# Sistema de Inventario Informático

> Documentación de diseño — v1.0

---

## 1. Descripción general

El sistema centraliza el inventario de equipos informáticos de la empresa. Se alimenta automáticamente de un agente (Windows Service en C#) que corre en cada PC de la red y reporta en tiempo real los componentes de hardware, periféricos conectados y estado del sistema operativo hacia un backend en Firebase/Firestore.

Adicionalmente, el sistema permite la carga manual de activos que el agente no puede detectar: cámaras de seguridad, ubicaciones físicas de los equipos y cualquier periférico no asignado directamente a una PC.

---

## 2. Objetivos

- Mantener un inventario actualizado y centralizado de todos los activos informáticos de la empresa.
- Automatizar la recolección de datos de hardware (discos, procesador, RAM, periféricos) desde cada equipo.
- Permitir el seguimiento del ciclo de vida de cada activo mediante un historial de cambios de estado.
- Unificar en un solo sistema activos detectados automáticamente y los cargados manualmente (cámaras, etc.).

---

## 3. Arquitectura general

```
[Agente Windows Service C#]  →  [Firebase / Firestore]  →  [Aplicación Java]
     (cada PC de la red)            (colección computadoras)     (este proyecto)
```

El agente ya está en producción (CyberWatch / AgenteBacar). Este proyecto no modifica el agente — solo consume y gestiona los datos que este genera.

---

## 4. Modelo de clases

El sistema se diseña con POO en Java. La jerarquía central es `ComponenteHW` como clase abstracta de la que heredan todos los componentes detectables de una PC y también los periféricos.

### Jerarquía

```
ComponenteHW  (abstract)
├── Disco
├── Procesador
├── Ram
└── Periferico

Computadora        (contiene 1..* ComponenteHW)
Camara             (entidad separada, carga manual)
Estado
Ambito             (enum)
CambioEstado
```

---

### 4.1 `ComponenteHW` — abstract

Nunca se instancia directamente. Define los atributos comunes y declara `getInfo()` como método a implementar por cada subclase.

| Atributo | Tipo | Carga |
|---|---|---|
| `nombre` | String | Automática |
| `marca` | String | Automática |
| `descripcion` | String | Automática |

**Métodos:** `getInfo() : String`

---

### 4.2 `Disco`

Una instancia por partición detectada en la PC.

| Atributo | Tipo | Carga |
|---|---|---|
| `tipo` | String | Automática |
| `totalGB` | double | Automática |
| `libreGB` | double | Automática |
| `puntoMontaje` | String | Automática |

**Métodos:** `getEspacioUsado() : double`, `getInfo() : String`

---

### 4.3 `Procesador`

El agente reporta el procesador como String crudo. Los núcleos físicos vienen en campo separado en Firestore.

| Atributo | Tipo | Carga |
|---|---|---|
| `nombreRaw` | String | Automática |
| `nucleosFisicos` | int | Automática |
| `arquitectura` | String | Automática |

**Métodos:** `getInfo() : String`

---

### 4.4 `Ram`

Una instancia por módulo físico. Una PC puede tener múltiples instancias.

| Atributo | Tipo | Carga |
|---|---|---|
| `capacidadGB` | int | Automática |
| `velocidadMHz` | int | Automática |
| `modelo` | String | Automática |

**Métodos:** `getInfo() : String`

---

### 4.5 `Periferico`

Hereda de `ComponenteHW`. La referencia a `Computadora` es opcional (`null` si el periférico existe en inventario sin estar asignado a una PC).

| Atributo | Tipo | Carga |
|---|---|---|
| `tipo` | String | Automática |
| `driver` | String | Automática |
| `puerto` | String | Automática |
| `computadora` | Computadora? | Automática |
| `estadoActual` | Estado | **Manual** |

**Métodos:** `isAsignado() : boolean`, `getInfo() : String`

---

### 4.6 `Computadora`

Entidad principal. Agrupa todos los `ComponenteHW` detectados por el agente. La ubicación y el estado se cargan manualmente desde la aplicación.

| Atributo | Tipo | Carga |
|---|---|---|
| `uuid` | String | Automática |
| `hostname` | String | Automática |
| `usuarioActual` | String | Automática |
| `ubicacion` | String | **Manual** |
| `sistemaOperativo` | String | Automática |
| `estadoActual` | Estado | **Manual** |

**Relaciones:**
- Composición `1..*` con `ComponenteHW`
- Asociación `0..*` con `CambioEstado` (historial)
- Asociación `1` con `Estado` (estado vigente)

**Métodos:** `getEstadoActual() : Estado`, `addComponente(ComponenteHW)`, `getComponentes() : List<ComponenteHW>`

---

### 4.7 `Camara`

Entidad separada, no hereda de `ComponenteHW`. Representa cámaras de seguridad u otros activos no conectados a una PC. Toda su información se carga manualmente.

| Atributo | Tipo | Carga |
|---|---|---|
| `nombre` | String | **Manual** |
| `marca` | String | **Manual** |
| `descripcion` | String | **Manual** |
| `ubicacion` | String | **Manual** |
| `fechaAlta` | LocalDate | **Manual** |
| `estadoActual` | Estado | **Manual** |

**Métodos:** `getEstadoActual() : Estado`

---

### 4.8 `Estado`

| Atributo | Tipo | Carga |
|---|---|---|
| `nombre` | String | **Manual** |
| `ambito` | Ambito | **Manual** |
| `descripcion` | String | **Manual** |

**Métodos:** `getNombre() : String`

---

### 4.9 `Ambito` — enum

```java
public enum Ambito {
    COMPUTADORA,
    CAMARA,
    PERIFERICO
}
```

---

### 4.10 `CambioEstado`

`fechaHoraFin` es `null` mientras el estado sigue vigente. El estado actual de una entidad es el `CambioEstado` cuyo `fechaHoraFin` sea `null`.

| Atributo | Tipo | Carga |
|---|---|---|
| `fechaHoraInicio` | LocalDateTime | Automática |
| `fechaHoraFin` | LocalDateTime | Automática |
| `motivo` | String | **Manual** |
| `estado` | Estado | **Manual** |

**Métodos:** `esEstadoActual() : boolean`, `getDuracion() : Duration`

---

## 5. Campos manuales vs automáticos

| Entidad | Campo manual | Motivo |
|---|---|---|
| Computadora | `ubicacion` | El agente no conoce la ubicación física del equipo |
| Computadora | `estadoActual` | El estado operativo lo define el área de IT |
| Periferico | `estadoActual` | El estado del periférico lo gestiona IT manualmente |
| Camara | Todos los campos | No hay agente en cámaras de seguridad |
| Estado / CambioEstado | Todos los campos | Son entidades de configuración del sistema |

---

## 6. Decisiones de diseño

**`ComponenteHW` es abstracta** — nunca se instancia directamente. Garantiza que todo componente tenga `nombre`, `marca` y `descripcion`, y fuerza a cada subclase a implementar `getInfo()` con la información relevante de ese tipo de hardware.

**`Periferico` hereda de `ComponenteHW`** — evita duplicar atributos. La referencia opcional a `Computadora` cubre el caso mixto: algunos periféricos están asignados a una PC, otros existen sueltos en el inventario.

**`Camara` es entidad separada** — no hereda de `ComponenteHW` porque no es un componente de PC. Es un activo independiente con su propio ciclo de vida.

**Estado actual por referencia directa** — `estadoActual` es una referencia directa a `Estado`, no un atributo String ni un campo calculado. El historial completo vive en la colección de `CambioEstado` de la entidad. Cuando `fechaHoraFin` es `null`, ese `CambioEstado` es el vigente.

**`Ambito` como enum** — permite que los estados disponibles estén tipados por entidad (`COMPUTADORA`, `CAMARA`, `PERIFERICO`), evitando asignar un estado que no corresponde al tipo de activo.

---

## 7. Tecnologías


| Componente | Tecnología |
|---|---|
| Lenguaje principal | Java (POO) |
| API REST | Spring Boot 3 (`inventario/`) |
| Frontend | React + Vite (`inventario/inventario-front/`) |
| Backend de datos | Firebase / Firestore |
| Caché en memoria | Caffeine + Spring Cache (`@Cacheable` / `@CacheEvict`) |
| Agente de recolección | Windows Service en C# (CyberWatch / AgenteBacar) |
| Tipos de fecha | `java.time.LocalDate`, `java.time.LocalDateTime` |

### 7.1 Caché en memoria (Caffeine)

Todos los repositorios de Firestore usan caché en memoria para evitar lecturas repetidas a la base de datos.

**Configuración** (`config/CacheConfig.java`):
- Proveedor: Caffeine (caché JVM de alto rendimiento)
- TTL: 3 minutos (expire after write)
- Máximo: 500 entradas por caché

**Cachés registrados** (uno por colección Firestore):

| Caché | Repositorio | Métodos cacheados |
|-------|-------------|-------------------|
| `computadoras` | ComputadoraRepository | findAll, findByUuid, findByUbicacion, findByHostname, listProgramas |
| `camaras` | CamaraRepository | findAll, findById, findByUbicacion, findByNvrId, conteos |
| `routers` | RouterRepository | findAll, findById |
| `switches` | SwitchRedRepository | findAll, findById |
| `nvrs` | NvrRepository | findAll, findById |
| `maquinasTesoreria` | MaquinaTesoreriaRepository | findAll, findByTipo, findById |
| `internos` | InternoIpRepository | findAll, findById |
| `perifericosManuales` | PerifericoManualRepository | findAll, findById |
| `servidores` | ServidorRepository | findAll, findById |
| `usuarios` | UsuarioRepository | findAll, findById, findByEmail |

**Invalidación**: cada método de escritura (create, update, delete, cambiarEstado) usa `@CacheEvict(allEntries = true)` para limpiar el caché completo de la colección afectada.

**Invalidación manual**: `DELETE /api/cache` limpia todos los cachés. Útil cuando el agente C# escribe directamente a Firestore y se necesita ver los cambios sin esperar el TTL.

---

## 8. Iteración 1 — Listado y detalle de computadoras (entregado)

Objetivo: poder ver todas las PCs que sincronizan con Firestore y abrir el detalle de una por UUID.

### Backend (`inventario/`)

- **CORS** (`config/CorsConfig.java`): origen `http://localhost:5173`, rutas `/api/**`, métodos según la iteración vigente (inicialmente GET).
- **Persistencia**: `ComputadoraRepository` lee la colección configurada en `firebase.collection.computadoras`, mapea el documento a `Computadora` (incluye lectura de `usuarios.usuario_actual` anidado) y expone `findAll` / `findByUuid`.
- **Servicio y controlador**: `ComputadoraService` + `ComputadoraController` con `GET /api/computadoras` y `GET /api/computadoras/{uuid}` (404 si no existe).
- **DTOs**: `ComputadoraMapper` arma `ComputadoraDTO` (hostname, usuario, ubicación enum como nombre, SO, arquitectura, estado operativo manual si existe, procesador aplanado, discos, RAM).

### Frontend (`inventario/inventario-front/`)

- Proyecto **Vite + React** con **React Router**.
- **`src/api/computadoraApi.js`**: llamadas `fetch` al backend.
- **Rutas**: `/` lista en tabla (UUID acortado, columnas principales, fila clickeable); `/computadoras/:uuid` detalle con datos generales, procesador, discos y RAM; navegación lateral con marca "Inventario BACARSA".
- Estilos en `index.css` / `App.css` (tablas, cards, layout).

Detalle de tareas y verificación: [`docs/iteracion-1-pasos.md`](docs/iteracion-1-pasos.md).

---

## 9. Iteración 2 — Ubicación (POST), conexión del agente y cámaras

Objetivo: actualizar la ubicación manual de una PC desde la API, mostrar **Activo / Desconectado** según el campo que escribe el agente en Firestore (`estado_conexion`, p. ej. `ONLINE`), y exponer **listado y alta** de cámaras en colección propia.

Detalle de tareas y verificación: [`docs/iteracion-2-pasos.md`](docs/iteracion-2-pasos.md).

---

## 10. Iteración 3 — Periféricos del agente (lectura y visualización)

Objetivo: exponer en la API REST los **periféricos detectados por el agente** (impresoras, USB, monitores, audio) dentro del detalle de cada computadora, y mostrarlos en el frontend.

### Backend

- **Modelos Firestore** (`models/`): `PerifericosFirestore`, `ImpresoraFirestore`, `DispositivoUsbFirestore`, `MonitorFirestore`, `AudioFirestore`, `DispositivoAudioFirestore` — deserializados automáticamente vía `toObject` desde el campo anidado `perifericos` del documento de computadora.
- **DTOs** (`dto/`): `PerifericoAgenteDTO`, `ImpresoraAgenteDTO`, `DispositivoUsbAgenteDTO`, `MonitorAgenteDTO`, `AudioAgenteDTO`, `DispositivoAudioAgenteDTO`. Sufijo "Agente" para distinguirlos del `PerifericoDTO` del modelo de negocio/inventario IT.
- **Mapper**: `PerifericosAgenteMapper` con mapeo campo a campo, null safety en listas y sanitización de `\0` en nombres de monitor.
- **Detalle vs listado**: `ComputadoraMapper.toDTO()` incluye periféricos (detalle); `toListDTO()` los omite (listado), para mantener el payload liviano.
- **Solo lectura**: el agente C# sigue siendo el único escritor de `perifericos`.

### Frontend

- Detalle de computadora: 4 secciones (Impresoras, Dispositivos USB, Monitores, Audio entrada/salida) con tablas reutilizando estilos existentes.
- Null safety con optional chaining (`?.`) y fallback a lista vacía (`?? []`).
- Si `perifericos` es `null`, las secciones no se muestran.

Detalle de tareas y verificación: [`docs/iteracion-3-pasos.md`](docs/iteracion-3-pasos.md).

---

## 11. Iteración 4 — Estados y ciclo de vida

Objetivo: introducir un enum tipado para el **estado operativo** compartido por computadoras y cámaras, y exponer endpoints + UI para **cambiar estado** (con motivo obligatorio) y **consultar historial** de cambios.

### Backend (`inventario/`)

- **Enum `EstadoOperativo`** (`models/`): valores `ACTIVO`, `EN_MANTENIMIENTO`, `FUERA_DE_SERVICIO` con campos `nombre` (label amigable) y `descripcion`. Fuente de verdad para validación. Se mantiene `Estado.java` como POJO para que Firestore siga deserializando documentos existentes.
- **DTOs** (`dto/`): `CambiarEstadoDTO` (`estado` + `motivo`, ambos `@NotBlank`) para el request; `CambioEstadoDTO` (estado, motivo, fechas ISO-8601, `activo`) para el response.
- **Endpoints**:
  - `POST /api/computadoras/{uuid}/estado` — body `CambiarEstadoDTO` (`@Valid`).
  - `GET /api/computadoras/{uuid}/historial` → `List<CambioEstadoDTO>`, 404 si no existe.
  - `POST /api/camaras/{id}/estado` — ídem para cámaras.
  - `GET /api/camaras/{id}/historial` → ídem.

### Frontend (`inventario-front/`)

- **Constantes** (`src/constants/estados.js`): array de estados disponibles y mapa de labels amigables, único punto de cambio si crece el enum.
- **API**: `computadoraApi.js` suma `updateEstado(uuid, estado, motivo)` y `fetchHistorial(uuid)`; `camaraApi.js` suma `updateEstadoCamara(id, estado, motivo)` y `fetchHistorialCamara(id)`.
- **ComputadoraDetail**: debajo del form de ubicación, nuevo formulario con `<select>` de estados + `<textarea>` de motivo + botón "Cambiar estado" (deshabilitado si falta selección o motivo). Nueva sección "Historial" con tabla (Estado, Motivo, Inicio, Fin, Activo), alimentada por `c.historialEstados` del DTO de detalle (sin fetch extra). Estado vacío: "Sin cambios de estado registrados".
- **`CamaraDetail.jsx`** (nueva en `src/pages/`): datos generales + form de cambio de estado + historial, mismo patrón que `ComputadoraDetail`.
- **Rutas**: `/camaras/:id` → `CamaraDetail`. `CamaraList` con filas linkeables al detalle.

### Notas

- La concurrencia esperada es baja (solo IT opera el inventario), pero la transacción queda igual para no depender de eso.
- `estadoActual` top-level sigue sincronizado con el último `CambioEstado` vigente, así el listado no necesita parsear el array.
- `Estado.java` **no se elimina** — Firestore lo necesita para deserializar documentos existentes. `EstadoOperativo` es la fuente de verdad únicamente para validación en el service.

Detalle de tareas y verificación: [`docs/iteracion-4-pasos.md`](docs/iteracion-4-pasos.md).

---

## 12. Iteración 5 — Dashboard de inicio y estadísticas agregadas

Objetivo: exponer un endpoint de **estadísticas agregadas** del inventario y construir una nueva home `/` tipo dashboard con cards de resumen, distribución por estado/ubicación y actividad reciente. El listado de PCs pasa a `/computadoras`.

### Backend (`inventario/`)

- **DTOs** (`dto/`): `DashboardStatsDTO` (totales, conectadas/desconectadas, mapas por `EstadoOperativo` y por `Ubicacion` / `UbicacionCamara`, lista `ultimosCambios`) y `CambioRecienteDTO` (tipo, id, nombre, estado, motivo, fecha ISO-8601).
- **Servicio** (`services/DashboardService.java`): `getStats()` carga `Computadora` + `Camara` directamente por los repos, sin pasar por mappers (evita cargar periféricos/historial completo). Cuenta totales en una sola pasada; detecta conectadas por `estado_conexion == "ONLINE"`; agrupa por estado y ubicación con mapas pre-inicializados (respuesta estable aunque no haya equipos en ese bucket); aplana todos los `CambioEstado` de ambas colecciones, ordena desc por `fechaHoraInicio` y toma los 10 más recientes.
- **Controller** (`controller/DashboardController.java`): `GET /api/dashboard/stats` → `DashboardStatsDTO` (200 OK). Sin parámetros. Sin caché.

### Frontend (`inventario-front/`)

- **API**: `src/api/dashboardApi.js` con `fetchDashboardStats()` usando `API_ORIGIN` de `config.js`.
- **Página `Dashboard.jsx`** (nueva en `src/pages/`): header con "Inventario BACARSA" + fecha de actualización; fila de cards de resumen con borde izquierdo coloreado (total PCs con conectadas/desconectadas, total cámaras, activos totales, mantenimiento/fuera de servicio); fila de distribución con badges por estado y ubicación; tabla "Actividad reciente" (máx 10) con links al detalle según `tipo`.
- **Rutas** (`App.jsx`): `/` → `Dashboard`; el listado de PCs se mueve a `/computadoras`. Se mantiene `/computadoras/:uuid`, `/camaras`, `/camaras/nueva`, `/camaras/:id`. Nuevo NavLink "Inicio" en el sidebar.
- **Estilos**: sección `/* ── Dashboard ───── */` en `App.css` con `.stats-grid` (CSS Grid responsive) y `.stat-card` + variantes `--success`, `--warning`, `--danger` que solo cambian `border-left-color`. Sin librerías nuevas.

### Notas

- La agregación corre toda en memoria — el inventario IT de la empresa es chico y no justifica caché ni paginación todavía.
- Cuando se incorporen nuevos tipos de activos (impresoras, switches), se extienden `DashboardStatsDTO` + los mapas de la UI.

Detalle de tareas y verificación: [`docs/iteracion-5-pasos.md`](docs/iteracion-5-pasos.md).

---

## 13. Iteración 6 — Navegación jerárquica por tópicos

Objetivo: reemplazar el sidebar plano por un **árbol de categorías expandibles**.

### Frontend

- **`src/constants/topicos.js`**: configuración declarativa del sidebar (ramas + hojas).
- **`SidebarNav.jsx`**: renderizado recursivo, auto-expande la rama activa, chevron `▸`/`▾`.
- Páginas de periféricos del agente: `PerifericosImpresorasList`, `PerifericosMonitoresList`, `PerifericosTecladosList`, `PerifericosMouseList`, `PerifericosWebcamsList`, `PerifericosParlantesList`, `PerifericosMicrofonosList`.
- Helpers en `src/utils/perifericos.js`: `esTeclado`, `esMouse`, `esWebcam`.

Detalle de tareas y verificación: [`docs/iteracion-6-pasos.md`](docs/iteracion-6-pasos.md).

---

## 14. Iteración 7 — Búsqueda global

Objetivo: barra de búsqueda en el header con dropdown de resultados en vivo sobre computadoras y cámaras.

### Backend

- **`BusquedaController.java`**: `GET /api/buscar?q=...` → `List<ResultadoBusquedaDTO>`.
- **`BusquedaService.java`**: normalización de texto (sin acentos, lowercase), match por `contains` en campos clave, máx 10 resultados por tipo.

### Frontend

- **`SearchBar.jsx`**: input con debounce 250 ms, dropdown con badges de tipo (PC / Cámara), navegación con teclado (flechas + Enter), cierre con Escape o click fuera.
- Integrado en topbar sticky sobre el área principal.

Detalle de tareas y verificación: [`docs/iteracion-7-pasos.md`](docs/iteracion-7-pasos.md).

---

## 15. Iteración 8 — Routers y Switches

Objetivo: agregar Router y Switch como nuevos tipos de activo con CRUD completo, integrados en búsqueda y dashboard.

### Backend

- **Modelos**: `Router.java`, `SwitchRed.java` (nombre Java evita palabra reservada), `UbicacionRed` enum.
- **CRUD completo**: `RouterController` (`/api/routers`), `SwitchRedController` (`/api/switches`) — listar, detalle, crear, cambiar estado.
- **`BusquedaService`** extendido: match en nombre, marca, modelo, IP de routers y switches.
- **`DashboardService`** extendido: totales y distribución de routers/switches en `DashboardStatsDTO`.

### Frontend

- **`routerApi.js`**, **`switchApi.js`**.
- **`RouterList.jsx`**, **`RouterDetail.jsx`**, **`SwitchList.jsx`**, **`SwitchDetail.jsx`**.
- Rama **Redes** en `topicos.js` con hijos Routers y Switches.

Detalle de tareas y verificación: [`docs/iteracion-8-pasos.md`](docs/iteracion-8-pasos.md).

---

## 16. Iteración 9 — Usuarios con Firebase Auth

Objetivo: gestión de usuarios con roles, persistiendo datos extra en Firestore y verificando el ID token de Firebase en cada request al backend.

### Backend

- **`Rol.java`** (enum): `ADMIN`, `OPERADOR`, `VISUALIZADOR`.
- **`Usuario.java`**: `id` = uid de Firebase Auth, `nombre`, `email`, `rol`, `activo`.
- **`UsuarioRepository.java`**: colección `usuarios`, CRUD por uid.
- **`UsuarioService.java`** + **`UsuarioController.java`**: `GET/POST/PUT/DELETE /api/usuarios`.
- **`FirebaseTokenFilter.java`** (`security/`): `OncePerRequestFilter` que verifica el Bearer token en `/api/**`; OPTIONS (preflight CORS) pasa sin verificar; 401 si token ausente o inválido.

### Frontend

- Pantalla **`Login.jsx`** con autenticación Firebase.
- Contexto de autenticación (`src/context/`) que mantiene el usuario activo y adjunta el token a cada request via **`src/api/http.js`**.

Detalle de tareas y verificación: [`docs/iteracion-9-pasos.md`](docs/iteracion-9-pasos.md).

---

## 17. Iteración 10 — Soporte multi-NVR en cámaras

Objetivo: crear la entidad **Nvr** como maestro y vincular cada cámara a su NVR.

### Backend

- **`Nvr.java`**: `id` (`@DocumentId`), `nombre`, `direccionIp`, `puerto`, `descripcion`. Colección Firestore: `nvrs`.
- **`NvrRepository.java`**, **`NvrService.java`**, **`NvrController.java`**: `GET /api/nvrs`, `GET /api/nvrs/{id}`, `POST /api/nvrs`, `GET /api/nvrs/{id}/camaras`.
- **`Camara.java`**: campo `nvrId` agregado.
- **`CamaraController`**: `GET /api/camaras?nvrId=...` y `POST /api/camaras/{id}/nvr`.

### Frontend

- **`NvrsCamarasList.jsx`**: Vista unificada consolidada para `/camaras` y `/nvrs` según diseño Stitch:
  - Fila de 4 KPIs superiores (CCTV Terminales, Servidores NVR, Almacenamiento RAID y Ciclo de Retención).
  - Sección superior con grabadoras digitales NVR en tarjetas horizontales con métricas de ocupación de canales (`NVR X/Y ch`), filtros rápidos (`Todos`, `Tesorería`, `Monitoreo`) y modales CRUD/edición.
  - Sección inferior con grilla paginada de cámaras (20 por página) con filtros por ubicación, NVR, orden por nombre, búsqueda reactiva y barra de acciones en lote.
  - Sidebar unificado: el módulo en la barra de navegación lateral pasa a ser **`NVR y Cámaras IP`**, concentrando el acceso al circuito cerrado en una sola vista.
- **`nvrApi.js`**, **`NvrList.jsx`**, **`NvrDetail.jsx`**, **`NvrNueva.jsx`**, **`CamaraNueva.jsx`**, **`CamaraList.jsx`**.
- El listado de cámaras (`/camaras`) permite dar de alta y editar cámaras directamente desde la ventana emergente (modal), incluyendo la selección opcional de la NVR y la persistencia en base de datos.
- El listado de NVRs (`/nvrs`) y el detalle de NVR (`/nvrs/:id`) también permiten dar de alta cámaras (con pre-selección automática si aplica) mediante la misma ventana emergente (modal).
- El registro de nueva cámara en su propia página (`/camaras/nueva`) también permite asignar una NVR de manera opcional (soporta parámetro `?from=camaras` para retorno de navegación).
- Detalle de cámara muestra y permite cambiar NVR mediante selector.

Detalle de tareas y verificación: [`docs/iteracion-10-pasos.md`](docs/iteracion-10-pasos.md).

---

## 18. Iteración 11 — Responsable de inventario (asignación manual)

Objetivo: separar el usuario del agente (`usuarioActual`) del responsable de inventario definido por IT (`responsableInventario`).

### Backend

- **`Computadora.java`**: campo `responsableInventario` (`@PropertyName("responsable_inventario")`).
- **`ComputadoraRepository.updateResponsableInventario(uuid, valor)`**: update parcial del campo sin reemplazar el documento.
- **`ComputadoraService.asignarResponsableInventario()`**: persiste el campo y re-deriva el estado operativo vía `DERIVAR_ASIGNACION` (usa `responsableInventario`, no `usuarioActual`).
- **Endpoint**: `POST /api/computadoras/{uuid}/responsable-inventario` → body `ResponsableInventarioDTO`.

### Frontend

- **`ComputadoraAsignaciones.jsx`**: vista "Asig" con tabla de PCs, edición de responsable y cambio de estado.
- **`ComputadoraSubnav.jsx`**: sub-navegación Inventario / Asig sobre el área de computadoras.
- Ruta `/computadoras/asignaciones` en `App.jsx`.

Detalle de tareas y verificación: [`docs/iteracion-11-pasos.md`](docs/iteracion-11-pasos.md).

---

## 19. Iteración 12 — Filtro de monitores de notebooks

Objetivo: excluir de `GET /api/monitores` los monitores integrados de notebooks (detectados por `tipoEquipo.tieneBateria == true`).

### Backend

- **`MonitorService.java`**: filtro previo al loop — omite computadoras donde `tipoEquipo.tieneBateria` es `true`.
- Sin cambios en frontend; el dashboard ya consume el endpoint filtrado.

---

## 20. Iteración 13 — Campos ampliados y Edición de Routers y Switches

Objetivo: enriquecer los modelos con los campos del Excel de Omada y habilitar la edición completa de Routers y Switches (full-stack).

### Backend

- **`Router.java`** y **`SwitchRed.java`**: nuevos campos `sitio`, `numeroSerie`, `ipPublica`, `version`, `macUplink`, `salto`, `grupoWlan` con `@PropertyName` para snake_case en Firestore.
- DTOs y mappers actualizados.
- **`RouterRepository.java`** y **`SwitchRedRepository.java`**: nuevo método de actualización parcial (`update(id, map)`) que preserva historiales de estados.
- Endpoints `PUT /api/routers/{id}` y `PUT /api/switches/{id}` agregados.

### Frontend

- **`RouterList.jsx`** y **`SwitchList.jsx`**: columnas adicionales en tabla.
- **Edición**: Se implementó el llamado a los nuevos endpoints desde el modal `InfraestructuraModal` en `RoutersSwitchesList.jsx` y se agregaron botones de "Editar" en `RouterDetail.jsx` y `SwitchDetail.jsx`.
- Importación desde Excel habilitada con **`routersSchema.js`** y **`switchesSchema.js`** en `src/lib/importSchemas/`.
- **`genericImport.js`** en `src/lib/`: parser genérico CSV/XLSX con aliases de columnas por entidad.
- **`ImportModal.jsx`**: modal de previsualización antes de confirmar la importación.

---

## 21. Entidades adicionales implementadas (fuera del plan original de iteraciones)

### MáquinaTesorería

Entidad de inventario manual para las máquinas de la tesorería.

- **Backend**: `MaquinaTesoreria.java`, `MaquinaTesoreriaRepository`, `MaquinaTesoreriaService`, `MaquinaTesoreriaController` (`/api/maquinas-tesoreria`), `MaquinaTesoreriaImportService` (importación desde CSV/Excel).
- **Frontend**: `maquinaTesoreriaApi.js`, `MaquinaTesoreriaList.jsx`, `MaquinaTesoreriaDetail.jsx`.

### Periférico Manual

Activo de inventario manual para periféricos no detectados por el agente.

- **Backend**: `PerifericoManual.java`, `PerifericoManualRepository`, `PerifericoManualService`, `PerifericoManualController` (`/api/perifericos-manuales`).
- **Frontend**: `perifericoManualApi.js`, `PerifericoManualList.jsx`, `PerifericoManualDetail.jsx`, `PerifericoManualNuevo.jsx`.

### Endpoints de periféricos del agente (endpoints propios)

- **`ImpresoraController`** → `GET /api/impresoras` (servido por `ImpresoraService`).
- **`MonitorController`** → `GET /api/monitores` (servido por `MonitorService`).
- **`PerifericosAgenteController`** → endpoints de listado de periféricos del agente separados del detalle de computadora.

### Admin / Migración

- **`AdminImportController`**: endpoints de importación masiva (cámaras activas, etc.).
- **`AdminMigracionController`**: endpoints internos para migraciones de datos en Firestore.
- **`CamarasActivasImportService`**: importación de cámaras desde Excel.

### Dashboard de Infraestructura

- **Frontend**: `InfraestructuraDashboard.jsx` — rediseñado según la maqueta Stitch:
  - Encabezado con total dinámico de activos y botón institucional `+ Nuevo Dispositivo` con menú desplegable para registro directo de equipos.
  - Fila de 8 KPIs compactos (NVR, Cámaras, Routers, Switches, Access Points, Tesorería, Servidores y Teléfonos IP) con estados e indicadores visuales.
  - Directorio de Teléfonos IP estructurado en tabla con avatares de iniciales, búsqueda en vivo, estado SIP, indicador de interno y acciones rápidas (llamada directa y copiado al portapapeles).
  - Sección inferior en 2 columnas con desglose distributivo: "Cámaras por NVR" con métricas de almacenamiento/retención, "Routers por Ubicación" y "Switches por Ubicación" con topología PoE y carga energética, más panel consolidado de Máquinas de Tesorería por tipo.

---

## 22. Iteración de UX — Sidebar moderno, Routers/Switches consolidado y Colaboradores

Objetivo: refinar la experiencia visual del frontend aplicando el "trasplante de UX" desde el sandbox (`gestión-de-inventario-it`) al proyecto de producción (`inventario-front`).

### Frontend (`inventario-front/`)

#### 🎨 SidebarNav renovado

- **`SidebarNav.jsx`** reemplaza el sidebar basado en el array `TOPICOS` por un componente propio con grupos colapsables (Hardware, Periféricos, Infraestructura) y animación de chevron.
- Usa `NavLink` de React Router para marcar automáticamente la sección activa.
- Soporta el prop `sidebarCollapsed`: cuando está reducido, oculta textos y sub-menús.
- CSS migrado al tema Obsidian oscuro con gradiente en `App.css`.
- Tipografía del sidebar aumentada de `0.85rem` a `0.95rem` para mejor legibilidad.
- Ícono del logo: sin fondo (solo el ícono, sin caja roja).

#### 🌐 Vista consolidada Routers & Switches (`/routers-switches`)

- **`RoutersSwitchesList.jsx`**: carga ambos endpoints (`fetchRouters` + `fetchSwitches`) en paralelo con `Promise.all`.
- Pestañas de filtro: **Todos / Routers / Switches**.
- Botón "Registrar Equipo" con menú desplegable para elegir el tipo (Router o Switch), cada uno con su modal de formulario específico.
- `InfraestructuraGrid` extendido para reconocer el campo `tipoComponente` y mostrar el ícono correcto en listas mixtas.
- Rutas `/routers` y `/switches` como páginas de lista separadas fueron eliminadas; el acceso es siempre por la vista consolidada.
- Nombres de pestañas simplificados y tamaño de fuente aumentado a `text-sm`.

#### 👥 Módulo de Colaboradores (`/colaboradores`)

- **`usuarioApi.js`**: CRUD completo apuntando a `/api/usuarios`.
- **`ColaboradoresList.jsx`**:
  - Grilla de tarjetas con avatar (foto o iniciales con gradiente generado por nombre).
  - Filtro de búsqueda libre y filtro por departamento.
  - Modal propio para crear/editar colaboradores.
  - Panel lateral deslizable con el detalle institucional del usuario.
- Link **"Colaboradores"** agregado al sidebar bajo la sección Administración.

#### 🔤 Nomenclatura estandarizada — Máquinas de Tesorería

- Formato de nombre: `MTes-TIP-NumSerie` (3 primeras letras del tipo en mayúsculas, ej. `MTes-IMP-00123`).

---

## 23. Iteración 14 y 15 — Servidores e Importación Masiva (Completadas)

### Servidores
Entidad de inventario manual para servidores físicos/virtuales. Incluye CRUD completo (`/api/servidores`), visualización y gestión en el frontend (`ServidorList`, `ServidorDetail`), y métricas en el `InfraestructuraDashboard`.

### Importación Masiva desde Excel
Habilitación de carga en bloque mediante archivos `.xlsx` usando esquemas específicos (`importSchemas/`) para Servidores, Cámaras, NVRs, Routers, Switches, Internos IP y Tesorería, utilizando el utilitario genérico de parseo.

---

## 24. Entidad adicional: Teléfonos IP (Internos)

Activo de inventario para el directorio de internos telefónicos IP.
- **Backend**: Modelo `InternoIp`, repositorio, servicio y controlador (`/api/internos`). Operaciones de lectura y escritura.
- **Frontend**: API client (`internoIpApi.js`), vista unificada en `TelefonoIpList.jsx`. 
- **Dashboards**: Sección de "Directorio de Teléfonos IP" agregado al Dashboard principal y al de Infraestructura, con buscador integrado y diseño de scroll vertical compacto.

---

## 25. Pendientes de implementación

*(No hay tareas pendientes en este momento)*

---

## 26. Iteración 16 — Filtros por atributo (Completada)

Objetivo: Unificar la experiencia de búsqueda y filtrado en todas las listas de activos usando un componente reutilizable.

### Frontend
- **`TableFilters.jsx`**: Nuevo componente Compound (`TableFilters.Search`, `TableFilters.Select`) para renderizar filtros de manera consistente y flexible.
- Se refactorizaron las siguientes listas para incluir búsqueda en tiempo real (en memoria) sin golpear al backend extra: `ComputadoraList`, `CamaraList`, `NvrList`, `RouterList`, `SwitchList`, `ServidorList`, `MaquinaTesoreriaList`, `PerifericoManualList`.
- Se usó `useMemo` en cada lista para filtrar las tablas eficientemente del lado del cliente.

---

## 27. Comandos de deploy

### Frontend — Firebase Hosting

Desde `inventario/inventario-front/`:

```bash
npm run deploy:hosting
```

Hace el build de Vite y despliega a Firebase Hosting en un solo paso.

### Backend — Cloud Run

Desde `inventario/`:

```powershell
gcloud run deploy inventario-api `
  --source . `
  --region us-central1 `
  --env-vars-file env-prod.yaml `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 1 `
  --max-instances 20 `
  --concurrency 80 `
  --timeout 300 `
  --set-secrets "/workspace/auth/serviceAccountKey.json=firebase-service-account:latest" `
  --cpu-boost
```

### Firestore Rules

Desde `inventario/`:

```bash
firebase deploy --only firestore:rules
```

---

## 28. Logística de etiquetas QR

El módulo `/etiquetas-qr` permite registrar el avance de cada puesto durante una
mudanza en tres fases: **Etiquetado**, **Embalado** y **En destino**.

### Persistencia y auditoría

- El progreso se guarda en Firestore, colección `progreso_logistica_qr`, usando
  el UUID de la computadora como ID del documento.
- Las marcas se mantienen separadas del documento `computadoras` para que las
  sincronizaciones del agente no las sobrescriban.
- Cada documento conserva los porcentajes y el último usuario que modificó el
  puesto.
- Cada cambio genera un documento en la subcolección
  `progreso_logistica_qr/{uuid}/historial`, con fase, acción
  (`MARCAR`/`DESMARCAR`), elementos afectados, fecha y usuario
  (`uid`, nombre y email).
- La escritura usa una transacción de Firestore para evitar que dos operadores
  pisen cambios concurrentes sobre la misma fase.

### API

- `GET /api/etiquetas-qr/progreso` — índice resumido y cacheado para KPIs y
  filtros; devuelve solo porcentajes y estado. Las marcas y el historial se
  reservan para la ficha individual.
- `GET /api/etiquetas-qr/{uuid}/progreso` — progreso e historial reciente del
  puesto.
- `PATCH /api/etiquetas-qr/{uuid}/progreso` — marca o desmarca elementos de una
  fase. La identidad del actor se obtiene del token Firebase verificado por el
  backend, no del body enviado por el navegador.

El listado web usa caché de consultas, carga el progreso en segundo plano y
pagina de a 50 estaciones para evitar bloquear la tabla o renderizar todo el
inventario de una vez.

---

## 29. Historial inmutable de computadoras (etapa 1)

Cada cambio que una persona hace sobre una computadora deja un renglón que no se pisa. Plan completo: [`docs/plan-historial-cambios.md`](docs/plan-historial-cambios.md).

### Persistencia

- Campo `historial` (lista append-only de `RenglonHistorial`) dentro del documento de `computadoras`. Cada renglón guarda tipo, `acto_id`, fecha, estado y estado anterior, motivo, quién (`quien_uid`, `quien_nombre`), origen y la lista de `cambios` (antes/después por campo).
- La ficha y el renglón se escriben en **la misma transacción**. Si el renglón no se guarda, la ficha queda como estaba y la API responde error (`HistorialNoGuardadoException`) con el id de la ficha.
- El alta manual y el primer reporte válido del agente (`POST /api/computadoras/reporte-agente`) también dejan renglón. Los campos que pisa el agente en reportes posteriores no generan renglón.
- `historialEstados` **no se borra**: sigue existiendo para compatibilidad.

### Migración

- `POST /api/computadoras/migracion-historial?limite=5` (solo `ADMINISTRADOR`): pasa los tramos de `historialEstados` al historial nuevo, o deja un renglón «Migración inicial» si no había. Marca `historial_migrado` y es idempotente.

### Frontend

- `ComputadoraDetail.jsx` muestra el historial en el detalle de la PC.

### Deuda anotada

- El listado que borra el documento de la PC no deja renglón. Queda para otra rama.

---

## 30. Stock — Proyección de unidades y código interno (Stock 1)

Proyección unificada de activos individuales de depósito y asignación idempotente de `codigo_interno` legible.

### Arquitectura y Perímetro

- **Colecciones leídas**: `computadoras`, `perifericos_manuales`, `celulares`, `camaras`, `televisores`, `routers`, `switches`, `access_points`.
- **Prefijos**: desktop `PC`, notebook `NB`, monitor `MON`, teclado `TEC`, mouse `MOU`, impresora `IMP`, webcam `WEB`, parlante `PAR`, micrófono `MIC`, celular `CEL`, cámara `CAM`, televisor `TV`, router `RTR`, switch `SW`, access point `AP` (formato ej. `PC-1`).
- **Exclusiones**: lotes con `cantidad != 1`, monitores anidados del agente CyberWatch, servidores, NVRs, internos IP y máquinas de tesorería.

### Persistencia y Resiliencia

- **Asignación no destructiva**: la clave `codigo_interno` se persiste en cada colección mediante `set(..., SetOptions.merge())` de un único campo. No pisa el documento original ni genera renglones en el historial de computadoras.
- **Backfill reanudable**: `CodigoInternoBackfillRunner` corre al arrancar el backend (`app.stock.codigo-interno.backfill=true`). Detecta el valor máximo existente por prefijo y asigna códigos únicamente a las unidades faltantes. Si se interrumpe, continúa en el siguiente arranque sin duplicar números.

### API

- `GET /api/stock/unidades` — devuelve `List<UnidadStockDTO>` con 10 campos proyectados (`codigo`, `tipo`, `marca`, `modelo`, `serieOImei`, `condicion`, `estadoDeposito`, `fechaIngreso`, `ubicacion`, `cantidad`). Sin dato se normaliza a `""` (no inventa marca en PCs ni fechas de ingreso; `cantidad` es 1 por defecto salvo lotes agrupados). Solo incluye unidades con código asignado en depósito.

---

## 31. Stock — ABM: Alta, Modificación y Baja con Motivo (Stock 2)

Operaciones de escritura unificadas sobre el catálogo de unidades de depósito en las 8 colecciones (`computadoras`, `perifericos_manuales`, `celulares`, `camaras`, `televisores`, `routers`, `switches`, `access_points`).

### Operaciones

- **Alta (`POST /api/stock/unidades`)**: recibe tipo, atributos de equipo (marca, modelo, serie/imei, condición, ubicación) y motivo opcional. Deriva el prefijo según tipo (`PC`, `NB`, `MON`, `TEC`, `MOU`, `IMP`, `WEB`, `PAR`, `MIC`, `CEL`, `CAM`, `TV`, `RTR`, `SW`, `AP`), calcula el siguiente consecutivo de `codigo_interno` en base a las unidades existentes y persiste la unidad. En el caso de computadoras, la creación se realiza dentro de la misma transacción con `aplicarHistorial` generando el renglón `ALTA_MANUAL`.
- **Modificación (`PATCH /api/stock/unidades/{codigo}`)**: permite editar atributos (marca, modelo, serie/imei, condición, ubicación, notas). Solo aplica cambios parciales mediante `set(..., SetOptions.merge())` sin sobreescribir el documento completo. En computadoras registra el diff campo a campo en el historial inmutable dentro de la misma transacción.
- **Baja con motivo (`POST /api/stock/unidades/{codigo}/baja`)**: exige motivo obligatorio (`@NotBlank`). Actualiza el estado a `BAJA` y asienta el motivo, fecha y usuario responsable. En computadoras, ejecuta `cambiarEstado` con `BAJA` y motivo en una sola transacción Firestore.

### API

- `GET /api/stock/unidades/{codigo}` — detalle de la unidad de stock proyectada (`UnidadStockDTO`).
- `POST /api/stock/unidades` — alta de unidad en stock (body `AltaUnidadStockDTO`).
- `PATCH /api/stock/unidades/{codigo}` — actualización parcial de unidad (body `ModificarUnidadStockDTO`).
- `POST /api/stock/unidades/{codigo}/baja` — baja con motivo obligatorio (body `BajaUnidadStockDTO`).

---

## 32. Stock — Libro de Asignaciones con Nombre (Stock 3)

Libro de asignaciones y bitácora de custodia donde cualquier unidad se asigna, libera o devuelve a una persona por nombre y área, registrando un movimiento que no se pisa.

### Operaciones y Resiliencia

- **Asignación (`POST /api/stock/unidades/{codigo}/asignar`)**: exige `responsable` obligatorio (`@NotBlank`). Aplica el principio de resiliencia: el movimiento se escribe primero en la colección Firestore `movimientos_stock` con estado `Pendiente`. Luego se actualiza la ficha del equipo en `perifericos_manuales` con `responsable`, `ubicacion` y `estadoActual: ASIGNADA`. Al confirmarse la actualización de la ficha, el movimiento se actualiza a `Activa`. Si la escritura de la ficha falla, el movimiento permanece `Pendiente` y la ficha no muta.
- **Devolución a Disponible (`POST /api/stock/unidades/{codigo}/devolver`)**: actualiza la unidad en `perifericos_manuales` para devolverla a `SIN_ASIGNAR` sin responsable y con ubicación `DEPOSITO`, cierra los movimientos activos previos marcándolos en `Finalizada` con `fechaDevolucion`, y genera el movimiento de acción `Devolución` en estado `Finalizada`.
- **Libro unificado (`GET /api/stock/asignaciones`)**: expone el listado consolidado de asignaciones activas y movimientos históricos (leyendo `movimientos_stock` y proyectando periféricos/equipos asignados de `perifericos_manuales` así como PCs asignadas de `computadoras` con origen stock `OrigenAlta.STOCK` sin movimiento previo) ordenados cronológicamente desc.

### API

- `POST /api/stock/unidades/{codigo}/asignar` — asignación de unidad con nombre y área obligatorios (body `AsignarUnidadStockDTO`).
- `POST /api/stock/unidades/{codigo}/devolver` — devolución de unidad a disponible (body `DevolverUnidadStockDTO`).
- `GET /api/stock/asignaciones` — listado unificado de movimientos y asignaciones (`List<MovimientoStockDTO>`).

---

## 33. Stock — Módulo Unificado de Depósito y Asignaciones (Stock 4 Rewrite)

Consolidación visual y operativa de las existencias de depósito y la custodia de asignaciones en la vista integral [`StockPage.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/StockPage.jsx) bajo la ruta canónica `/deposito`, integrando React Query para la carga y sincronización de datos sin prop drilling ni estados dispersos.

