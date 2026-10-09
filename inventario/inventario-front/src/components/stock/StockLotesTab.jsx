import { Package, Layers, MapPin, Edit2, ArrowUpRight } from 'lucide-react';
import { BadgeDisponibilidad, StockInfoBanner } from '../StockEstadoBadges';
import { labelDeCatalogo } from '../../hooks/useCatalogo';
import { etiquetaFromItem, resolveSpecFromItem, UBICACION_DEPOSITO_DEFAULT } from '../../utils/stockPcHelpers';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';

export default function StockLotesTab({
  lotesFiltrados,
  buscarLote,
  onBuscarLoteChange,
  totalUnidadesLotes,
  lotesCount,
  tiposEquipoItems,
  condicionesItems,
  estadoLabels,
  onOpenSacarUnidad,
  onOpenEdit,
  onUpdateStock,
  onBajaUnidad,
}) {
  return (
    <>
      <StockInfoBanner tipo="lotes" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Total unidades</span>
            <span className="text-3xl font-black font-mono text-teal-600">{totalUnidadesLotes}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Ítems distintos</span>
            <span className="text-3xl font-black font-mono text-slate-900">{lotesCount}</span>
          </div>
        </div>
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscarLote}
            onChange={onBuscarLoteChange}
            placeholder="Buscar por CPU, RAM, descripción, ubicación..."
          />
        </TableFilters>
      </StudioFilterBar>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Etiqueta</th>
                <th className="py-4 px-5">Descripción</th>
                <th className="py-4 px-5">Tipo de equipo</th>
                <th className="py-4 px-5">Condición</th>
                <th className="py-4 px-5">Disponibilidad</th>
                <th className="py-4 px-5">Ubicación</th>
                <th className="py-4 px-5 text-center">Cantidad</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {lotesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No hay ítems en stock de PCs. Usá &quot;Cargar al stock&quot; para registrar ej. 3× Ryzen 5600G 8GB.
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map((lote) => {
                  const loteSpec = resolveSpecFromItem(lote);
                  return (
                    <tr key={lote.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="text-xs font-semibold text-teal-800">{etiquetaFromItem(lote) || '—'}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium text-slate-700">{lote.nombre?.trim() || '—'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium text-slate-700">
                          {loteSpec.tipoEquipo
                            ? labelDeCatalogo(tiposEquipoItems, loteSpec.tipoEquipo)
                            : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium text-slate-700">
                          {loteSpec.condicion
                            ? labelDeCatalogo(condicionesItems, loteSpec.condicion)
                            : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <BadgeDisponibilidad estadoActual={lote.estado} estadoLabels={estadoLabels} />
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lote.ubicacion || UBICACION_DEPOSITO_DEFAULT}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-bold font-mono text-slate-900 text-base">{lote.cantidad ?? 1}</span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {(lote.cantidad ?? 0) > 0 && loteSpec.cpuModelo && (
                            <button
                              type="button"
                              onClick={() => onOpenSacarUnidad(lote)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                              title="Crear computadora trazable y restar 1 del lote"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Sacar 1
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onBajaUnidad(lote)}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            title="Dar de baja 1 unidad"
                          >
                            Baja 1
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEdit(lote)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => onUpdateStock(lote, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                              title="Restar 1 unidad"
                            >
                              -
                            </button>
                            <span className="text-slate-300 mx-0.5 text-xs">|</span>
                            <button
                              type="button"
                              onClick={() => onUpdateStock(lote, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                              title="Sumar 1 unidad"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
