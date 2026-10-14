# Auditoría de Código Muerto

**Fecha:** 2026-09-11
**Proyecto:** MiniAgente-Inventario
**Rama:** dev
**Alcance:** Revisión completa del proyecto, con foco principal en `inventario/inventario-front/src/` (162 archivos `.js`/`.jsx`/`.css`) y una revisión de directorios huérfanos en el resto del repositorio.

**Metodología:** análisis estático propio (grafo de imports/exports vía script Python) + `eslint` (regla `no-unused-vars`, ya configurada en `eslint.config.js`, corrida tras `npm install`) + verificación manual con `grep`/`Read` de cada hallazgo antes de reportarlo. No se modificó ni se borró ningún archivo de código fuente.

---

## Resumen Ejecutivo

| Categoría | Cantidad |
|---|---|
| Imports muertos | 30 |
| Funciones/componentes sin uso | 22 |
| Variables/constantes sin uso | 8 |
| Hooks sin consumidores | 2 |
| Archivos huérfanos | 8 hallazgos (≈86 archivos) |
| Exports sin importadores | 49 |
| CSS sin uso | ≈125 selectores |
| Código comentado abandonado | 0 |
| Código duplicado/reemplazado | 4 |
| **Total** | **≈248** |

---

## Hallazgos Detallados

### 1. Imports Muertos

Confirmados con `eslint` (`no-unused-vars`) sobre `inventario-front`, verificados leyendo cada archivo.

#### `motion` (librería `motion/react`)
- **Archivos:** `components/ComputadorasEstadoModal.jsx:5`, `components/ImportModal.jsx:2`, `components/InfraestructuraModal.jsx:1`, `pages/CelularList.jsx:3`, `pages/InfraestructuraDashboard.jsx:3`, `pages/PerifericoManualList.jsx:4`, `pages/PerifericosDashboard.jsx:3`, `pages/TelefonoIpList.jsx:5`, `pages/TelevisorList.jsx:3`
- **Qué es:** import de `{ motion }` (y en varios casos también `AnimatePresence`, este sí usado) desde `motion/react`.
- **Por qué es código muerto:** `motion` no se referencia en el JSX de ninguno de estos 9 archivos (quedó de una versión anterior con animaciones).
- **Prioridad:** Baja (no rompe nada, pero infla el bundle innecesariamente en 9 archivos).

#### `studioTableClass`, `studioTheadClass`, `studioThClass`, `studioTdClass` (de `components/studio/StudioUi`)
- **Archivos:** `pages/CamaraList.jsx:19-22`, `pages/MaquinaTesoreriaList.jsx:18-21`, `pages/NvrList.jsx:18-21`, `pages/ServidorList.jsx:17-20`
- **Qué es:** 4 helpers de clases CSS para tablas, importados pero nunca aplicados (estas listas usan otro patrón de tabla).
- **Por qué es código muerto:** ninguno de los 4 nombres aparece en el cuerpo de estos archivos.
- **Prioridad:** Baja.

#### `useNavigate` (react-router-dom)
- **Archivo:** `pages/InfraestructuraDashboard.jsx:5`
- **Por qué es código muerto:** no se invoca `useNavigate()` en el archivo.
- **Prioridad:** Baja.

#### `useState` (react)
- **Archivo:** `pages/PerifericosDashboard.jsx:1`
- **Por qué es código muerto:** el archivo solo usa `useMemo` de ese import; `useState` no se usa (el estado se maneja vía React Query).
- **Prioridad:** Baja.

#### `updateUbicacionCamara` (api/camaraApi)
- **Archivo:** `pages/CamaraList.jsx:3`
- **Por qué es código muerto:** se importa junto a otras 6 funciones de `camaraApi`, pero nunca se invoca.
- **Prioridad:** Baja.

#### `labelDeCatalogo` (hooks/useCatalogo)
- **Archivo:** `pages/MaquinaTesoreriaList.jsx:9`
- **Por qué es código muerto:** se importa pero el componente no lo llama.
- **Prioridad:** Baja.

#### `cambiarEstadoInterno` (api/internoIpApi)
- **Archivo:** `pages/TelefonoIpList.jsx:9-16`
- **Por qué es código muerto:** se importa junto a `fetchInternos`, `createInterno`, etc., pero nunca se usa en el archivo. Es además la única referencia a esta función en todo el proyecto (ver también sección 6 — el export tampoco tiene otros consumidores).
- **Prioridad:** Media (podría indicar una funcionalidad de cambio de estado no terminada de conectar a la UI).

