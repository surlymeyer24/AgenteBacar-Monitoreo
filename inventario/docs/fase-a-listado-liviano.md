# Fase A — Listado liviano de computadoras

> Plan de implementación para optimizar `GET /api/computadoras` y `/recientes` sin Cloud Functions, sin colección índice nueva, y sin cambiar el agente C#.

**Contexto:** Hoy el listado hace `findAll()` del documento gordo de cada PC, `toObject(Computadora.class)` y `ComputadoraMapper.toListDTO()`. Eso omite periféricos en el JSON, pero Firestore igual transfiere RAM, discos, USB, historial, etc. La Fase A separa **lectura de listado** vs **lectura de detalle** y parte las caches.

**No objetivo de Fase A:** reducir la cantidad de lecturas facturadas en Firestore (sigue siendo 1 read/doc). El ahorro es bandwidth, RAM, CPU de deserialización y tamaño del JSON.

---

## PRs — cómo empezar a desarrollar

Cinco PRs en orden. **No mergear PR 4/5 antes de ejecutar la migración de PR 2 en el entorno target.**

```text
PR-1 ──► PR-2 ──► [deploy + migración en staging/prod] ──► PR-3 ──► PR-4 ──► PR-5
         PR-3 puede desarrollarse en paralelo con PR-1/2, pero merge después de migración
```

### PR-1 — `ubicacion_stock` en raíz al cambiar estado + fix deserialización historial

**Rama sugerida:** `feat/fase-a-ubicacion-stock-raiz`

**Alcance:**

- [ ] **Fix previo (mismo PR):** en `CambioEstado.java`, agregar `@PropertyName` para que `toObject()` lea lo que el repo escribe en el historial:
  ```java
  @Getter(onMethod_ = @PropertyName("ubicacion_stock"))
  @Setter(onMethod_ = @PropertyName("ubicacion_stock"))
  private String ubicacionStock;

  @Getter(onMethod_ = @PropertyName("responsable_inventario"))
  @Setter(onMethod_ = @PropertyName("responsable_inventario"))
  private String responsableInventario;
  ```
  **Ver §5.0** — hoy el repo escribe snake_case en el map del historial pero el modelo esperaba camelCase; la ficha/API devolvía `ubicacionStock` null en entradas de historial aunque el dato exista en Firestore.
- [ ] Test: snapshot mock con `historialEstados[].ubicacion_stock` → `CambioEstadoMapper` devuelve `ubicacionStock` poblado.
- [ ] `ComputadoraRepository.cambiarEstado`: escribir/borrar `ubicacion_stock` en **raíz** del doc (misma transacción que historial).
- [ ] Tests: estado Sin Asignar con stock → raíz poblada; Asignada → raíz borrada.
- [ ] Sin cambios de contrato HTTP todavía.

**Archivos:** `CambioEstado.java`, `ComputadoraRepository.java`, tests.

**Deploy:** puede ir solo a prod/staging antes del resto (preparación de datos).

---

### PR-2 — Migración one-shot `ubicacion_stock`

**Rama sugerida:** `feat/fase-a-migracion-ubicacion-stock`

**Depende de:** PR-1 mergeado.

**Alcance:**

- [ ] `MigracionUbicacionStockService` + `POST /api/admin/migracion/ubicacion-stock`.
- [ ] Flag `app.migration.ubicacion-stock.enabled=true` (mismo patrón que `AdminMigracionController`).
- [ ] **Leer historial como `Map<String, Object>` crudo**, no confiar en `toObject(CambioEstado)`:
  ```java
  Object raw = entrada.get("ubicacion_stock");
  if (raw == null) raw = entrada.get("ubicacionStock"); // por si hubo escrituras camelCase
  ```
- [ ] Entrada vigente: `fechaHoraFin == null`; estado desde `((Map) entrada.get("estado")).get("nombre")`.
- [ ] Respuesta `{ procesados, actualizados, limpiados, errores[] }`.
- [ ] Tests unitarios del algoritmo con maps snake_case (como escribe el repo hoy).

