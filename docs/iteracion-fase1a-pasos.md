# Fase 1a — Campos, catálogos y migración legacy

Plan de implementación detallado para la primera subfase de trazabilidad stock ↔ agente.

**Fecha:** 2026-09-04  
**Estado:** Aprobado para implementación  
**Documento padre:** [`trazabilidad-stock-agente.md`](./trazabilidad-stock-agente.md)  
**Alcance:** Backend Java + Frontend React  

---

## Objetivo

Que toda PC nueva cargada en stock tenga `tipoEquipo`, `condicion` y `origenAlta` desde el día 1, y que las PCs existentes queden migradas con defaults que no generen ruido en bandejas ni listados.

---

## Estado actual relevante

| Qué | Estado |
|-----|--------|
| `tipoEquipo` | Existe en modelo como `TipoEquipo` (POJO: `tipo` + `tieneBateria`). Lo escribe el agente. No se captura al crear PC desde stock. |
| `condicion` | No existe en ninguna capa. |
| `origenAlta` | No existe en ninguna capa. |
| `estadoConciliacion` | No existe en ninguna capa. |
| Catálogos genéricos | Sistema funcionando: Firestore + API + admin UI + hook `useCatalogo`. 11 catálogos en bootstrap. |
| `ComputadoraNueva.jsx` | Captura: hostname, usuario, ubicación, SO, arquitectura, motivo. Sin tipo ni condición. |
| `PerifericoManualList.jsx` | Modal "Nueva PC a stock" con campos similares a `ComputadoraNueva`. |

---

## Cambios por capa

### 1. Backend — Modelo (`Computadora.java`) + Enums nuevos

- Crear 2 enums Java con tipado fuerte:
  - `OrigenAlta`: `STOCK`, `DETECTADA_POR_AGENTE`, `DETECTADA_VINCULADA_RETRO`, `LEGACY`
  - `EstadoConciliacion`: `PENDIENTE`, `COINCIDE`, `DISCREPANCIA`, `SIN_BASELINE`, `NO_APLICA`, `BASELINE_LISTO`
- Agregar campos en `Computadora.java`:
  - `String condicion` → `@PropertyName("condicion")`
  - `OrigenAlta origenAlta` → `@PropertyName("origen_alta")` — enum, garantiza integridad antes de persistir
  - `EstadoConciliacion estadoConciliacion` → `@PropertyName("estado_conciliacion")` — idem
- `tipoEquipo` ya existe como `TipoEquipo` — solo necesita poder setearse al crear.

Los DTOs siguen usando `String` para la API (flexibilidad); la conversión enum ↔ String se hace en el mapper/service. Firestore persiste el `.name()` del enum (ej. `"STOCK"`, `"SIN_BASELINE"`).

**Archivos:**
- `inventario/src/main/java/com/bacarsa/inventario/models/Computadora.java`
- `inventario/src/main/java/com/bacarsa/inventario/models/OrigenAlta.java` (nuevo)
- `inventario/src/main/java/com/bacarsa/inventario/models/EstadoConciliacion.java` (nuevo)

---

### 2. Backend — DTOs

| DTO | Cambio |
|-----|--------|
| `ComputadoraCreateDTO` | Agregar `tipoEquipo` (String, opcional) y `condicion` (String, opcional). `origenAlta` NO va en el DTO — lo setea el service. |
| `ComputadoraDTO` | Agregar `condicion`, `origenAlta`, `estadoConciliacion` (String). |
| `ComputadoraListadoDTO` | Agregar `condicion`, `origenAlta`, `estadoConciliacion` (String). |

**Archivos:**
- `inventario/src/main/java/com/bacarsa/inventario/dto/ComputadoraCreateDTO.java`
- `inventario/src/main/java/com/bacarsa/inventario/dto/ComputadoraDTO.java`
- `inventario/src/main/java/com/bacarsa/inventario/dto/ComputadoraListadoDTO.java`

---

### 3. Backend — Mappers

