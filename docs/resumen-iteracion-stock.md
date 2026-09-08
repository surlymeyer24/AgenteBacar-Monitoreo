# Resumen — iteración Stock de PCs y periféricos

Documento consolidado de **tus requerimientos** y **lo implementado** en la sesión de trabajo sobre stock (sep 2026).  
Proyecto: `inventario/` (backend Java + frontend React en `inventario-front/`).

---

## 1. Requerimiento inicial

> *"Necesito mejorar la lógica del stock. Quiero que esté completo e hile muy fino. Nosotros por un lado tenemos los periféricos y por otro las computadoras. En cada uno de ellos deberíamos tener la info necesaria para después triangular esa computadora con una del agente. Además el manejo del stock, sobre todo los estados, está raro y no se entiende. En el stock las PCs se cargan como inventario: puede pasar que tenga 3 CPU Ryzen 5 5600G con 8 de RAM."*

**Problema de fondo detectado:** coexistían dos modelos mezclados (lotes por cantidad vs unidades trazables) y tres nociones de “estado” que competían entre sí (operativo, conciliación, sync del agente).

---

## 2. Tus requerimientos (cronológico)

| # | Fecha / momento | Pedido |
|---|-----------------|--------|
| 1 | Inicio | Mejorar lógica de stock; separar periféricos y computadoras; info para triangular con AgenteBacar; clarificar estados; PCs por cantidad (ej. 3× Ryzen) |
| 2 | — | Empezar con **Fase A** |
| 3 | — | Los nombres de las pestañas son confusos |
| 4 | — | Aprobar renombre: **Periféricos / Stock de PCs / Computadoras** |
| 5 | — | Seguir con **Fase B** |
| 6 | — | Sacar KPI de ubicaciones; default **stock** en ubicación depósito |
| 7 | — | Que diga solo **Ubicación** (sin “depósito”) |
| 8 | — | Continuar con **Fase C** |
| 9 | — | Seguir con **Fase D** (×2) |
| 10 | — | Explicación: asignación por UUID |
| 11 | — | Aclaración: PCs de stock aún no tienen UUID del agente (sí UUID de inventario) |
| 12 | — | Agente se llama **AgenteBacar** (no CyberWatch); aplicar **Fase E** |
| 13 | — | Bug: al editar stock de PCs y guardar, no persiste; al re-editar se borra |
| 14 | — | Al editar, que los campos cargados queden como estaban |
| 15 | — | Campos de editar stock **consistentes** entre lotes y unidades (×2) |
| 16 | — | **4.ª vez:** los datos cargados deben quedar para re-editar (corregir una letra, etc.) |
| 17 | — | Mostrar **condición** y **tipo de equipo** en tabla; modal con **descripción** (sacar “etiqueta opcional”) |
| 18 | — | Sacar el **ID del documento Firebase** de la vista |
| 19 | — | **Descripción** separada de la **etiqueta visual** (CPU + RAM auto) |
| 20 | — | Orden: primero **etiqueta**, después **descripción** |
| 21 | — | Cómo volver una PC al stock desde computadoras |
| 22 | — | Botón **Ingresar a stock** desde el modal de editar (+ link en ficha) |
| 23 | — | Explicar cómo funcionan los estados |
| 24 | — | Explicar de dónde salen los badges Disponibilidad / Preparación / Agente |
| 25 | — | Este documento: resumen + requerimientos en un solo `.md` |

---

## 3. Plan de fases acordado

| Fase | Objetivo | Estado |
|------|----------|--------|
| **A** | Separar pestañas, badges en 3 ejes, leyenda de estados | ✅ |
| **B** | Specs estructuradas CPU/RAM/disco/tipo/condición en lotes | ✅ |
| **C** | **Sacar 1 unidad** del lote → computadora trazable | ✅ |
| **D** | Pre-fill Armar combo + número de serie en periféricos | ✅ |
| **E** | Asignar periféricos por **UUID de inventario** (no texto libre) | ✅ |
| **Extra** | UX, persistencia, descripción vs etiqueta, ingresar a stock | ✅ |

---

## 4. Lo implementado (por tema)

### 4.1 Fase A — UI y estados legibles

- **Tres pestañas** en `/perifericos/stock`:
  - **Periféricos** — accesorios por cantidad
  - **Stock de PCs** — PCs genéricas por cantidad (3× Ryzen…)
  - **Computadoras** — unidades con hostname y UUID
- Componente **`StockEstadoBadges.jsx`**: badges ortogonales
  - **Disponibilidad** ← `estadoActual`
  - **Preparación** ← `estadoConciliacion` (mapeo A)
  - **Agente** ← `estadoConciliacion` (mapeo B)
- Leyenda expandible **Ver / Ocultar leyenda** en pestaña Computadoras
- Banners **`StockInfoBanner`** explicando cada pestaña
- Badges **Por cantidad** vs **Individual** (unidad trazable)

### 4.2 Fase B — Specs estructuradas

**Backend**

