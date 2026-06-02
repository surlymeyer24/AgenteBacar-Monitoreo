# Iteración 11 — Asignación manual de persona (inventario) y vista “Asig”

**Alcance:** backend (`inventario/`) + frontend (`inventario-front/`). Planificar **ambas capas** en el mismo documento (API estable + UI que la consume).

## Contexto y decisión de dominio

Hoy en Firestore / `Computadora` existe **`usuarioActual`**: lo rellena el **agente** (usuario de sesión Windows u otro dato técnico; a menudo `SYSTEM`). Eso **no** representa “a quién le corresponde la máquina en inventario”.

Se introduce un concepto aparte:

| Concepto | Origen | Uso |
|----------|--------|-----|
| **`usuarioActual`** | Agente (sync) | Diagnóstico / contexto técnico; puede cambiar en cada sync. |
| **Responsable de inventario** (nombre tentativo del campo) | Alta/edición manual por IT | Persona o referencia de negocio a la que **se asigna** la PC en el inventario; no la pisa el agente. |

**Nombre sugerido del campo en modelo:** `responsableInventario` (`String`, opcional).  
Firestore: `@PropertyName("responsable_inventario")` para mantener snake_case en documentos.

**YAGNI:** en esta iteración basta **texto libre** (nombre, legajo). Vincular a la entidad `Usuario` del sistema (Firebase/login) puede ser **iteración futura** si hace falta catálogo unificado.

---

## Objetivos

1. Persistir en el documento de la PC un campo **`responsableInventario`** independiente de `usuarioActual`.
2. Exponer API para **asignar / actualizar / limpiar** ese valor (con motivo opcional para auditoría si ya existe el patrón en otros flujos).
3. Ajustar la regla **`DERIVAR_ASIGNACION`** en `ComputadoraService` para que el estado operativo “Asignada / Sin asignar” se infiera desde **`responsableInventario`**, no desde `usuarioActual` (el agente ya no define ese criterio).
4. **Frontend:** nueva **solapa o ruta “Asig”** (asignaciones) en el área de computadoras: flujo pensado para **asignar persona** y **cambiar estado** sin mezclarlo con el listado técnico; el diseño visual fino queda abierto (wireframe o primera versión mínima).

---

### Orden de trabajo recomendado

1. Parte A (backend) hasta probar con Postman/cURL.
2. Parte B (frontend) contra esa API.
3. Parte C (verificación cruzada + regresión en listado de PCs).
4. Parte D (operación: backfill opcional, documentación breve).

---

## Parte A: Backend

### A.1 `models/Computadora.java`

Agregar:

```java
@Getter(onMethod_ = @PropertyName("responsable_inventario"))
@Setter(onMethod_ = @PropertyName("responsable_inventario"))
private String responsableInventario;
```

- No reutilizar ni renombrar `usuarioActual`; coexisten ambos.

---

### A.2 `dto/ComputadoraDTO.java`

- Agregar `private String responsableInventario;`
- En documentación/javadoc del DTO (si se usa): aclarar que `usuarioActual` es agente y `responsableInventario` es asignación IT.

---

### A.3 `mapper/ComputadoraMapper.java`

- En `toDTO()`, mapear `computadora.getResponsableInventario()` → `dto.setResponsableInventario(...)` (null-safe).

---

### A.4 `repository/ComputadoraRepository.java`

**Nuevo método (firma explícita):**

```java
/**
 * Actualiza solo el campo Firestore {@code responsable_inventario} (merge / update parcial).
 * @param responsableInventario valor normalizado; {@code null} para borrar el campo en el documento.
 */
public void updateResponsableInventario(String uuid, String responsableInventario)
        throws ExecutionException, InterruptedException
```

- Implementar con `DocumentReference.update(...)` de un mapa con la clave `responsable_inventario`, o `set` con `SetOptions.merge()` — el criterio es **no reemplazar el documento entero**.

**Nota operativa:** ver Parte D: el agente no debe pisar `responsable_inventario` al sincronizar.

---

### A.5 `dto/ResponsableInventarioDTO.java` (nuevo)

Mismo estilo que `CambiarEstadoDTO` (motivo opcional, longitud acotada):

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponsableInventarioDTO {
    /** Null o blank en request = desasignar responsable de inventario. */
    private String responsableInventario;
    /** Opcional; se reusa como motivo del {@code cambiarEstado(DERIVAR_ASIGNACION)} si se llama después del update. */
    @Size(max = 2000)
    private String motivo;
}
```

(Sin `@NotBlank` en `responsableInventario`: el cliente debe poder enviar cuerpo vacío para limpiar.)

---

### A.6 `services/ComputadoraService.java`

#### A.6.1 Nuevo método — **retorna `ComputadoraDTO`, no `void`**

```java
/**
 * Persiste {@code responsableInventario} y refresca el estado operativo vía {@code DERIVAR_ASIGNACION}
 * para que “Asignada / Sin asignar” siga al texto de inventario, no al usuario del agente.
 * @return DTO actualizado, o {@code null} si no existe PC con ese {@code uuid}.
 */
