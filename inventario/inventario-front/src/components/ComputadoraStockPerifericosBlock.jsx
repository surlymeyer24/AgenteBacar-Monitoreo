import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { fetchPerifericosPorPc } from '../api/perifericoManualApi';
import { labelTipoStock, normalizarTipoStock } from '../constants/tiposStock';
import { BadgeDisponibilidad } from './StockEstadoBadges';

export default function ComputadoraStockPerifericosBlock({ uuid, estadoLabels }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uuid) return undefined;
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchPerifericosPorPc(uuid)
      .then(data => {
        if (!cancel) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancel) {
          setError('No se pudieron cargar los periféricos de stock.');
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });
    return () => { cancel = true; };
  }, [uuid]);

  if (cargando) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-slate-500 font-medium">Cargando periféricos de stock asignados…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-700">Sin periféricos de stock asignados</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Los ítems asignados desde el depósito aparecerán acá. Podés gestionarlos en{' '}
              <Link to="/perifericos/stock?vista=asignaciones" className="text-indigo-600 hover:underline font-bold">
                Asignaciones
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Periféricos de stock asignados
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {items.length}
              {' '}
              ítem(s) del depósito vinculados a esta PC
            </p>
          </div>
        </div>
        <Link
          to="/perifericos/stock?vista=asignaciones"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
        >
          Ver todas las asignaciones
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">Ítem</th>
              <th className="py-3 px-5">Tipo</th>
              <th className="py-3 px-5">Estado</th>
              <th className="py-3 px-5 text-right">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-5">
                  <p className="font-bold text-slate-900">{item.nombre || item.fabricante || '—'}</p>
                  {item.numeroSerie && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      S/N:
                      {' '}
                      {item.numeroSerie}
                    </p>
                  )}
                </td>
                <td className="py-3 px-5">
                  <span className="text-xs font-semibold text-slate-600 capitalize">
                    {labelTipoStock(normalizarTipoStock(item.tipo))}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <BadgeDisponibilidad estadoActual={item.estado} estadoLabels={estadoLabels} />
                </td>
                <td className="py-3 px-5 text-right">
                  <Link
                    to={`/perifericos/stock/${encodeURIComponent(item.id)}`}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
