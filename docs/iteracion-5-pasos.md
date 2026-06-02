# Iteración 5 — Dashboard de inicio y estadísticas agregadas

## Objetivos

1. Exponer un endpoint de **estadísticas agregadas** para el inventario (totales, conteos por estado, por ubicación, PCs desconectadas, **totales de periféricos reportados por el agente**).
2. Crear una **página Dashboard** (nueva home `/`) con cards de resumen, lista de últimos cambios de estado y accesos directos a los listados.
3. Mover el listado actual de computadoras a `/computadoras` (la `/` queda para el dashboard).

> **Contexto:** Inspirada en el dashboard de ServiceDesk Plus (ManageEngine). Respeta la paleta oscura del sidebar (`#0e0f36`) y reusa `.card`, `.badge`, `.table` existentes.

---

## Parte A: Backend

### 1. DTO `DashboardStatsDTO` (nuevo en `dto/`)

- Campos:
  - `totalComputadoras` (int)
  - `totalCamaras` (int)
  - `computadorasConectadas` (int) — `estadoAgente == "Activo"`
  - `computadorasDesconectadas` (int)
  - `porEstadoComputadoras` (`Map<String, Integer>`) — clave = nombre del `EstadoOperativo` (ACTIVO, EN_MANTENIMIENTO, FUERA_DE_SERVICIO), valor = cantidad
  - `porEstadoCamaras` (`Map<String, Integer>`)
  - `porUbicacionComputadoras` (`Map<String, Integer>`) — clave = nombre del enum `Ubicacion`
  - `porUbicacionCamaras` (`Map<String, Integer>`)
  - `perifericos` (`PerifericosStatsDTO`) — totales agregados de periféricos del agente (ver paso 3)
  - `ultimosCambios` (`List<CambioRecienteDTO>`, máx 10)
- `@Data @NoArgsConstructor @AllArgsConstructor`.

### 2. DTO `CambioRecienteDTO` (nuevo en `dto/`)

- Campos:
  - `tipo` (String: `"computadora"` | `"camara"`)
  - `entidadId` (String: uuid u id)
  - `entidadNombre` (String: hostname o nombre)
  - `estado` (String)
  - `motivo` (String)
  - `fechaHoraInicio` (String ISO-8601)
- Sirve para alimentar la tabla "Actividad reciente" del dashboard sin exponer el historial completo.

### 3. DTO `PerifericosStatsDTO` (nuevo en `dto/`)

- Campos (`int`, todos no-null, default 0):
  - `totalImpresoras`
  - `totalMonitores`
  - `totalDispositivosUsb`
  - `totalAudioEntrada` — micrófonos
  - `totalAudioSalida` — parlantes / auriculares / headsets
- `@Data @NoArgsConstructor @AllArgsConstructor`.
- Representa el **conteo agregado** de periféricos reportados por el agente C# a lo largo de todas las PCs. No confundir con inventario IT manual (un teclado USB suma aunque IT no lo haya dado de alta).

### 4. `DashboardService` (nuevo en `service/`)

- Método `getStats()`:
  1. Cargar todas las `Computadora` y `Camara` desde los repos existentes.
  2. Recorrer una vez cada colección, contabilizando totales, conexión, estado y ubicación.
  3. En la misma pasada sobre computadoras, acumular los conteos de `PerifericosStatsDTO` sumando `c.perifericos.impresoras.size()`, `c.perifericos.monitores.size()`, `c.perifericos.dispositivosUsb.size()`, `c.perifericos.audio.entrada.size()` y `c.perifericos.audio.salida.size()`. **Null-safe**: si `c.perifericos` o cualquier sublista es `null`, suma 0.
  4. Aplanar todos los `CambioEstado` con `activo == true` (o los más recientes por `fechaHoraInicio`), ordenar descendente y tomar top 10.
- Todo en memoria — la cantidad de docs es chica (inventario IT de una empresa).
- **Nota de evolución:** cuando la Iter 6 cree el `PerifericoAgenteService` con métodos de listado agregado, el `DashboardService` puede delegarle los conteos para evitar duplicar lógica (DRY). No es requisito para Iter 5 — se puede refactorizar después.

### 5. Controller `DashboardController` (nuevo en `controller/`)

- `GET /api/dashboard/stats` → `DashboardStatsDTO` (200 OK).
- Sin parámetros. No cacheamos todavía (si hace falta, se agrega en una iteración futura).

### 6. Reutilización de mappers existentes

- No hace falta DTO nuevo para cargar datos. Usar directamente los repos + entidades.
- Para los conteos de periféricos, el service accede a `c.getPerifericos()` directamente sobre el modelo `Computadora` (ya deserializado desde Firestore vía `PerifericosFirestore`); no hace falta pasar por `PerifericosAgenteMapper` ni `ComputadoraMapper.toDTO`.

---

## Parte B: Frontend

### 7. API

- Nuevo `src/api/dashboardApi.js` con `fetchDashboardStats()` → GET a `http://localhost:8080/api/dashboard/stats`.

### 8. Página `Dashboard.jsx` (nueva en `src/pages/`)

