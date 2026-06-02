# Iteración 10 — Soporte multi-NVR en cámaras

**Alcance:** backend (`inventario/`) + frontend (`inventario-front/`). Las iteraciones de este repo deben **planificar siempre ambas capas** en el mismo documento (API estable + UI que la consume), salvo excepción explícita y temporal.

## Objetivos

1. Crear la entidad **`Nvr`** (NVR = Network Video Recorder) como maestro simple con IP, nombre y descripción.
2. Vincular cada cámara a su NVR mediante un campo `nvrId`.
3. Exponer endpoints para **CRUD de NVRs** y para **filtrar cámaras por NVR**.
4. Proveer endpoint de migración (`POST /api/camaras/{id}/nvr`) para asignar NVR a cámaras existentes.
5. **Frontend:** listado, detalle y alta de NVR; integración en pantallas de cámara (selector, filtro, asignación).

> **Contexto:** La empresa tiene 6 NVRs (192.168.0.35, .85, .102, .234, .237, .238). Las cámaras existentes en Firestore pertenecen a NVR 192.168.0.102 ("Monitoreo Nueva") pero no tienen ese dato almacenado. NVR es una entidad maestra sin estado ni historial (YAGNI).

### Orden de trabajo recomendado

1. Parte A (backend) hasta endpoints probables con Postman o equivalente.
2. Parte B (frontend) contra esa API.
3. Parte C (verificación cruzada back + front).
4. Parte D (operación / datos) cuando el vínculo cámara–NVR ya esté en código desplegable.

---

## NVRs de producción (para carga inicial)

| IP              | Nombre sugerido ID doc       | Nombre legible                  |
|-----------------|------------------------------|---------------------------------|
| 192.168.0.35    | nvr-tesoreria-arriba         | NVR Tesoreria-arriba            |
| 192.168.0.85    | nvr-monitoreo-vieja          | NVR Monitoreo vieja             |
| 192.168.0.234   | nvr-tesoreria-backup-boxes   | NVR Tesoreria backup boxes      |
| 192.168.0.102   | nvr-monitoreo-nueva          | NVR Monitoreo Nueva             |
| 192.168.0.237   | nvr-tesoreria-ambientales    | NVR Tesoreria Ambientales adm   |
| 192.168.0.238   | nvr-tesoreria-boxes-abajo    | NVR Tesoreria Boxes Abajo       |

---

## Parte A: Backend

### 1. `application.properties`

Agregar:
```properties
firebase.collection.nvrs=nvrs
```

---

### 2. `models/Nvr.java` (nuevo)

```java
@DocumentId String id
String nombre
String direccionIp
Integer puerto        // opcional; puerto de gestión HTTP/ONVIF de la NVR
String descripcion    // opcional; texto libre
```

- Sin `@PropertyName` (los nombres ya son camelCase compatibles con Firestore).
- Sin `estadoActual` ni `historialEstados`.
- Constructor vacío explícito (Firestore lo requiere).

---

### 3. `dto/NvrDTO.java` (nuevo)

Campos: `id`, `nombre`, `direccionIp`, `puerto`, `descripcion`.

Lombok: `@Data @NoArgsConstructor @AllArgsConstructor`.

---

### 4. `dto/NvrCreateDTO.java` (nuevo)

Campos: `dispositivo` (ID del doc Firestore), `nombre`, `direccionIp`, `puerto`, `descripcion`.

- `dispositivo` y `nombre` son obligatorios (validar en service).
- Mismo patrón que `CamaraCreateDTO`.

---

### 5. `mapper/NvrMapper.java` (nuevo)

```java
public static NvrDTO toDTO(Nvr nvr)  // null-safe
```

Mapper manual, constructor privado. Sin lógica adicional.

---

### 6. `repository/NvrRepository.java` (nuevo)

Constructor inyecta `Firestore` + `@Value("${firebase.collection.nvrs}") String collectionName`.

Métodos:
- `List<Nvr> findAll()`
- `Nvr findById(String id)`
- `void guardarConId(String id, Nvr nvr)` — usa `ref.set(nvr).get()`

---

### 7. `services/NvrService.java` (nuevo)

Constructor inyecta `NvrRepository`.

Métodos:
- `List<NvrDTO> listarTodas()`
- `NvrDTO obtenerPorId(String id)`
- `NvrDTO crear(NvrCreateDTO dto)` — sanitiza ID con `FirestoreDocumentId.sanitizar()`, valida `nombre` y `dispositivo`.

---

### 8. `controller/NvrController.java` (nuevo)

`@RequestMapping("/api/nvrs")`

Endpoints:
```
GET  /api/nvrs              → listar todas las NVRs
GET  /api/nvrs/{id}         → obtener NVR por ID (404 si no existe)
POST /api/nvrs              → crear NVR
GET  /api/nvrs/{id}/camaras → listar cámaras de esa NVR
```

El endpoint `/camaras` delega en `CamaraService.listarCamaras(null, nvrId)`.

---

### 9. `models/Camara.java` — modificar

Agregar campo:
```java
private String nvrId;
```

Sin `@PropertyName` (campo camelCase simple).

---

### 10. `dto/CamaraDTO.java` — modificar

Agregar campo `String nvrId`.

---

### 11. `dto/CamaraCreateDTO.java` — modificar

Agregar campo `String nvrId` (opcional al crear).

---

### 12. `mapper/CamaraMapper.java` — modificar

En `toDTO()`, agregar:
```java
dto.setNvrId(camara.getNvrId());
```

---

### 13. `repository/CamaraRepository.java` — modificar

