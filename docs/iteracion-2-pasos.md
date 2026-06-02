# Iteración 2 — Ubicación, conexión del agente y cámaras

## Objetivos

1. Permitir **actualizar la ubicación manual** de una computadora vía API (POST).
2. Exponer en el DTO el **estado de conexión del agente** como **Activo** / **Desconectado** a partir del campo Firestore `estado_conexion` (p. ej. `ONLINE`), más `ultima_sincronizacion` si está presente.
3. Persistir y exponer **cámaras** en una colección Firestore dedicada: **GET** listado y por id, **POST** alta.

---

## Parte A: Backend

### 1. Modelo `Computadora`

- Campos opcionales mapeados desde el agente:
  - `estado_conexion` → `estadoConexion` (String)
  - `ultima_sincronizacion` → `ultimaSincronizacion` (String ISO, tal como llega de Firestore)

### 2. `ComputadoraDTO`

- `estadoAgente`: `"Activo"` si `estadoConexion` es `ONLINE` (sin importar mayúsculas); en caso contrario o si falta el campo, `"Desconectado"`.
- `ultimaSincronizacion`: copia del valor del documento (puede ser `null`).
- Mantener `estadoActual` para el **estado operativo manual** de IT (cuando exista en Firestore / historial), distinto del estado de conexión del agente.

### 3. `ComputadoraMapper`

- Rellenar `estadoAgente` y `ultimaSincronizacion` además de los campos ya mapeados.

### 4. POST ubicación

- `POST /api/computadoras/{uuid}/ubicacion`
- Cuerpo JSON: `{ "ubicacion": "ADMINISTRACION" }` (nombre del enum `Ubicacion`).
- Validar el enum; si el documento no existe → 404; si el valor es inválido → 400.
- Persistir en Firestore el campo `ubicacion` como string del enum.

### 5. CORS

- Permitir **POST** además de GET para `/api/**` y el origen del front (`http://localhost:5173`), más `OPTIONS` para preflight.

### 6. Configuración Firestore — cámaras

- Propiedad `firebase.collection.camaras` (p. ej. `camaras`).

### 7. Modelo `Camara`

- Campo `id` con `@DocumentId` (ID del documento en Firestore).
- Constructor por defecto que inicialice listas necesarias (p. ej. `historialEstados`).

### 8. `CamaraDTO`

- Incluir `id` para listado y detalle.

### 9. Repositorio / servicio / controlador `Camara`

- `GET /api/camaras` → lista de `CamaraDTO`.
- `GET /api/camaras/{id}` → detalle o 404.
- `POST /api/camaras` → cuerpo `CamaraCreateDTO` (nombre, marca, descripción, responsable, ubicación como nombre de `UbicacionCamara`; `fechaAlta` opcional, por defecto hoy). Respuesta **201** con el DTO creado (incluye `id`).

---

## Parte B: Frontend

### 10. API

- `src/api/camaraApi.js`: `fetchCamaras`, `fetchCamara(id)`, `createCamara(body)`.
- `src/api/computadoraApi.js`: `updateUbicacion(uuid, ubicacion)` → POST.

### 11. Computadoras

- Lista: columna de conexión **Activo / Desconectado** usando `estadoAgente` (y dejar visible el estado manual si aplica).
- Detalle: mostrar conexión del agente, última sincronización y formulario (select + guardar) para **cambiar ubicación**.

### 12. Cámaras

- Ruta `/camaras`: tabla con las cámaras.
- Ruta `/camaras/nueva`: formulario POST y redirección al listado o detalle.
- Enlace en la navegación lateral.

### 13. Prueba integrada

1. Backend en `localhost:8080`, front en `localhost:5173`.
2. Ver lista de PCs con **Activo/Desconectado** coherente con `estado_conexion` en Firestore.
3. Cambiar ubicación desde el detalle y comprobar el documento en Firestore.
4. Crear una cámara y verla en `GET /api/camaras`.

---

## Notas

- La colección `camaras` debe existir o crearse al dar de alta el primer documento; las reglas de seguridad de Firestore deben permitir las operaciones que use el backend (service account).
