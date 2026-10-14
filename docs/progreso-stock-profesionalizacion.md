# Profesionalización del Stock — Progreso

Estado al **2026-09-09**. Objetivo: que el flujo de stock de PCs y periféricos sea claro, trazable e intuitivo.

---

## Fase A — Bugs y consistencia de datos ✅

Correcciones puntuales sobre datos que se perdían o colisionaban.

### A1: Hostname collision en sacarUnidad
- **Problema:** dos extracciones del mismo lote generaban hostnames idénticos porque el sufijo venía del lote ID (`loteId.substring(length - 4)`).
- **Fix:** se usa `pcUuid.substring(0, 8)` (único por unidad). Frontend idem con `crypto.randomUUID().slice(0, 8)`.
- **Archivos:** `PerifericoManualService.java`, `stockPcHelpers.js`

### A2: Naming mixto en Firestore (`computadoraHostname` vs `computadora_hostname`)
- **Problema:** campo camelCase en un doc donde todo lo demás es snake_case. Queries inconsistentes.
- **Fix:** unificado a `computadora_hostname` con `@PropertyName`. Lectura con fallback legacy para docs viejos.
- **Archivos:** `PerifericoManual.java`, `PerifericoManualRepository.java`, `PerifericoManualService.java`, `ArmadoComboService.java`

### A3: Trazabilidad perdida en asignar/clonar
- **Problema:** al asignar un periférico, el clon perdía `loteOrigenId`, `ubicacion` y `especificacion_stock`.
- **Fix:** nuevo campo `loteOrigenId` en modelo + DTO. Se copian los campos faltantes en `asignar()` y `copiarPerifericoParaAsignacion()`.
- **Archivos:** `PerifericoManual.java`, `PerifericoManualDTO.java`, `PerifericoManualMapper.java`, `PerifericoManualService.java`, `ArmadoComboService.java`

### A4: Link periférico↔PC por UUID en vez de hostname
- **Problema:** `cambiarEstado()` usaba hostname (mutable) para inferir asignación.
- **Fix:** usa `computadoraUuid` (inmutable). Se deprecó `findByComputadoraHostname` con dual-query.
- **Archivos:** `PerifericoManualService.java`, `PerifericoManualRepository.java`

---

## Fase B — Separar EstadoConciliacion en dos ejes ✅

El enum `EstadoConciliacion` mezclaba tres conceptos en un solo campo. Se separó en dos ejes ortogonales.

### B1: Nuevos enums
- `EstadoPreparacion`: `SIN_ARMAR` → `ARMADO` → `NO_APLICA`
- `EstadoReporteAgente`: `SIN_REPORTE` → `MATCH_SUGERIDO` → `CONFIRMADA` / `DISCREPANCIA` → `NO_APLICA`
- **Archivos nuevos:** `EstadoPreparacion.java`, `EstadoReporteAgente.java`

### B2: Modelo y DTOs
- `Computadora.java`: campos `estadoPreparacion` + `estadoReporteAgente` con `@PropertyName` snake_case. Campo viejo marcado `@Deprecated`.
- `ComputadoraDTO.java` y `ComputadoraListadoDTO.java`: strings nuevos agregados.
- `ComputadoraListadoFields.java`: proyección Firestore ampliada.

### B3: Escritura dual en services
Todos los puntos que escriben estado ahora graban **ambos** campos nuevos + el viejo `estado_conciliacion` para backward compat:

| Service | Transición |
|---|---|
| `ComputadoraService.crear()` | → `SIN_ARMAR` / `SIN_REPORTE` |
| `PerifericoManualService.sacarUnidad()` | → `SIN_ARMAR` / `SIN_REPORTE` |
| `ArmadoComboService` (armado) | → `ARMADO` |
| `MatchingStockService` (match) | → `MATCH_SUGERIDO` |
| `ConciliacionStockService.confirmar()` | → `CONFIRMADA` o `DISCREPANCIA` |
| `ConciliacionStockService.rechazar()` | → `SIN_REPORTE` |
| `MigracionTrazabilidadService` | → según caso legacy |