- Modelo **`EspecificacionStock`** + DTO + mapper
- Campo Firestore `especificacion_stock` en `perifericos_manuales`
- Validación: CPU y RAM obligatorias en stock de PCs
- Campo `numero_serie` preparado para periféricos

**Frontend**

- Formulario **Cargar al stock** con CPU, RAM, disco, tipo, condición
- Columna **Especificación** en tabla de lotes
- Helpers en **`stockPcHelpers.js`**: `buildNombreFromSpec`, `specToPayload`, etc.

### 4.3 Fase C — Sacar 1 unidad

**Backend**

- `POST /api/perifericos-manuales/{id}/sacar-unidad`
- Crea `Computadora` con `origenAlta=STOCK`, `estado_conciliacion=SIN_BASELINE`
- Copia specs → `especificacion_esperada`, guarda `lote_origen_id`
- Estado `SIN_ASIGNAR` + decrementa cantidad del lote

**Frontend**

- Botón **Sacar 1** en lotes (si hay stock y specs)
- Modal con hostname sugerido; redirige a pestaña **Computadoras**

### 4.4 Fase D — Armar combo y serial

- **`ArmarComboModal`**: pre-carga CPU/RAM/disco desde `especificacionEsperada`
- Banner “Hardware pre-cargado desde el stock del lote”
- **`ArmadoComboService`**: fallback desde Firestore si el DTO viene incompleto
- Serial del periférico copiado al baseline al armar combo
- UI: campo **Número de serie** en periféricos; S/N visible en selects del combo

### 4.5 Fase E — Asignación por UUID

**Backend**

- `AsignarPerifericoDTO` exige `computadoraUuid`
- `GET /api/computadoras/{uuid}/perifericos-manuales`
- Persistencia `computadora_uuid` + hostname derivado

**Frontend**

- **`perifericoPcHelpers.js`**: PCs asignables (`origenAlta === 'STOCK'`)
- Selector de PC en ficha y modal de asignación (ya no “persona” como hostname)
- Renombre AgenteBacar en textos de UI donde correspondía

### 4.6 Ajustes de UX (pestañas, ubicación, KPIs)

- Renombre pestañas acordado
- Botones: **Cargar al stock**, **Cargar stock de PC**
- Eliminado KPI de ubicaciones en stock
- Default ubicación: **`stock`**
- Label **Ubicación** (sin “depósito”)
- Catálogo **`ubicaciones_computadora`** en formularios (sin sedes hardcodeadas)

### 4.7 Formularios unificados y persistencia

**Problema:** ítems legacy sin `especificacion_stock` en Firestore; solo `nombre` (ej. `"Ryzen 5 · 16 GB RAM"`). Al re-editar, el formulario quedaba vacío.

**Solución**

- **`stockPcHelpers.js`**: `parseSpecFromNombre`, `resolveSpecFromItem`, `descripcionFromItem`, `etiquetaFromItem`
- **`EspecificacionStockMapper.enrichFromNombre()`** + uso en **`PerifericoManualRepository.snapshotToPeriferico`**
- Componentes compartidos:
  - **`StockPcLoteFormFields.jsx`** — lotes
  - **`ComputadoraStockFormFields.jsx`** — unidades trazables
  - **`stockFormStyles.js`**
- Al abrir editar: `fetchComputadora` / `fetchPerifericoM` + `populateFormFromItem`
- Guardado: `nombre` = solo **descripción**; etiqueta = auto desde specs (`buildNombreFromSpec`)

### 4.8 Descripción vs etiqueta visual

| Campo | Rol |
|-------|-----|
| **Descripción** | Texto libre del operador → Firestore `nombre` |
| **Etiqueta** | Auto CPU + RAM + disco → solo lectura en formulario |

- Tabla lotes: columnas **Etiqueta**, **Descripción**, **Tipo de equipo**, **Condición**
- Orden en formulario: etiqueta primero, descripción después
- Backend: removido auto-set de `nombre` desde spec en `PerifericoManualService.crear()`

### 4.9 Limpieza de UI

- ID de documento Firebase **oculto** en filas y títulos de modal

### 4.10 Volver al stock / Ingresar a stock

**Concepto:** cambiar `estadoActual` a **`Sin Asignar`** (`SIN_ASIGNAR`) + `ubicacion_stock`.

**Implementado**

- Modal editar PC (`PerifericoManualList.jsx`):
  - Botón **Ingresar a stock** si no está en depósito
  - Campo **Motivo del ingreso**
  - `handleIngresarPcStock()`: `updateDatosStock` + `updateEstado('SIN_ASIGNAR', …)`
- **`ComputadoraDetail.jsx`**: link **Ingresar a stock** → `/perifericos/stock?tab=unidades&editarPc={uuid}`
- Deep link abre modal automáticamente (`useSearchParams` + `fetchComputadora`)

> **Nota:** no existe “volver al lote”. Sacar 1 unidad es irreversible hacia el contador del lote.

---

## 5. De dónde salen los tres ejes de estado (referencia)

