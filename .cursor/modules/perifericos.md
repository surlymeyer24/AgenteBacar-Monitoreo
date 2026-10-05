# Módulo: Periféricos / Stock de depósito

Slug: `perifericos`

## Qué es

Pantalla "Inventario IT y Control de Suministros": stock manual de depósito (periféricos, lotes de PCs, pipeline de computadoras, infraestructura) y la vista de asignaciones.

## Dónde buscar

Frontend (pantalla de stock):

- `inventario/inventario-front/src/pages/PerifericoManualList.jsx` — página, tabs y wiring
- `inventario/inventario-front/src/components/stock/PerifericosTab.jsx`
- `inventario/inventario-front/src/components/stock/StockLotesTab.jsx`
- `inventario/inventario-front/src/components/stock/StockUnidadesTab.jsx`
- `inventario/inventario-front/src/components/stock/StockInfraTab.jsx`
- `inventario/inventario-front/src/components/stock/StockCelularesTab.jsx`
- `inventario/inventario-front/src/components/stock/StockAsignacionesTab.jsx`
- `inventario/inventario-front/src/components/stock/StockManualListModals.jsx`
- `inventario/inventario-front/src/components/stock/StockPcPipeline.jsx`
- `inventario/inventario-front/src/hooks/usePerifericoManualListData.js`
- `inventario/inventario-front/src/hooks/usePerifericoItemForm.js`
- `inventario/inventario-front/src/hooks/useStockComboForm.js`
- `inventario/inventario-front/src/utils/asignacionesStockHelpers.js`
- `inventario/inventario-front/src/utils/stockListHelpers.js`
- `inventario/inventario-front/src/constants/tiposStock.js`
- `inventario/inventario-front/src/pages/PerifericosDashboard.jsx`
- `inventario/inventario-front/src/pages/PerifericoManualDetail.jsx`, `PerifericoManualNuevo.jsx`
- `inventario/inventario-front/src/api/perifericoManualApi.js`

Backend (periféricos manuales):

- `inventario/src/main/java/com/bacarsa/inventario/controller/PerifericoManualController.java`
- `inventario/src/main/java/com/bacarsa/inventario/services/PerifericoManualService.java`
- `inventario/src/main/java/com/bacarsa/inventario/repository/PerifericoManualRepository.java`

## Qué ver primero (orden)

1. `PerifericoManualList.jsx` — tabs (`perifericos`, `lotes-pc`, `unidades`, `infraestructura`, `celulares`), vista `stock` vs `asignaciones`, y qué props recibe cada tab.
2. `usePerifericoManualListData.js` — de dónde salen los datos y cómo se refrescan.
3. El `*Tab.jsx` que corresponda — patrón de tarjetas, badges y acciones.
4. `StockManualListModals.jsx` — cómo se montan los modales de alta/edición/asignación.

## Qué tocar

- Página de stock, sus tabs y modales bajo `components/stock/`.
- Hooks y utils propios de esa pantalla.
- Dashboard de periféricos (KPIs y links de esa pantalla).
- Backend de periféricos manuales cuando el contrato lo requiera.

## Qué NO tocar

- Módulo **celulares**: no editar `CelularList.jsx`, `celularApi.js`, `constants/celulares.js`, ni el backend de celulares. Se consume su API tal cual; si falta un endpoint o helper, se pide al padre.
- Módulo **computadoras**: reglas del pipeline (`pipelinePcHelpers.js`), `EditPcStockModal`, `ArmarComboModal`, backend de computadoras. Se usa lo que ya existe.
- Cámaras, infraestructura de red backend, tesorería, internos, auth, logística QR.
- `inventario/public/assets` (build generado), secretos, CI y deploy.
- Contratos del agente Python AgenteBacar.

## Dependencias

Este módulo usa: catálogos (`tipos_stock`, `estados_operativos`, `tipos_equipo`, `condiciones_equipo`, `ubicaciones_computadora`), API de periféricos manuales, API de computadoras, API de celulares (solo lectura/consumo).
Este módulo es usado por: dashboard de periféricos, reportes.

## Notas

- La vista se controla por query param `?vista=asignaciones`; las tabs de stock viven en estado local (`activeTab`).
- Cada tab tiene su badge de conteo en el botón; seguí ese patrón al agregar una tab.
- Los estados operativos se resuelven por catálogo (`estadoLabels`), no hardcodeados.
- Celulares tienen su propio estado (`activo` / `en_stock` / `baja`), distinto de los estados operativos de periféricos. No mezclar.
- Tab Celulares (vista Stock): lista `useCelulares()` filtrado con `esCelularEnStock`. Edición y asignación van en `StockCelularesTab` (modales propios). Los que cumplen `esCelularAsignadoDesdeStock` sí aparecen en la vista Asignaciones (Devolver reutiliza `devolverCelularAStock`). Las PCs de origen stock en columna Asignada del pipeline también se listan ahí, solo lectura.