---

### 2. Funciones/Componentes sin uso

#### Funciones locales sin uso (confirmadas por `eslint`)
| Función | Archivo | Línea |
|---|---|---|
| `handleCopyAnydesk` | `components/AsignacionesBoard.jsx` | 78 |
| `toggleSeleccionarVisibles` | `pages/CamaraList.jsx` | 291 |
| `eliminarCamaraFila` | `pages/CamaraList.jsx` | 431 |
| `handleOpenAddModal` | `pages/MaquinaTesoreriaList.jsx` | 56 |
| `handleOpenAddModal` | `pages/ServidorList.jsx` | 60 |
| `claveFila` | `pages/PerifericosMicrofonosList.jsx` | 9 |
| `claveFila` | `pages/PerifericosMonitoresList.jsx` | 16 |
| `claveFila` | `pages/PerifericosMouseList.jsx` | 9 |
| `claveFila` | `pages/PerifericosParlantesList.jsx` | 9 |
| `claveFila` | `pages/PerifericosTecladosList.jsx` | 9 |
| `claveFila` | `pages/PerifericosWebcamsList.jsx` | 9 |
| `limpiarNombre` | `pages/PerifericosMonitoresList.jsx` | 20 |
- **Por qué es código muerto:** declaradas (algunas con lógica no trivial, como `eliminarCamaraFila`, que hace un `await` a la API) pero nunca invocadas ni pasadas como prop/handler.
- **Nota:** `claveFila` se repite idéntica en 6 páginas de periféricos — probablemente boilerplate copiado de una plantilla común donde después se optó por otra estrategia de `key` en las listas.
- **Prioridad:** Media para `eliminarCamaraFila` (parece una función de borrado a medio conectar); Baja para el resto.

#### Componentes React exportados sin importadores
- **`CredentialsInput`** — `components/CredentialsField.jsx:39` (el archivo sí exporta `CredentialsDisplay`, que se usa en `CamaraDetail.jsx` y `NvrDetail.jsx`; `CredentialsInput` no se usa en ningún lado). Prioridad: Baja.
- **`BadgePreparacion`, `BadgeAgente`, `BadgeLoteInventario`** — `components/StockEstadoBadges.jsx:60,65,70` (otros badges del mismo archivo como `BadgeDisponibilidad`, `BadgeUnidadTrazable`, `StockEstadosUnidad` sí se usan). Prioridad: Baja.
- **`StudioCardGrid`, `StudioPerifericoCard`, `StudioSection`, `StudioKpiBox`, `StudioDiskBar`, `StudioDetailTabs`** — `components/studio/StudioUi.jsx` (este archivo es un design-system interno muy usado — 30 archivos lo importan — pero estos 6 componentes específicos no los consume nadie). Prioridad: Baja.

---

### 3. Variables y Constantes sin uso

Confirmadas por `eslint` (`no-unused-vars`):

| Variable | Archivo | Línea |
|---|---|---|
| `copiedAnydesk` (state) | `components/AsignacionesBoard.jsx` | 33 |
| `result` | `components/AsignacionesBoard.jsx` | 125 |
| `borrandoId` (state) | `pages/CamaraList.jsx` | 46 |
| `nvrNombre` | `pages/CamaraList.jsx` | 208 |
| `msgEliminar` (state) | `pages/ComputadoraDetail.jsx` | 102 |
| `loadingProfile` (state) | `pages/MiPerfil.jsx` | 21 |
| `apIds` | `pages/RoutersSwitchesList.jsx` | 247 |
| `isSyncing` (state) | `pages/TelefonoIpList.jsx` | 21 |

- **Por qué es código muerto:** son asignaciones (`const`/`useState`) que se calculan pero nunca se leen después; en los casos de `useState`, el setter puede seguir usándose pero el valor leído no.
- **Prioridad:** Baja en general; Media en `msgEliminar`/`borrandoId`/`isSyncing`, que sugieren un flujo de feedback de UI (mensaje de error al eliminar, indicador de sincronización) que quedó a medio implementar.

---

### 4. Hooks personalizados sin consumidores