### Arquitectura y Pantallas

- **`StockPage.jsx` (Ruta `/deposito`)**:
  - **Encabezado institucional**: Shell unificado con `StudioPageShell`, botón `+ Nueva unidad` en la pestaña de depósito (`requiresWrite`) y selector de pestañas `StudioDetailTabs` ("Depósito", "Asignaciones" y "Bajas") sincronizado con la URL (`?tab=deposito|asignaciones|bajas`).
  - **Capa de datos con React Query**:
    - Consultas declarativas mediante `useStockUnidades()` y `useStockAsignaciones()` en `src/hooks/useQueries.js`.
    - Invalidación centralizada post-mutación mediante `useStockInvalidation()` (`invalidarUnidades`, `invalidarAsignaciones`, `invalidarTodo`).
  - **Pestaña Depósito (`DepositoTab.jsx`)**:
    - Muestra exclusivamente las existencias físicas en almacén disponibles (sin asignar y en mantenimiento), excluyendo equipos asignados/operativos (que se visualizan en Asignaciones) y bajas (que se visualizan en Bajas).
    - Barra de solapas superiores por familia de hardware (**Todas**, **PCs**, **Periféricos**, **Infraestructura**, **Celulares**) con badges numéricos en vivo con la cantidad de unidades en cada categoría.
    - Filtros dinámicos con `StudioFilterBar`: búsqueda global de texto (código, marca, modelo, serie, ubicación), selector de subtipos contextual a la familia activa, filtro por estado operativo en almacén (Sin Asignar/Disponible, En Mantenimiento) y selector de condición.
    - Tabla unificada (`StudioDataTable`) simplificada sin columnas de Código ni Serie/IMEI, destacando tipo, marca, modelo, estado, condición, ubicación y cantidad.
    - Paginación client-side de 25 filas por página con controles de navegación.
    - Acciones contextuales protegidas por `WriteGate`: `Editar`, `Asignar` (solo unidades disponibles/sin asignar) y `Baja` con motivo.
  - **Pestaña Asignaciones (`AsignacionesTab.jsx`)**:
    - KPIs reales calculados en cliente: *Asignaciones Activas*, *Entregas del Mes* y *Devoluciones del Mes*.
    - Barra de solapas por familia de hardware (**Todas**, **PCs**, **Periféricos**, **Infraestructura**, **Celulares**) con badges numéricos en vivo con la cantidad de asignaciones en cada categoría.
    - Filtro de búsqueda y selectores por estado de movimiento (Activa, Finalizada, Pendiente) y área/sector.
    - Tabla simplificada sin columnas de código ni serie, priorizando equipo, responsable, área, acción, estado y fechas. Incluye equipos de red operativos e infraestructura (como Access Points) proyectados automáticamente.
    - Acción rápida `Devolver` al depósito sobre asignaciones activas.
  - **Pestaña Bajas (`BajasTab.jsx`)**:
    - Vista dedicada para unidades desincorporadas o dadas de baja definitiva.
    - Tarjetas métricas superiores con conteos de bajas por familia (Total Bajas, PCs, Periféricos, Infraestructura).
    - Solapas por familia de hardware (**Todas**, **PCs**, **Periféricos**, **Infraestructura**, **Celulares**) con badges en vivo.
    - Buscador global y tabla de bajas sin código ni serie, priorizando tipo, equipo, ubicación anterior, fecha y motivo de baja.
  - **Modales integrados (`StockModals.jsx`)**:
    - `ModalAlta`: alta de activo con selector canónico de tipos, validación y feedback de error.
    - `ModalEditar`: modificación parcial de datos físicos (marca, modelo, serie, condición, ubicación, notas).
    - `ModalBaja`: baja con motivo obligatorio y estilo de advertencia destructiva.
    - `ModalAsignar`: asignación a responsable por nombre y área obligatorios.
    - `ModalDevolver`: devolución de unidad a disponible en almacén con motivo opcional.
  - **Navegación y Rutas (`SidebarNav.jsx` y `App.jsx`)**:
    - Accesos en la barra lateral bajo la sección *Depósito*: **Stock de Depósito** (`/deposito?tab=deposito`), **Asignaciones de Stock** (`/deposito?tab=asignaciones`) y acceso directo a **Bajas** (`/deposito?tab=bajas`).
    - Redirecciones automáticas desde rutas legadas (`/asignaciones-stock`, `/perifericos/stock`) hacia `/deposito`.