**Archivos:** `MigracionUbicacionStockService.java`, `AdminMigracionController.java`, `application*.yaml` (flag), tests.

**Post-merge (manual, obligatorio):**

```bash
# Tras deploy con flag enabled
curl -X POST .../api/admin/migracion/ubicacion-stock
# Verificar en Firestore: docs Sin Asignar tienen ubicacion_stock en raíz
```

---

### PR-3 — Listado liviano (select + DTO + service + controller)

**Rama sugerida:** `feat/fase-a-listado-liviano`

**Depende de:** PR-1 mergeado. **Merge a main después de migración PR-2 ejecutada** en el entorno que recibirá front.

**Alcance:**

- [ ] `ComputadoraListadoDTO`, `ComputadoraListadoFields`, `ComputadoraListadoMapper`.
- [ ] `findAllListado()`, `findByUbicacionListado()` con `Query.select(...)`.
- [ ] `ComputadoraService`: `getAll`, `listar`, `getRecientes` → listado.
- [ ] `BusquedaService`: PCs → `findAllListado()`.
- [ ] `ComputadoraController`: `GET /`, `/recientes` → `List<ComputadoraListadoDTO>`.
- [ ] POST create/update que alimentan listado: devolver `ComputadoraListadoDTO` o mapear en service (auditar create, ubicacion, estado, responsable).
- [ ] `findAll()` gordo **sin cambios de comportamiento** (dashboard/periféricos).
- [ ] Tests: mapper, integración listado sin `perifericos`/`discos`.

**Archivos:** ver §6.1–6.2 (excepto cache y migración).

**Breaking change API:** JSON de listado más chico (menos campos). Front debe ir en PR-4.

---

### PR-4 — Caches partidas + invalidación

**Rama sugerida:** `feat/fase-a-cache-partida`

**Depende de:** PR-3 (mismo branch o PR encadenado justo después).

**Alcance:**

- [ ] `CacheConfig`: `pc-listado`, `pc-detalle`, `pc-programas`, `computadoras-gordo`.
- [ ] TTL según §8.1.
- [ ] Reemplazar `@Cacheable("computadoras")` en listado por `pc-listado`; detalle por `pc-detalle`; `findAll()` → `computadoras-gordo`.
- [ ] `@CacheEvict` según matriz §8.2 (periféricos embebidos **no** invalidan `pc-listado`).
- [ ] Opcional: `ComputadoraCacheEviction` helper + `DELETE /api/cache/pc-listado`.
- [ ] Test o documentación de invalidación cruzada.

**Archivos:** `CacheConfig.java`, `ComputadoraRepository.java`, `CacheController.java` (opcional).

---

### PR-5 — Frontend

**Rama sugerida:** `feat/fase-a-front-listado`

**Depende de:** PR-3 + PR-4 deployados; **migración PR-2 ya corrida**.

**Alcance:**

- [ ] `PerifericoManualList.jsx`: solo `pc.ubicacionStock` (eliminar `getUbicacionStock` / historial).
- [ ] `ComputadorasListLayout.jsx`: `pickListadoFields()` en `mergeEnListado`.
- [ ] `Dashboard.jsx`: `procesadorNombre` en recientes.
- [ ] Smoke: inventario, asignaciones, stock periféricos, ficha detalle.

**Archivos:** ver §9.1.

**No incluir en este PR:** `useComputadorasHW` (A.2 opcional, PR aparte).

---

### PR opcional A.2 — `System.jsx` sin onSnapshot gordo

**Rama sugerida:** `feat/fase-a-system-api`

**Independiente.** Reemplazar `useComputadorasHW` por `fetchComputadoras` o endpoint mínimo agente.

---

### Resumen rápido para Claude