#### `useTareasHW`
- **Archivo:** `hooks/useTareasHW.js` (57 líneas, único export del archivo)
- **Por qué es código muerto:** ningún componente importa `useTareasHW` ni el archivo `hooks/useTareasHW.js` (verificado: 0 referencias en todo `src/`). El archivo completo es huérfano (ver también sección 5).
- **Prioridad:** Media (57 líneas de lógica de negocio — probablemente una feature de "tareas de hardware" que se abandonó o se reemplazó por `useComandoHW`/`useTareasHW`-equivalentes en otro hook).

#### `useLabelUbicacionComputadora`
- **Archivo:** `hooks/useCatalogo.js:58`
- **Por qué es código muerto:** el resto del archivo (`useCatalogo`, `opcionesEnumCatalogo`, `labelDeCatalogo`) se usa ampliamente; este hook específico no tiene ningún importador.
- **Prioridad:** Baja.

---

### 5. Archivos Huérfanos

#### Dentro de `inventario/inventario-front/src/`

- **`components/NavIcon.jsx`** (7 líneas) — componente wrapper de íconos de navegación. 0 referencias en todo el proyecto.
- **`lib/navIcons.js`** — su único importador es `components/NavIcon.jsx`, que a su vez no lo importa nadie. Es decir, es un par de archivos que solo se referencian entre sí y no cuelgan de ningún punto vivo del árbol de imports (`SidebarNav.jsx` resuelve los íconos del menú por otro camino).
- **`constants/estados.js`** (19 líneas) — exporta `ESTADOS_OPERATIVOS` y `ESTADO_OPERATIVO_LABELS`; ninguno de los dos se usa en ningún componente.
- **`constants/topicos.js`** (46 líneas) — exporta `TOPICOS`; no se importa en ningún archivo (la navegación real vive hardcodeada en `SidebarNav.jsx`).
- **`pages/ColaboradoresList.jsx`** (466 líneas) — página completa de listado de "Colaboradores". No está registrada en ninguna ruta de `App.jsx`, no aparece en `SidebarNav.jsx` ni en `constants/topicos.js`. Parece una feature construida y nunca conectada al router, o retirada de la navegación sin borrar el archivo.

- **Prioridad:** Alta para `pages/ColaboradoresList.jsx` (466 líneas de página completa, con llamadas a API, sin ruta — vale la pena decidir si se termina de conectar o se borra); Media para el resto.

#### Directorios huérfanos completos (fuera de `inventario-front/src`)

- **`front/`** (raíz del repo, 13 archivos `.tsx`/`.ts` sueltos, ~8082 líneas: `EtiquetaQrFicha.tsx`, `CatalogIcon.tsx`, `ComputadoraHardwareSection.tsx`, `ramHelpers.ts`, `ComputadoraSoftwareSection.tsx`, `ComputadorasList.tsx`, `HardwareComplementList.tsx`, `ComputadoraPerifericosSection.tsx`, `CatalogosAbm.tsx`, `types (1).ts`, `EtiquetasQrList.tsx`, `catalogosDefault.ts`, `types.ts`). No pertenecen a ningún `package.json`/build; no los referencia nada en `inventario-front`. Comparando `front/CatalogIcon.tsx` contra `inventario-front/src/components/CatalogIcon.jsx` se confirma que son el mismo componente en un borrador TypeScript previo (ver también sección 9).
- **`front/version v1 409/gestión-de-inventario-it/`** (57 archivos, 2.8 MB, incluye además el propio `.zip` del proyecto) — una versión anterior completa del frontend (con su propio `package.json`, `vite.config.ts`, etc.), evidentemente reemplazada por `inventario/inventario-front/`.
- **`inventario/inventario-front/src/App.tsx`, `main.tsx`, `mockData.ts`, `types.ts`, `components/AssetsList.tsx`, `components/Assignments.tsx`, `components/ComputadorasList.tsx`, `components/Dashboard.tsx`, `components/ReportsView.tsx`, `components/StockList.tsx`, `components/UsersList.tsx`** (11 archivos, 5617 líneas) — un scaffold TypeScript completo (con datos mock) que convive dentro del propio `src/` real. `index.html` solo carga `<script type="module" src="/src/main.jsx">` (la app real en `.jsx`), por lo que Vite nunca compila ni sirve este `main.tsx`/`App.tsx`. Es, en la práctica, un prototipo temprano de la app (con datos falsos) que quedó "vivo" en el árbol de fuentes.
- **Prioridad:** Alta para los tres (representan ~86 archivos y varios MB de código que ningún build usa; generan confusión sobre cuál es la versión vigente).

