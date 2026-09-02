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

- **Frontend**: `InfraestructuraDashboard.jsx` — dashboard secundario para la sección de infraestructura de red (Routers, Switches, NVRs).

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

