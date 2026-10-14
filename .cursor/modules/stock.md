# Módulo: Stock (proyección)

Slug: `stock`

## Qué es

Lista única de unidades de depósito: lee cada colección, proyecta los campos que la ficha ya tiene y completa `codigo_interno` con un merge de un solo campo.

## Dónde buscar

Colecciones (`inventario/src/main/resources/application.properties`):

- `computadoras`, `perifericos_manuales`, `celulares`, `camaras`, `televisores`, `routers`, `switches`, `access_points`

Modelos y `findAll`:

- `inventario/src/main/java/com/bacarsa/inventario/models/Computadora.java` — id de documento `uuid`, `tipo_equipo`, `serial_equipo`, `condicion`, `estadoActual`, `ubicacion`. Sin marca, sin modelo, sin fecha de ingreso.
- `inventario/src/main/java/com/bacarsa/inventario/models/PerifericoManual.java` — `tipo`, `cantidad`, `fabricante`, `numero_serie`, `fechaAlta`, `ubicacion`, `estadoActual`. Sin modelo.
- `inventario/src/main/java/com/bacarsa/inventario/models/Celular.java` — `marca`, `modelo`, `imei`, `estado`. Sin ubicación ni fecha.
- `inventario/src/main/java/com/bacarsa/inventario/models/Camara.java` — el campo `tipo` es el modelo. `marca`, `fechaAlta`, `ubicacion`, `estadoActual`. Sin serie.
- `inventario/src/main/java/com/bacarsa/inventario/models/Televisor.java` — `marca`, `modelo`, `numero_serie`, `estado`, `area`. Sin ubicación ni fecha.
- `inventario/src/main/java/com/bacarsa/inventario/models/Router.java` y `SwitchRed.java` — `marca`, `modelo`, `numero_serie`, `fechaAlta`, `ubicacion`, `estadoActual` y string `estado`. En el switch, `tipo` es managed/unmanaged.
- `inventario/src/main/java/com/bacarsa/inventario/models/AccessPoint.java` — `marca`, `modelo`, `estado`, `ubicacion`, `mac`. Sin serie ni fecha.
- `inventario/src/main/java/com/bacarsa/inventario/models/TipoEquipo.java` — `tipo` (`desktop` / `notebook`).
- `inventario/src/main/java/com/bacarsa/inventario/models/Estado.java` — `nombre`.
- `inventario/src/main/java/com/bacarsa/inventario/models/PerifericosFirestore.java` y `MonitorFirestore.java` — monitor anidado del agente. No entra.
- Repositorios `*Repository.findAll` de esas ocho colecciones.
- Patrón de escritura: `ComputadoraRepository.mergeUpdates` (`set` + `SetOptions.merge`).

Fuera de esta lista, para no tocarlos: `Nvr`, `Servidor`, `InternoIp`, `MaquinaTesoreria` y sus repositorios.

## Qué ver primero

1. `ComputadoraRepository.mergeUpdates` — el único patrón de escritura permitido.
2. Los ocho POJO de arriba — qué campo existe y cuál queda vacío.
3. `CatalogoBootstrapRunner` — `desktop`/`notebook` y tipos de periférico (`teclado`, `mouse`, `monitor`, `impresora`, `webcam`, `parlante`, `microfono`).
4. Un controller existente (`CelularController`, `@RequestMapping("/api/...")`) — estilo del GET nuevo.

## Qué tocar

- Código nuevo del módulo: DTO de proyección, servicio de lectura, backfill interno, `GET` (por ejemplo `/api/stock/unidades`).
- En cada POJO de las ocho colecciones: el campo `codigo_interno` (`@PropertyName("codigo_interno")`), para que un `set` posterior de la ficha no lo borre.
- En cada repositorio de esas colecciones: un método que haga `set` con merge de solo `codigo_interno`. En computadoras, reutilizar `mergeUpdates`.
- Test del backfill y del GET, sin emulador y sin Firestore real.

## Qué NO tocar

- Pantallas, `inventario-front/`, altas, bajas, asignaciones, combos, importación, exportación.
- Historial de computadoras y la rama `feature/computadoras-historial`.
- El checkout `D:\Desarrollo\MiniAgente-Inventario` (está sucio). Todo el trabajo va en este worktree.
- NVR, servidores, internos IP, máquinas de tesorería, monitores anidados del agente.
- Métodos `set(entidad)` que reescriben el documento. El backfill no los usa.
- `firestore.rules`, secretos, CI, deploy, `README`.
- Colecciones y contratos del agente.

## Dependencias

Este módulo usa: los `findAll` y el merge de un campo de las ocho colecciones.
Este módulo es usado por: nadie todavía. Stock 2 y Stock 4 quedan fuera.

## Rutas de esta feat

- `GET /api/stock/unidades` → `StockController` → `StockUnidadesService.listar` (no escribe)
- Backfill interno: `CodigoInternoBackfillRunner` al arrancar (`app.stock.codigo-interno.backfill`, default activo) → `StockUnidadesService.backfill` → `CodigoInternoBackfill`
- Proyección: `ProyeccionStock`, ficha `FichaLectura`, DTO `UnidadStockDTO`
- Merge de un campo: `MergeCodigoInterno` + `mergeCodigoInterno` en los repositorios (en computadoras, `mergeUpdates`)
- Tests: `StockProyeccionTest`, `StockUnidadesServiceTest` (documento en memoria, sin emulador)

## Notas

- Prefijos: desktop `PC`, notebook `NB`, monitor `MON`, teclado `TEC`, mouse `MOU`, impresora `IMP`, webcam `WEB`, parlante `PAR`, microfono `MIC`, celular `CEL`, camara `CAM`, televisor `TV`, router `RTR`, switch `SW`, access point `AP`. Formato `PC-1`.
- El siguiente número es el máximo ya guardado de ese prefijo, más uno. Una ficha con código no se toca.
- Entra solo `cantidad == 1` en periféricos manuales. Cantidad distinta, tipo vacío o tipo fuera de la tabla: no entra y el log nombra colección e id.
- `area` y `sitio` no se copian a ubicación. La MAC no es serie. La condición anidada en `especificacion_stock` no se copia.
- El backfill no es un endpoint. El GET no escribe.