---

### 6. Exports sin Importadores

Verificado con `grep -rnw` en todo `inventario-front` (no solo `src/`) que el nombre no aparece en ningún otro archivo salvo su propia declaración.

**Capa API** (funciones de fetch/delete/etc. sin ningún componente que las invoque):
- `api/accessPointApi.js` :: `deleteAccessPoint`
- `api/camaraApi.js` :: `fetchHistorialCamara`
- `api/celularApi.js` :: `fetchCelular`
- `api/computadoraApi.js` :: `fetchHistorial`
- `api/conciliacionApi.js` :: `fetchConciliacion`, `reprocesarMatchingAdmin`
- `api/etiquetaQrApi.js` :: `fetchEtiquetaQrPorHostname`
- `api/internoIpApi.js` :: `fetchInternoById`, `fetchHistorialInterno`, `cambiarEstadoInterno` (ver también sección 1)
- `api/perifericoManualApi.js` :: `fetchPerifericosPorPc`
- `api/perifericosAgenteApi.js` :: `invalidatePerifericosAgenteListadosCache`
- `api/routerApi.js` :: `deleteRouter`
- `api/switchApi.js` :: `deleteSwitch`
- `api/televisorApi.js` :: `fetchTelevisor`
- `api/usuarioApi.js` :: `fetchUsuario`
- **Prioridad:** Media — varias son operaciones de borrado/histórico (`deleteRouter`, `deleteSwitch`, `deleteAccessPoint`, `fetchHistorial*`) que suenan a funcionalidad planeada (¿falta el botón "eliminar" o la vista de histórico en la UI?) más que a simple descarte.

**Constantes**:
- `constants/catalogosConstants.js` :: `COLOR_OPTIONS`
- `constants/celulares.js` :: `ESTADOS_CELULAR`, `ESTADO_CELULAR_LABELS`
- `constants/roles.js` :: `labelRolSistema`
- `constants/televisores.js` :: `ESTADOS_TELEVISOR`, `ESTADO_TELEVISOR_LABELS`
- `constants/tiposStock.js` :: `opcionesTipoStock`
- `constants/ubicaciones.js` :: `UBICACIONES_COMPUTADORA_LABELS`, `UBICACIONES_COMPUTADORA`, `UBICACIONES_RED`, `UBICACIONES_CAMARA_LEGACY`, `UBICACIONES_CAMARA_IMPORTADAS`, `UBICACIONES_CAMARA_SUGERIDAS`, `UBICACIONES_CAMARA`
- **Prioridad:** Baja (son datos, no lógica; el archivo sigue vivo por otros exports).

**`lib/`**:
- `lib/etiquetaQr.js` :: `ETIQUETA_TERMICA`
- `lib/firebase.js` :: `getFirebaseApp`
- **Prioridad:** Baja.

**`utils/`**:
- `utils/logisticaProgreso.js` :: `ESTADOS_PUESTO`
- `utils/perifericoPcHelpers.js` :: `labelPcAsignable`
- `utils/perifericos.js` :: `siNo`, `esWebcam`, `esBluetooth`, `filtrarUsbSinDuplicadoWebcamCam`, `debeOcultarUsbParaInventario`
- `utils/reporteInventario.js` :: `resolverEstadoPc`, `esTipoComputadoraStock`
- `utils/stockPcHelpers.js` :: `parseSpecFromNombre`, `specFromItem`
- `utils/syncActividad.js` :: `edadUltimaSyncMs`, `CICLO_SYNC_AGENTE_MINUTOS`
- **Prioridad:** Baja.

**`hooks/`**:
- `hooks/useLogsActualizacion.js` :: `deleteLogsActualizacionCoinciden` (función async que sí hace una operación real de borrado en Firestore/API — vale revisar si debería estar conectada a algún botón de admin)
- `hooks/useLogsDebug.js` :: `LOGS_DEBUG_SNAPSHOT_CAP`
- **Prioridad:** Media para `deleteLogsActualizacionCoinciden`, Baja para el resto.

**Otros**:
- `components/StockEstadoBadges.jsx` :: `labelDisponibilidad` (función auxiliar; el componente `BadgeDisponibilidad` del mismo archivo sí se usa, pero no llama a esta función auxiliar).
- `components/EtiquetaQrChecklistProgreso.jsx` :: el `export default` (línea 411) no tiene consumidores — el único importador (`pages/EtiquetaQrFicha.jsx:35`) usa el **named export** (`import { EtiquetaQrChecklistProgreso } from ...`), por lo que el `export default EtiquetaQrChecklistProgreso;` es redundante.
- **Prioridad:** Baja.

