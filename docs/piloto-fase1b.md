# Piloto Fase 1b — Armado de combo + baseline esperado

Guía operativa para validar en **dev** el flujo stock → armado → baseline antes de iniciar Fase 2 (matching con el agente).

**Fecha:** 2026-09-04  
**Estado:** Pendiente de ejecución  
**Prerequisito:** Fase 1a implementada; Fase 1b implementada en código  
**Documentos relacionados:**
- [`trazabilidad-stock-agente.md`](./trazabilidad-stock-agente.md)
- [`iteracion-fase1b-pasos.md`](./iteracion-fase1b-pasos.md)

---

## Objetivo del piloto

Confirmar con **2–3 PCs reales en dev** que IT puede:

1. Cargar una PC y periféricos en stock.
2. Armar el combo desde la aplicación.
3. Ver la PC en estado `BASELINE_LISTO` en la UI.
4. Verificar en Firestore que `baseline_esperado`, `combo_esperado_id` y `computadora_uuid` quedaron correctos.
5. Validar casos de error (409, legacy, re-armado, periférico ocupado).

**No es un deploy nuevo:** es verificación manual end-to-end del código ya implementado.

**Duración estimada:** 1–2 horas (flujos felices + pruebas negativas).

**Criterio de cierre:** el piloto pasa si al menos 2 PCs reales quedan en `BASELINE_LISTO` con baseline verificado en Firestore y las pruebas negativas se comportan como se espera.

---

## Pre-requisitos

| Requisito | Notas |
|-----------|-------|
| Backend Java corriendo en dev | Endpoints `POST .../armar-combo` y `GET .../perifericos-stock-disponibles` |
| Frontend apuntando a ese backend | Modal `ArmarComboModal`, badges y filtros |
| Migración 1a ejecutada (si hay PCs legacy) | `POST /api/admin/migracion/trazabilidad-stock-v1` |
| Acceso a Firestore Console | Verificar documentos post-armado |
| 2 técnicos (opcional) | Prueba de concurrencia en lotes con `cantidad > 1` |

### Precondiciones para que aparezca el botón "Armar"

La PC debe cumplir **las tres** condiciones:

| Campo | Valor requerido |
|-------|-----------------|
| `origenAlta` | `STOCK` |
| `estadoConciliacion` | `SIN_BASELINE` |
| `estadoActual` | `Sin Asignar` |

PCs con `origenAlta = LEGACY` o `estadoConciliacion = NO_APLICA` **no** deben ofrecer armado.

### Validación mínima al armar (backend)

Al confirmar el armado debe haber **al menos uno** de:

- Un periférico (monitor, mouse o teclado), **o**
- Un dato manual de hardware (CPU, RAM o disco).

Máximo **1 por tipo** de periférico. El armado es **irreversible desde la UI** (corrección manual en Firestore si hubo error humano).

---

## Puntos de entrada en la UI

Probar **ambos** caminos; distintos técnicos pueden usar uno u otro:

| Ubicación | Componente | Cuándo aparece |
|-----------|------------|----------------|
| Detalle de PC | Botón **Armar computadora** | `ComputadoraDetail.jsx` — PC STOCK + SIN_BASELINE + Sin Asignar |
| Stock manual → tab PCs | Botón **Armar** en fila | `PerifericoManualList.jsx` — mismas precondiciones |

Ambos abren el mismo modal `ArmarComboModal.jsx`.

---

## Escenarios del piloto

### PC-A — Flujo feliz completo (obligatorio)

**Objetivo:** armado con 3 periféricos + datos manuales de HW.

| Entidad | Datos sugeridos (adaptar a stock real) |
|---------|----------------------------------------|
| PC | Hostname `PILOTO-STOCK-01`, tipo desktop, condición nueva, ubicación stock "Depósito IT" |
| Monitor | Ej. Dell U2419H, serial `ABC123` |
| Mouse | Ej. Logitech M185 |
| Teclado | Ej. Genius KB-118 |
| HW manual | CPU `Intel Core i5-12400`, RAM `16`, disco `SSD 512GB NVMe` |

**Pasos:**

1. **Periféricos manuales** → tab Periféricos → alta de monitor, mouse y teclado en stock (`Sin Asignar`).
2. **PC en stock** → tab *Computadoras en stock* → "Nueva PC a stock" con tipo y condición.
3. Abrir detalle de la PC y verificar:
   - Badge origen **STOCK**
   - Badge conciliación **Sin baseline**
   - Botón **Armar computadora** visible