| PR | Qué hace | ¿Merge solo? |
|---|---|---|
| 1 | Escribe `ubicacion_stock` en raíz | Sí |
| 2 | Endpoint migración + correr en BD | Sí, luego migrar |
| 3 | Core listado liviano | Tras migración |
| 4 | Caches | Con o justo después de 3 |
| 5 | Front | Tras 3+4 deploy |
| A.2 | System sin Firestore directo | Cuando quieras |

**Estimación:** PR-1 ~ medio día; PR-2 ~ medio día; PR-3 ~ 1 día; PR-4 ~ medio día; PR-5 ~ medio día.

---

## 1. Principio de diseño

| Uso | Fuente | Mapper |
|---|---|---|
| Tabla inventario, asignaciones, recientes, búsqueda PCs | `Query.select(...)` sobre `computadoras` | `ComputadoraListadoDTO` |
| Ficha `/computadoras/{uuid}` | Documento completo + subcolección `programas` | `ComputadoraDTO` (sin cambios) |
| Dashboard stats, listados agente (teclados/mouse/impresoras) | `findAll()` gordo (como hoy) | Entidad + mappers actuales |

---

## 2. Periféricos manuales vs embebidos (importante para caché)

**Stock manual** (`perifericos_manuales`, asignación desde `/perifericos/stock`):

- Documento **separado** con campo `computadoraHostname`.
- Asignar **no** modifica `computadoras/{uuid}`.
- **No** invalidar `pc-listado` al asignar/desasignar periférico manual.

**Periféricos embebidos** (`computadoras/{uuid}.perifericos.*`):

- Escritos por el agente C# o por IT vía `POST /api/computadoras/{uuid}/perifericos/...`.
- **No** están en campos del listado → **no** invalidar `pc-listado` al agregar impresora/USB/monitor.
- **Sí** invalidar `pc-detalle::{uuid}` y `computadoras-gordo`.

**Sync del agente:** actualiza `ultima_sincronizacion`, `estado_conexion`, a veces `usuarios` → **sí** afecta listado. Refresh vía TTL de `pc-listado` (~60s) o `DELETE /api/cache`.

---

## 3. Contrato API — `ComputadoraListadoDTO`

Nuevo DTO (no reutilizar `ComputadoraDTO` con arrays vacíos).

```json
{
  "uuid": "...",
  "hostname": "PC-FOO",
  "tipoEquipo": "PC",
  "usuarioActual": "jperez",
  "ubicacion": "ADMINISTRACION",
  "sistemaOperativo": "Windows 11",
  "arquitectura": "x64",
  "estadoActual": "Asignada",
  "estadoConexion": "ONLINE",
  "estadoAgente": "Activo",
  "ultimaSincronizacion": "2026-09-01T12:00:00Z",
  "procesadorNombre": "Intel Core i5-...",
  "responsableInventario": "...",
  "anydeskId": "123456789",
  "ubicacionStock": "Estante A3"
}
```

**Sin:** `discos`, `modulos`, `perifericos`, `historialEstados`, `programas`, `windowsVersionDetallada`.

Endpoints que pasan a devolver `List<ComputadoraListadoDTO>`:

- `GET /api/computadoras`
- `GET /api/computadoras/recientes`

`GET /api/computadoras/{uuid}` sigue con `ComputadoraDTO`.

POST que devuelven PC actualizada (create, updateUbicacion, updateEstado, updateResponsable): devolver `ComputadoraListadoDTO` si el front solo hace merge en listado, o mapear en service.

---

## 4. Campos Firestore para `Query.select()`

Constante `ComputadoraListadoFields.ALL` (nombres exactos de Firestore):

```
hostname
tipo_equipo
ubicacion
sistema_operativo
arquitectura
estadoActual
estado_conexion
ultima_sincronizacion
responsable_inventario
anydesk_id
anydesk
procesador
usuarios
ubicacion_stock
```

Reglas:

- Si hay `whereEqualTo("ubicacion", ...)`, incluir `ubicacion` en el mask.
- **No** incluir `perifericos`, `discos`, `modulos_ram`, `historialEstados`.
- **AnyDesk en listado:** solo `anydesk_id` / `anydesk`. **No** usar `AnydeskIdResolver` (fallback por impresoras requiere `perifericos` gordo). Documentado como trade-off aceptado.

---

## 5. `ubicacion_stock` — raíz del documento + migración obligatoria

### 5.0 Bug conocido: deserialización del historial (verificar / corregir en PR-1)

**Escritura** (`ComputadoraRepository.cambiarEstado`):

```java
nuevaEntrada.put("ubicacion_stock", ubicacionStock);
nuevaEntrada.put("responsable_inventario", responsableInventario);
```

**Modelo** (`CambioEstado.java`): `ubicacionStock` y `responsableInventario` **sin** `@PropertyName`.

Firestore `toObject()` mapea por nombre de propiedad Java → busca `ubicacionStock` en el map, pero el dato está guardado como `ubicacion_stock`. **Resultado:** el dato existe en Firestore pero `CambioEstadoMapper.toDTO()` devuelve `ubicacionStock: null` en el historial de la ficha/API.

Mismo patrón para `responsable_inventario` dentro de entradas de historial (el campo raíz `responsable_inventario` de `Computadora` sí tiene `@PropertyName` y funciona).

**Impacto probable:**

- `PerifericoManualList.getUbicacionStock()` (lee `historialEstados` del listado) casi nunca veía stock para PCs cargadas del API.
- Lo que “funcionaba” era el hack client-side tras `createComputadora` (`created.historialEstados = [...]`), no la deserialización real.

**Acciones:**

1. PR-1: `@PropertyName` en `CambioEstado` (fix forward para ficha/historial).
2. PR-2 migración: leer **map raw** `entrada.get("ubicacion_stock")`, no `toObject`.
3. Test de regresión con snapshot snake_case.

### 5.1 Escritura en `cambiarEstado`

En `ComputadoraRepository.cambiarEstado`, en la misma transacción, actualizar raíz:

- Estado **Sin Asignar** + `ubicacionStock` informado → `updates.put("ubicacion_stock", valor)`
- Cualquier otro estado → `FieldValue.delete()` en `ubicacion_stock`

### 5.2 Script one-shot (obligatorio antes del deploy front)

Nuevo endpoint admin (patrón `AdminMigracionController`):

```
POST /api/admin/migracion/ubicacion-stock
```

Requiere flag de config (ej. `app.migration.ubicacion-stock.enabled=true`).

**Algoritmo por documento** en colección `computadoras`:

1. Leer `historialEstados`.
2. Entrada vigente: `fechaHoraFin == null` (criterio backend, **no** `activo` del front).
3. Si `estado.nombre` es Sin Asignar y la entrada tiene `ubicacion_stock` → merge en raíz.
4. Si no → borrar campo raíz `ubicacion_stock` si existe.
5. Batch writes de 500; respuesta `{ procesados, actualizados, limpiados, errores[] }`.

### 5.3 Front — sin fallback a historial

Eliminar `getUbicacionStock` que lee `historialEstados`. Usar solo:

```javascript
pc.ubicacionStock?.trim() || null
```

No mantener compatibilidad dual en el front.

---

## 6. Backend — archivos y cambios

### 6.1 Nuevos

| Archivo | Rol |
|---|---|
| `dto/ComputadoraListadoDTO.java` | Contrato listado |
| `mapper/ComputadoraListadoMapper.java` | `DocumentSnapshot` → DTO (sin `toObject(Computadora)`) |
| `repository/ComputadoraListadoFields.java` | Constantes del `select` |
| `config/ComputadoraCacheEviction.java` (opcional) | Helper centralizado de invalidación |
| `services/MigracionUbicacionStockService.java` | Lógica migración |
| Endpoint en `AdminMigracionController` | `POST .../ubicacion-stock` |
| Tests: `ComputadoraListadoMapperTest`, etc. | |