---

### 7. CSS sin uso

`App.css` tiene 2932 líneas; `index.css` 135. Se extrajeron los ~282 selectores de clase y se verificó cada uno contra todo `src/` (incluyendo construcción dinámica de `className`). Resultado: **≈125 clases nunca referenciadas**, concentradas en bloques que corresponden a páginas que migraron su estilado a utilidades de Tailwind pero cuyo CSS "viejo" nunca se eliminó (ver también sección 9). Se listan agrupadas por bloque, con una clase representativa y su línea:

| Bloque | Ejemplo / línea | Clases del bloque (no usadas) | Evidencia |
|---|---|---|---|
| Login (`Login.jsx`) | `.login-container` (App.css:51) | `login-container`, `login-left*`, `login-dot`, `login-right`, `login-bracket-wrap`, `login-corner` + 4 modificadores, `login-card-header`, `login-floating-card`, `login-card-title`, `login-card-subtitle`, `login-toggle*`, `login-form`, `login-field`, `login-name-row`, `login-label`, `login-error` (~24 clases) | `pages/Login.jsx` ahora usa solo clases Tailwind (`min-h-screen`, `bg-[#02040a]`, etc.) + la clase contenedora `login-page`, que sí sigue viva. |
| Panel "System" (`System.jsx`) | `.sys-left-panel` | `sys-split`, `sys-left-panel`, `sys-right-panel`, `sys-card-*`, `sys-node-*`, `sys-batch-*`, `sys-installer-reqs`, `sys-terminal-feedback--ok`, `sys-stat-icon--*` (~20 clases) | `pages/System.jsx` usa exclusivamente utilidades Tailwind. |
| Dashboard viejo | `.metric-card` (App.css:1241 aprox.) | `metric-card` + 5 variantes de color, `metric-card__title/value/sub`, `dashboard-perifericos-card*` (7), `dashboard-charts-row`, `dashboard-distribution`, `dashboard-metric-icon-card`, `dashboard-metrics-row/foot` (~20 clases) | `pages/Dashboard.jsx` reescrito con Tailwind (`bg-white rounded-xl border...`). |
| Stat cards | `.stat-card__value` (App.css:1246) | `stat-card`, `stat-card__value/label/sub`, `stat-card--success/warning/danger` (7 clases) | 0 referencias en `src/`. |
| Comandos HW | `.comandos-hw` (App.css) | `comandos-hw`, `comandos-hw-host`, `comandos-hw-list` | 0 referencias. |
| Filtros viejos | `.filter-bar` | `filter-bar`, `filter-input`, `filter-label` | `components/TableFilters.jsx` (el filtro actual) usa otras clases/Tailwind. |
| Tablas | `.table-checkbox` | `table-checkbox`, `table-col-check`, `table-col-sync`, `table-row-link` | 0 referencias. |
| Sync/estado | `.sync-dot` | `sync-dot` + 4 modificadores (`--activo`, `--critico`, `--intermedio`, `--sin-datos`) | 0 referencias. |
| Buscador | `.search-result-title` | `search-result-line1`, `search-result-title`, `search-result-sub` | 0 referencias. |
| Inventario (toolbar vieja) | `.inventory-toolbar-card` | `inventory-toolbar-card`, `inventory-page-sub`, `inventory-bulk-estado-section`, `inventory-bulk-section-heading` | 0 referencias (otras clases `inventory-*` del mismo archivo sí siguen usándose). |
| Badges de red | `.badge-router` (App.css:1067) | `badge-router`, `badge-switch`, `badge-row` | 0 referencias (`badge`, `badge-success`, etc. sí se usan). |
| Detalle | `.detail-dl` | `detail-dl` (+ `dt`/`dd`), `detail-tabs-block--tabs-only` | 0 referencias. |
| Formulario ubicación | `.ubicacion-form-row` | `ubicacion-form-row`, `ubicacion-form--assign` | La clase base `.ubicacion-form` sigue usándose (`MaquinaTesoreriaList.jsx`, `NvrNueva.jsx`, `ServidorList.jsx`); solo estos 2 modificadores están muertos. |
| Tabla periféricos PC | `.td-pcs-impresora` | `td-pcs-impresora`, `.link-inline` anidado, `tarea-log`, `td-log` | 0 referencias. |
| Inputs "bare" | `.ui-date--bare` | `ui-date--bare`, `ui-select--bare` | 0 referencias. |
| Navegación | `.nav-link-emoji`, `.page--computadora-list` | idem | 0 referencias. |
| Logo | `.logo-icon` (App.css:507) | `logo-icon` (+ `svg`) | Ligado al componente huérfano `NavIcon.jsx` (sección 5): nadie renderiza el logo por ese camino. |
| Sidebar | `.sidebar-auth-email`, `.sidebar-logout-text` | idem | 0 referencias. |
| Varios/compuestos | `.error.small`, `.muted.small` (App.css:2117-2119) | selector compuesto `small` combinado con `.error`/`.muted` | No se encontró ningún `className` que combine `error`/`muted` con `small`. |