| Mapper | Cambio |
|--------|--------|
| `ComputadoraMapper.toDTO()` | Mapear `condicion`, `origenAlta`, `estadoConciliacion` del modelo al DTO. |
| `ComputadoraMapper.toListDTO()` | Idem. |
| `ComputadoraListadoMapper.fromSnapshot()` | Leer `condicion`, `origen_alta`, `estado_conciliacion` del `DocumentSnapshot`. |

**Agregar a `ComputadoraListadoFields.ALL`:** `"condicion"`, `"origen_alta"`, `"estado_conciliacion"`.

**Archivos:**
- `inventario/src/main/java/com/bacarsa/inventario/mapper/ComputadoraMapper.java`
- `inventario/src/main/java/com/bacarsa/inventario/mapper/ComputadoraListadoMapper.java`
- `inventario/src/main/java/com/bacarsa/inventario/repository/ComputadoraListadoFields.java`

---

### 4. Backend — Service

**`ComputadoraService.crear()`:**

- Aceptar `tipoEquipo` y `condicion` del `ComputadoraCreateDTO`.
- Si viene `tipoEquipo`: construir `TipoEquipo` con `tipo` seteado, `tieneBateria` null (el agente lo completa después).
- Setear automáticamente:
  - `origenAlta = "STOCK"`
  - `estadoConciliacion = "SIN_BASELINE"`

**Archivo:** `inventario/src/main/java/com/bacarsa/inventario/services/ComputadoraService.java`

---

### 5. Backend — Catálogos bootstrap

Agregar 2 catálogos nuevos en `CatalogoBootstrapRunner`:

**`tipos_equipo`:**

| Código | Etiqueta | Orden |
|--------|----------|-------|
| `mini_pc` | Mini PC | 1 |
| `desktop` | Desktop | 2 |
| `notebook` | Notebook | 3 |

**`condiciones_equipo`:**

| Código | Etiqueta | Orden |
|--------|----------|-------|
| `nueva` | Nueva | 1 |
| `usada` | Usada | 2 |

**Archivo:** `inventario/src/main/java/com/bacarsa/inventario/bootstrap/CatalogoBootstrapRunner.java`

---

### 6. Backend — Endpoint de migración

**`POST /api/admin/migracion/trazabilidad-stock-v1`**

**Seguridad:** endpoint bajo `/api/admin/` — requiere privilegios de administrador en el filtro de seguridad. Verificar que el guard existente para rutas admin cubra esta ruta, o agregar check explícito (`RequireAdmin` / rol `ADMINISTRADOR`). Previene ejecución accidental o no autorizada.

Lógica idempotente por documento en `computadoras`:

1. Si ya tiene `origen_alta` → **skip** (idempotente).
2. Si `ultima_sincronizacion` presente → `origen_alta = LEGACY`, `estado_conciliacion = NO_APLICA`. Opcionalmente: `primer_reporte_agente_at = ultima_sincronizacion` (aproximación).
3. Si sin sync y estado `SIN_ASIGNAR` → `origen_alta = STOCK`, `estado_conciliacion = SIN_BASELINE`. No entran al matcher automático hasta que IT complete baseline manualmente.
4. Resto → `LEGACY` + `NO_APLICA`.
5. No tocar `historialEstados` existente. Opcional: entrada "Migración trazabilidad v1 — valores default aplicados".

**Respuesta:** resumen con conteos (migradas, skipped, por categoría).

**Archivos nuevos:**
- Controller: `MigracionController.java` (o endpoint en `ComputadoraController`)
- Service: lógica en `ComputadoraService` o servicio dedicado

---

### 7. Frontend — Catálogos admin (`CatalogosAdmin.jsx`)

Agregar al array `CATALOGOS`:

```js
{ id: 'tipos_equipo', nombre: 'Tipos de Equipo' },
{ id: 'condiciones_equipo', nombre: 'Condiciones de Equipo' },
```

**Archivo:** `inventario/inventario-front/src/pages/CatalogosAdmin.jsx`

---

### 8. Frontend — Formulario `ComputadoraNueva.jsx`

