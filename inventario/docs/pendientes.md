# Pendientes — CyberWatch / MiniAgente-Inventario

Documento de seguimiento de funcionalidades pendientes.  
Última actualización: 2026-07-07.

---

## Resumen ejecutivo

| # | Pendiente | Estado | Prioridad sugerida |
|---|-----------|--------|-------------------|
| 1 | Card total PCs → modal activas/inactivas | **Hecho** | — |
| 2 | Computadoras por área | **Hecho** | — |
| 3 | Trazabilidad PCs/periféricos (asignaciones, historial unificado) | Parcial | Media |
| 4 | Stock real + mínimo de reposición | **Hecho** | — |
| 5 | Dashboard de periféricos | **Hecho** | — |
| 6 | Inventario de televisores | **Hecho** | — |
| 7 | Inventario de celulares | **Hecho** | — |
| 8 | Separar access points de routers/switches | **Hecho** | — |
| 9 | Credenciales en NVR / cámaras | **Hecho (básico)** | Baja (mejoras opcionales) |
| 10 | Completar teléfonos IP | Parcial | Baja–Media |

**Progreso:** 8 de 10 ítems completados (2 parciales: #3 y #10).

---

## Detalle por ítem

### 1. Card total computadoras → modal activas/inactivas ✅

**Descripción:** Al hacer click en la KPI card "Total computadoras" del dashboard principal, abrir un modal o drawer con filtro por estado: Activas / Inactivas / Todas, con tabla compacta y enlace al detalle de cada PC.

**Estado actual (2026-07-07):**
- Card "Total Comp." es clickeable en `Dashboard.jsx`.
- Modal `ComputadorasEstadoModal.jsx` con tabs Activas / Inactivas / Todas, contadores y tabla con hostname, usuario, área (`ubicacion`), estado y enlace al detalle.

**Archivos relacionados:**
- `inventario-front/src/pages/Dashboard.jsx`
- `inventario-front/src/components/ComputadorasEstadoModal.jsx`

**Criterios de aceptación:**
- [x] Click en card "Total computadoras" abre modal/drawer.
- [x] Tabs o pills: Activas | Inactivas | Todas, con contador en cada uno.
- [x] Tabla con hostname, usuario, área, estado, última actualización.
- [x] Link "Ver detalle" por fila → detalle de computadora.
- [x] Misma paleta visual que el resto del dashboard.

---

### 2. Computadoras por área ✅

**Descripción:** Poder ver y filtrar cuántas computadoras hay por área (departamento, sucursal, sector).

**Estado actual (2026-07-07):**
- Campo `ubicacion` persistido en `Computadora.java` / Firestore.
- Filtro por ubicación en `ComputadoraList.jsx` (dropdown con constantes en `ubicaciones.js`).
- Gráfico de barras "Computadoras por área" en `Dashboard.jsx` (`porUbicacionComputadoras`).

**Criterios de aceptación:**
- [x] Campo área/ubicación persistido en Firestore.
- [x] Filtro por área en listado de computadoras.
- [x] KPI o gráfico "Computadoras por área" en dashboard.

**Nota:** El campo operativo es `ubicacion` (enum/lista fija), no un campo `area` separado.

---

### 3. Trazabilidad de computadoras y periféricos

**Descripción:** Seguimiento de quién tiene asignada cada PC/periférico, historial de asignaciones, y que equipos sin asignación pasen automáticamente a stock.

**Estado actual (2026-07-07):**
- **PCs:** `historialEstados` + `cambiarEstado()` en `ComputadoraRepository`; estados IT (`Asignada`, `Sin Asignar`, `En mantenimiento`, `Baja`); vistas `ComputadoraAsignaciones.jsx` y `AsignacionesBoard.jsx`; alta y asignación desde stock en `PerifericoManualList.jsx`.
- **Periféricos manuales:** `historialEstados` en `PerifericoManual.java`; stock con campo `cantidad`.
- **Televisores / celulares:** `responsable`, `area` y `estado` (`activo` / `en_stock` / `baja`) manuales, sin historial de asignaciones.
- **Pendiente:** entidad `Asignacion` unificada cross-tipo, timeline en detalle de TV/celular, y desasignación automática a stock en todos los módulos.

**Modelo sugerido:**

```
Asignacion {
  id,
  equipoId,
  tipoEquipo,        // pc | periferico | televisor | celular
  responsable,
  area,
  fechaInicio,
  fechaFin,          // null si asignación activa
  motivo,
  registradoPor,
  observaciones
}
```

**Reglas de negocio:**
- PC/periférico sin asignación activa → estado `en_stock`.
- Al desasignar: cerrar asignación actual (`fechaFin`), pasar equipo a stock.
- Desde vista Stock: botón "Nueva asignación" abre modal reutilizable.
- Detalle de equipo: tab "Historial de asignaciones" (timeline vertical).

**Archivos de referencia:**
- `models/Camara.java` — historial de estados
- `CamaraRepository.cambiarEstado()` — transacción Firestore

**Criterios de aceptación:**
- [ ] Entidad `Asignacion` en backend + colección Firestore (hoy se usa `historialEstados` embebido en PCs).
- [ ] CRUD de asignaciones vía API unificada.
- [x] Desasignación de PC mueve equipo a stock (`Sin Asignar` + `ubicacion_stock`).
- [x] Historial de estados en PC (vía `historialEstados`).
- [x] Asignación desde stock (`PerifericoManualList.jsx` → modal asignar PC).
- [ ] Timeline de historial en detalle de TV y celular.
- [ ] Integración formal con televisores (#6) y celulares (#7).

---

### 4. Stock real + mínimo de reposición ✅

**Descripción:** Manejo de stock de PCs y periféricos.

**Estado actual (2026-07-07):** Implementado el flujo operativo de stock.

**Periféricos manuales:**
- Campo `cantidad` en `PerifericoManual.java`.
- Vista `/perifericos/stock` (`PerifericoManualList.jsx`): solapas **Periféricos** y **Computadoras**, alta/edición, botones +/- de cantidad, filtros y búsqueda.
- Entrada en menú (`topicos.js`) y acceso desde `PerifericosDashboard.jsx`.

**Computadoras:**
- Estado IT `Sin Asignar` = en stock; `ubicacion_stock` en `historialEstados`.
- Alta de PC directo al stock y asignación desde la misma vista.
- `ComputadoraRepository.cambiarEstado()` con transacción Firestore.

**Televisores / celulares:**
- Estado `en_stock` manual en cada módulo.

**Modelo operativo:**
- PCs: 1 unidad por registro (no lotes).
- Periféricos manuales: `cantidad` numérica por ítem.

**Criterios de aceptación:**
- [x] Campos stock en modelos correspondientes (`cantidad` periféricos; estado `Sin Asignar` / `en_stock` en PCs y TVs/celulares).
- [x] Vista centralizada de stock (`/perifericos/stock`).
- [x] Registrar ingreso a stock (alta de periférico o PC con estado stock).
- [x] Ajuste de cantidad (+/-) en periféricos manuales.
- [ ] Alertas por `minimoReposicion` (no implementado — no requerido operativamente).
- [ ] Campo `minimoReposicion` (no implementado).

**Mejora opcional futura:** mínimo de reposición + alertas en dashboard si el equipo lo necesita.

---

### 5. Dashboard de periféricos ✅

**Descripción:** Dashboard dedicado con KPIs y gráficos de periféricos (monitores, teclados, impresoras, etc.).

**Estado actual (2026-07-07):**
- Página `PerifericosDashboard.jsx` con KPIs, accesos rápidos y contadores por categoría.
- Entrada en menú lateral (`topicos.js`, `SidebarNav.jsx`) y ruta en `App.jsx`.
- Incluye acceso a monitores, televisores, celulares y demás periféricos manuales.

**Archivos relacionados:**
- `inventario-front/src/pages/PerifericosDashboard.jsx`
- `PerifericosMonitoresList.jsx`
- `MonitorService.java` → `GET /api/monitores`

**Criterios de aceptación:**
- [x] Página `PerifericosDashboard.jsx`.
- [x] KPIs por categoría.
- [ ] Gráfico por tipo/área (mejora futura).
- [x] Entrada en menú lateral (`topicos.js`).
- [ ] Indicador stock vs mínimo de reposición (mejora opcional, ítem #4).

---

### 6. Inventario de televisores ✅

**Descripción:** Módulo para inventariar televisores (pantallas en salas, recepción, etc.).  
**Nota:** "Teles" = **televisores**, no teléfonos.

**Estado actual (2026-07-07):** Implementado completo (backend + frontend).

**Campos:**

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `marca` | string | sí | ej. Samsung, LG |
| `modelo` | string | sí | |
| `numeroSerie` | string | no | trazabilidad |
| `area` | string | sí | sala, recepción, depósito… |
| `direccionIp` | string | no | Smart TV / gestión remota |
| `estado` | enum | sí | `activo` \| `en_stock` \| `baja` |

**Backend:**
- `Televisor.java`, `EstadoTelevisor.java`
- Colección Firestore: `televisores`
- API: `GET/POST/PUT/DELETE /api/televisores`
- Caché en `CacheConfig`

**Frontend:**
- `TelevisorList.jsx` — listado, CRUD modal, filtros por área y estado
- Ruta `/perifericos/televisores`
- Import Excel/CSV (`televisoresSchema.js`)
- Menú y dashboard de periféricos

**Integración futura:** Cuando exista trazabilidad (#3), TVs entran en el mismo flujo de asignaciones e historial.

**Criterios de aceptación:**
- [x] CRUD completo backend + frontend.
- [x] Listado con columnas acordadas.
- [x] Import Excel funcional.
- [x] Filtros por área y estado.

---

### 7. Inventario de celulares ✅

**Descripción:** Módulo para móviles corporativos.

**Estado actual (2026-07-07):** Implementado completo (backend + frontend), mismo patrón que televisores.

**Campos implementados:**
- marca, modelo, IMEI, línea/número, responsable, área, estado (`activo` \| `en_stock` \| `baja`)

**Backend:**
- `Celular.java`, `EstadoCelular.java`
- Colección Firestore: `celulares`
- API: `GET/POST/PUT/DELETE /api/celulares`
- Caché en `CacheConfig`

**Frontend:**
- `CelularList.jsx` — listado en tarjetas, modal CRUD, filtros y búsqueda
- Ruta `/perifericos/celulares`
- Import Excel/CSV (`celularesSchema.js`)
- Menú, `topicos.js` y dashboard de periféricos

**Criterios de aceptación:**
- [x] Modelo `Celular.java` + colección Firestore.
- [x] CRUD + listado.
- [x] Import Excel.
- [ ] Integración con asignaciones (#3) cuando esté disponible.

**Pendiente definir:** ¿IMEI obligatorio?

---

### 8. Separar access points de routers/switches ✅

**Descripción:** Los puntos de acceso WiFi deben tener inventario propio, separado de routers y switches.

**Estado actual (2026-07-07):**
- Entidad `AccessPoint.java` con colección Firestore propia.
- API CRUD: `/api/access-points`
- Listado unificado en `/routers-switches` con solapas (routers, switches, APs).
- Al editar: selector "Tipo de equipo" para convertir entre router, switch y AP conservando el ID.
- `POST /api/infraestructura/cambiar-tipo` — migración entre colecciones en una sola llamada.
- `InfraestructuraLimpiezaService` — detección y limpieza de duplicados (`GET/POST /api/infraestructura/duplicados` y `limpiar-duplicados`).
- Botón "Limpiar duplicados" en frontend; listado oculta duplicados en pantalla hasta limpiar en Firestore.
- Card en `InfraestructuraDashboard.jsx` y entrada en menú.

**Criterios de aceptación:**
- [x] Entidad y colección Firestore para APs.
- [x] Listado separado de routers y switches (solapas en vista unificada).
- [x] Card en dashboard de infraestructura.
- [x] Entrada en menú lateral.
- [ ] Sync Omada (opcional, no implementado).

**Pendiente definir:** ¿Sync Omada además del inventario manual?

---

### 9. Credenciales en NVR / cámaras ✅ (básico)

**Descripción:** Guardar credenciales de acceso (usuario/contraseña) en NVRs y cámaras.

**Estado actual (2026-07-07):**
- Campos `usuario` / `password` en `Nvr.java` y `Camara.java`.
- UI con máscara y botón mostrar/ocultar (`CredentialsField.jsx`) en `NvrDetail.jsx` y `CamaraDetail.jsx`.
- Edición desde modales de detalle.

**Criterios de aceptación:**
- [x] Campos credenciales en modelos NVR y Cámara.
- [ ] Almacenamiento cifrado o vault (hoy texto plano en Firestore).
- [x] UI con máscara mostrar/ocultar.
- [ ] Permisos por rol para ver credenciales.
- [ ] No exponer contraseñas en logs ni respuestas API sin autorización.

**Mejoras opcionales:** vault externo (BacarPass / Firebase), cifrado en Firestore, permisos por rol.

---

### 10. Teléfonos IP (completar — ítem aparte de televisores)

**Descripción:** Completar el módulo de teléfonos IP / internos ya iniciado.

**Estado actual:**
- `TelefonoIpList.jsx`, `internosSchema.js`, KPI en dashboard.
- Posibles gaps en CRUD backend o campos enriquecidos.

**Criterios de aceptación:**
- [ ] CRUD backend completo si falta.
- [ ] Campos enriquecidos según necesidad operativa.
- [ ] Import Excel estable.

---

## Fases de implementación sugeridas

> Las fases 1, 2, 4 y 5 originales están completadas. Stock (#4) operativo en `/perifericos/stock`.

### Fase actual — Trazabilidad unificada (parcial)
1. Entidad `Asignacion` cross-tipo o extender historial a TVs/celulares (#3)
2. Timeline de historial en detalle de TV y celular (#3)
3. Integración formal de asignaciones con televisores (#6) y celulares (#7)

### Fase siguiente — Completar y pulir
5. Completar teléfonos IP (#10)
6. Gráfico por tipo/área en dashboard de periféricos (#5, mejora)
7. Credenciales: vault/cifrado y permisos por rol (#9, mejora)
8. Sync Omada para access points (#8, opcional)

### Completado ✅
- Card PCs activas/inactivas (#1)
- Computadoras por área (#2)
- Stock operativo: periféricos + PCs + estados en_stock (#4)
- Dashboard de periféricos (#5)
- Televisores (#6)
- Celulares (#7)
- Access Points + migración de tipo + limpieza duplicados (#8)
- Credenciales NVR/cámaras básicas (#9)

---

## Dependencias

```
Stock operativo (#4) ✅
    ├── Vista /perifericos/stock (periféricos + PCs)
    └── Asignación de PC desde stock

Trazabilidad unificada (#3) — PARCIAL   ← PRÓXIMO BLOQUE
    ├── PCs: historialEstados + asignaciones ✅
    ├── Integración TVs/celulares — pendiente
    └── Entidad Asignacion cross-tipo — pendiente

Dashboard periféricos (#5) ✅
    └── Alertas mínimo reposición — opcional

Access Points (#8) ✅
    └── Sync Omada — opcional

Credenciales (#9) ✅ básico
    └── Vault / cifrado / roles — mejora opcional
```

---

## Decisiones pendientes de negocio

| Tema | Opciones | Ítem |
|------|----------|------|
| Mínimo de reposición | Implementar alertas vs no requerido | #4 (opcional) |
| Celulares | ¿IMEI obligatorio? | #7 |
| Credenciales | Vault externo vs cifrado Firestore vs estado actual | #9 |
| Access Points | Sync Omada además de inventario manual | #8 |

---

## Referencia: arquitectura de persistencia

**Fuente de verdad:** Firestore (modelo documental).  
**Patrón:** cada activo es un documento con estado actual; historial IT embebido (`historialEstados` + `estadoActual` denormalizado).  
**Caché:** Caffeine en Spring (TTL ~3 min), solo rendimiento.  
**Tiempo real:** `onSnapshot` solo en pantalla Sistema; el resto del inventario va por REST con lecturas puntuales (`.get()`).

---

## Referencia: design system (frontend)

Para diseño UI en Google AI Studio / Figma, ver prompt completo en conversación del 2026-07-02 o solicitar regeneración.

**Pantallas prioritarias para diseño (próximas):**
1. Detalle TV/celular con historial de asignaciones
2. Timeline unificado cross-tipo
3. Alertas de stock bajo mínimo (si se implementa)

**Stack frontend:** React + Vite + Tailwind + React Router. Auth Firebase. UI en español.

---

## Changelog de este documento

| Fecha | Cambio |
|-------|--------|
| 2026-07-02 | Creación inicial con 10 ítems, fases, spec de televisores, dependencias |
| 2026-07-07 | Movido desde `Documents/MiniAgente-Inventario` a `Desarrollo/MiniAgente-Inventario` |
| 2026-07-07 | Sincronización con código: #1–#2, #5–#9 marcados hechos; #10 parcial; fases reorganizadas; notas de infraestructura (migración tipo, duplicados) y arquitectura de persistencia |
| 2026-07-07 | #4 stock marcado hecho (`/perifericos/stock`, cantidad, PCs Sin Asignar); #3 reclasificado como parcial (PCs ya tienen historial y asignaciones) |
