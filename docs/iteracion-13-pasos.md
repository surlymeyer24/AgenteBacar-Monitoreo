# Iteración 13 — Persistencia de edición de Routers y Switches

## Contexto

El frontend ya tiene botones de editar en la lista (`RoutersSwitchesList.jsx`) y en los detalles (`RouterDetail.jsx`, `SwitchDetail.jsx`), con modal de edición con todos los campos relevantes. Al guardar, se muestra un `alert("Backend requiere actualización...")` y el cambio sólo se simula localmente sin persistir en Firestore. El objetivo es completar el ciclo full-stack: implementar los endpoints `PUT` en backend y conectar el frontend a ellos.

---

## Estado actual

| Capa | Router | Switch |
|---|---|---|
| Modelo | ✓ completo | ✓ completo |
| DTO create/update | ✓ `RouterCreateDTO` | ✓ `SwitchRedCreateDTO` |
| Repository `update()` | ✗ falta | ✗ falta |
| Service `update()` | stub incompleto | ✗ falta |
| Controller `PUT /{id}` | ✗ falta | ✗ falta |
| Frontend API `actualizar*()` | ✗ falta | ✗ falta |
| Frontend modal conectado | ✗ sólo simula | ✗ sólo simula |

---

## Archivos a modificar

### Backend
- `src/main/java/com/bacarsa/inventario/repository/RouterRepository.java`
- `src/main/java/com/bacarsa/inventario/repository/SwitchRedRepository.java`
- `src/main/java/com/bacarsa/inventario/services/RouterService.java`
- `src/main/java/com/bacarsa/inventario/services/SwitchRedService.java`
- `src/main/java/com/bacarsa/inventario/controller/RouterController.java`
- `src/main/java/com/bacarsa/inventario/controller/SwitchRedController.java`

### Frontend
- `inventario-front/src/api/routerApi.js`
- `inventario-front/src/api/switchApi.js`
- `inventario-front/src/pages/RoutersSwitchesList.jsx`
- `inventario-front/src/pages/RouterDetail.jsx`
- `inventario-front/src/pages/SwitchDetail.jsx`

---

## Pasos de implementación

### Paso 1 — Repository: método `update()`

Agregar en **RouterRepository** y **SwitchRedRepository**:

```java
public void update(String id, Map<String, Object> campos)
        throws ExecutionException, InterruptedException {
    DocumentReference docRef = firestore.collection("routers").document(id); // o "switches"
    docRef.update(campos).get();
}
```

**Por qué `update()` y no `set` con merge:** `update()` sólo toca los campos del mapa. Con `set+merge` si se pasa un campo null se borra. Así se preservan `estadoActual` e `historialEstados` que no forman parte del DTO de edición.

---

### Paso 2 — Service: método `update()`

**RouterService** — completar el stub existente.  
**SwitchRedService** — crear desde cero.

Lógica:
1. `findById(id)` — si retorna `null`, lanzar `IllegalArgumentException("Router/Switch no encontrado: " + id)`.
2. Construir `Map<String, Object> campos` con los valores del DTO, usando los nombres de campo Firestore (snake_case).
3. Llamar a `repository.update(id, campos)`.
4. Retornar `mapper.toDTO(repository.findById(id))`.

**Campos del mapa — Router** (clave = nombre en Firestore):
```
nombre, marca, modelo, ip, numero_serie, firmware, sitio, ip_publica,
estado_omada, version, mac_uplink, salto, grupo_wlan,
cantidad_puertos_wan, cantidad_puertos_lan, gateway, ubicacion, fecha_alta
```

**Campos del mapa — SwitchRed** (clave = nombre en Firestore):
```
nombre, marca, modelo, ip, numero_serie, sitio, ip_publica,
estado_omada, version, mac_uplink, salto,
cantidad_puertos, tipo, vlans, ubicacion, fecha_alta
```

> No incluir `estadoActual` ni `historialEstados` — esos sólo los toca el endpoint de cambio de estado.

---

### Paso 3 — Controller: endpoint `PUT /{id}`

Agregar en **RouterController** y **SwitchRedController**:

```java
@PutMapping("/{id}")
public ResponseEntity<RouterDTO> actualizar(
        @PathVariable String id,
        @RequestBody @Valid RouterCreateDTO dto)
        throws ExecutionException, InterruptedException {
    try {
        RouterDTO actualizado = routerService.update(id, dto);
        return ResponseEntity.ok(actualizado);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.notFound().build();
    }
}
```

Rutas resultantes:
- `PUT /api/routers/{id}`
- `PUT /api/switches/{id}`

---

### Paso 4 — Frontend API

**routerApi.js** — agregar:
```js
export const actualizarRouter = async (id, data) => {
  const res = await fetch(`${BASE_URL}/api/routers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar router');
  return res.json();
};
```

**switchApi.js** — ídem `actualizarSwitch(id, data)`.

---

### Paso 5 — Frontend: conectar modal de edición

En **RoutersSwitchesList.jsx**, reemplazar el `alert(...)` + simulación local por:
1. Llamar a `actualizarRouter(id, formData)` o `actualizarSwitch(id, formData)` según tipo.
2. On success: cerrar modal y refrescar la lista.
3. On error: mostrar mensaje de error al usuario (no alert, idealmente un estado de error en el modal).

En **RouterDetail.jsx** y **SwitchDetail.jsx**: si tienen lógica similar de simulación, aplicar el mismo reemplazo.

---

## Verificación

1. Levantar backend: `mvnw.cmd spring-boot:run`
2. Levantar frontend: `npm run dev` en `inventario-front/`
3. Lista de Routers → editar → modificar un campo → guardar → verificar que la lista se actualiza
4. Abrir el Detail del router editado → confirmar que el cambio persiste
5. Repetir para Switches
6. Verificar en Firestore Console que el documento fue actualizado y que `estadoActual` / `historialEstados` **no fueron borrados**
7. Probar editar un ID inexistente (ej. via Postman `PUT /api/routers/id-falso`) → debe retornar `404`
