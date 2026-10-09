# Plan: historial de cambios

Fecha: 2026-10-09  
Sistema: Inventario Agente Bacar (este repo, en producción)  
Estado: análisis cerrado, sin implementación

El historial se construye en este sistema, por etapas. No es un proyecto nuevo.

## 1. Problema

Todo lo cargado se puede dar de alta, modificar y cambiar de estado. Eso no sirve si el dato anterior desaparece.

Hoy el historial está partido:

| Situación | Activos |
|---|---|
| Tienen tramos de estado (`historialEstados`) | PC, periférico manual, router, switch, cámara, interno IP, máquina de tesorería |
| El estado es un texto que se pisa | Celular, access point, televisor, servidor |
| No tienen estado | NVR |
| Renglón de cambio de ficha (campo, antes, después) | Ninguno |

Un celular reasignado pierde el responsable anterior. Una corrección de serie, IP o ubicación no queda en ningún lado. El historial de estado que sí existe no es el mismo en todos los tipos.

## 2. Decisiones cerradas

1. Se implementa en este sistema. El panel actual sigue en producción.
2. El orden es progresivo: **computadoras → stock → infraestructura**. Cada etapa se termina y se prueba antes de pasar a la siguiente.
3. La reconstrucción del pasado también es progresiva y honesta. Solo se recupera lo que tiene evidencia. Lo que no se puede probar queda como pasado desconocido, con un punto de partida de migración. No se inventan fechas, autores ni valores anteriores.
4. Cada cambio que hace una persona deja un renglón que no se pisa.
5. Si en un mismo guardado cambian varios campos, es **un** renglón y adentro van todos los antes/después.
6. El historial es inmutable: no se edita ni se borra.
7. La baja es lógica. La ficha sigue existiendo.
8. Quién es el usuario de Firebase. La fecha la pone el servidor.
9. La escritura es atómica: si no se puede guardar el renglón, tampoco se aplica el cambio.
10. Descargar el instalador del agente **no** da de alta una PC. El alta automática ocurre en el **primer reporte válido** del agente.
11. No se detectan retiros ni cambios de hardware (monitor, CPU, RAM, periféricos que se sacan). No hay bandeja de auditoría de eso.
12. Lo que reescribe solo el agente después del alta no genera renglones de ficha ni de estado manual.

## 3. Fuera de alcance

- Proyecto o repo nuevo para este historial.
- Comparar snapshots para avisar que se sacó o se cambió hardware.
- Renglón por cada reporte periódico del agente (uso de CPU, RAM, última sincronización, estado de conexión).
- Reconstruir una biografía completa de activos viejos cuando no hay evidencia.
- Borrado físico del documento para “limpiar” una baja.
- Tocar el agente Python AgenteBacar. El alta automática se registra de este lado, cuando el reporte ya llegó.
- Mezclar esta obra con las features abiertas de asignaciones (PC asignada y celulares liberados). Esas siguen su rama. El historial arranca en la suya cuando esas no estén en el medio.

## 4. Modelo del renglón

Hay un solo historial por ficha. Adentro hay dos clases de renglón.

### 4.1 Cambio de estado

Es un tramo. El vigente es el que no tiene fecha de fin.

| Campo | Qué guarda |
|---|---|
| Tipo | `ESTADO` |
| Desde | Fecha del servidor al abrir el tramo |
| Hasta | Fecha del servidor al cerrarlo. Vacío si es el vigente |
| Estado | Nombre del estado nuevo |
| Estado anterior | Nombre del estado que se cerró |
| Motivo | Texto obligatorio en el cambio de estado |
| Quién | `uid` y nombre visible del usuario de Firebase, o `SISTEMA` |
| Origen | `MANUAL`, `AGENTE` o `MIGRACION` |

Estados de computadora que ya existen y se respetan: `SIN_ASIGNAR`, `ASIGNADA`, `EN_MANTENIMIENTO`, `BAJA`, `ACTIVA`, `INACTIVA`. Stock, asignación, reparación y baja son pasajes entre esos estados, no un modelo paralelo.

