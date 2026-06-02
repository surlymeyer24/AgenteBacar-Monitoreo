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
| Frontend | React + Vite (`inventario-front/`) |
| Backend de datos | Firebase / Firestore |
| Agente de recolección | Windows Service en C# (CyberWatch / AgenteBacar) |
| Tipos de fecha | `java.time.LocalDate`, `java.time.LocalDateTime` |

---

## 8. Iteración 1 — Listado y detalle de computadoras (entregado)

Objetivo: poder ver todas las PCs que sincronizan con Firestore y abrir el detalle de una por UUID.

### Backend (`inventario/`)

- **CORS** (`config/CorsConfig.java`): origen `http://localhost:5173`, rutas `/api/**`, métodos según la iteración vigente (inicialmente GET).
- **Persistencia**: `ComputadoraRepository` lee la colección configurada en `firebase.collection.computadoras`, mapea el documento a `Computadora` (incluye lectura de `usuarios.usuario_actual` anidado) y expone `findAll` / `findByUuid`.
- **Servicio y controlador**: `ComputadoraService` + `ComputadoraController` con `GET /api/computadoras` y `GET /api/computadoras/{uuid}` (404 si no existe).
- **DTOs**: `ComputadoraMapper` arma `ComputadoraDTO` (hostname, usuario, ubicación enum como nombre, SO, arquitectura, estado operativo manual si existe, procesador aplanado, discos, RAM).

### Frontend (`inventario-front/`)

- Proyecto **Vite + React** con **React Router**.
- **`src/api/computadoraApi.js`**: llamadas `fetch` al backend.
- **Rutas**: `/` lista en tabla (UUID acortado, columnas principales, fila clickeable); `/computadoras/:uuid` detalle con datos generales, procesador, discos y RAM; navegación lateral con marca “Inventario BACARSA”.
- Estilos en `index.css` / `App.css` (tablas, cards, layout).

La guía paso a paso original de esta iteración ya no se mantiene en un archivo apartado; este apartado la reemplaza.

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

### Nota importante

Los campos `estado` dentro de impresoras y dispositivos de audio son **reportados por Windows**, no representan el estado operativo gestionado por IT (`estadoActual` / `CambioEstado`).

Detalle de tareas y verificación: [`docs/iteracion-3-pasos.md`](docs/iteracion-3-pasos.md).

---

## 11. Iteración 4 — Estados y ciclo de vida

Objetivo: introducir un enum tipado para el **estado operativo** compartido por computadoras y cámaras, y exponer endpoints + UI para **cambiar estado** (con motivo obligatorio) y **consultar historial** de cambios.

### Backend (`inventario/`)

- **Enum `EstadoOperativo`** (`models/`): valores `ACTIVO`, `EN_MANTENIMIENTO`, `FUERA_DE_SERVICIO` con campos `nombre` (label amigable) y `descripcion`. Fuente de verdad para validación. Se mantiene `Estado.java` como POJO para que Firestore siga deserializando documentos existentes.
- **Fix `Camara.getEstadoActual()`**: ahora replica la lógica de `Computadora.getEstadoActual()` — itera `historialEstados`, devuelve el que tiene `esEstadoActual() == true`, y cae en `estadoActual` si no encuentra.
- **DTOs** (`dto/`): `CambiarEstadoDTO` (`estado` + `motivo`, ambos `@NotBlank`) para el request; `CambioEstadoDTO` (estado, motivo, fechas ISO-8601, `activo`) para el response.
- **Mapper** `CambioEstadoMapper`: `toDTO` y `toDTOList` null-safe, formatea `LocalDateTime` como ISO-8601 vía `toString()`.
- **`ComputadoraDTO` / `CamaraDTO`**: agregan `List<CambioEstadoDTO> historialEstados`. En computadoras solo se carga en el detalle (`toDTO`), no en el listado (`toListDTO`), para mantener el payload liviano.
- **Repos — transacción Firestore**: `ComputadoraRepository.cambiarEstado()` y `CamaraRepository.cambiarEstado()` hacen un read-modify-write transaccional: leen el documento, cierran el `CambioEstado` vigente seteando `fechaHoraFin`, agregan la nueva entrada con `fechaHoraFin: null`, y reescriben el array completo + el campo top-level `estadoActual` (para que el listado no tenga que parsear el historial). La transacción es necesaria porque Firestore no soporta update condicional dentro de un array.
- **Services**: `ComputadoraService.cambiarEstado()` y `CamaraService.cambiarEstado()` validan el `estado` recibido contra `EstadoOperativo.valueOf()` (si falla, `IllegalArgumentException` → 400), devuelven `null` si no existe el doc, o el DTO actualizado en éxito.
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

