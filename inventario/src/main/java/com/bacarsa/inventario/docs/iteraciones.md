# Plan: Nuevas funcionalidades de inventario

## Context

El sistema de inventario necesita varias mejoras: una nueva entidad Servidores en la sección Infraestructura, enriquecer los modelos de Routers y Switches con más campos, filtrar monitores de notebooks (usando `tieneBateria=true`), agregar importación desde Excel a todas las secciones, y filtros por atributo en cada lista. Las mejoras de front (visualizaciones, diseño premium, feedback de carga) se planifican como backlog para una iteración posterior.

---

## Iteración 1 — Filtro de monitores de notebooks

**Problema:** `MonitorService.listarReportadosAgente()` incluye monitores de notebooks (pantallas integradas reportadas por el agente).

**Cambios:**
- `inventario/src/main/java/.../services/MonitorService.java`: agregar filtro antes del loop interno — omitir computadoras donde `tipoEquipo.tieneBateria == true`.
- No se requieren cambios en frontend; el conteo del dashboard ya toma el resultado del endpoint `/api/monitores`.

---

## Iteración 2 — Nuevos campos en Routers y Switches

Los modelos actuales son simples. Ampliar según los campos del Excel de Omada.

**Campos a agregar (Router y Switch por igual salvo donde se indica):**

| Campo Java | Firestore key | Tipo |
|---|---|---|
| `sitio` | `sitio` | String |
| `numeroSerie` | `numero_serie` | String |
| `ipPublica` | `ip_publica` | String |
| `estado` | `estado` | String |
| `modelo` | `modelo` | String |
| `version` | `version` | String |
| `macUplink` | `mac_uplink` | String |
| `salto` | `salto` | Integer |
| `grupoWlan` | `grupo_wlan` | String (solo AP/Router) |

**Archivos a modificar:**
- `models/Router.java` y `models/Switch.java` — agregar campos con `@PropertyName`
- DTOs correspondientes (`RouterDTO.java`, `SwitchDTO.java`)
- Mappers (`RouterMapper.java`, `SwitchMapper.java`)
- Frontend: `pages/RouterList.jsx`, `pages/SwitchList.jsx` — agregar columnas a la tabla

---

## Iteración 3 — Nueva entidad: Servidores

Modelo idéntico al patrón Cámara/Router: inventario manual, CRUD completo.

**Campos:**
- `nombre` (String, requerido)
- `hostname` (String)
- `ip` (String)
- `sistemaOperativo` (String)
- `ubicacion` (String)
- `descripcion` (String)
- `estado` (String — activo/inactivo/mantenimiento)

**Backend — archivos nuevos siguiendo el patrón de `Camara`:**
- `models/Servidor.java`
- `dto/ServidorDTO.java`
- `repository/ServidorRepository.java` (colección Firestore: `servidores`)
- `services/ServidorService.java`
- `controller/ServidorController.java` → `GET/POST /api/servidores`, `GET/PUT/DELETE /api/servidores/{id}`

**Frontend — archivos nuevos siguiendo el patrón de `Router`:**
- `api/servidorApi.js`
- `pages/ServidorList.jsx`
- `pages/ServidorDetalle.jsx`
- `pages/ServidorNuevo.jsx`
- Agregar rutas en `App.jsx`
- Agregar card de Servidores en `InfraestructuraDashboard.jsx`

---

## Iteración 4 — Importación desde Excel (todas las secciones)

Reutilizar y generalizar el patrón de `inventario-front/src/lib/camarasImport.js`.

**Estrategia:** crear un parser genérico `genericImport.js` en `src/lib/` que:
- Detecta CSV/XLSX automáticamente (ya existe lógica en `camarasImport.js`, extraer)
- Recibe un mapa de aliases de columnas por entidad
- Devuelve array de objetos normalizados

**Archivos de configuración de columnas** (uno por entidad, en `src/lib/importSchemas/`):
- `servidoresSchema.js` — nombre, hostname, ip, sistemaOperativo, ubicacion, estado
- `routersSchema.js` — nombre, ip, sitio, modelo, numeroSerie, estado, etc.
- `switchesSchema.js` — ídem routers
- `camarasSchema.js` — extraer aliases ya existentes de `camarasImport.js`
- `nvrsSchema.js`, `maquinasTesoreriaSchema.js` — si se desea consistencia

**UI:** agregar botón "Importar desde Excel" en cada página de lista, con modal de previsualización (tabla de filas a importar + columnas detectadas) antes de confirmar. Reutilizar componente si ya existe o crear `ImportModal.jsx` en `components/`.

---

## Iteración 5 — Filtros por atributo en cada lista

Agregar filtros inline en cada tabla de lista (no modal separado).

**Patrón:** barra de filtros encima de la tabla con inputs/selects por columna relevante. Implementar en el cliente (filter sobre el array ya cargado) para no requerir cambios de backend.

**Componente reutilizable:** `components/TableFilters.jsx` que recibe la definición de campos filtrables y emite el estado del filtro.

**Listas a actualizar:** Servidores, Routers, Switches, Cámaras, NVRs, Computadoras, Monitores, Periféricos.

---

## Backlog — Mejoras de front (iteración futura)

- Visualizaciones enriquecidas: más estadísticas en dashboards, gráficos de estado por categoría
- Diseño "premium": mejorar tipografía, espaciado, jerarquía visual, colores
- Skeleton loaders / mejor feedback de carga
- A definir en detalle con mockups o referencias visuales antes de implementar

---

## Orden de implementación recomendado

1. Filtro notebooks en monitores (cambio mínimo, backend solo)
2. Campos ampliados en Routers/Switches (backend + front)
3. Entidad Servidores completa (backend + front)
4. Import Excel genérico (frontend, reutiliza patrón existente)
5. Filtros por atributo en listas (frontend)
6. Mejoras de front (iteración separada, requiere diseño previo)

---

## Verificación

- Levantar backend Java y verificar `GET /api/monitores` no retorna monitores de notebooks
- Probar CRUD de Servidores via API y desde el frontend
- Importar un Excel de prueba con routers/switches y verificar mapeo de columnas
- Verificar que los filtros en tabla funcionan sin peticiones extra al backend