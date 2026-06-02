# Iteración 7 — Búsqueda global

## Objetivos

1. Agregar un endpoint `GET /api/buscar?q=...` que retorne **resultados unificados** de computadoras y cámaras.
2. Agregar una **barra de búsqueda global** en el header del área principal, con dropdown de resultados en vivo, debounce y navegación directa al detalle.

> **Contexto:** Inspirado en el search bar de ServiceDesk Plus. Reutiliza `.badge`, `.card` y la paleta existente.

---

## Parte A: Backend

### 15. DTO `ResultadoBusquedaDTO` (nuevo en `dto/`)

- Campos:
  - `tipo` (String: `"computadora"` | `"camara"`)
  - `id` (String: uuid u id)
  - `titulo` (String: hostname o nombre)
  - `subtitulo` (String: usuario o ubicación)
  - `estado` (String)
  - `path` (String: ruta relativa al detalle, p. ej. `/computadoras/abc-123`)
- `@Data @NoArgsConstructor @AllArgsConstructor`.

### 16. `BusquedaService` (nuevo en `service/`)

- Método `buscar(String q)`:
  1. Normalizar `q` (trim, lowercase, sin acentos con `java.text.Normalizer.normalize` + regex `\\p{InCombiningDiacriticalMarks}+`).
  2. Cargar todas las `Computadora` y `Camara` desde los repos (inventario chico, in-memory ok).
  3. Match por inclusión (`contains`) normalizado en cualquiera de: `hostname`, `usuarioActual`, `uuid`, `ubicacion.name()` en PCs; `nombre`, `marca`, `ubicacion.name()`, `id` en cámaras.
  4. Retornar lista ordenada: computadoras primero, máx 10 resultados por tipo.
- Si `q` es `null`, vacío o `length < 2`: retornar lista vacía.

### 17. `BusquedaController` (nuevo en `controller/`)

- `GET /api/buscar?q={query}` → `List<ResultadoBusquedaDTO>` (200 OK, array vacío si sin matches).
- Query param obligatorio en la URL pero permitido vacío (el service maneja el caso).

### 18. CORS

- Ya permite GET en `/api/**` (iteración 2). No hace falta tocar `CorsConfig`.

---

## Parte B: Frontend

### 19. API

- Nuevo `src/api/busquedaApi.js` con `buscar(q)` → GET a `http://localhost:8080/api/buscar?q=...` (URL-encodear `q`).

### 20. Componente `SearchBar.jsx` (nuevo en `src/components/`)

- Input controlado + dropdown de resultados.
- **Debounce** de 250 ms antes de disparar la request (implementado con `useEffect` + `setTimeout`, sin dependencia externa).
- Mientras escribe: `.muted` "Buscando..." en el dropdown.
- Dropdown con `position: absolute`, ancho = input, máx 400 px de alto con scroll.
- Cada resultado: fila con badge de tipo (`.badge-info` para "PC", `.badge-neutral` para "Cámara"), título en bold, subtítulo `.muted`.
- Click en resultado → `navigate(resultado.path)` + limpiar input + cerrar dropdown.
- Cierre del dropdown: click fuera (`useEffect` con `mousedown` listener en `document`) o tecla Escape.
- Accesibilidad básica: flechas ↑ / ↓ para navegar opciones, Enter para seleccionar.

### 21. Integración en layout

- Agregar un header al área `.main` (arriba del `<Routes>` en `App.jsx`):
  ```jsx
  <header className="topbar">
    <SearchBar />
  </header>
  ```
- La topbar queda sticky en top, fondo `var(--header-bg)`, con sombra sutil `var(--shadow)`.

### 22. Estilos nuevos

- Agregar en `App.css`:
  - `.topbar` — flex, padding, sticky, z-index sobre el contenido.
  - `.search-input` — full width hasta 520 px, borde `--color-border`, focus ring con `--color-sidebar-bar`.
  - `.search-dropdown` — absolute, `--card-bg`, `box-shadow`, `border-radius: var(--radius)`.
  - `.search-result-item` — padding, hover `--hover-bg`, seleccionado (teclado) con outline en `--color-sidebar-bar`.

---

## Prueba integrada

1. Backend en `localhost:8080`, front en `localhost:5173`.
2. `GET /api/buscar?q=lat` devuelve PCs cuyo hostname contiene "lat" (case-insensitive, sin acentos).
3. `GET /api/buscar?q=` devuelve `[]`.
4. `GET /api/buscar?q=áÁ` normaliza igual que `aA`.
5. Escribir "adm" en la barra → dropdown muestra PCs y cámaras con ubicación ADMINISTRACION.
6. Click en un resultado → navega al detalle correspondiente y limpia el input.
7. Flechas + Enter navegan también.
8. Escape o click fuera cierra el dropdown.

---

## Notas

- Inventario pequeño → se permite scan in-memory. Cuando crezca, se puede mover a query Firestore con `array-contains-any` sobre un campo `search_tokens` precomputado e indexado.
- La búsqueda no es fuzzy; solo `contains`. Fuzzy (Levenshtein, Fuse.js) queda para iteración futura si el usuario lo pide.
- Si en el futuro se agregan más tipos de activo (impresoras, switches), extender `BusquedaService` con sus repos y sumar los matches al resultado.