Objetivo: reemplazar el sidebar plano por un **árbol de categorías expandibles** inspirado en el panel "Tópicos" de ServiceDesk Plus, con las categorías declaradas en un único archivo de configuración para que sumar un nuevo tipo de activo sea solo agregar una entrada.

### Frontend (`inventario-front/`)

- **Configuración declarativa** (`src/constants/topicos.js`): único lugar donde viven las categorías del sidebar. Estructura: array de items con `id`, `label`, `icono` (emoji), y opcionalmente `path` (hoja) o `children` (rama con sub-items). Sumar una rama nueva = editar este archivo.
- **Componente `SidebarNav.jsx`** (nuevo en `src/components/`): reemplaza el `<nav>` plano que antes vivía en `App.jsx`. Renderiza recursivamente el árbol:
  - Hojas → `<NavLink>` con clase `.nav-link`.
  - Ramas → header clickeable (`.nav-group-header`) con chevron `▸`/`▾` que colapsa/expande los hijos.
  - Auto-expande la rama cuyo hijo matchea la ruta actual (`useLocation()`).
- **Páginas de periféricos derivados del agente** (nuevas en `src/pages/`): `PerifericosImpresorasList` y `PerifericosMonitoresList`. Ambas iteran `fetchComputadoras()` + `fetchComputadora(uuid)` por cada PC (no hay endpoint agregado — inventario chico, en memoria alcanza), aplanan los periféricos de todas las PCs en una sola tabla con columna "PC origen".
- **Estilos** (`App.css`): `.nav-group-header`, `.nav-group-chevron`, `.nav-group-children` (+ variante `is-collapsed` que aplica `display: none`). Paleta oscura del sidebar (`#0e0f36`) sin cambios.
- Sin librerías de iconos — se usan emojis unicode (`🏠`, `💻`, `📹`).

### Backend

- **Sin cambios**. Los listados de periféricos consumen `GET /api/computadoras/{uuid}` existente. Si más adelante el volumen hace lento el N+1, se evaluará agregar endpoints agregados tipo `GET /api/perifericos/impresoras`.

### Extensión posterior — grupo "Periféricos"

Después de cerrar el spec original de la iteración, se sumó un **cuarto grupo al sidebar** con 5 listados adicionales derivados del mismo snapshot del agente:

- Grupo `🧩 Periféricos` con hijos: Teclados, Mouse, Webcams, Parlantes, Micrófonos.
- Rutas `/perifericos/{teclados,mouse,webcams,parlantes,microfonos}`.
- **Teclados/Mouse/Webcams** salen de `perifericos.dispositivosUsb` con filtros heurísticos sobre los campos `clase` y `nombre` (case-insensitive `includes()`). Cada tabla expone la columna "Clase" para poder calibrar los matchers mirando datos reales del agente.
- **Parlantes/Micrófonos** salen de `perifericos.audio.salida` y `perifericos.audio.entrada` respectivamente — ya vienen separados por dirección, no requieren filtrado.
- **Helpers en `src/utils/perifericos.js`**: `siNo`, `esTeclado`, `esMouse`, `esWebcam` — filtros puros compartidos por las 3 páginas USB.
- Las 5 páginas siguen el mismo patrón N+1 de Impresoras/Monitores (fetch lista + fetch detalle por PC + aplanar).

### Notas

- El estado `expandido` del sidebar es local al componente; si se quiere persistir entre recargas, se agrega `localStorage` en una iteración futura.
- Los filtros USB (`esTeclado`/`esMouse`/`esWebcam`) son heurísticos y se esperan ajustes incrementales cuando se vea qué valores manda Windows en `clase`/`categoria` en cada máquina. No amerita iteración propia — se calibran como tweak.

Detalle de tareas y verificación: [`docs/iteracion-6-pasos.md`](docs/iteracion-6-pasos.md).

---

## 14. Pendientes de diseño

### 14.1 Identificadores de entidades

`Computadora` usa `uuid` como ID de documento (viene del agente). **`Camara`** usa `id` de Firestore (`@DocumentId`) en la iteración 2. Para el resto (`Estado`, `CambioEstado`, componentes HW anidados) sigue pendiente definir `String id` o estrategia de persistencia antes de exponerlos por API.

### 14.2 Identificación operativa de cámaras

Revisar y definir **cómo identificar las cámaras** en el día a día del inventario más allá del `id` autogenerado del documento: por ejemplo código interno de activo, número de serie del fabricante, etiqueta física, o nombre único negocio—lo que permita búsqueda, cruce con instalación física y auditoría sin depender solo del ID de Firestore.

---

## 15. Comandos de deploy

### Frontend — Firebase Hosting

Desde `inventario-front/`:

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