Estructura (usando clases `.page`, `.card`, `.badge`, `.table` existentes para coherencia):

- **Header**: `<h1>Inventario BACARSA</h1>` + párrafo `.muted` con fecha/hora de última actualización.
- **Fila 1 — Cards de resumen de activos** (grid responsive, 4 columnas en desktop → 2 → 1):
  - Total Computadoras (con sub-conteo "X conectadas / Y desconectadas").
  - Total Cámaras.
  - Equipos activos (suma PCs + cámaras en estado ACTIVO).
  - Equipos en mantenimiento o fuera de servicio.
  - Cada card con borde izquierdo coloreado (`--color-sidebar-bar`, `--color-success-border`, `--color-accent`, `--color-danger`) siguiendo el patrón existente de `.card { border-left: 4px solid ... }`.
- **Fila 2 — Cards de periféricos detectados por el agente** (mismo `.stats-grid`, 4–5 columnas):
  - Impresoras — `perifericos.totalImpresoras`.
  - Monitores — `perifericos.totalMonitores`.
  - Dispositivos USB — `perifericos.totalDispositivosUsb` (incluye teclados, mouse, pendrives, etc.).
  - Audio entrada — `perifericos.totalAudioEntrada` (micrófonos).
  - Audio salida — `perifericos.totalAudioSalida` (parlantes / auriculares).
  - Encima o al costado, subtítulo `.muted` aclaratorio: **"Dispositivos reportados por el agente (no es inventario IT manual)"**. Evita confusión con los cambios de estado manual.
  - Reusar clases `.stat-card` y `.stat-card--info` (nueva, solo cambia `border-left-color` al gris neutro — ver paso 10).
- **Fila 3 — Distribución** (2 columnas):
  - "Computadoras por estado" — lista horizontal de badges con conteo (reusar `.badge-info`, `.badge-success`, `.badge-neutral`).
  - "Computadoras por ubicación" — ídem.
- **Tabla "Actividad reciente"** (máx 10 filas) con columnas: Tipo, Equipo, Estado nuevo, Motivo, Fecha. Cada fila linkea al detalle correspondiente (`/computadoras/:uuid` o `/camaras/:id`) según `tipo`.
- Estados vacíos: "Sin cambios recientes" y mensaje de error con `.estado-msg`.

### 9. Rutas y navegación

- `App.jsx`:
  - `/` → `<Dashboard />` (nueva home).
  - `/computadoras` → `<ComputadoraList />` (mover desde `/`).
  - Mantener `/computadoras/:uuid`, `/camaras`, `/camaras/nueva`, `/camaras/:id`.
- Agregar NavLink **"Inicio"** arriba de "Computadoras" en el sidebar, con emoji simple.

### 10. Estilos

- Agregar en `App.css` sección `/* ── Dashboard ───── */`:
  - `.stats-grid` — CSS Grid, `repeat(auto-fit, minmax(220px, 1fr))`, gap 1rem.
  - `.stat-card` — extiende `.card` con número grande (`font-size: 2rem; font-weight: 700; color: var(--color-primary)`) y label (`.muted`).
  - Variantes `.stat-card--success`, `.stat-card--warning`, `.stat-card--danger`, `.stat-card--info` — solo cambian el `border-left-color`.
- Todo dentro de `App.css`, **sin** instalar librerías nuevas (no Tailwind, no UI kit).

---

## Prueba integrada

1. Backend en `localhost:8080`, front en `localhost:5173`.
2. `GET /api/dashboard/stats` devuelve totales coherentes con los listados existentes **y** un objeto `perifericos` con los 5 conteos (impresoras, monitores, usb, audio entrada, audio salida).
3. Sumar manualmente los periféricos de 2-3 PCs en Firestore y verificar que el conteo del endpoint coincide.
4. En `/` aparece el nuevo dashboard con las 2 filas de stat-cards (activos + periféricos); `/computadoras` sigue mostrando el listado.
5. Cambiar estado de una PC a EN_MANTENIMIENTO → recargar `/` → los conteos reflejan el cambio y el cambio aparece en "Actividad reciente".
6. PC **sin** campo `perifericos` en Firestore: el endpoint no rompe y la fila de periféricos muestra 0 en los conteos de esa PC.
7. Inventario vacío: dashboard no rompe, muestra ceros en todas las cards y "Sin cambios recientes".

---

## Notas

- El dashboard agrega por ahora computadoras + cámaras; cuando se incorporen nuevos tipos de activos (switches, routers), se extienden `DashboardStatsDTO` y la UI.
- Los conteos de periféricos son del **snapshot del agente C#** — reflejan lo que reporta Windows, no el inventario IT manual. Por eso la aclaración `.muted` en la UI ("Dispositivos reportados por el agente").
- **Evolución futura:** cuando Iter 6 introduzca `PerifericoAgenteService` con métodos de listado agregado (`listarTodasLasImpresoras`, etc.), `DashboardService` puede delegarle los conteos para evitar duplicar lógica. Refactor opcional, no bloqueante.
- No se agrega caché ni autenticación — coherente con el scope actual del proyecto.
- Cuando cierre la iteración, actualizar la sección de iteraciones del `README.md` del repo.