### 6.2 Modificar

| Archivo | Cambio |
|---|---|
| `ComputadoraRepository.java` | `findAllListado()`, `findByUbicacionListado()` con `select`; `findAll()` renombrar cache a gordo; `cambiarEstado` → raíz `ubicacion_stock` |
| `ComputadoraService.java` | `getAll`, `listar`, `getRecientes` → listado; `getByUuid` sin cambios |
| `ComputadoraController.java` | Tipos de retorno listado |
| `BusquedaService.java` | PCs → `findAllListado()` |
| `CacheConfig.java` | Caches partidas + TTL |

### 6.3 No tocar en Fase A

- `DashboardService`
- `PerifericosAgenteListadoService`, `ImpresoraService`, `MonitorService`
- `MigracionEstadosService` (salvo nuevo endpoint ubicacion-stock)
- Caches de cámaras, routers, etc.

---

## 7. Repository — dos caminos de lectura

```text
findAll()                    → colección completa (dashboard / periféricos agente)
findAllListado()             → .select(ComputadoraListadoFields.ALL)
findByUbicacionListado()     → where + select
findByUuid()                 → documento completo (ficha)
findByHostname()             → documento completo
```

Mapper listado:

- `uuid` desde `doc.getId()`
- `usuarioActual` desde `usuarios.usuario_actual`
- `estadoActual` + inferencia (`EstadoOperativo.inferirAsignacionDesdeTexto`) — reutilizar lógica de `ComputadoraMapper`
- `estadoAgente` desde `estado_conexion`
- `procesadorNombre` desde string `procesador`
- `anydeskId` desde `anydesk_id` o `anydesk` (sin resolver impresoras)

---

## 8. Caches

### 8.1 Nombres y TTL

| Cache | Contenido | TTL | Max entries |
|---|---|---|---|
| `pc-listado` | `findAllListado`, por ubicación, recientes | 60s | ~10 |
| `pc-detalle` | `findByUuid`, `findByHostname` | 120s | 500 |
| `pc-programas` | `listProgramas(uuid)` | 120s | por uuid |
| `computadoras-gordo` | `findAll()` actual | 3 min | 1 |

Sacar listado del cache `"computadoras"` monolítico actual.

### 8.2 Matriz de invalidación

| Operación | `pc-listado` | `pc-detalle::{uuid}` | `computadoras-gordo` |
|---|---|---|---|
| `cambiarEstado`, `updateUbicacion`, `updateResponsable`, create, delete PC | allEntries | evict uuid | allEntries |
| `agregarImpresora/USB/monitor/audio` | **no** | evict uuid | allEntries |
| Asignar periférico manual (otra colección) | **no** | **no** | **no** |
| Sync agente (externo) | TTL / `DELETE /api/cache` | TTL | TTL |

Regla de code review: invalidar `pc-listado` **solo** si cambia algún campo de `ComputadoraListadoFields`.

### 8.3 CacheController

Mantener `DELETE /api/cache` (invalida todo). Opcional: `DELETE /api/cache/pc-listado`.

---

## 9. Frontend

### 9.1 Cambios obligatorios

| Archivo | Cambio |
|---|---|
| `PerifericoManualList.jsx` | `ubicacionStock` plano; quitar `getUbicacionStock` + historial |
| `ComputadorasListLayout.jsx` | Helper `pickListadoFields(dto)` en `mergeEnListado` si el detalle devuelve DTO gordo |
| `Dashboard.jsx` | Recientes: usar `procesadorNombre` o corregir `procesador?.nombre` vs `nombreRaw` |

### 9.2 Sin cambios de URL

`fetchComputadoras` / `fetchComputadorasRecientes` siguen igual; cambia la forma del JSON (menos campos).

### 9.3 Consumidores verificados (compatibles con listado)