### B4: Lectura con fallback
- `ComputadoraMapper`: lee campos nuevos del modelo; si son null, deriva desde `estadoConciliacion` viejo con switch expression.
- `ComputadoraListadoMapper`: lee desde Firestore doc; misma derivación si los campos no existen.
- `ConciliacionComparador`: `ComparacionResult` retorna ambos tipos (nuevo + deprecated).

### B5: Frontend migrado
- `StockEstadoBadges.jsx`: mapas por `estadoPreparacion` y `estadoReporteAgente` (ya no por `estadoConciliacion`). Leyenda actualizada con "AgenteBacar".
- `ComputadoraDetail.jsx`: badges separados Preparación + Reporte. Lógica `puedeArmarCombo` usa `estadoPreparacion` con fallback legacy.
- `ComputadoraList.jsx`: filtro renombrado de "Baseline" a "Preparación" con opciones `SIN_ARMAR` / `ARMADO` / `NO_APLICA`.
- `ComputadorasListLayout.jsx`: campos nuevos en la proyección del listado.
- `PerifericoManualList.jsx`: `unidadesConBaseline` y `puedeArmarPcStock` usan `estadoPreparacion`.
- `perifericoPcHelpers.js`: label de PC usa `estadoPreparacion`.
- `stockPcHelpers.js`: `computadoraDesdeSacarUnidad` incluye ambos campos nuevos.

### B6: Compilación verificada
- `mvn compile` ✅
- `vite build` ✅ (124 entries precached)

---

## Fase D — Refactor PerifericoManualList.jsx ✅

**Problema:** archivo monolítico (~2230 líneas) con lógica de lotes, unidades, periféricos, modales y formularios mezclados.

**Hecho:**
- `PerifericoManualList.jsx` reducido a ~380 líneas (orquestador: tabs, header, wiring)
- Subcomponentes en `components/stock/`:
  - `PerifericosTab.jsx` — KPIs + tabla de periféricos
  - `StockLotesTab.jsx` — stock por cantidad (lotes PC)
  - `StockUnidadesTab.jsx` — computadoras trazables en depósito
  - `StockManualListModals.jsx` — todos los modales (form, combo, asignar, editar PC, sacar unidad)
- Hooks extraídos:
  - `usePerifericoManualListData` — fetch lista + PCs
  - `usePerifericoItemForm` — formulario alta/edición periférico/lote
  - `useStockComboForm` — modal combo
  - `useStockPcModals` — estado y handlers de modales PC
- Helpers: `utils/stockListHelpers.js`
- `vite build` ✅ — misma UX, refactor interno sin cambios visibles

---

## Fase C — Timeline / ficha unificada ✅

**Problema:** para entender la historia de una PC hay que navegar entre varias pantallas (detalle, stock, conciliación, periféricos).

**Hecho:**
- **Backend:** `GET /api/computadoras/{uuid}/timeline` agrega:
  - `CAMBIO_ESTADO` desde `historialEstados`
  - `EVENTO_HARDWARE` desde AgenteBacar (con dedup existente)
  - `CONCILIACION` desde `conciliaciones_stock` (query por agente o stock UUID)
  - `SISTEMA` (primer reporte agente, matching en proceso)
  - Dedup: omite entradas de historial duplicadas al confirmar conciliación
- **Archivos:** `ComputadoraTimelineItemDTO`, `ComputadoraTimelineService`, `ConciliacionStockRepository.findByPcUuid`
- **Frontend:** `ComputadoraTimelineUnificada.jsx` + hook `useComputadoraTimeline`
- **Ficha PC:** solapa renombrada a **Historial**; header usa `StockEstadosUnidad` (3 ejes + origen)
- `mvn compile` ✅ · `vite build` ✅

---

## Decisiones técnicas vigentes

| Decisión | Razón |
|---|---|
| **Dual-write** (campos nuevos + viejo) | Docs existentes en Firestore siguen funcionando sin migración masiva obligatoria |
| **Fallback en mappers** | Docs sin campos nuevos derivan valores desde `estadoConciliacion` al leer |
| **`estadoReporteAgente`** (no `estadoAgente`) | `estadoAgente` ya existe en `ComputadoraListadoDTO` para conexión online/offline del agente |
| **`estadoConciliacion` marcado `@Deprecated`** | Se mantiene para backward compat; no borrar hasta que todos los docs tengan los campos nuevos |