### 4.2 Cambio de ficha

| Campo | Qué guarda |
|---|---|
| Tipo | `FICHA` |
| Cuándo | Fecha del servidor |
| Quién | Igual que en el estado |
| Origen | `MANUAL` o `MIGRACION` |
| Cambios | Lista de `{ campo, valorAnterior, valorNuevo }` |

Entran los datos que carga o corrige una persona: hostname de inventario, ubicación, responsable, serie, AnyDesk, notas, tipo de equipo, condición, y el resto de campos editables de la ficha.

No entran, ni en claro ni enmascarados como cambio de ficha:

- Campos que el agente pisa en cada reporte: hardware, periféricos detectados, `estado_conexion`, `ultima_sincronizacion`, uso de CPU/RAM, usuario de Windows (`usuarioActual`).
- Credenciales (usuario y contraseña de NVR u otros). Si más adelante un tipo tiene secreto, el renglón dice que el secreto cambió y no guarda el valor.

### 4.3 Alta

El alta es el primer renglón de la ficha. No es un cambio de ficha con valores anteriores vacíos mezclado con el estado.

| Caso | Renglón |
|---|---|
| Una persona carga la PC | `ALTA_MANUAL`. Actor = usuario. Origen = `MANUAL`. Estado inicial en el mismo hecho |
| El agente reporta por primera vez una identidad que no existe | `ALTA_AUTOMATICA`. Actor = `SISTEMA`. Origen = `AGENTE`. Estado inicial `SIN_ASIGNAR` |
| La identidad ya existe | No hay otra alta. Se vincula el reporte a esa ficha |

Identidad estable de la PC: el `uuid` que ya usa el documento. El hostname no alcanza para decidir si es la misma máquina.

### 4.4 Dónde se guarda

En la ficha, como lista append-only, al lado del estado vigente. El listado sigue leyendo el estado actual en el campo de arriba y no recorre el historial.

El `historialEstados` actual de la PC se conserva como evidencia de migración. El historial nuevo no lo reescribe ni lo borra. La pantalla de la ficha muestra el historial nuevo; el viejo se puede consultar como tramos previos cuando la migración los haya copiado.

## 5. Reglas de escritura

1. Toda alta, edición de ficha y cambio de estado de una persona pasa por un único servicio de historial del tipo. No se actualiza el documento “por afuera”.
2. Un guardado = un renglón de ficha, aunque cambien varios campos. Los campos que no cambiaron no se listan.
3. Un cambio de estado cierra el tramo vigente y abre otro en el mismo guardado. Si en ese guardado también cambió la ficha, son dos renglones del mismo acto (mismo `actoId`): uno `ESTADO` y uno `FICHA`.
4. Motivo obligatorio solo en el cambio de estado. La edición de ficha no lo exige.
5. Fecha y autor salen del servidor y del token. No se aceptan desde el cliente.
6. Firestore: la ficha y el renglón se escriben en la misma transacción. Si falla, no queda la ficha nueva sin renglón ni un renglón de un cambio que no se aplicó.
7. Baja: el estado pasa a `BAJA`, con motivo, y la ficha permanece. No hay delete del documento como camino de baja.
8. Un reporte del agente sobre una PC ya dada de alta actualiza solo los campos del agente y no agrega renglón `FICHA` ni `ESTADO`.

## 6. Alta de computadoras

```text
Descarga del instalador
        │
        ▼
   No crea ficha
   No crea renglón

Primer reporte válido
        │
        ├─ uuid ya existe ──► vincula, no duplica, no hay segunda alta
        │
        └─ uuid no existe ──► crea PC + renglón ALTA_AUTOMATICA
                              actor SISTEMA, origen AGENTE
                              estado SIN_ASIGNAR
                              fecha del servidor
```

“Reporte válido” es un documento de computadora con `uuid` presente, el mismo que el sistema ya usa para identificar la máquina. Un archivo descargado, un intento de instalación o un reporte sin identidad no abren ficha.