- `ComputadoraList.jsx` — hostname, estado, sync, anydesk, ubicación, SO
- `ComputadoraAsignaciones.jsx` — estado, responsable, hostname
- `PerifericoManualList` stock PCs — `estadoActual === 'Sin Asignar'` + `ubicacionStock`

### 9.4 A.2 opcional (mismo espíritu, otro PR)

`useComputadorasHW.js` en `System.jsx`: reemplazar `onSnapshot` de colección gorda por API. El SDK web no tiene `select` útil.

---

## 10. Orden de deploy

```text
1. Backend: cambiarEstado escribe ubicacion_stock en raíz
2. Backend: endpoint migración ubicacion-stock
3. Deploy backend
4. Ejecutar POST /api/admin/migracion/ubicacion-stock en staging/prod
5. Verificar muestra (PCs Sin Asignar con ubicacionStock en raíz)
6. Backend: DTO listado + select + caches partidas
7. Deploy backend
8. Deploy front (ubicacionStock + merge listado)
9. Medición p95 y tamaño JSON
```

**No** deployar front de listado liviano antes de la migración de `ubicacion_stock`.

---

## 11. Tests

| Test | Verifica |
|---|---|
| `ComputadoraListadoMapperTest` | Snapshot mock → DTO correcto |
| `AnydeskIdResolverTest` | Sin cambios (solo detalle) |
| `cambiarEstado` | Escribe/borra `ubicacion_stock` en raíz |
| Migración | Doc con historial Sin Asignar → raíz poblada |
| Integración listado | `GET /computadoras` no incluye `perifericos` ni `discos` |
| Caché | Asignar periférico manual no vacía `pc-listado`; cambiar responsable sí |

---

## 12. Validación / métricas

Antes y después (misma cantidad de PCs):

- Tamaño respuesta `GET /api/computadoras` (objetivo: −60% a −90%)
- p95 latencia en Cloud Run
- Heap en cold miss de cache
- Lecturas Firestore: **iguales** (esperado)
- Ficha detalle intacta (discos, periféricos agente, historial, programas)

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Campo mal nombrado en `select` → nulls | Constante única + test |
| Stock sin `ubicacion_stock` migrado | Migración obligatoria pre-deploy |
| AnyDesk solo en impresora | Solo en ficha (detalle); listado puede mostrar "—" |
| `mergeEnListado` mezcla DTO gordo | `pickListadoFields` |
| POST create devuelve DTO incompatible | Auditar respuestas de create/update |

**Rollback:** revert PR; caches se vacían solas. Sin migración destructiva.

---

## 14. Criterio de done

- [ ] `GET /api/computadoras` y `/recientes` usan `select` + `ComputadoraListadoDTO`
- [ ] `findAll()` gordo solo para dashboard/periféricos agente
- [ ] Caches partidas con matriz de invalidación documentada
- [ ] `ubicacion_stock` en raíz + migración ejecutada
- [ ] Front sin fallback a `historialEstados` para stock
- [ ] Tests backend verdes
- [ ] Métricas before/after documentadas

---

## 15. Fuera de alcance (Fase B+)

- Colección `computadoras_indice` + Cloud Function onWrite
- Reducir lecturas facturadas
- Redis / listener Firestore permanente
- Optimizar dashboard / periféricos agente / `useComputadorasHW`

---

## 16. Referencias en el repo

- Listado actual: `ComputadoraRepository.findAll()` + `ComputadoraService.getAllComputadoras()`
- Mapper listado engañoso: `ComputadoraMapper.toListDTO()` (aún mapea discos/RAM/historial)
- Periféricos manuales: `PerifericoManualRepository`, colección `perifericos_manuales`
- Periféricos embebidos: `computadoras/{uuid}.perifericos.*`
- Cache actual: `CacheConfig.java`, `@Cacheable("computadoras")`
- Migración existente: `AdminMigracionController`