| Badge UI | Campo real | Quién lo escribe |
|----------|------------|------------------|
| **Disponibilidad** | `estadoActual.nombre` | `ComputadoraRepository.cambiarEstado` / asignaciones |
| **Preparación** | `estado_conciliacion` | Mapeo UI (`PREPARACION_MAP`) |
| **Agente** | `estado_conciliacion` (mismo) | Mapeo UI (`AGENTE_MAP`) |

**Transiciones típicas de `estado_conciliacion`**

| Valor | Momento |
|-------|---------|
| `SIN_BASELINE` | Alta PC trazable / Sacar 1 |
| `BASELINE_LISTO` | Armar combo |
| `PENDIENTE` | AgenteBacar reporta; match sugerido |
| `COINCIDE` / `DISCREPANCIA` | IT confirma en Conciliaciones |
| `NO_APLICA` | PCs legacy |

**Disponibilidad (mapeo UI)**

| `estadoActual` | Badge |
|----------------|-------|
| Sin Asignar | En depósito |
| Asignada | Asignada |
| En mantenimiento / Baja | Igual |

Implementación: `inventario-front/src/components/StockEstadoBadges.jsx`.

---

## 6. Archivos principales tocados

### Backend (Java)

| Archivo | Rol |
|---------|-----|
| `models/EspecificacionStock.java` | Specs estructuradas |
| `mapper/EspecificacionStockMapper.java` | Firestore ↔ DTO + `enrichFromNombre` |
| `services/PerifericoManualService.java` | CRUD stock, sacar unidad, asignar |
| `services/ComputadoraService.java` | Alta PC, cambiar estado, datos stock |
| `services/ArmadoComboService.java` | Combo + baseline |
| `repository/PerifericoManualRepository.java` | Persistencia + snapshot enrich |
| `dto/SacarUnidadStockDTO.java`, `SacarUnidadStockResultDTO.java` | Sacar 1 |
| `dto/AsignarPerifericoDTO.java` | Asignación por UUID |
| `dto/ComputadoraStockUpdateDTO.java` | Editar datos de PC en stock |

### Frontend (React)

| Archivo | Rol |
|---------|-----|
| `pages/PerifericoManualList.jsx` | Pantalla principal stock (3 pestañas, modales) |
| `pages/PerifericoManualDetail.jsx` | Ficha periférico + asignación UUID |
| `pages/ComputadoraDetail.jsx` | Link ingresar a stock |
| `components/StockEstadoBadges.jsx` | Badges + leyenda |
| `components/StockPcLoteFormFields.jsx` | Form lotes |
| `components/ComputadoraStockFormFields.jsx` | Form unidades |
| `components/ArmarComboModal.jsx` | Pre-fill combo |
| `utils/stockPcHelpers.js` | Specs, parseo legacy, etiqueta/descripción |
| `utils/perifericoPcHelpers.js` | PCs asignables |
| `utils/stockFormStyles.js` | Estilos compartidos |
| `api/perifericoManualApi.js` | sacar-unidad, asignar por UUID |
| `api/computadoraApi.js` | updateEstado, updateDatosStock |

### Documentación relacionada (preexistente)

- `docs/trazabilidad-stock-agente.md` — diseño trazabilidad / conciliación

---

## 7. Flujo operativo resumido

```
Stock de PCs (lote 3× Ryzen)
    → Cargar al stock (specs + descripción)
    → Sacar 1 → Computadora trazable (UUID inventario, Sin Asignar)
    → Armar combo → BASELINE_LISTO
    → Instalar AgenteBacar → PENDIENTE → Conciliaciones → COINCIDE/DISCREPANCIA
    → Asignar → Asignada (sale del listado de stock)
    → Ingresar a stock → Sin Asignar (vuelve a pestaña Computadoras)
```

---

## 8. Pendiente / fuera de scope de esta iteración

- Renombrar referencias restantes a “CyberWatch” → **AgenteBacar** en toda la UI (algunas leyendas aún dicen CyberWatch)
- Fases futuras del plan original de trazabilidad (matching automático, bandeja conciliaciones — parcialmente existente en backend)
- Editar stock desde listado general `/computadoras` para PCs asignadas de origen STOCK (solo deep link desde ficha hoy)
- Reiniciar backend tras cambios en mapper Java para ítems legacy en entornos ya desplegados

---

## 9. Notas para QA

1. **Lote:** crear → editar → re-editar: deben persistir descripción, specs, tipo, condición, ubicación.
2. **Sacar 1:** cantidad −1, PC nueva en Computadoras con specs del lote.
3. **Ingresar a stock:** PC asignada → modal → Ingresar a stock → reaparece en Computadoras con `Sin Asignar`.
4. **Legacy:** lote antiguo solo con `nombre` tipo `"Ryzen 5 · 16 GB RAM"` debe pre-llenar CPU/RAM al editar.
5. **Estados:** tres badges en unidades trazables; leyenda opcional en pestaña Computadoras.

---

*Generado a partir de la iteración de chat `e5da6dce-28dd-4f80-a00d-818485d4046e` — sep 2026.*
