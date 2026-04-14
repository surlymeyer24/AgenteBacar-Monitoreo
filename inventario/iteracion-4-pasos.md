# Iteración 4 — Estados y ciclo de vida

## Objetivos

1. Definir un enum **`EstadoOperativo`** con los estados ACTIVO, EN_REPARACION, BAJA, compartido por computadoras y cámaras.
2. Exponer endpoints para **cambiar estado** (con motivo obligatorio) y **consultar historial** de cambios.
3. Corregir la inconsistencia de `Camara.getEstadoActual()` que no consulta `historialEstados`.
4. Agregar **UI** para cambiar estado y ver historial en el detalle de ambas entidades, incluyendo una **nueva página CamaraDetail**.

> **Ya existe:** `Estado.java` (POJO para deserialización Firestore), `CambioEstado.java` (con `esEstadoActual()` y `getDuracion()`), campos `estadoActual` y `historialEstados` en `Computadora` y `Camara`. Lo que falta es la validación por enum, los endpoints, el mapeo del historial a DTO, y la UI.

---

## Parte A: Backend

### 1. Enum `EstadoOperativo` (nuevo en `models/`)

- Valores: `ACTIVO("Activo", "Equipo operativo")`, `EN_REPARACION("En reparación", "Equipo en proceso de reparación")`, `BAJA("Baja", "Equipo dado de baja")`.
- Campos: `nombre` (label amigable), `descripcion`.
- No eliminar `Estado.java` — Firestore lo necesita para deserializar documentos existentes.

### 2. Fix `Camara.getEstadoActual()`

- Replicar la lógica de `Computadora.getEstadoActual()`: iterar `historialEstados`, buscar `esEstadoActual() == true`, fallback a `estadoActual`.

### 3. DTO `CambiarEstadoDTO` (nuevo en `dto/`)

- Campos: `estado` (`@NotBlank`), `motivo` (`@NotBlank`).
- Mismo patrón que `UbicacionUpdateDTO`.

### 4. DTO `CambioEstadoDTO` (nuevo en `dto/`)

- Campos: `estado` (String), `motivo` (String), `fechaHoraInicio` (String ISO-8601), `fechaHoraFin` (String ISO-8601 o null), `activo` (boolean).

### 5. `CambioEstadoMapper` (nuevo en `mapper/`)

- `static CambioEstadoDTO toDTO(CambioEstado)` — convierte fechas a ISO-8601.
- `static List<CambioEstadoDTO> toDTOList(List<CambioEstado>)` — null-safe.

### 6. Actualizar `ComputadoraDTO`

- Agregar: `List<CambioEstadoDTO> historialEstados`.
- Se incluye solo en detalle (`toDTO`), no en listado (`toListDTO`).

### 7. Actualizar `CamaraDTO`

- Agregar: `List<CambioEstadoDTO> historialEstados`.

### 8. Actualizar mappers

- `ComputadoraMapper.mapear()`: si es detalle, mapear historial con `CambioEstadoMapper.toDTOList()`.
- `CamaraMapper.toDTO()`: mapear historial con `CambioEstadoMapper.toDTOList()`.

### 9. `ComputadoraRepository.cambiarEstado()`

- **Transacción Firestore** (read-modify-write):
  1. Leer documento dentro de la transacción.
  2. Obtener array `historialEstados`.
  3. Cerrar el estado vigente (setear `fechaHoraFin` al actual).
  4. Agregar nueva entrada con `fechaHoraFin: null`.
  5. Escribir array completo + actualizar campo top-level `estadoActual`.
- Necesario porque Firestore no soporta `arrayUnion` con lógica condicional.

### 10. `CamaraRepository.cambiarEstado()`

- Misma lógica que paso 9, sobre colección `camaras`.

### 11. `ComputadoraService.cambiarEstado()`

- Validar `estadoRaw` contra `EstadoOperativo.valueOf()`; si falla → `IllegalArgumentException`.
- Verificar que el documento existe; si no → null.
- Construir `Estado` desde el enum, llamar repo, devolver DTO actualizado.

### 12. `CamaraService.cambiarEstado()`

- Misma lógica que paso 11.

### 13. Endpoints

- `POST /api/computadoras/{uuid}/estado` — body `@Valid CambiarEstadoDTO`, patrón idéntico al de ubicación.
- `GET /api/computadoras/{uuid}/historial` — retorna `List<CambioEstadoDTO>`, 404 si no existe.
- `POST /api/camaras/{id}/estado` — mismo patrón.
- `GET /api/camaras/{id}/historial` — mismo patrón.

---

## Parte B: Frontend

### 14. Constantes

- `src/constants/estados.js`: array de estados y mapa de labels amigables.

### 15. API

- `computadoraApi.js`: `updateEstado(uuid, estado, motivo)`, `fetchHistorial(uuid)`.
- `camaraApi.js`: `updateEstadoCamara(id, estado, motivo)`, `fetchHistorialCamara(id)`.

### 16. ComputadoraDetail — formulario de estado

- Debajo del formulario de ubicación: select de estados + textarea de motivo + botón "Cambiar estado".
- Botón deshabilitado si no hay selección o motivo vacío.
- On submit: llamar `updateEstado`, refrescar datos.

### 17. ComputadoraDetail — sección historial

- Tabla: Estado, Motivo, Inicio, Fin, Activo.
- Usa `c.historialEstados` del DTO de detalle (sin llamada extra).
- Si lista vacía: "Sin cambios de estado registrados".

### 18. CamaraDetail.jsx (nueva página)

- Datos generales + formulario de estado + historial (mismo patrón que ComputadoraDetail).
- Usa `fetchCamara(id)` + `updateEstadoCamara`.

### 19. Rutas y navegación

- `App.jsx`: ruta `/camaras/:id` → `CamaraDetail`.
- `CamaraList.jsx`: filas linkeables al detalle.

### 20. Estilos

- Reutilizar clases de tablas y formularios existentes.

---

## Prueba integrada

1. Backend + front corriendo. Abrir detalle de una PC, cambiar estado a EN_REPARACION con motivo "Pantalla rota".
2. Verificar que `estadoActual` se actualiza en la UI y en Firestore.
3. Cambiar a ACTIVO con motivo "Pantalla reemplazada". Verificar historial con 2 entradas, la primera con `fechaHoraFin` seteada.
4. Repetir con una cámara desde el nuevo CamaraDetail.
5. Verificar que listados reflejan el estado actualizado.
6. PC/cámara sin historial previo: cambio funciona, historial muestra 1 entrada.

---

## Notas

- La transacción Firestore es necesaria porque no se puede hacer update condicional dentro de un array. La concurrencia es baja (solo IT), así que es suficiente.
- Se mantiene `estadoActual` top-level sincronizado para que las queries de listado no necesiten parsear el array.
- `Estado.java` se mantiene sin cambios para no romper la deserialización de Firestore. `EstadoOperativo` enum es la fuente de verdad para validación.
