import { Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, MapPin, UserCheck, Edit2, Layers } from 'lucide-react';
import { BadgeDisponibilidad } from '../StockEstadoBadges';
import { labelTipoStock, normalizarTipoStock, esTipoInfra } from '../../constants/tiposStock';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';
import { getCategoryColor } from '../../utils/stockListHelpers';

export default function PerifericosTab({
  lista,
  itemsFiltrados,
  buscar,
  onBuscarChange,
  selectedCategory,
  onCategoryChange,
  estadoLabels,
  onUpdateStock,
  onBajaUnidad,
  onOpenEdit,
  onAsignarPeriferico,
}) {
  const navigate = useNavigate();

  const totalEnBodega = lista.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const tiposDistintos = new Set(lista.map(p => normalizarTipoStock(p.tipo))).size;

  const uniqueCategories = [...new Set(
    lista.map(p => normalizarTipoStock(p.tipo)).filter(Boolean),
  )];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">En bodega</span>
            <span className="text-3xl font-black font-mono text-emerald-600">
              {totalEnBodega}
              {' '}
              <span className="text-base font-normal text-slate-400">unidades</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Tipos distintos</span>
            <span className="text-3xl font-black font-mono text-slate-900">{tiposDistintos}</span>
          </div>
        </div>
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscar}
            onChange={onBuscarChange}
            placeholder="Buscar por componente, ID o ubicación..."
          />
          <TableFilters.Select
            value={selectedCategory}
            onChange={onCategoryChange}
            label="Filtro"
          >
            <option value="All">Todas las categorías</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{labelTipoStock(cat)}</option>
            ))}
          </TableFilters.Select>
        </TableFilters>
      </StudioFilterBar>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">COD / ID</th>
                <th className="py-4 px-5">Componente IT / Fabricante</th>
                <th className="py-4 px-5">Categoría</th>
                <th className="py-4 px-5">Ubicación / Estado</th>
                <th className="py-4 px-5 text-center">Nivel de Stock</th>
                <th className="py-4 px-5 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No se encontraron componentes en el inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/perifericos/stock/${encodeURIComponent(c.id)}`)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-blue-600 text-xs">
                        {c.id}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="space-y-1">
                        <p className="capitalize">{c.nombre ?? c.fabricante ?? '—'}</p>
                        {c.conexion && (
                          <p className="text-[11px] text-slate-400 font-normal">
                            Conexión:
                            {' '}
                            {c.conexion}
                          </p>
                        )}
                        {c.numeroSerie && (
                          <p className="text-[11px] text-slate-500 font-mono font-normal">
                            S/N:
                            {' '}
                            {c.numeroSerie}
                          </p>
                        )}
                        {c.comboNombre && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            <Layers className="w-3 h-3" />
                            {c.comboNombre}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(c.tipo)}`}>
                        {labelTipoStock(c.tipo) || 'Sin tipo'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <BadgeDisponibilidad estadoActual={c.estado} estadoLabels={estadoLabels} />
                        {(c.computadoraUuid || c.computadoraHostname || c.ubicacion) && (
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {c.computadoraUuid ? (
                              <Link
                                to={`/computadoras/${encodeURIComponent(c.computadoraUuid)}`}
                                className="truncate max-w-[150px] text-indigo-600 hover:underline"
                                title={c.computadoraHostname || c.computadoraUuid}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.computadoraHostname || c.computadoraUuid.slice(0, 8)}
                              </Link>
                            ) : (
                              <span className="truncate max-w-[150px]" title={c.computadoraHostname || c.ubicacion}>
                                {c.computadoraHostname || c.ubicacion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="font-bold font-mono text-slate-900 text-base">
                        {c.cantidad ?? 1}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm mr-2">
                          <button
                            type="button"
                            onClick={() => onUpdateStock(c, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Restar 1 unidad"
                          >
                            -
                          </button>
                          <span className="text-slate-300 mx-0.5 text-xs">|</span>
                          <button
                            type="button"
                            onClick={() => onUpdateStock(c, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onBajaUnidad(c)}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          title="Dar de baja 1 unidad"
                        >
                          Baja 1
                        </button>
                        <button
                          type="button"
                          onClick={() => onAsignarPeriferico(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Asignar
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEdit(c)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Editar suministro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