El alta manual de stock sigue siendo de una persona: renglón `ALTA_MANUAL`, `origen_alta = STOCK`. Si esa PC después reporta con el mismo uuid, el reporte se vincula y no genera `ALTA_AUTOMATICA`.

`origen_alta` que ya existe se mantiene como dato de la ficha (`STOCK`, `DETECTADA_POR_AGENTE`, `DETECTADA_VINCULADA_RETRO`, `LEGACY`). El renglón de alta no lo reemplaza: cuenta el hecho. `DETECTADA_POR_AGENTE` coincide con `ALTA_AUTOMATICA`.

## 7. Reconstrucción

Se hace en la misma etapa que el tipo de activo, no como un proyecto aparte al final.

Para cada ficha existente:

1. Si hay `historialEstados` con fechas, se copian esos tramos al historial nuevo como origen `MIGRACION`. El estado, el desde y el hasta salen de ahí. El quién queda como estaba en el tramo; si no hay autor, queda `DESCONOCIDO`, no se le pone un usuario actual.
2. Si no hay tramos utilizables, se abre un solo renglón `MIGRACION_INICIAL`: estado vigente, fecha de la migración, actor `SISTEMA`, origen `MIGRACION`, y el pasado marcado como desconocido.
3. No se fabrican ediciones de ficha anteriores. El primer valor conocido de un campo es el que está hoy en el documento. De ahí en adelante, cada cambio sí deja antes/después.
4. La migración es repetible: si la ficha ya tiene renglón de migración, no se duplica.
5. Se corre por lotes, primero en un conjunto chico de PCs reales, y se revisa una ficha a mano antes de seguir.

Lo que no se promete: saber quién cambió una serie en 2024, ni el responsable anterior de un celular, ni el motivo de un estado que nunca se guardó.

## 8. Etapas

### Etapa 1 — Computadoras

Incluye la PC como ficha: alta manual, alta por primer reporte, edición de los campos de inventario, cambios de estado (asignar, mantenimiento, baja) y la historia visible en el detalle.

También incluye la reconstrucción de las PCs que ya están en Firestore.

No incluye periféricos del stock, celulares, lotes, ni red. Esos se leen como hasta ahora.

### Etapa 2 — Stock

Cuando la etapa 1 está probada en PCs reales.

Entran los cargados a mano del depósito, en este orden interno:

1. Periférico manual (ya tiene tramos de estado; falta el renglón de ficha y unificar el historial).
2. Celular (hoy el estado y `fecha_asignacion` se pisan).
3. Lotes y unidades de stock que tengan ficha propia y cambio de estado.

La asignación y la devolución son cambios de estado con motivo, más el renglón de ficha si en el mismo acto cambian responsable, área u otro dato.

### Etapa 3 — Infraestructura

Cuando la etapa 2 está probada.

Orden interno:

1. Router y switch (ya tienen tramos).
2. Cámara, interno IP y máquina de tesorería (ya tienen tramos).
3. Access point, televisor y servidor (estado pisado, sin historial).
4. NVR: primero se define si tiene estado operativo. Si sigue siendo solo un registro de conexión asociado a cámaras, el historial es de ficha (nombre, IP, puerto, descripción) y el secreto no se guarda en el renglón.

## 9. Cómo se prueba la etapa 1

Estas cinco pruebas definen si las computadoras están listas. Se hacen contra el emulador o un entorno de prueba, con una PC realista, y se mira el documento en Firestore además de la pantalla.

1. **Alta manual.** Crear una PC de stock. Queda en `SIN_ASIGNAR` y aparece un renglón `ALTA_MANUAL` con el usuario logueado y la fecha del servidor. No hay renglón de ficha vacío.
2. **Alta automática.** Un primer reporte con uuid nuevo crea la PC y un renglón `ALTA_AUTOMATICA` (`SISTEMA` / `AGENTE`). Un segundo reporte del mismo uuid no crea otra PC ni otra alta. Descargar el instalador, sin reporte, no crea nada.
3. **Edición.** En un solo guardado cambiar ubicación, responsable y serie. Aparece un solo renglón `FICHA` con los tres pares antes/después. Los campos que no se tocaron no figuran.
4. **Estados.** Recorrer stock → asignada → mantenimiento → baja. Quedan los tramos en orden, cada uno con motivo y usuario. La baja sigue en el listado de bajas y la ficha abre el historial completo. El tramo vigente no tiene fecha de fin; los anteriores sí.
5. **Legado y atomicidad.** Una PC vieja con `historialEstados` muestra esos tramos como migración y un punto de partida, sin fechas inventadas. Una PC vieja sin historial muestra solo `MIGRACION_INICIAL` y el pasado desconocido. Si la escritura del renglón falla, la ficha queda como estaba.