public ComputadoraDTO asignarResponsableInventario(String uuid, String responsableInventarioRaw, String motivo)
        throws ExecutionException, InterruptedException
```

**Comportamiento recomendado (orden):**

1. Si `computadoraRepository.findByUuid(uuid) == null` → return `null`.
2. `String valor = blankToNull(responsableInventarioRaw)` (reutilizar helper privado ya existente).
3. `computadoraRepository.updateResponsableInventario(uuid, valor)`.
4. `String motivoDerivacion = (motivo != null && !motivo.isBlank()) ? motivo.trim() : "Actualización responsable inventario";`
5. `return cambiarEstado(uuid, "DERIVAR_ASIGNACION", motivoDerivacion);`

Así un solo endpoint devuelve PC con **campo nuevo + estado + historial** alineados. Si preferís no registrar cada cambio en historial, el paso 5 se vuelve opcional y en su lugar se hace `return getByUuid(uuid)` solo después del paso 3 (documentar la decisión).

#### A.6.2 Método existente a modificar — `cambiarEstado`

**Firma (sin cambios):**

```java
public ComputadoraDTO cambiarEstado(String uuid, String estadoRaw, String motivo)
        throws ExecutionException, InterruptedException
```

**Cambio solo en la rama `DERIVAR_ASIGNACION`:** reemplazar

```java
estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(pc.getUsuarioActual());
```

por (tras volver a cargar la PC o usar la ya cargada **después** de cualquier update previo en la misma request):

```java
estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(pc.getResponsableInventario());
```

Opcional defensivo: si `responsableInventario` es null y el negocio lo pide, no volver a caer en `usuarioActual` — la iteración asume que **solo inventario** define asignación.

---

### A.7 `ComputadoraService.crear` y alta manual

- **YAGNI v1:** no agregar `responsableInventario` a `ComputadoraCreateDTO`; tras crear la PC, si hace falta responsable, llamar al nuevo endpoint o a `asignarResponsableInventario` en una segunda llamada.
- Tras implementar A.6.2, el `cambiarEstado(..., "DERIVAR_ASIGNACION", ...)` del `crear()` seguirá derivando el estado desde **`responsableInventario`** (inicialmente null) → “Sin asignar”, coherente con no tener aún responsable de inventario.

---

### A.8 `controller/ComputadoraController.java`

Alineado a `POST /api/computadoras/{uuid}/ubicacion` y `POST /api/computadoras/{uuid}/estado`:

**Endpoint:** `POST /api/computadoras/{uuid}/responsable-inventario`

**Método del controlador (firma explícita):**

```java
@PostMapping("/{uuid}/responsable-inventario")
public ResponseEntity<ComputadoraDTO> actualizarResponsableInventario(
        @PathVariable String uuid,
        @Valid @RequestBody ResponsableInventarioDTO body)
        throws ExecutionException, InterruptedException {
    try {
        ComputadoraDTO dto = computadoraService.asignarResponsableInventario(
                uuid,
                body != null ? body.getResponsableInventario() : null,
                body != null ? body.getMotivo() : null);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    } catch (IllegalArgumentException ex) {
        return ResponseEntity.badRequest().build();
    }
}
```

- **200:** cuerpo `ComputadoraDTO`.
- **404:** UUID inexistente.
- **400:** solo si en el futuro se valida algo más (por ahora igual que otros POST del mismo controller).

---

### A.9 Contratos resumidos (referencia rápida)

| Capa | Método | Retorno |
|------|--------|---------|
| `ComputadoraRepository` | `updateResponsableInventario(String uuid, String responsableInventario)` | `void` |
| `ComputadoraService` | `asignarResponsableInventario(String uuid, String responsableInventarioRaw, String motivo)` | `ComputadoraDTO` o `null` |
| `ComputadoraService` | `cambiarEstado(String uuid, String estadoRaw, String motivo)` | `ComputadoraDTO` o `null` (existente; cambia implementación en rama `DERIVAR_ASIGNACION`) |
| `ComputadoraController` | `actualizarResponsableInventario(...)` | `ResponseEntity<ComputadoraDTO>` |

---

## Parte B: Frontend (`inventario-front`)

**Meta:** introducir la solapa **“Asig”** (o título completo “Asignaciones”) **junto al flujo de computadoras**, sin obligar a un diseño final: primera versión puede ser tabla + formulario inline.

### B.1 API cliente

- [ ] En `src/api/computadoraApi.js` (o el módulo que ya use el listado de PCs), agregar por ejemplo:

```js
/**
 * @param {string} uuid
 * @param {{ responsableInventario?: string | null, motivo?: string }} body
 * @returns {Promise<import('./config').ComputadoraDto | null>} // ajustar tipo al patrón del archivo
 */
