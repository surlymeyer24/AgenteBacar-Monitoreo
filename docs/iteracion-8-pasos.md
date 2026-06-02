# Iteración 8 — Routers y Switches

## Objetivos

1. Agregar **Router** y **Switch** como nuevos tipos de activo en el inventario, con CRUD completo (crear, listar, detalle, cambiar estado).
2. Colecciones **separadas** en Firestore (`routers`, `switches`) — coherente con `computadoras` / `camaras`.
3. Nuevo enum **`UbicacionRed`** exclusivo para dispositivos de red.
4. Integrar ambos tipos en la **búsqueda global** y el **dashboard**.
5. Agregar la rama **Redes** en el sidebar y las páginas de listado/detalle en el frontend.

> **Contexto:** La iteración 6 dejó un placeholder en `topicos.js` para "Redes → Routers/Switches". Esta iteración lo concreta. Los puertos individuales (puerto 1 conectado a PC X, etc.) quedan para una iteración futura; por ahora solo se guarda la cantidad total.

---

## Parte A: Backend

### 1. Enum `UbicacionRed` (nuevo en `models/`)

```java
public enum UbicacionRed {
    RACK_PRINCIPAL,
    RACK_SECUNDARIO,
    ADMINISTRACION,
    MONITOREO,
    SISTEMAS,
    GUARDIA
}
```

> Se amplía según necesidad sin romper nada; es un enum independiente de `Ubicacion` y `UbicacionCamara`.

### 2. Modelo `Router` (nuevo en `models/`)

- Campos:
  - `id` (`@DocumentId`)
  - `nombre` (String)
  - `marca` (String)
  - `modelo` (String)
  - `ip` (String)
  - `numeroSerie` (String, Firestore: `numero_serie`)
  - `firmware` (String)
  - `cantidadPuertosWan` (int, Firestore: `cantidad_puertos_wan`)
  - `cantidadPuertosLan` (int, Firestore: `cantidad_puertos_lan`)
  - `gateway` (String)
  - `ubicacion` (UbicacionRed)
  - `estadoActual` (Estado)
  - `historialEstados` (List\<CambioEstado\>)
  - `fechaAlta` (LocalDate, Firestore: `fecha_alta`)
- `@Getter @Setter`, constructor vacío inicializando `historialEstados`.
- Método `getEstadoActual()` que recorre historial (mismo patrón que `Camara`).

### 3. Modelo `SwitchRed` (nuevo en `models/`)

> Nombre `SwitchRed` porque `Switch` es palabra reservada en Java.

- Campos:
  - `id` (`@DocumentId`)
  - `nombre` (String)
  - `marca` (String)
  - `modelo` (String)
  - `ip` (String)
  - `numeroSerie` (String, Firestore: `numero_serie`)
  - `cantidadPuertos` (int, Firestore: `cantidad_puertos`)
  - `tipo` (String: `"MANAGED"` | `"UNMANAGED"`)
  - `vlans` (List\<String\>)
  - `ubicacion` (UbicacionRed)
  - `estadoActual` (Estado)
  - `historialEstados` (List\<CambioEstado\>)
  - `fechaAlta` (LocalDate, Firestore: `fecha_alta`)
- Misma estructura que `Router`.

### 4. DTOs

**`RouterDTO`** — lectura:
- `id`, `nombre`, `marca`, `modelo`, `ip`, `numeroSerie`, `firmware`, `cantidadPuertosWan`, `cantidadPuertosLan`, `gateway`, `ubicacion` (String), `estado` (String), `fechaAlta` (LocalDate), `historialEstados` (List\<CambioEstadoDTO\>)

**`RouterCreateDTO`** — creación:
- `nombre` (@NotBlank), `marca`, `modelo`, `ip`, `numeroSerie`, `firmware`, `cantidadPuertosWan`, `cantidadPuertosLan`, `gateway`, `ubicacion` (@NotBlank), `fechaAlta` (opcional, default hoy)

**`SwitchRedDTO`** — lectura:
- `id`, `nombre`, `marca`, `modelo`, `ip`, `numeroSerie`, `cantidadPuertos`, `tipo`, `vlans` (List\<String\>), `ubicacion` (String), `estado` (String), `fechaAlta` (LocalDate), `historialEstados` (List\<CambioEstadoDTO\>)

**`SwitchRedCreateDTO`** — creación:
- `nombre` (@NotBlank), `marca`, `modelo`, `ip`, `numeroSerie`, `cantidadPuertos`, `tipo`, `vlans`, `ubicacion` (@NotBlank), `fechaAlta` (opcional)

### 5. Repositories

