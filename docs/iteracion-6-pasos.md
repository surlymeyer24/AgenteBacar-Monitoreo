# Iteración 6 — Navegación jerárquica por tópicos

## Objetivos

1. Reestructurar el sidebar en un **árbol de categorías expandibles** (Hardware → Computadoras/Impresoras/Monitores; Seguridad → Cámaras; etc.), inspirado en el panel "Tópicos" de ServiceDesk Plus.
2. Preparar las categorías como **configuración declarativa** (`src/constants/topicos.js`), de modo que sumar un nuevo tipo de activo a futuro sea solo agregar una entrada.
3. Mantener la paleta oscura actual del sidebar (`#0e0f36`, `--color-sidebar-bar`).

> **Ya existe:** sidebar con `NavLink` plano para Computadoras y Cámaras en `App.jsx`, clases `.sidebar`, `.nav`, `.nav-link` en `App.css`. Esta iteración las amplía con soporte de ramas.

---

## Parte A: Backend

**No se tocan endpoints en esta iteración.** Solo se valida que las categorías nuevas (Impresoras, Monitores) apunten a listados derivados del snapshot del agente ya disponible en `/api/computadoras/{uuid}`.

Si el costo de iterar los detalles de PC para armar los listados de periféricos resulta alto, se evaluará agregar endpoints `GET /api/perifericos/impresoras` y `GET /api/perifericos/monitores` en una iteración futura.

---

## Parte B: Frontend

### 10. Estructura de datos de categorías

- Nuevo `src/constants/topicos.js` exportando un array de objetos:
  ```js
  export const TOPICOS = [
    { id: 'inicio', label: 'Inicio', icono: '🏠', path: '/' },
    {
      id: 'hardware', label: 'Hardware', icono: '💻',
      children: [
        { id: 'computadoras', label: 'Computadoras', path: '/computadoras' },
        { id: 'impresoras',   label: 'Impresoras',   path: '/perifericos/impresoras' },
        { id: 'monitores',    label: 'Monitores',    path: '/perifericos/monitores' },
      ],
    },
    {
      id: 'seguridad', label: 'Seguridad', icono: '📹',
      children: [
        { id: 'camaras', label: 'Cámaras', path: '/camaras' },
      ],
    },
    // Placeholders para futuras iteraciones (Redes → Routers/Switches, Softwares, etc.)
  ];
  ```
- El archivo es la única fuente de verdad para el sidebar; sumar una rama = editar este archivo.

### 11. Componente `SidebarNav.jsx` (nuevo en `src/components/`)

- Crear carpeta `src/components/` (no existe aún).
- Importa `TOPICOS` y renderiza recursivamente:
  - **Hoja** (sin `children`) → `<NavLink>` con `.nav-link`.
  - **Rama** (con `children`) → header clickeable (`.nav-group-header`) que toggle-a un `useState` local (`expandido[id]`), y al expandirse muestra los hijos con indentación.
- Indicador de expansión: `▸` / `▾` (caracter simple, sin librería de íconos).
- Auto-expandir la rama cuyo hijo coincide con la ruta actual (`useLocation()` → comparar `pathname` con `child.path`).

### 12. Integración en `App.jsx`

- Reemplazar el bloque `<nav className="nav">…</nav>` por `<SidebarNav />`.
- Mantener el `.logo` y la estructura del `<aside className="sidebar">`.

### 13. Vistas placeholder para categorías sin página propia

Para que el árbol no tenga "ramas muertas":

- **Impresoras** — ruta `/perifericos/impresoras` → nueva página `PerifericosImpresorasList.jsx`:
  - Llama a `fetchComputadoras()` + por cada PC hace `fetchComputadora(uuid)` (solo en detalle viene `perifericos`).
  - **Decisión:** empezar sin endpoint nuevo (inventario chico). Si tarda >1s, se agrega endpoint en iteración futura.
  - Tabla agrupada: PC origen, Nombre impresora, Driver, Puerto, Predeterminada.
- **Monitores** — ruta `/perifericos/monitores` → análogo, con columnas Nombre, Resolución, Pulgadas.
- Ambas páginas reutilizan clases `.table`, `.table-wrap`, `.card`.

### 14. Estilos nuevos

- Agregar en `App.css`:
  - `.nav-group-header` — similar a `.nav-link` pero con cursor pointer, sin borde activo, y `display: flex; justify-content: space-between` entre label y chevron.
  - `.nav-group-children` — padding-left extra (1rem) para indentación.
  - Transición simple con toggle `display: none / flex` (aceptable; no hace falta animación con `max-height`).

---

## Prueba integrada

1. Sidebar muestra: Inicio, Hardware ▸ (Computadoras, Impresoras, Monitores), Seguridad ▸ (Cámaras).
2. Expandir/colapsar una rama funciona con click en el header.
3. Navegar a `/camaras` → "Seguridad" se auto-expande y "Cámaras" queda marcado como `.active`.
4. Responsive: en mobile (<768px) el árbol sigue funcionando (respetar el `@media (max-width: 768px)` existente).
5. Impresoras y Monitores muestran datos reales derivados de `/api/computadoras/{uuid}.perifericos`.
6. PC sin periféricos: las páginas no rompen, muestran "Sin registros".

---

## Notas

- No se introduce librería de íconos (react-icons, lucide, etc.). Si más adelante el usuario acepta, se reemplazan los emojis.
- El estado `expandido` es local al componente — si se quiere persistir en `localStorage`, se agrega en una iteración futura.
- Las ramas vacías de Redes / Softwares se dejan **fuera** de esta iteración; se suman cuando existan sus DTOs.