- **Prioridad:** Media — no rompe nada en runtime (CSS de más simplemente no se aplica), pero son ~125 reglas repartidas en más de la mitad de un archivo de 2932 líneas, lo que dificulta mantenerlo. Recomendable limpiar por bloque a medida que se toque cada página.

---

### 8. Código Comentado Abandonado

No se encontraron bloques significativos de código comentado (ni `// código` de 4+ líneas consecutivas, ni bloques `/* ... */` con código, ni JSX comentado `{/* ... */}` de más de 3 líneas) en `inventario/inventario-front/src/`. Los únicos comentarios largos encontrados son JSDoc legítimo (por ejemplo `hooks/useFirebaseAuth.js:5-11`), no código muerto.

- **Cantidad:** 0

---

### 9. Código Duplicado/Reemplazado

#### `lib/camarasImport.js` vs `lib/genericImport.js`
- **Archivo obsoleto (parcial):** `lib/camarasImport.js` — define internamente `normalizeNewlines` (línea 4), `normalizeKey` (21), `pickNorm` (30), `buildNorm` (81), `detectDelimiter` (199), `normalizeImportCell` (206), `collapseSpacesBetweenSemicolons` (217), `splitCsvLine` (228), `readCsvFileText` (256) — 9 funciones.
- **Mejor implementación en:** `lib/genericImport.js` líneas 2, 9, 18, 29, 61, 68, 76, 87, 112 — las mismas 9 funciones, ya generalizadas para cualquier entidad vía `schema` (usadas por `components/ImportModal.jsx` + `lib/importSchemas/*.js`, el sistema de importación genérico usado por todas las demás entidades).
- **Por qué es obsoleto:** `camarasImport.js` es la implementación específica de cámaras que antecede al sistema genérico (existe incluso `lib/importSchemas/camarasSchema.js`, el equivalente "genérico" para cámaras). Solo `pages/NvrDetail.jsx` sigue usando `camarasImport.js` (vía `parseCamaraImportFile`/`importCamarasRowsToNvr`/`PLANTILLA_CSV_CAMARAS`); las 9 funciones internas duplicadas ya no aportan nada que `genericImport.js` no resuelva.
- **Prioridad:** Media — no es código "muerto" (se ejecuta), pero es lógica duplicada mantenida en dos lugares; migrar la importación de cámaras al sistema genérico eliminaría ~150 líneas.

#### `fmtFechaIso` duplicada
- **Archivo obsoleto:** `pages/ComputadoraDetail.jsx:27-31` (función local, no exportada, idéntica carácter por carácter).
- **Mejor implementación en:** `components/DetailInfraHelpers.jsx:5-9` (exportada, pensada para reutilizarse — de hecho ya la usa el propio `DetailInfraHelpers.jsx` internamente, pero curiosamente ningún otro archivo la importa pese a estar exportada — ver sección 6).
- **Por qué es obsoleto:** es la misma función (formatea fecha ISO a `es-AR`) copiada en vez de importada.
- **Prioridad:** Baja.

#### CSS legacy (App.css) vs migración a Tailwind
- **Archivo obsoleto:** bloques de `App.css` para `login-*`, `sys-*`, `metric-card*`, `dashboard-*`, `stat-card*` (ver detalle completo en sección 7).
- **Mejor implementación en:** `pages/Login.jsx`, `pages/System.jsx`, `pages/Dashboard.jsx` actuales, que usan utilidades Tailwind inline.
- **Por qué es obsoleto:** el diseño se rehizo con Tailwind pero el CSS custom anterior nunca se retiró de `App.css`.
- **Prioridad:** Media (impacto en mantenibilidad del CSS, no funcional).

