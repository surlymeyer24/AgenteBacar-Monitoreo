# Prompt para Google AI Studio — Frontend Inventario IT Bacarsa

> Copiá **todo** el contenido desde la sección «PROMPT» hacia abajo y pegalo en Google AI Studio (Build / Gemini app).  
> Objetivo: generar un frontend React profesional que **mantenga la estructura y los datos** del sistema actual, pero con UI más limpia, ordenada y corporativa.

---

## PROMPT

```
Sos un diseñador/desarrollador senior de productos B2B. Necesito que construyas una aplicación web completa de **Inventario IT corporativo** para la empresa **Bacarsa** (marca en UI: **IT-Bacar** / **Inventario**).

NO inventes un sistema genérico de assets. Debés respetar EXACTAMENTE la arquitectura de información, pantallas, entidades, campos y flujos que describo abajo. Mejorá solo el diseño visual, la tipografía, el espaciado, la jerarquía y la pulcritud — sin cambiar el modelo de negocio ni eliminar secciones.

────────────────────────────────────────
1) CONTEXTO DEL PRODUCTO
────────────────────────────────────────

Sistema interno de inventario IT. Un agente C# instalado en cada PC (CyberWatch) reporta hardware/software a Firestore. Un backend Java Spring Boot expone API REST. Este frontend es la consola de control para el equipo de Sistemas.

Usuarios reales: administradores y técnicos IT. Idioma de la UI: **español (Argentina)**. Fechas en locale `es-AR`.

Hay dos orígenes de datos conceptuales:
A) **Detectados por agente** — PCs, periféricos USB/monitores/impresoras/audio reportados automáticamente.
B) **Carga manual** — stock de depósito, cámaras, NVRs, routers, switches, servidores, teléfonos IP, celulares, televisores, máquinas de tesorería.

────────────────────────────────────────
2) STACK TÉCNICO DESEADO
────────────────────────────────────────

- React + Vite + TypeScript (o JS si preferís, pero tipado fuerte es mejor).
- React Router (rutas reales, no solo `currentView` state).
- Tailwind CSS v4 o v3.
- Lucide React para iconos.
- Recharts para gráficos.
- Framer Motion / motion para micro-animaciones sutiles (barras, transiciones de página).
- Layout: sidebar colapsable + área principal con scroll independiente.
- Responsive: desktop-first, pero usable en tablet/móvil (drawer overlay en mobile).
- Datos: podés usar **mock data realista** alineado a los schemas de abajo (luego se conectará a API). Incluí un archivo `mockData.ts` rico con 8–15 PCs, periféricos, stock, cámaras, etc.
- NO uses Gemini API / AI features salvo que se pida. Es una app de inventario, no un chatbot.
- Auth: pantalla de Login (email/password) mockeada; después del login, shell con sidebar. Roles: VISUALIZADOR (solo lectura), USUARIO (CRUD inventario), ADMINISTRADOR (usuarios + Sistema).

────────────────────────────────────────
3) DIRECCIÓN VISUAL (MUY IMPORTANTE)
────────────────────────────────────────

Queremos algo **profesional, limpio, corporativo IT**, estilo consola Atlassian / Linear / admin moderno — NO un landing page, NO dark cyberpunk saturado, NO púrpura/índigo genérico AI, NO cards con sombras enormes ni “glassmorphism” exagerado.

Paleta sugerida (podés refinarla, pero mantené esta dirección):
- Fondo app: slate-50 / #F7F8FA
- Superficies: blanco #FFFFFF con borde sutil slate-200
- Texto: slate-900 / slate-600 / slate-500
- Acento primario: azul corporativo #0c66e4 (hover #0055cc)
- Éxito: #36b37e | Alerta: #ffab00 | Error/offline: #ff5630 | Info: #00a3bf | Secundario: #6554c0
- Sidebar: fondo oscuro sobrio (#0B1220 o similar), texto muted, item activo con acento azul
- Tipografía: Inter o similar sans moderna (podés usar una display solo en login). Evitá Inter+púrpura cliché; si usás Inter, compensá con espaciado y color sobrio.
- Radio: 8–12px. Sombras: mínimas (shadow-xs). Densidad: media-alta (tablas compactas, KPIs claros).
- Badges de estado: píldoras pequeñas uppercase tracking-wide.
- Indicadores de sync/actividad: puntos de color (verde = activo, ámbar = intermedio, rojo = sin actividad).

Login: puede ser más expresivo (fondo oscuro #07080d, marca grande “IT-Bacar”, eyebrow “BACARSA SISTEMAS”), pero el interior de la app debe ser light y ordenado.

────────────────────────────────────────
4) NAVEGACIÓN / SIDEBAR (ESTRUCTURA OBLIGATORIA)
────────────────────────────────────────

Sidebar con secciones colapsables. Marca: logo + texto “Inventario”. Footer con usuario logueado + logout.

### General
- Inicio → `/` (Dashboard principal)
- Reportes → `/reportes`

### Hardware (grupo expandible)
- Computadoras → `/computadoras`
- Impresoras → `/perifericos/impresoras`
- Monitores → `/perifericos/monitores`

### Periféricos (grupo expandible)
- Teclados → `/perifericos/teclados`
- Mouse → `/perifericos/mouse`
- Webcams → `/perifericos/webcams`
- Parlantes → `/perifericos/parlantes`
- Micrófonos → `/perifericos/microfonos`
- Televisores → `/perifericos/televisores`
- Celulares → `/perifericos/celulares`

### Stock (link directo)
- Stock → `/perifericos/stock`

### Infraestructura (grupo expandible)
- NVR → `/nvrs`
- Cámaras → `/camaras`
- Servidores → `/servidores`
- Routers & Switches → `/routers-switches` (vista combinada; también existen `/routers`, `/switches`, `/access-points`)
- Máq. Tesorería → `/maquinas-tesoreria`
- Teléfonos IP → `/telefonos`

### Administración
- Mi Perfil → `/perfil`
- Usuarios → `/admin/usuarios` (solo ADMIN)
- Sistema → `/system` (solo ADMIN)

Rutas adicionales a contemplar:
- `/computadoras/asignaciones` (tablero de asignaciones)
- `/computadoras/nueva`
- `/computadoras/:uuid` (detalle — master-detail: listado a la izquierda o full page con drawer)
- `/perifericos/dashboard` (dashboard específico de periféricos)
- `/perifericos` (todos los detectados por agente)
- `/perifericos/stock/nuevo` y `/perifericos/stock/:id`
- `/infraestructura` (dashboard de infraestructura)
- Detalles: `/camaras/:id`, `/nvrs/:id`, `/routers/:id`, `/switches/:id`, `/servidores/:id`, `/maquinas-tesoreria/:id`

────────────────────────────────────────
5) DASHBOARD PRINCIPAL (`/`)
────────────────────────────────────────

Título: “Consola de Control de Inventario IT”
Subtítulo: “Estado de activos, stock de periféricos y asignaciones en tiempo real.”
CTA: botón “Registrar Computadora”

### KPI strip (5 métricas en fila)
1. Total Computadoras (clickeable → modal o navegación a listado)
2. Comp. Activas (online / sync reciente)
3. Cámaras
4. Periféricos (detectados; click → `/perifericos/dashboard`)
5. Teléfonos IP

### Bloques
- **Directorio de Teléfonos IP** (preview con búsqueda por nombre asignado; muestra asignadoA, IP, interno; link a directorio completo)
- **Computadoras por área** — bar chart horizontal por ubicación
- **Métricas de Periféricos** — barras animadas por tipo (Impresoras, Monitores, Teclados, Mouse, Webcams, Parlantes, Micrófonos…)
- **Estado de Computadoras** — pie chart Activas vs Inactivas
- **Tabla preview Computadoras**: Hostname | Estado conexión | Procesador | Ubicación (click → detalle)
- **Tabla preview Cámaras**: Nombre | Tipo | Ubicación (click → detalle o NVR)

────────────────────────────────────────
6) COMPUTADORAS (NÚCLEO DEL SISTEMA)
────────────────────────────────────────

### Listado `/computadoras`
Vistas/perspectivas posibles:
- Inventario (tabla)
- Asignaciones (board Kanban o columnas por estado/ubicación)

Columnas tabla:
- Checkbox (acciones masivas)
- Hostname (+ icono PC vs Notebook según `tipoEquipo`)
- Usuario actual
- Responsable inventario (IT)
- AnyDesk ID (copiable, formateado con espacios cada 3 dígitos)
- Ubicación
- Estado operativo (badge)
- Estado conexión / actividad sync (dot + label)
- Sistema operativo (badge)
- Procesador (resumen)

Filtros:
- Búsqueda libre (hostname, usuario, responsable, uuid, ubicación, SO, estado, anydesk)
- Ubicación (enum)
- Tipo equipo: PC / Notebook
- Actividad sync: Activo / Intermedio / Sin actividad
- Orden: Hostname A-Z, Z-A, Ubicación A-Z

Acciones masivas (si hay permisos de escritura):
- Cambiar ubicación a N seleccionadas
- Eliminar N seleccionadas (con confirmación)

### Detalle `/computadoras/:uuid`
Header con: hostname, badges de conexión + estado operativo, última sincronización relativa (“hace X minutos”), AnyDesk copiable, botón volver/eliminar.

**3 solapas (tabs):**

#### Tab Hardware
- Resumen: tipoEquipo, SO, arquitectura, windowsVersionDetallada (edición, display_version, build, ubr, build_lab)
- Procesador: nombre, núcleos, fabricante, arquitectura
- RAM: módulos (capacidadGB, velocidadMHz, modelo, fabricante) + total GB
- Discos: modelo, tipo, total/libre/usado GB, % usado (barra), punto de montaje
- Monitores detectados (nombre limpio, fabricante, etc.)
- Impresoras detectadas
- USB filtrados para inventario (teclados, mouse, webcams identificados)
- Audio (entrada/salida)

#### Tab Software
- Buscador de programas instalados
- Tabla de programas (nombre, versión, publisher si existe)

#### Tab Asignación
- Editar ubicación (select enum)
- Editar responsable de inventario (texto libre)
- Cambiar estado operativo (select + motivo obligatorio) → genera historial
- Timeline de historial de estados (fecha, estado, motivo, usuario)

Ubicaciones de computadora (enum exacto):
ADMINISTRACION, MONITOREO, TESORERIA, CAPITAL_HUMANO, SISTEMAS, SEGURIDAD_PRIVADA, OPERACIONES
(mostrar labels legibles: “Capital Humano”, “Seguridad Privada”, etc.)

Estados operativos:
ASIGNADA → “Asignada”
SIN_ASIGNAR → “Sin Asignar”
EN_MANTENIMIENTO → “En mantenimiento”
BAJA → “Baja”
ACTIVA → “Activa”
INACTIVA → “Inactiva”

Schema Computadora (campos a mockear):
{
  uuid, hostname, tipoEquipo, usuarioActual, ubicacion, sistemaOperativo, arquitectura,
  estadoActual, estadoAgente, estadoConexion, ultimaSincronizacion,
  procesador: { nombreRaw, nucleosFisicos, arquitectura, fabricante },
  discos: [{ tipoDisco, modeloDisco, totalGB, libreGB, usadoGB, porcentajeUsado, puntoMontaje, dispositivo }],
  modulos: [{ capacidadGB, velocidadMHz, modelo, fabricante }],
  perifericos: {
    impresoras: [...],
    dispositivosUsb: [...],
    monitores: [...],
    audio: { entrada: [...], salida: [...] }
  },
  historialEstados: [{ fecha, estado, motivo, usuario }],
  programas: [{ nombre, version, ... }],
  windowsVersionDetallada: { edicion, display_version, build, ubr, build_lab },
  responsableInventario, anydeskId
}

────────────────────────────────────────
7) PERIFÉRICOS DETECTADOS POR AGENTE
────────────────────────────────────────

Cada tipo tiene su listado propio (misma UX de tabla + filtros):
- Impresoras, Monitores, Teclados, Mouse, Webcams, Parlantes, Micrófonos

Cada fila debe mostrar al menos:
- Nombre / modelo del periférico
- PC de origen (hostname) — link a la computadora
- Ubicación de esa PC
- Fabricante / conexión si aplica

Dashboard `/perifericos/dashboard`:
- KPIs: Total agente, Stock manual, Impresoras, Monitores, …, Televisores, Celulares
- Barras “Por tipo (agente)” clickeables
- Accesos rápidos a cada categoría

También existe vista “Todos” `/perifericos`.

────────────────────────────────────────
8) STOCK MANUAL (`/perifericos/stock`) — CRÍTICO
────────────────────────────────────────

Stock de depósito / ítems cargados a mano (NO confundir con periféricos del agente).

Tabs internos:
1. **Periféricos / ítems de stock**
2. **Computadoras en stock** (PCs con estado “Sin Asignar”)

Tipos canónicos de stock:
computadora, camara_ip, teclado, mouse, monitor, impresora, webcam, parlante, microfono, otro

Campos de ítem de stock (PerifericoManual):
{
  id, tipo, cantidad, nombre, fabricante, conexion,
  computadoraHostname, ubicacion, notas, estado,
  fechaAlta, comboId, comboNombre, historialEstados
}

UX requerida:
- Filtro por categoría + búsqueda
- Tabla con cantidad editable (+ / −)
- Modal crear/editar
- Alta de “combo” (kit: teclado+mouse+etc. agrupados)
- CRUD completo
- Link a detalle `/perifericos/stock/:id`
- Sensación de “depósito organizado”: limpio, con chips de tipo, stock bajo destacado

────────────────────────────────────────
9) TELEVISORES Y CELULARES
────────────────────────────────────────

Televisor: { id, marca, modelo, numeroSerie, area, direccionIp, estado }
Celular: { id, marca, modelo, imei, lineaNumero, responsable, area, estado }

Listados con CRUD, filtros por área/estado, importación opcional (modal CSV) si entra en el diseño.

────────────────────────────────────────
10) INFRAESTRUCTURA
────────────────────────────────────────

### Dashboard `/infraestructura`
KPIs: NVR, Cámaras, Routers, Switches, Access Points, Máq. Tesorería, Servidores, Teléfonos IP
Barras: cámaras por NVR, distribución por ubicación/estado
Preview directorio teléfonos

### NVR
{ id, nombre, direccionIp, puerto, descripcion, usuario, password, cantidadCamaras, camaras[] }
Listado + detalle con cámaras asociadas.

### Cámaras
{ id, nombre, marca, descripcion, responsable, ubicacion, direccionIp, puerto, tipo, estado, fechaAlta, nvrId, usuario, password, historialEstados }
Ubicación puede ser texto libre (hay muchas ubicaciones físicas: Guardia, Planta 1–6, Tesorería, etc.)

### Routers
{ id, nombre, marca, modelo, ip, numeroSerie, firmware, sitio, ipPublica, estadoOmada, version, macUplink, salto, grupoWlan, cantidadPuertosWan, cantidadPuertosLan, gateway, ubicacion, estado, fechaAlta }

### Switches / Access Points
Campos similares de red (nombre, IP, ubicación, estado, marca/modelo). Vista combinada “Routers & Switches”.

Ubicaciones de red (enum):
RACK_PRINCIPAL, RACK_SECUNDARIO, ADMINISTRACION, MONITOREO, SISTEMAS, GUARDIA

### Servidores
{ id, nombre, hostname, ip, sistemaOperativo, ubicacion, descripcion, estado }

### Máquinas Tesorería
{ id, tipo, modelo, nroSerie, vida, estado, historialEstados }

### Teléfonos IP (Internos)
{ id, numeroInterno, asignadoA, direccionIp, macAddress, marcaModelo, estado, historialEstados }
Directorio searchable, aspecto de agenda corporativa.

────────────────────────────────────────
11) REPORTES (`/reportes`)
────────────────────────────────────────

Página analítica con:
- KPIs agregados del inventario completo
- Pie/bar charts: PCs por estado, por ubicación, periféricos por tipo, stock, cámaras, etc.
- Botón “Exportar PDF”
- Botón refrescar

────────────────────────────────────────
12) ADMINISTRACIÓN
────────────────────────────────────────

### Mi Perfil
Nombre, email, rol, teléfono, departamento — editable en local.

### Usuarios (ADMIN)
Tabla de usuarios con rol (VISUALIZADOR / USUARIO / ADMINISTRADOR), alta/edición, badges de rol.

### Sistema (ADMIN)
Panel técnico: listado de agentes/PCs con filtros de conexión, envío simulado de comandos al agente (RESETEAR_ID, etc.), estado de sync. Look “terminal/ops” pero limpio.

────────────────────────────────────────
13) COMPONENTES UI REUTILIZABLES
────────────────────────────────────────

Creá un pequeño design system interno:
- PageShell (título, subtítulo, actions)
- MetricCard (clickable opcional)
- FilterBar + TableFilters
- DataTable (header sticky, hover row, empty state)
- StatusBadge / SyncDot
- Modal / Drawer
- ConfirmDialog
- EmptyState
- Loading / Error states
- PrimaryButton / SecondaryButton
- Form fields consistentes

────────────────────────────────────────
14) COMPORTAMIENTO Y CALIDAD
────────────────────────────────────────

- Todas las tablas deben tener búsqueda y al menos 1–2 filtros.
- Empty states útiles (“No hay cámaras registradas. Agregar la primera.”)
- Confirmaciones antes de borrar.
- Toasts o alerts al guardar.
- Transiciones suaves al cambiar de vista.
- Sidebar colapsable con tooltips cuando está colapsada.
- Mobile: header con menú hamburguesa + logout.
- Mock data coherente: mismas PCs referenciadas desde periféricos y stock.
- NO uses emojis en la UI.
- NO uses cards innecesarias en hero; el dashboard SÍ usa cards de métrica/contenido porque son contenedores de datos (está bien).
- Priorizá legibilidad: jerarquía tipográfica clara, whitespace controlado, alineación de columnas.

────────────────────────────────────────
15) ENTREGABLE
────────────────────────────────────────

Generá la app completa navegable con:
1. Login
2. Shell + sidebar completa
3. Dashboard principal rico
4. Computadoras listado + detalle con 3 tabs
5. Listados de cada tipo de periférico
6. Dashboard periféricos
7. Stock (tabs + CRUD + cantidad)
8. Infraestructura dashboard + NVR/Cámaras/Routers/Servidores/Tesorería/Teléfonos
9. Reportes
10. Perfil / Usuarios / Sistema

Empezá por el layout + dashboard + computadoras (son el corazón), y luego completá el resto manteniendo el mismo lenguaje visual.

Nombre del producto en UI: **IT-Bacar · Inventario**
Empresa: Bacarsa — área Sistemas / Tecnología y Comunicaciones.
```

---

## Notas para vos (no van al prompt)

- Ya existe un intento previo en `inventario/inventario-front/gestion-de-inventario-it/` generado con AI Studio; este prompt es más fiel al front real actual (`inventario-front/src`).
- Cuando AI Studio genere el resultado, la integración real con el backend Java (`localhost:8081/api/...`) se puede hacer después pegando los `api/*.js` existentes.
- Si el límite de caracteres de AI Studio es bajo, pegá primero las secciones 1–8 + 13–15, y en un segundo mensaje las secciones de infraestructura/reportes.