export async function setResponsableInventario(uuid, body) {
  // POST ${base}/api/computadoras/${encodeURIComponent(uuid)}/responsable-inventario
  // body JSON: { responsableInventario, motivo } — iguales a ResponsableInventarioDTO
}
```

- [ ] Reutilizar la función existente que llama a `POST /api/computadoras/{uuid}/estado` (mismo cuerpo que `CambiarEstadoDTO`: `estado`, `motivo`) para la columna de cambio de estado en la vista Asig.

### B.2 UX mínima (abierta a refinar)

- [ ] **Navegación:** en la zona superior del listado de computadoras (donde hoy está “Inventario”), **dos pestañas** o enlaces:
  - **Inventario** → comportamiento actual del listado (`/computadoras`).
  - **Asig** → nueva ruta, p. ej. `/computadoras/asignaciones`, que lista PCs con columnas relevantes: hostname, UUID, **responsable inventario**, estado IT, acciones.
- [ ] En **Asig**: permitir **editar responsable** (input texto o modal) y **cambiar estado** con el mismo conjunto de estados que ya usa el detalle (reutilizar constantes `estados` si existen).
- [ ] Opcional: mostrar **usuario del agente** (`usuarioActual`) como columna secundaria solo lectura, para contrastar con responsable de inventario.

### B.3 Rutas y componentes

- [ ] Ruta nueva en `App.jsx`: `/computadoras/asignaciones`.
- [ ] Componente dedicado, p. ej. `ComputadoraAsignaciones.jsx`, o layout con `<Outlet />` y tabs si preferís anidar rutas.
- [ ] No romper rutas existentes: `/computadoras`, `/computadoras/:uuid`, `/computadoras/nueva`.

### B.4 Listado principal (opcional en la misma iteración)

- [ ] En `ComputadoraList`, si cabe en scope: columna **“Asignado (IT)”** leyendo `responsableInventario` del DTO. Si el scope aprieta, dejar solo la vista Asig.

### B.5 Calidad

- [ ] `npm run build` sin errores.
- [ ] Mensajes de error coherentes con el resto del proyecto.

---

## Parte C: Verificación

### Backend

1. `./mvnw.cmd compile` y tests si hay suite activa.
2. PC existente: `POST/PATCH .../responsable-inventario` con cuerpo `{ "responsableInventario": "Juan Pérez", "motivo": "..." }` → `GET /api/computadoras/{uuid}` muestra el campo.
3. Mismo endpoint con `responsableInventario` vacío/null → campo limpio en GET.
4. `POST .../estado` con `DERIVAR_ASIGNACION` → estado derivado según **`responsableInventario`**, no según `usuarioActual` (probar PC con `usuarioActual = SYSTEM` y `responsableInventario` seteado → debe poder quedar “Asignada” por negocio).
5. Regresión: `GET /api/computadoras` sigue funcionando; listado incluye nuevo campo si el mapper lo expone.

### Frontend

6. Navegar **Inventario** vs **Asig** sin perder auth.
7. Desde **Asig**, asignar y ver reflejo tras refrescar o invalidar query.
8. Cambio de estado desde **Asig** coherente con backend.

---

## Parte D: Operación y datos

- [ ] Comunicar al equipo del **agente C#** (si aplica) que el campo `responsable_inventario` lo escribe solo el backend/API de inventario; el agente **no** debe limpiarlo al sincronizar.
- [ ] Opcional: script o admin endpoint para **backfill** masivo solo si hoy están usando `usuarioActual` como proxy de asignación (la iteración asume que **no** es equivalente; backfill sería decisión de negocio explícita).
- [ ] Actualizar `diagrama-clases.puml` o nota en README cuando el campo esté en código.

---

## Fuera de alcance (explícito)

- Unificar login Firebase con “usuario asignado” (catálogo `Usuario`).
- Notificaciones o workflows de aprobación.
- Historial específico “solo de cambios de responsable” si ya cubre `historialEstados` con motivo (valorar al implementar).
