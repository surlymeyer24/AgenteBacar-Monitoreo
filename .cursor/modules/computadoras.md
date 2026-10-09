# Módulo: Computadoras

Slug: `computadoras`

## Qué es

Ficha de PC: alta, edición de inventario, estado operativo e historial de cambios.

## Dónde buscar

- `inventario/src/main/java/com/bacarsa/inventario/controller/ComputadoraController.java`
- `inventario/src/main/java/com/bacarsa/inventario/services/ComputadoraService.java`
- `inventario/src/main/java/com/bacarsa/inventario/services/ComputadoraHistorialService.java`
- `inventario/src/main/java/com/bacarsa/inventario/historial/ComputadoraHistorialReglas.java`
- `inventario/src/main/java/com/bacarsa/inventario/repository/ComputadoraRepository.java`
- `inventario/src/main/java/com/bacarsa/inventario/models/Computadora.java`
- `inventario/inventario-front/src/pages/ComputadoraDetail.jsx`
- `inventario/inventario-front/src/pages/ComputadoraNueva.jsx`
- `inventario/inventario-front/src/api/computadoraApi.js`
- `inventario/src/test/java/com/bacarsa/inventario/historial/ComputadoraHistorialReglasTest.java`
- Contrato: `docs/plan-historial-cambios.md`

## Qué ver primero

1. `ComputadoraHistorialReglas` — qué renglón se arma y cuándo no
2. `ComputadoraRepository.aplicarHistorial` — la transacción ficha + renglón
3. `ComputadoraDetail.jsx` — guardado de ficha, estado y lista del historial

## Qué tocar

- Alta, edición de ficha, cambio de estado y baja lógica de la PC
- Modelo `historial` en el documento de la computadora
- Detalle de la PC y su API (`/api/computadoras`)
- Migración por lotes `POST /api/computadoras/migracion-historial`
- Llegada del primer reporte: `MatchingDeteccionService.registrarLlegadaDeReporte` y `POST /api/computadoras/reporte-agente`

## Qué NO tocar

- Stock manual, periféricos, lotes, celulares
- Routers, switches, cámaras, access points, televisores, servidores, NVR, internos, tesorería
- `ArmadoComboService`, `PerifericoManualService`, `ConciliacionStockService` (siguen escribiendo la PC por afuera)
- El agente (C# o Python) y la descarga del instalador
- Borrar `historialEstados`
- `inventario/public` (build de hosting)

## Dependencias

Este módulo usa Firestore (`computadoras`), usuarios de Firebase para el autor, y el índice de responsables.

Lo usan el listado, el detalle, el ingreso a stock de una PC y el job de primer reporte.

## Notas

El renglón vive en `historial` del mismo documento. Si esa lista no entra en la transacción, la ficha no cambia. La fecha y el autor salen del servidor y del token. Un reporte posterior del agente no agrega renglón `FICHA` ni `ESTADO`.
