# Módulo: Computadoras

Slug: `computadoras`

## Qué es

PCs del inventario: alta, ficha, estados operativos (asignada, depósito, reparación, baja) e historial de estados.

## Dónde buscar

Frontend:

- `inventario/inventario-front/src/pages/ComputadoraAsignaciones.jsx` — vista de asignaciones y filtros por estado
- `inventario/inventario-front/src/components/AsignacionesBoard.jsx` — cambio de estado por fila («En Reparación» = `EN_MANTENIMIENTO`, «Retirada» = `BAJA`)
- `inventario/inventario-front/src/api/computadoraApi.js` — `updateEstado` y el resto de la API de PCs
- `inventario/inventario-front/src/pages/ComputadoraDetail.jsx` — ficha; el borrado físico vive acá y no es esta feat
- `inventario/inventario-front/src/pages/ComputadoraList.jsx`

Backend:

- `inventario/src/main/java/com/bacarsa/inventario/services/ComputadoraService.java` — `cambiarEstado`
- `inventario/src/main/java/com/bacarsa/inventario/repository/ComputadoraRepository.java` — `cambiarEstado` escribe `historialEstados`
- `inventario/src/main/java/com/bacarsa/inventario/models/EstadoOperativo.java`
- `inventario/src/main/java/com/bacarsa/inventario/controller/ComputadoraController.java`
- `inventario/src/main/java/com/bacarsa/inventario/dto/CambiarEstadoDTO.java`

## Qué ver primero (orden)

1. `AsignacionesBoard.jsx` — `handleApplyStateChange` y el select de estados.
2. `ComputadoraService.cambiarEstado` — cómo se valida el estado y qué se persiste.
3. `ComputadoraRepository.cambiarEstado` — cierre del tramo anterior y alta del nuevo en `historialEstados`.

## Qué tocar

- Regla de baja en `ComputadoraService` y, si hace falta el motivo obligatorio, el DTO ya existente.
- Select y validación de `AsignacionesBoard.jsx` (y el filtro de `ComputadoraAsignaciones.jsx` solo si la baja deja de verse ahí).
- Test de `cambiarEstado` si ya hay carpeta de tests del servicio; si no hay, un test nuevo junto a los tests existentes del backend.

## Qué NO tocar

- Pantalla de stock (`PerifericoManualList.jsx`, `components/stock/`). La pestaña Bajas la hace el módulo perifericos.
- Celulares, cámaras, infraestructura, tesorería, internos, auth.
- Borrado físico de la PC (`eliminar` / delete en ficha y listado).
- `inventario/public/assets`, secretos, CI y deploy.
- Contratos del agente Python AgenteBacar.
- `historialEstados` de otros activos.

## Dependencias

Este módulo usa: catálogo `estados_operativos`, `ResponsableService` al cambiar estado.
Este módulo es usado por: stock de depósito (lee PCs), reportes, asignaciones.

## Notas

- En la UI, «En Reparación» es el estado `EN_MANTENIMIENTO` / «En mantenimiento». «Retirada (Dar de baja)» es `BAJA`.
- `cambiarEstado` ya agrega un tramo a `historialEstados` (motivo, fechas, estado). No crear otra colección.
- `SIN_ASIGNAR` es la vuelta de operativo a stock disponible. No cambiar esa regla.
- Si la baja no se puede guardar, el estado anterior tiene que seguir vigente.
- `BAJA` solo se acepta si el estado actual es `EN_MANTENIMIENTO` y hay motivo. Lo valida `ComputadoraService.cambiarEstado` antes de escribir; el historial lo sigue armando `ComputadoraRepository.cambiarEstado`. En `AsignacionesBoard` la opción «Retirada (Dar de baja)» aparece en reparación (y en una PC que ya está en baja, para que el select muestre el estado actual).