#### Prototipos/versiones anteriores del frontend completo
- **Archivo/directorio obsoleto:** `front/` (13 archivos sueltos), `front/version v1 409/gestión-de-inventario-it/` (proyecto Vite completo, 57 archivos) y el scaffold `.tsx` dentro de `inventario/inventario-front/src/` (`App.tsx`, `main.tsx`, `mockData.ts`, `types.ts` + 7 componentes en `components/`).
- **Mejor implementación en:** `inventario/inventario-front/src/` (los `.jsx` reales, servidos por `index.html` → `/src/main.jsx`).
- **Por qué es obsoleto:** son iteraciones/borradores previos (con datos mock, sin conexión a Firebase/API real) del mismo frontend, confirmado comparando componentes homónimos (p. ej. `front/CatalogIcon.tsx` vs `src/components/CatalogIcon.jsx`, mismo componente, borrador en TS vs versión final en JSX).
- **Prioridad:** Alta (ver sección 5 — representan la mayor cantidad de bytes/archivos muertos del repositorio).

---

## Recomendaciones de Limpieza

Priorizadas de mayor a menor impacto:

1. **Decidir sobre los directorios/archivos huérfanos grandes** (sección 5 y 9): `front/`, `front/version v1 409/` y el scaffold `.tsx` dentro de `inventario-front/src/`. Si son prototipos descartados, eliminarlos reduce significativamente el tamaño del repo y evita confusión sobre "cuál es la versión real". Si `front/version v1 409/` se guarda como referencia histórica, moverlo fuera del árbol de código activo (o a un tag/branch) en vez de convivir en la raíz.
2. **Decidir el destino de `pages/ColaboradoresList.jsx`** (466 líneas, sin ruta ni entrada de menú): o se termina de conectar (ruta en `App.jsx` + entrada en `SidebarNav.jsx`/`topicos.js`) o se elimina.
3. **Revisar las funciones de borrado/histórico sin usar en la capa API** (`deleteRouter`, `deleteSwitch`, `deleteAccessPoint`, `fetchHistorial*`, `deleteLogsActualizacionCoinciden`, `cambiarEstadoInterno`): parecen funcionalidad planeada e incompleta más que descarte; vale la pena confirmar con el equipo si falta conectarlas a la UI antes de borrarlas.
4. **Unificar `lib/camarasImport.js` con `lib/genericImport.js`**, migrando `NvrDetail.jsx` al sistema genérico de importación y eliminando las 9 funciones duplicadas.
5. **Limpiar `App.css`** eliminando los ~125 selectores de las páginas ya migradas a Tailwind (`login-*`, `sys-*`, `metric-card*`, `dashboard-*`, `stat-card*`, etc.), idealmente a medida que se retoque cada página para minimizar riesgo.
6. **Eliminar imports muertos** (`motion`, `studioTableClass`/`studioTheadClass`/`studioThClass`/`studioTdClass`, `useNavigate`, `useState`, etc.) — cambio mecánico y de bajo riesgo, ideal para automatizar corriendo `eslint . --fix` (nota: `no-unused-vars` no es autofixable por eslint, requiere borrado manual línea por línea, pero la lista de la sección 1 ya da la ubicación exacta).
7. **Borrar funciones/componentes/hooks sin consumidores** de las secciones 2, 4 y 6 (constantes, badges, hooks) una vez confirmado con el equipo que no son funcionalidad pendiente.
8. **Correr `eslint .` en CI** — la regla `no-unused-vars` ya está configurada en `eslint.config.js` pero no hay evidencia de que se corra en un pipeline; esto habría detectado automáticamente gran parte de las secciones 1 y 3.
9. **Limpiar archivos sueltos en `inventario/` (raíz del backend Java)** fuera del alcance detallado de esta auditoría (enfocada en el frontend), pero se detectaron de paso varios candidatos obvios a revisar: scripts ad-hoc `fix_vida.js`, `fix_fields.js`, `fix_grid.js`, `fix_grid2.js`, `fix_hooks.js`, `fix_bugs.js`, `inject.js` (no referenciados por ningún build ni documentación) y logs de crash de la JVM (`hs_err_pid*.log`, `replay_pid*.log`, varios cientos de KB cada uno) que no deberían estar versionados.