- `RouterRepository` — CRUD contra colección `routers`. Métodos: `findAll()`, `findById(id)`, `create(Router)`, `cambiarEstado(id, estado, motivo)`. Patrón idéntico a `CamaraRepository`.
- `SwitchRedRepository` — ídem contra colección `switches`.

### 6. Mappers

- `RouterMapper` — `toDTO(Router)` y `toListDTO(Router)` convirtiendo ubicación/estado a String.
- `SwitchRedMapper` — ídem.

### 7. Services

- `RouterService` — `listarTodos()`, `obtenerPorId(id)`, `crear(RouterCreateDTO)`, `cambiarEstado(id, estado, motivo)`. Patrón idéntico a `CamaraService`.
- `SwitchRedService` — ídem.

### 8. Controllers

- `RouterController` — `@RequestMapping("/api/routers")`:
  - `GET /` → listar todos
  - `GET /{id}` → detalle
  - `POST /` → crear
  - `POST /{id}/estado` → cambiar estado
- `SwitchRedController` — `@RequestMapping("/api/switches")`: mismos endpoints.

### 9. Configuración

Agregar en `application.properties`:
```properties
firebase.collection.routers=routers
firebase.collection.switches=switches
```

### 10. Integración búsqueda (`BusquedaService`)

- Inyectar `RouterRepository` y `SwitchRedRepository`.
- Match por: `nombre`, `marca`, `modelo`, `ip`, `id`, `ubicacion.name()`.
- Nuevos tipos en `ResultadoBusquedaDTO`: `"router"` y `"switch"`.
- Paths: `/routers/{id}` y `/switches/{id}`.
- Máx 10 por tipo (igual que PCs y cámaras).

### 11. Integración dashboard (`DashboardService`)

- Nuevos campos en `DashboardStatsDTO`:
  - `totalRouters`, `totalSwitches`
  - `porEstadoRouters`, `porEstadoSwitches`
  - `porUbicacionRouters`, `porUbicacionSwitches`
- Incluir cambios de estado de routers/switches en `ultimosCambios`.

### 12. CORS

- Ya permite GET/POST en `/api/**` (iteración 2). No hace falta tocar `CorsConfig`.

---

## Parte B: Frontend

### 13. API

- `routerApi.js` — `fetchRouters()`, `fetchRouter(id)`, `crearRouter(data)`, `cambiarEstadoRouter(id, body)`.
- `switchApi.js` — ídem para switches.

### 14. Páginas

- `RouterList.jsx` — tabla con nombre, marca, modelo, IP, puertos WAN/LAN, ubicación, estado. Botón "Nuevo router" que abre modal/formulario.
- `RouterDetail.jsx` — card completa + historial de estados + botón cambiar estado.
- `SwitchList.jsx` — tabla con nombre, marca, modelo, IP, cantidad puertos, tipo, ubicación, estado.
- `SwitchDetail.jsx` — ídem.
- Reutilizar `.table`, `.card`, `.badge` existentes.

### 15. Sidebar

- Agregar rama "Redes" en `topicos.js`:
  ```js
  {
    id: 'redes', label: 'Redes', icono: '🌐',
    children: [
      { id: 'routers',  label: 'Routers',  path: '/routers' },
      { id: 'switches', label: 'Switches', path: '/switches' },
    ],
  }
  ```

### 16. Rutas

- Agregar en `App.jsx`: `/routers`, `/routers/:id`, `/switches`, `/switches/:id`.

### 17. Búsqueda

- En `SearchBar.jsx`, agregar badges para tipo `"router"` y `"switch"` con colores diferenciados.

---

## Prueba integrada

1. `GET /api/routers` → lista vacía (colección nueva).
2. `POST /api/routers` con body válido → 201 con el router creado.
3. `GET /api/routers/{id}` → detalle del router.
4. `POST /api/routers/{id}/estado` → cambia estado, aparece en historial.
5. Ídem puntos 1-4 para `/api/switches`.
6. `GET /api/buscar?q=cisco` → devuelve routers/switches cuya marca contiene "cisco".
7. `GET /api/dashboard/stats` → incluye totales y distribuciones de routers/switches.
8. Sidebar muestra rama "Redes" con Routers y Switches.
9. Listado y detalle de ambos tipos funciona en el front.

---

## Notas

- `SwitchRed` en el backend, pero en el frontend y la API se usa `/switches` y `"switch"` como tipo (sin el sufijo "Red").
- Los puertos individuales (mapeo puerto → dispositivo conectado) quedan para iteración futura.
- `UbicacionRed` es independiente; si se quiere unificar todos los enums de ubicación en uno solo, se hace en refactor aparte.
- Si el inventario de red crece mucho, mover a queries Firestore con filtros (mismo approach que la nota de búsqueda en iteración 7).