### Resiliencia y Manejo de Errores

- Ante fallas de red o errores de validación de backend (HTTP 400/404/500), se capturan las excepciones y se presentan en alertas dentro del formulario sin aplicar mutaciones optimistas destructivas.
- Tras mutaciones confirmadas por la API, la caché de React Query se invalida inmediatamente reflejando los cambios en las tablas sin recargar la página.

### Persistencia Unificada de Stock y Coexistencia con Colecciones Especializadas

- **Stock de Depósito (`StockUnidadesService`)**: Integra periféricos y equipos de `perifericos_manuales` junto con los dispositivos móviles de la colección `celulares` (`CelularRepository`). Las unidades con estado de depósito disponible (`en_stock`, `disponible`, `sin asignar`) se visualizan en la pestaña **Depósito** bajo la familia **Celulares**.
- **Custodia y Asignaciones (`StockAsignacionesService`)**: Proyecta dinámicamente celulares activos (`celulares`), Access Points operativos (`access_points`) y periféricos/equipos de red de `perifericos_manuales` que tengan responsable, estado operativo o una ubicación física asignada fuera de depósito (ej. `MEZON_TRANSPORTISTA`, `ADMINISTRACION`, etc.), reflejándolos en la pestaña **Asignaciones** bajo su familia correspondiente (**Infraestructura**, **PCs**, **Periféricos**, **Celulares**).
- **Filtro estricto de almacén en Depósito (`DepositoTab.jsx`)**: Asegura que cualquier unidad que tenga responsable asignado o cuya ubicación física sea operativa (fuera de depósito) no figure en el almacén de Depósito.
- **Tablas limpias sin sobrecarga visual**: Se eliminaron las columnas redundantes de "Código" y "Serie / IMEI" en las tres solapas (**Depósito**, **Asignaciones** y **Bajas**), priorizando el tipo, modelo, responsable/ubicación, condición, estado y fechas.
- **Ciclo de vida en `perifericos_manuales`**:
  - **Alta**: Crea documento con código automático (`PC-n`, `CEL-n`, etc.) y estado `SIN_ASIGNAR`.
  - **Asignación**: Actualiza `responsable`, `ubicacion` y `estadoActual: ASIGNADA`, registrando el movimiento en `movimientos_stock`.
  - **Devolución**: Remueve `responsable`, resetea `ubicacion: DEPOSITO` y `estadoActual: SIN_ASIGNAR`, cerrando el movimiento activo.
  - **Baja**: Registra `motivo_baja`, `fecha_baja`, `usuario_baja` y `estadoActual: BAJA`.

