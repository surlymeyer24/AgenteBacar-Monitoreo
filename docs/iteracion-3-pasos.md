# Iteración 3 — Periféricos del agente (lectura y visualización)

## Objetivos

1. Exponer los **periféricos del snapshot del agente** (impresoras, USB, monitores, audio) en el DTO de detalle de computadora vía API REST.
2. Mostrar esa información en el **detalle de la PC** en el frontend React.

> **Ya implementado:** modelos Firestore (`PerifericosFirestore`, `ImpresoraFirestore`, `MonitorFirestore`, `DispositivoUsbFirestore`, `AudioFirestore`, `DispositivoAudioFirestore`), campo `perifericos` en `Computadora` con `@PropertyName`, y deserialización automática vía `toObject`. Esta iteración completa la capa DTO + mapper + frontend.

---

## Parte A: Backend

### 1. DTOs nuevos en `dto/`

Usar sufijo **Agente** para distinguirlos del `PerifericoDTO` existente (modelo de negocio/inventario IT), consistente con los modelos (`PerifericosFirestore`, etc.). Todos con `@Data @NoArgsConstructor @AllArgsConstructor`.

- `**PerifericosAgenteDTO`**: `List<ImpresoraAgenteDTO> impresoras`, `List<DispositivoUsbAgenteDTO> dispositivosUsb`, `List<MonitorAgenteDTO> monitores`, `AudioAgenteDTO audio`.
- `**ImpresoraAgenteDTO**`: `nombre`, `driver`, `puerto`, `tipo`, `tipoImpresora`, `estado` (String), `compartida` (Boolean), `predeterminada` (Boolean).
- `**DispositivoUsbAgenteDTO**`: `nombre`, `fabricante`, `categoria`, `clase`, `conexion`.
- `**MonitorAgenteDTO**`: `nombre`, `resolucion`, `pulgadas` (Double), `anchoCm` (Double), `altoCm` (Double).
- `**AudioAgenteDTO**`: `List<DispositivoAudioAgenteDTO> entrada`, `List<DispositivoAudioAgenteDTO> salida`.
- `**DispositivoAudioAgenteDTO**`: `nombre`, `fabricante`, `estado` (String).

### 2. `PerifericosAgenteMapper` en `mapper/`

- Método estático `toDTO(PerifericosFirestore)` → `PerifericosAgenteDTO`.
- Si la entrada es `null`, retornar `null`.
- Mapear cada sublista elemento a elemento; si una lista fuente es `null`, usar lista vacía en el DTO.
- Monitores: sanitizar `nombre` con `replace("\0", "").trim()`.

### 3. Agregar campo en `ComputadoraDTO`

- Nuevo campo: `PerifericosAgenteDTO perifericos`.

### 4. Conectar en `ComputadoraMapper.toDTO()`

- Agregar: `dto.setPerifericos(PerifericosAgenteMapper.toDTO(computadora.getPerifericos()))`.

### 5. Periféricos solo en detalle, no en listado

- `GET /api/computadoras` (listado): **no** incluir periféricos para mantener el payload liviano.
- `GET /api/computadoras/{uuid}` (detalle): incluir el campo `perifericos` completo.
- Si el listado y el detalle usan el mismo `toDTO`, agregar un método `toListDTO` o setear `perifericos` a `null` en el servicio para el listado.

### 6. Solo lectura

- Esta iteración **no** agrega endpoints de escritura para periféricos. El agente C# sigue siendo el único escritor.

---

## Parte B: Frontend

### 7. Detalle de computadora

- Después de la sección RAM, agregar cuatro secciones/cards para periféricos, guardadas por `c.perifericos != null`.
- **Impresoras**: tabla con columnas Nombre, Driver, Puerto, Tipo, Estado, Compartida, Predeterminada.
- **Dispositivos USB**: tabla con columnas Nombre, Fabricante, Categoría, Clase, Conexión.
- **Monitores**: tabla con columnas Nombre, Resolución, Pulgadas, Ancho cm, Alto cm.
- **Audio**: dos subtítulos "Entrada" y "Salida", cada uno con tabla Nombre, Fabricante, Estado.

### 8. Null safety

- Usar `c.perifericos?.impresoras ?? []` antes de `.map()` en cada lista.
- Si `c.perifericos` es `null` o `undefined`: no mostrar las secciones, o mostrar "Sin datos de periféricos".
- `key` en `.map()`: usar índice (mismo patrón que discos y RAM).

### 9. Estilos

- Reutilizar clases de tablas del detalle actual (discos/RAM) para coherencia visual.

---

## Prueba integrada

1. Backend en `localhost:8080`, front en `localhost:5173`.
2. `GET /api/computadoras/{uuid}` de una PC **con** periféricos completos: verificar que `perifericos` aparece con las 4 ramas pobladas.
3. `GET /api/computadoras/{uuid}` de una PC **sin** campo `perifericos` en Firestore: verificar que llega como `null`, sin error 500.
4. `GET /api/computadoras` (listado): verificar que `perifericos` **no** aparece o es `null`.
5. Frontend detalle: tablas de impresoras, USB, monitores y audio con datos coherentes con el documento Firestore.
6. Frontend detalle de PC sin periféricos: sin errores en consola, secciones ausentes u ocultas.
7. Verificar que "Estado" en tablas de impresora/audio **no** se confunde visualmente con "Estado (IT)" del encabezado.

---

## Notas

- Los campos `estado` de impresoras y dispositivos de audio son reportados por Windows; **no** representan el estado operativo gestionado por IT (`estadoActual` / `CambioEstado`).
- **No** reutilizar `PerifericoDTO` ni `PerifericoMapper` existentes — esos son del modelo de negocio/inventario manual, no del snapshot del agente.