Además, un reporte posterior del agente sobre una PC ya cargada cambia `ultima_sincronizacion` (o el hardware) y el historial manual no suma renglones.

## 10. Riesgo

El dato que no se puede perder es el renglón. Si se pierde, el inventario vuelve a mentir sobre el pasado.

| Corte | Qué pasa | Mitigación |
|---|---|---|
| El servidor cae entre actualizar la ficha y append del historial | La ficha queda nueva y el pasado no | Una transacción de Firestore para las dos escrituras |
| El cliente manda fecha o autor | Se puede falsificar el historial | Se ignoran; salen del token y del reloj del servidor |
| La migración corre dos veces | Tramos duplicados | Marca de “ya migrada” en la ficha y la corrida no agrega otro `MIGRACION_INICIAL` |
| Se confunde un reporte del agente con una edición | El historial se llena de ruido | Lista cerrada de campos del agente que no generan renglón |
| No hay evidencia del pasado | Alguien completa huecos a ojo | Prohibido. El hueco se llama desconocido |

Quién lo usa: Sistemas, en la oficina, con sesión iniciada. No es un flujo de campo sin señal. No hace falta cola offline para esta etapa.

Si el historial falla un día entero, se pierden los cambios de ese día como evidencia. Por eso la escritura atómica frena el cambio en lugar de guardarlo “y el historial después”.

Cómo nos enteramos: el cambio rechazado responde error al usuario y queda en el log del backend con el id de la ficha. No depende de que alguien compare dos pantallas.

## 11. Qué hay hoy en el código

- `CambioEstado` ya es un tramo: inicio, fin, motivo, estado, ubicación de stock, responsable y `origen_cambio`. Le falta el renglón de ficha y, en varios caminos, el usuario que hizo el cambio.
- `OrigenAlta` ya distingue stock, detectada por agente, vinculada después y legacy.
- `Computadora.primer_reporte_agente_at` ya existe. El alta automática del plan se apoya en el primer reporte con uuid, no en una descarga.
- `ComputadoraTimelineService` arma la línea de tiempo de estados de la PC. La pantalla nueva muestra el historial unificado; no se le suman eventos de hardware.
- Celular, access point, televisor y servidor guardan `estado` como string, sin lista.
- NVR no tiene `estado`.

La etapa 1 no borra esas piezas. Agrega el historial nuevo en la PC y deja de escribir cambios de persona por fuera de él.

## 12. Orden de trabajo de la etapa 1

Una sola rama, desde `dev`, cuando no haya otra feature de computadoras a medio mezclar:

1. Modelo del renglón y servicio único de escritura para la PC.
2. Alta manual y alta por primer reporte pasan por ese servicio.
3. Edición de ficha y cambio de estado pasan por ese servicio.
4. Detalle de la PC muestra el historial, del más nuevo al más viejo.
5. Migración por lotes, primero una muestra, después el resto de las PCs.
6. Recién ahí se considera la etapa 1 lista. Stock no se toca en esa rama.

## 13. Listo de cada etapa

La etapa está lista cuando:

- Los escenarios de la sección 9 (o los equivalentes del tipo de activo) pasan.
- Una ficha vieja migrada se puede abrir y se entiende qué es evidencia y qué es desconocido.
- Un reporte del agente no ensucia el historial.
- El build del backend y del frontend pasan.
- No quedó un segundo camino que actualice la ficha de ese tipo sin renglón.