---

## 34. Reportes de Inventario — Rediseño Stitch (Auditoría General)

Rediseño completo de la pantalla [`Reportes.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/Reportes.jsx) bajo la ruta `/reportes`, adaptada al prototipo de Google Stitch `a2993f71ba894c7ca34547188dcfee96`.

### Características Principales

- **Encabezado en Card blanca**:
  - Título con badge institucional `Auditoría General`.
  - Subtítulo con timestamp dinámico de última actualización.
  - Botón de actualización de caché y botón de exportación PDF (`Exportar PDF`).
  - Botón de filtros avanzados eliminado según directiva de gobernanza.
- **Tira superior de 6 KPIs**:
  - Total Computadoras, Activas (con % de operatividad normal), Inactivas, Asignadas (con % sobre el total), En Stock y Periféricos c/ PC (con promedio por estación).
- **Tablero de 9 dimensiones analíticas (Grid 3x3)**:
  1. *PCs activas vs inactivas*: Gauge semicircular de operatividad con badge de tasa óptima/atención.
  2. *Distribución por estado*: Barras horizontales de ciclo de vida (Asignadas, En Stock, Mantenimiento, Para Baja) y cálculo de equipos operativos.
  3. *Computadoras por área*: Ranking de departamentos/ubicaciones con barras de densidad y porcentajes.
  4. *Computadoras por tipo*: Columnas comparativas de chasis (Escritorio, Notebooks, Workstation) y ratio de movilidad.
  5. *Sistemas operativos*: Gráfico de dona con porcentaje de adopción de Windows 11 y desglose de versiones.
  6. *Procesadores (CPU)*: Modelos principales y balance de arquitecturas Intel vs AMD.
  7. *Periféricos por tipo*: Anillo de total general y cuadrícula 2x2 para Monitores, Mouse, Teclados y Webcams.
  8. *Cámaras por NVR*: Ocupación de canales por NVR con advertencias visuales de capacidad.
  9. *Networking (Switches & Routers)*: Métricas de equipamiento Core, Distribución y Acceso.
- **Equipamiento de Tesorería Especializado**:
  - Banner institucional con conteo y especificaciones de Contadoras de Billetes, Clasificadoras y Terminales POS.
- **Tabla de Detalle de computadoras**:
  - Búsqueda en tiempo real por Hostname, usuario, responsable, área o sistema operativo.
  - Columnas: Hostname (monospace rojo interactivo con navegación a detalle), Tipo con ícono, Responsable, Área, SO con punto de color, Procesador, RAM, Estado con pill de color, Última sincronización y menú de acciones.
  - Selector dinámico de filas por página (5, 10, 25, 50, Todos) y paginación client-side.
  - Ancho completo (`w-full min-w-full text-sm`), celdas con espaciado vertical cómodo (`px-3.5 py-3.5`) y cabeceras `bg-[#f8fafc]`.
- **Alineación de Layout Global**:
  - Contenedor raíz adaptado al estándar de `Computadoras`, `Inicio` y `Periféricos` (`flex flex-col flex-1 min-h-0 space-y-4 pb-6 w-full`), eliminando paddings duplicados para que la card de encabezado, gráficos y tablas coincidan milimétricamente en ancho y coordenadas.

---

## 35. Periféricos — Módulo Unificado y Consolidación de Navegación (Stitch b34a5a1116384bdd946b82210a2da684)

Consolidación integral de todos los dispositivos de entrada, salida y accesorios en un único módulo centralizado [`PerifericosTodosList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/PerifericosTodosList.jsx) bajo la ruta `/perifericos`.

### Arquitectura y Navegación

- **Sidebar Compacto (`SidebarNav.jsx`)**:
  - Se eliminaron las 9 rutas individuales redundantes del menú lateral (*Impresoras, Monitores, Teclados, Mouse, Webcams, Parlantes, Micrófonos, Televisores, Celulares*).
  - Bajo la sección `Hardware`, se preserva exclusivamente **Computadoras** (`/computadoras`) y el acceso único **Periféricos** (`/perifericos`).
- **Redirecciones Automáticas (`App.jsx`)**:
  - Rutas legadas (`/perifericos/monitores`, `/perifericos/teclados`, `/perifericos/mouse`, etc.) redirigen automáticamente a `/perifericos?tipo=...`.
- **Encabezado en Card blanca**:
  - Título con badge dinámico `{total} unidades en total · ~{ratio} por estación`.
  - Botón `Exportar listado` (descarga CSV del listado filtrado) y botón `Registrar periférico manual` integrado con `ModalAlta` de depósito protegido con `WriteGate`.
- **Tira de 6 KPIs Superiores**:
  - *Monitores*, *Teclados*, *Mouse Ópticos*, *Webcams HD*, *Audio y Parlantes*, y *Otros Periféricos*, con conteo en uso/asignados y stock.
- **Card Unificada de Control (Solapas y Filtros Integrados)**:
  - Cabecera superior integrada con las solapas de categorías (`Todos`, `Monitores`, `Teclados`, etc.) sobre fondo suave `bg-slate-50/80` y división sutil, con botones amplios (`px-3.5 py-2`), pestaña activa blanca con sombra y badge numérico de conteo.
  - Fila inferior de búsqueda y filtros con buscador fluido (`flex-1`) que aprovecha el ancho disponible de la pantalla eliminando espacios desiertos a la derecha, y 4 selectores (`Conexión`, `Estado`, `Origen`, `Área`) con anchos legibles que evitan el truncado de texto.
  - Fila inferior para conteo de filtros activos y botón de reseteo rápido *Limpiar filtros*.
- **Tabla Unificada de Dispositivos (Ancho Completo)**:
  - Estructurada en ancho completo (`w-full min-w-full`) sin restricciones de ancho mínimo fijo (`min-w-[1000px]` eliminado), adaptándose naturalmente a pantallas grandes y a cualquier volumen de items paginados.
  - Columnas: Checkbox, Tipo y Dispositivo con ícono representativo, N° Serie / ID, Conexión, Hostname vinculado con enlace interactivo a la computadora, Responsable y Área, Origen, Estado con badge de color y Última sincronización.
  - Paginador client-side configurado por defecto en `Todos` (con opciones de 25, 50, 100).
- **Homogeneización Visual y Limpieza de Métricas**:
  - Eliminación definitiva de la tarjeta inferior "Distribución por tipo de conector".
  - Contenedor raíz con `w-full` y adaptado al flujo de `ComputadoraList` e `Inicio` (`flex flex-col flex-1 min-h-0 space-y-4 pb-6 w-full`).

---

## 36. Configuración del Sistema — Módulo Unificado Stitch (50fd5ccad758463e9c156c7282966a9b)

Consolidación integral de todas las áreas administrativas y operativas de identidades, catálogos técnicos, responsables y políticas en una sola pantalla unificada [`ConfiguracionSistema.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ConfiguracionSistema.jsx) bajo la ruta `/configuracion`.

### Arquitectura y Navegación

- **Sidebar Compacto (`SidebarNav.jsx`)**:
  - Se agruparon los enlaces dispersos de administración (*Mi Perfil, Responsables, Usuarios, Catálogos, Sistema*) bajo un único acceso maestro: **Configuración** (`/configuracion`).
- **Redirecciones Automáticas (`App.jsx`)**:
  - `/perfil` &rarr; `/configuracion?tab=perfil`
  - `/admin/usuarios` &rarr; `/configuracion?tab=usuarios`
  - `/admin/catalogos` &rarr; `/configuracion?tab=catalogos`
  - `/responsables` &rarr; `/configuracion?tab=responsables`
  - `/system` &rarr; `/configuracion?tab=agente`
  - La ruta de detalle `/responsables/:id` se preserva intacta.
- **Encabezado Institucional en Card Independiente**:
  - Encapsulado en una card blanca (`bg-white border border-slate-200/90 rounded-2xl p-5`), sin breadcrumb superior redundante, conteniendo el título `Configuración del Sistema`, badge `BACAR.it v2.1 Enterprise`, descripción y botones de `Auditoría de Cambios` y `Guardar Configuración`.
- **Layout de Ancho Completo (`w-full`)**:
  - Contenedor raíz adaptado al 100% del ancho de pantalla (`w-full px-4 sm:px-6 py-4 space-y-4`), alineado con el resto de las vistas del sistema.
- **Barra de Solapas en Card Separada**:
  - Solapas organizadas horizontalmente en su propio contenedor blanco con estilos activos claros y legibles.
- **Estructura de Solapas (Tabs) en el Orden Específico**:
  1. **Mi Perfil IT** *(Primero)*: Tarjeta de operador en sesión (avatar, nombre, sede, último ingreso y estado activo, sin token de API), resumen de seguridad IT, acceso a consola remota y formularios de datos personales y credenciales de acceso.
  2. **Usuarios y Permisos**: Enfocada exclusivamente en la gestión de operadores con tabla completa de usuarios, avatares, roles corporativos (`SUPERADMIN IT`, `ADMINISTRADOR IT`, etc.), buscador en vivo, filtro por rol y modal de asignación/edición de cuentas Firebase Auth.
  3. **Catálogos**: ABM centralizado de los 12 catálogos técnicos del sistema con encabezado estándar en card blanca, buscador por catálogo, reordenamiento y activación/desactivación de ítems (sin bloque de parámetros globales).
  4. **Responsables y Áreas**: Directorio de custodios de equipamiento en card blanca estándar con buscador en tiempo real, conteo de equipos asignados y reconstrucción de índice.
  5. **Integraciones y Agente**: Configuración de enlace de telemetría `BACAR.Agent`, heartbeat, comandos remotos a nodos y logs de sincronización.



---

## 37. Unificación de UX e Infraestructura — Diseño Stitch y Estandarización de Encabezados

Se consolidó y estandarizó toda la sección de Infraestructura siguiendo el diseño institucional de la maqueta Stitch (`NvrsCamarasList.jsx`), unificando encabezados, barras de navegación, KPIs interactivos, filtros y grillas de tarjetas:

### Estandarización de Encabezados (Header Cards)
- Formato uniforme idéntico a Inicio, Reportes, Computadoras y Stock: card blanca limpia (`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`), título en formato oración/minúsculas sin `uppercase`, sin bordes ni franjas de acento rojo superior ("sin lo rojo").
- Badges de conteo total e información de contexto en gris neutro (`bg-slate-100 text-slate-700 border-slate-200`).
- Botones de acción institucional primaria en azul corporativo (`bg-[#0c66e4] hover:bg-[#0055cc]`).

### Módulos Actualizados
1. **Sidebar (`SidebarNav.jsx`)**:
   - Acceso consolidado **"NVR y Cámaras IP"** (`/camaras`), eliminando el ítem redundante de Cámaras IP.
   - Acceso consolidado **"Routers, Switches y AP"** (`/routers-switches`), eliminando el ítem separado de Access Points.
2. **NVRs y Cámaras IP (`NvrsCamarasList.jsx`)**:
   - Tarjetas de NVR horizontales con cálculo de canales ocupados y estado de conexión en vivo.
   - Grilla de cámaras CCTV paginada a 20 items/página con filtros, asignación masiva y badges de estado.
3. **Routers, Switches y Access Points (`RoutersSwitchesList.jsx`)**:
   - 3 tarjetas KPI métricas interactivas (Routers, Switches, Access Points) que filtran la grilla al hacer clic.
   - Solapas de navegación (**Todos**, **Routers**, **Switches**, **Access Points**) con conteos dinámicos.
   - Grilla de tarjetas responsive de 4 columnas, filtros por ubicación y orden, y paginación client-side de 20 por página.
4. **Servidores (`ServidorList.jsx`)**:
   - Encabezado estándar blanco y card principal con barra de herramientas completa (ubicación, estado, orden por nombre, buscador en tiempo real, selección total y conteo).
   - Grilla de tarjetas Stitch de 4 columnas con métricas de hostname, IP, sistema operativo y acciones rápidas.
5. **Máquinas de Tesorería (`MaquinaTesoreriaList.jsx`)**:
   - Encabezado estándar blanco y fila de KPIs interactivos por cada tipo de máquina (Validadora, Recontadora, Bolsillos, Envasadora, Fajadora).
   - Solapas dinámicas por tipo con conteo en vivo, filtros de estado y orden, buscador y selección múltiple.
   - Grilla de 4 columnas con modelo, número de serie, vida útil/observación, badge de estado operativo y navegación a detalle.
6. **Teléfonos IP (`TelefonoIpList.jsx`)**:
   - Encabezado estándar blanco y card principal con barra de herramientas unificada (estado, orden por interno/nombre, buscador, selección total).
   - Grilla de 4 columnas con avatar visual por iniciales, indicador de interno (`Int: XXXX`), dirección IP con copiado rápido al portapapeles, modelo, MAC y estado SIP.

---

## 38. Estandarización Visual de Sistema — Componentes Canónicos de Layout (Basado en Periféricos)

A partir del módulo consolidado de **Periféricos** (`PerifericosTodosList.jsx`), se establecieron los estilos generales y componentes de layout estándar del sistema para garantizar homogeneidad visual estricta en todas las vistas:

### 1. Componentes Reutilizables de Layout (`src/components/layout/`)
- **`ModuleHeader`** ([`ModuleHeader.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/layout/ModuleHeader.jsx)):
  - Card blanca institucional (`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full`).
  - Título con tipografía `text-2xl font-bold text-slate-900 tracking-tight`.
  - Badge de estado/conteo (`bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold px-2.5 py-0.5`).
  - Subtítulo descriptivo (`text-xs text-slate-500 mt-1`).
  - Botones de acción unificados: secundario en gris neutro (`bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs px-3.5 py-2`) y primario corporativo (`bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg shadow-xs px-4 py-2`).
- **`KpiGrid` y `KpiCard`** ([`KpiGrid.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/layout/KpiGrid.jsx), [`KpiCard.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/layout/KpiCard.jsx)):
  - Grilla responsiva de 6 columnas (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3`).
  - Tarjeta KPI independiente (`bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between`).
  - Cabecera en mayúsculas (`text-[11px] font-bold text-slate-500 uppercase tracking-wider`) con icono temático `w-4 h-4`.
  - Métrica cuantitativa de alto impacto (`text-3xl font-extrabold text-slate-900 tracking-tight my-2`).
  - Pie explicativo o desglose (`text-xs text-slate-400`).
- **`TabsCard`** ([`TabsCard.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/layout/TabsCard.jsx)):
  - Contenedor en card blanca redondeada (`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full`).
  - Franja superior de solapas integrada (`p-2 sm:p-2.5 bg-slate-50/80 border-b border-slate-200 overflow-x-auto scrollbar-none`).
  - Solapa activa: `bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold px-3.5 py-2 rounded-lg text-xs sm:text-sm` acompañada de pill badge distintivo `bg-red-50 text-red-600 border border-red-100 font-extrabold px-2 py-0.5 rounded-full text-xs`.
  - Solapa inactiva: `text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold px-3.5 py-2 rounded-lg text-xs sm:text-sm` con badge tenue `bg-slate-200/80 text-slate-600 font-extrabold px-2 py-0.5 rounded-full text-xs`.
- **`FilterBar`** ([`FilterBar.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/components/layout/FilterBar.jsx)):
  - Barra de búsqueda y filtros proporcionales en una sola fila (`FilterBar`, `FilterBar.Search`, `FilterBar.Select`).
  - Buscador flexible (`w-[36%] min-w-[200px] flex-1`) y `<select>` proporcionales con porcentaje de la card (`!w-[15%] max-w-[16%] min-w-[120px] truncate cursor-pointer`) para pisar el `width: 100%` global de `App.css` y garantizar que todos los filtros se vean completos dentro de la card.
  - Pie automático de filtros activos con contador y botón *Limpiar filtros*, más `!w-auto` para el selector de paginación (`Por página`).

### 2. Vistas Adaptadas al Estándar
- [`Dashboard.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/Dashboard.jsx): `ModuleHeader` para Consola de Control de Inventario IT.
- [`Reportes.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/Reportes.jsx): `ModuleHeader` con acciones secundarias y primarias estandarizadas.
- [`ComputadoraList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ComputadoraList.jsx): `ModuleHeader` institucional y simplificación de solapa secundaria redundante.
- [`StockPage.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/StockPage.jsx): `ModuleHeader`, `TabsCard` para *Depósito*, *Asignaciones* y *Bajas*, con tarjetas KPI estandarizadas en `AsignacionesTab.jsx` y `BajasTab.jsx` usando `KpiGrid` y `KpiCard`.
- [`EtiquetasQrList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/EtiquetasQrList.jsx): `ModuleHeader` y botones estandarizados.
- [`EventosHardwareList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/EventosHardwareList.jsx): `ModuleHeader` y card container estándar.
- [`ConciliacionesList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ConciliacionesList.jsx): `ModuleHeader` y `TabsCard` para conciliaciones pendientes/resueltas.
- [`InfraestructuraDashboard.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/InfraestructuraDashboard.jsx): `ModuleHeader` institucional y fila de 8 KPIs estandarizada con tarjetas verticales, tipografía `text-3xl font-extrabold` e iconos directos de Periféricos.
- [`NvrsCamarasList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrsCamarasList.jsx): `ModuleHeader` y 4 tarjetas KPI migradas a `KpiGrid` y `KpiCard` canónicos (*CCTV Terminales*, *Servidores NVR*, *Almacenamiento RAID*, *Ciclo Retención*).
- [`ServidorList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx): `ModuleHeader` y grilla unificada.
- [`RoutersSwitchesList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RoutersSwitchesList.jsx): `ModuleHeader`, `TabsCard` y 3 tarjetas KPI unificadas al estándar vertical de Periféricos con toggle interactivo y resaltado visual.
- [`MaquinaTesoreriaList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx): `ModuleHeader`, `KpiGrid` por tipo y `TabsCard` integrado.
- [`TelefonoIpList.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/TelefonoIpList.jsx): `ModuleHeader` institucional y acciones unificadas.
- [`InvestigacionSesiones.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/InvestigacionSesiones.jsx): `ModuleHeader` y `KpiCard` con tipografía estándar de Periféricos.
- [`ResponsableDetail.jsx`](file:///d:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ResponsableDetail.jsx): `ModuleHeader` con botón de regreso estándar.