Agregar método:
```java
public List<Camara> findByNvrId(String nvrId)
    // .whereEqualTo("nvrId", nvrId)
```

Agregar método:
```java
public void updateNvrId(String id, String nvrId)
    // ref.update("nvrId", nvrId)
```

---

### 14. `services/CamaraService.java` — modificar

- `listarCamaras(String ubicacion)` → `listarCamaras(String ubicacion, String nvrId)`:
  - Si solo `nvrId` presente: `findByNvrId`.
  - Si solo `ubicacion` presente: `findByUbicacion`.
  - Si ambos presentes: filtrar en memoria (o aplicar `nvrId` primero, luego stream).
  - Si ninguno: `findAll`.
- Agregar método `asignarNvr(String id, String nvrId)`:
  - Verificar que la cámara existe.
  - Llamar `camaraRepository.updateNvrId(id, nvrId)`.
  - Retornar `CamaraDTO` actualizado.

---

### 15. `controller/CamaraController.java` — modificar

- `GET /api/camaras`: agregar `@RequestParam(required = false) String nvrId`; pasar a `listarCamaras`.
- Agregar endpoint:
  ```
  POST /api/camaras/{id}/nvr   body: { "nvrId": "nvr-monitoreo-nueva" }
  ```
  Body: nuevo `NvrAsignacionDTO` con campo `nvrId` (o reusar un DTO genérico de string).

---

### 16. `dto/NvrAsignacionDTO.java` (nuevo, pequeño)

```java
@Data @NoArgsConstructor @AllArgsConstructor
public class NvrAsignacionDTO {
    private String nvrId;
}
```

---

## Parte B: Frontend (`inventario-front`)

**Meta:** misma experiencia mínima que routers/switches: listado, detalle, alta; navegación desde el menú; uso de los endpoints de la Parte A en cámaras.

### B.1 API cliente

- [ ] Crear `src/api/nvrApi.js` con:
  - listado → `GET /api/nvrs`
  - detalle → `GET /api/nvrs/:id` (404 como `null` o error manejado, según `routerApi.js`)
  - alta → `POST /api/nvrs` con cuerpo alineado a `NvrCreateDTO` (`dispositivo`, `nombre`, `direccionIp`, `puerto`, `descripcion`)
  - opcional: cámaras por NVR → `GET /api/nvrs/:id/camaras`
- [ ] Extender el cliente de cámaras para:
  - `GET /api/camaras` con query opcional `nvrId` (y convivencia con `ubicacion` si ya existe)
  - `POST /api/camaras/:id/nvr` con `{ "nvrId": "..." }`

### B.2 Páginas

- [ ] **`NvrList.jsx`** — tabla o cards: IP, nombre, id; acciones: detalle, “Nueva NVR”.
- [ ] **`NvrDetail.jsx`** — todos los campos del DTO; sección **“Cámaras en esta NVR”** vía `GET /api/nvrs/:id/camaras` con enlaces al detalle de cámara.
- [ ] **`NvrNueva.jsx`** o modal en lista — `dispositivo` y `nombre` obligatorios en cliente.

### B.3 Rutas y navegación

- [ ] Rutas en `App.jsx` (p. ej. `/nvrs`, `/nvrs/:id`, `/nvrs/nueva`).
- [ ] Entrada en `topicos.js` (Red / infra / videovigilancia).
- [ ] Icono en `navIcons.js`.

### B.4 Cámaras en UI

- [ ] **`CamaraDetail.jsx`** (o formulario de edición): selector NVR (dropdown con `GET /api/nvrs`), guardando con `POST .../nvr` o flujo de actualización ya definido.
- [ ] **Listado de cámaras:** columna o badge con `nvrId`; filtro opcional por NVR (`?nvrId=`).

### B.5 Calidad

- [ ] `npm run build` sin errores.
- [ ] Mensajes de error de red coherentes con el resto del proyecto.

---

## Parte C: Verificación (backend + frontend)

### API / backend

1. `./mvnw.cmd compile` — sin errores de compilación.
2. `./mvnw.cmd spring-boot:run` — arranca sin errores.
3. Crear las 6 NVRs con `POST /api/nvrs`.
4. `GET /api/nvrs` → devuelve las 6 NVRs.
5. `POST /api/camaras/{id}/nvr` con `{ "nvrId": "nvr-monitoreo-nueva" }` para cada cámara existente (o muestra representativa).
6. `GET /api/camaras?nvrId=nvr-monitoreo-nueva` → solo las cámaras migradas.
7. `GET /api/nvrs/nvr-monitoreo-nueva/camaras` → mismo resultado que (6).
8. `GET /api/camaras` sin params → todas (regresión).
9. `GET /api/camaras?ubicacion=Monitoreo` → sigue funcionando (regresión).

### UI

10. Menú → listado NVR → alta → detalle con lista de cámaras enlazadas.
11. Detalle/listado de cámara muestra y permite cambiar NVR; filtro por NVR en lista si está implementado.

---

## Parte D: Operación y datos (tras cerrar Partes A–C)

- [ ] Cargar en Firestore las 6 NVR (API o script) con los IDs acordados de la tabla superior.
- [ ] Asignación masiva de `nvrId` para cámaras de “Monitoreo Nueva” (`nvr-monitoreo-nueva`) según criterio de operaciones; script en `inventario/scripts/` si el volumen lo merece.
- [ ] Documentar en README (back y/o front) endpoints NVR, rutas UI y proceso de asignación.
- [ ] Decidir YAGNI: si no hay `DELETE` de NVR, omitir limpieza en cascada de `nvrId` en cámaras.