Agregar 2 selects usando `useCatalogo` + `FriendlySelect`:

- **Tipo de equipo** → catálogo `tipos_equipo` (opcional)
- **Condición** → catálogo `condiciones_equipo` (opcional)

Enviar `tipoEquipo` y `condicion` en el body del POST.

**Archivo:** `inventario/inventario-front/src/pages/ComputadoraNueva.jsx`

---

### 9. Frontend — Modal "Nueva PC a stock" en `PerifericoManualList.jsx`

Mismos selects de tipo y condición que en `ComputadoraNueva`.

**Archivo:** `inventario/inventario-front/src/pages/PerifericoManualList.jsx`

---

### 10. Frontend — Listado `ComputadoraList.jsx`

- Mostrar badge `origenAlta` (STOCK / LEGACY / DETECTADA_POR_AGENTE) en filas.
- Mostrar `condicion` donde corresponda.
- Filtro tipo equipo: usar catálogo `tipos_equipo` en vez de hardcoded "Notebook / PC".
- Toggle "Incluir equipos legacy" (excluidos por defecto post-migración).

**Archivo:** `inventario/inventario-front/src/pages/ComputadoraList.jsx`

---

### 11. Frontend — Detalle `ComputadoraDetail.jsx`

- Badge `origenAlta` en header (STOCK / LEGACY / DETECTADA_POR_AGENTE).
- Badge `estadoConciliacion` (SIN_BASELINE / NO_APLICA / etc.) — solo lectura, sin lógica activa.
- Mostrar `condicion` en tab Inventario / Asignación.

**Archivo:** `inventario/inventario-front/src/pages/ComputadoraDetail.jsx`

---

## Orden de ejecución

| Paso | Tarea | Depende de |
|------|-------|------------|
| 1 | Backend: modelo + DTOs + mappers (campos nuevos) | — |
| 2 | Backend: catálogos bootstrap (`tipos_equipo`, `condiciones_equipo`) | — |
| 3 | Backend: service `crear()` — aceptar tipo/condición, setear origen/conciliación | Paso 1 |
| 4 | Frontend: agregar catálogos al admin | Paso 2 |
| 5 | Frontend: selects en `ComputadoraNueva` y modal stock | Pasos 2, 3 |
| 6 | Frontend: badges y filtros en listado y detalle | Paso 1 |
| 7 | Backend: endpoint migración | Paso 1 |
| 8 | Probar flujo completo + ejecutar migración en dev | Todos |

---

## Fuera de alcance (Fase 1a)

| Ítem | Fase |
|------|------|
| Armado de combo (vincular PC + periféricos de stock) | 1b |
| Baseline esperado (`baseline_esperado`, `combo_esperado_id`) | 1b |
| Matching / conciliación automática | 2 |
| Bandeja de conciliaciones pendientes | 2 |
| Alta automática `DETECTADA_POR_AGENTE` | 3 |
| Vinculación retroactiva | 3 |
| Bloque "esperado vs real" en detalle | 3 |
| Resolución de discrepancias | 4 |

---

## Criterios de aceptación (Fase 1a)

- [ ] Puedo crear PC en stock con tipo de equipo y condición (selects desde catálogo).
- [ ] `origenAlta` se setea automáticamente como `STOCK` al crear PC.
- [ ] `estadoConciliacion` se setea automáticamente como `SIN_BASELINE` al crear PC.
- [ ] Catálogos `tipos_equipo` y `condiciones_equipo` aparecen en admin y se pueden gestionar.
- [ ] Listado muestra tipo, condición y badge de origen.
- [ ] Detalle muestra badges de origen y estado de conciliación.
- [ ] Filtro en listado permite excluir/incluir equipos legacy.
- [ ] Migración one-shot: PCs existentes quedan con `LEGACY` + `NO_APLICA` (o `STOCK` + `SIN_BASELINE` si aplica).
- [ ] Re-ejecutar migración no sobrescribe valores ya seteados (idempotente).
- [ ] Listados y filtros no muestran ruido de PCs legacy por defecto.