4. Abrir modal → elegir los 3 periféricos + CPU/RAM/disco → revisar preview → confirmar (aceptar aviso de irreversibilidad).
5. Post-armado en UI:
   - Badge **Baseline listo**
   - Bloque baseline read-only (periféricos, HW, fecha de armado)
   - Botón "Armar" **ya no visible**
6. En **listado de computadoras**: filtrar por estado de baseline → la PC aparece como armada.
7. Verificar en **Firestore** (ver sección [Verificación Firestore](#verificación-firestore)).
8. Repetir entrada desde **PerifericoManualList** con otra PC para confirmar paridad de comportamiento.

**Registro:**

| Campo | Valor |
|-------|-------|
| UUID PC | |
| Hostname | |
| `combo_esperado_id` | |
| IDs periféricos usados | |
| ¿Normalización CPU/disco OK? | ☐ Sí ☐ No |
| ¿UI coherente post-refresh? | ☐ Sí ☐ No |
| Observaciones | |

---

### PC-B — Solo periféricos, sin HW manual (obligatorio)

**Objetivo:** validar regla "al menos un periférico **o** HW manual" cuando solo hay periféricos.

1. Crear `PILOTO-STOCK-02` + al menos un monitor en stock.
2. Armar combo **sin** CPU/RAM/disco.
3. Verificar `baseline_esperado.perifericos` con el ítem elegido.
4. Confirmar badge `BASELINE_LISTO` y filtro en listado.

**Registro:**

| Campo | Valor |
|-------|-------|
| UUID PC | |
| Periféricos usados | |
| ¿Baseline OK en Firestore? | ☐ Sí ☐ No |

---

### PC-C — Solo HW manual, sin periféricos (opcional)

**Objetivo:** validar baseline mínimo solo con CPU/RAM/disco declarados.

1. Crear `PILOTO-STOCK-03`.
2. Armar con CPU + RAM, sin elegir periféricos.
3. Verificar `baseline_esperado.perifericos: []` y `estado_conciliacion: BASELINE_LISTO`.

**Registro:**

| Campo | Valor |
|-------|-------|
| UUID PC | |
| CPU / RAM / disco declarados | |
| ¿Baseline OK? | ☐ Sí ☐ No |

---

## Pruebas negativas

Ejecutar después de PC-A (usa los mismos datos).

| # | Acción | Resultado esperado | ☐ OK |
|---|--------|-------------------|------|
| 1 | Intentar armar de nuevo PC-A | Error 409 o mensaje claro "ya tiene baseline" | |
| 2 | Armar otra PC usando monitor ya asignado a PC-A | Error 409 "no disponible" / "ya vinculado" | |
| 3 | Abrir detalle de PC legacy (`origenAlta: LEGACY`) | **No** aparece botón Armar | |
| 4 | PC con estado distinto de Sin Asignar (asignada) | **No** aparece botón Armar | |
| 5 | Modal sin periféricos ni HW → confirmar | Validación: indicar al menos un periférico o dato HW | |
| 6 | Armado desde `PerifericoManualList` vs `ComputadoraDetail` | Mismo resultado en ambos | |

---

## Prueba de concurrencia (opcional, recomendada)

Solo si hay un periférico en stock con **`cantidad > 1`** (lote).

1. Dos técnicos abren armado de **PCs distintas** casi al mismo tiempo.
2. Ambos seleccionan el **mismo ítem de lote**.
3. **Esperado:** un POST responde 200, el otro 409, sin sobreasignación en Firestore.

| Campo | Valor |
|-------|-------|
| ID periférico lote | |
| Cantidad inicial | |
| ¿Uno 200 / uno 409? | ☐ Sí ☐ No |
| ¿Cantidad en Firestore coherente? | ☐ Sí ☐ No |

---

## Verificación Firestore

Tras armar PC-A, revisar documento `computadoras/{uuid}`:

```text
estado_conciliacion: "BASELINE_LISTO"
combo_esperado_id: "<uuid>"
baseline_esperado: {
  cpu_modelo: "intel core i5-12400"     # trim + minúsculas
  ram_total_gb: 16                     # entero
  disco_resumen: "ssd 512gb nvme"      # trim + minúsculas
  perifericos: [{
    tipo: "monitor" | "mouse" | "teclado",
    id_stock: "<id PerifericoManual>",
    nombre, fabricante, numero_serie
  }],
  armado_at: <timestamp>,
  armado_por: <usuario|null>
}
historialEstados: ... entrada "Combo armado" ...
```

En cada periférico vinculado (`perifericos_manuales/{id}`):

```text
computadora_uuid: "<uuid de la PC>"
computadoraHostname: "<hostname PC>"
comboId: "<mismo combo_esperado_id>"
# estado coherente con asignación / split de lote
```

### Checklist Firestore

| Verificación | ☐ OK |
|--------------|------|
| `estado_conciliacion` = `BASELINE_LISTO` | |
| `combo_esperado_id` presente y no vacío | |
| `baseline_esperado.perifericos` coincide con selección UI | |
| `cpu_modelo` y `disco_resumen` en minúsculas normalizadas | |
| `ram_total_gb` es entero ≥ 0 | |
| Periféricos tienen `computadora_uuid` = UUID de la PC | |
| `comboId` en periféricos = `combo_esperado_id` en PC | |
| Historial PC registra armado del combo | |

---

## Procedimiento de corrección manual

Si se armó con periférico incorrecto (**no existe "desarmar combo" en 1b**):

1. Identificar PC (`computadoras/{uuid}`) y periféricos (`computadora_uuid`).
2. **En cada periférico:** quitar `computadora_uuid`, `computadoraHostname`, `comboId`; restaurar estado `Sin Asignar`.
3. **En la PC:** borrar `baseline_esperado`, `combo_esperado_id`; setear `estado_conciliacion = SIN_BASELINE`.
4. Opcional: entrada en `historialEstados` explicando la corrección.

Documentar casos reales aquí para diseñar el endpoint de desarmar en backlog:

| Fecha | PC (uuid) | Error | Corrección aplicada |
|-------|-----------|-------|---------------------|
| | | | |

---

## Criterios de aceptación del piloto

Marcar al cerrar. Deben alinearse con [`iteracion-fase1b-pasos.md`](./iteracion-fase1b-pasos.md).

### Funcional

- [ ] Desde detalle de PC en stock (`SIN_BASELINE`), puedo abrir "Armar computadora".
- [ ] Puedo elegir monitor/mouse/teclado del stock disponible (máx. 1 por tipo).
- [ ] Puedo declarar CPU/RAM/disco esperados opcionalmente.
- [ ] Al confirmar, periféricos quedan vinculados por `computadora_uuid` (y hostname).
- [ ] La PC persiste `baseline_esperado` y `combo_esperado_id`.
- [ ] `estadoConciliacion` pasa a `BASELINE_LISTO`.
- [ ] Historial de la PC registra el armado del combo.
- [ ] Detalle muestra el baseline armado (solo lectura).
- [ ] No puedo armar una PC ya en `BASELINE_LISTO` (error claro).
- [ ] No puedo usar un periférico ya asignado a otra PC.
- [ ] Listado permite distinguir PCs con/sin baseline.
- [ ] PCs `LEGACY` / `NO_APLICA` no muestran flujo de armado.
- [ ] Modal advierte que el armado **no es reversible** desde la app.
- [ ] `cpu_modelo` y `disco_resumen` persistidos normalizados (trim + lowercase).

### Piloto específico

- [ ] Al menos **2 PCs reales** en dev con baseline verificado en Firestore.
- [ ] Entrada probada desde detalle **y** desde tab stock (`PerifericoManualList`).
- [ ] Pruebas negativas (re-armado, periférico ocupado, legacy) OK.
- [ ] (Opcional) Concurrencia en lote `cantidad > 1` OK.
- [ ] Equipo IT considera el flujo usable y distinguible de "asignar periférico suelto".

---

## Resultado del piloto

Completar al finalizar la sesión.

| Campo | Valor |
|-------|-------|
| Fecha de ejecución | |
| Entorno | dev / staging |
| Participantes | |
| PCs piloto (hostnames) | |
| Resultado global | ☐ Aprobado ☐ Aprobado con observaciones ☐ Rechazado |
| Bloqueantes para Fase 2 | |
| Mejoras UX detectadas | |
| ¿Actualizar `iteracion-fase1b-pasos.md` estado a "Validada"? | ☐ Sí ☐ No |

### Observaciones

_(Espacio libre para notas del equipo durante el piloto.)_

---

## Próximo paso tras piloto aprobado

1. Marcar criterios de aceptación en [`iteracion-fase1b-pasos.md`](./iteracion-fase1b-pasos.md).
2. Actualizar estado en [`trazabilidad-stock-agente.md`](./trazabilidad-stock-agente.md) (1b validada en piloto).
3. Iniciar diseño/implementación **Fase 2**: servicio matching async, bandeja de conciliaciones, índices Firestore — ver [`iteracion-fase2-pasos.md`](./iteracion-fase2-pasos.md).
