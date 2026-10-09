import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { BadgeDisponibilidad } from '../StockEstadoBadges';
import { fmtFechaIso } from '../DetailInfraHelpers';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';

export default function StockBajasTab({ filas = [], estadoLabels = {} }) {
  const [buscar, setBuscar] = useState('');

  const unidades = useMemo(
    () => filas.reduce((sum, fila) => sum + (fila.cantidad ?? 1), 0),
    [filas],
  );

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((fila) => {
      const text = `${fila.nombre} ${fila.clase} ${fila.motivo || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [filas, buscar]);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
          <Archive className="w-6 h-6" />
        </div>
        <div>
          <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">En baja</span>
          <span className="text-3xl font-black font-mono text-slate-900">
            {unidades}
            {' '}
            <span className="text-base font-normal text-slate-400">
              {unidades === 1 ? 'unidad' : 'unidades'}
            </span>
          </span>
        </div>
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por nombre, tipo o motivo..."
          />
        </TableFilters>
      </StudioFilterBar>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Qué es</th>
                <th className="py-4 px-5">Tipo</th>
                <th className="py-4 px-5">Cantidad</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5">Desde</th>
                <th className="py-4 px-5">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    {filas.length === 0
                      ? 'No hay computadoras ni componentes en baja.'
                      : 'Ningún registro coincide con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                visibles.map((fila) => (
                  <tr key={fila.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {fila.href ? (
                        <Link to={fila.href} className="text-slate-900 hover:text-indigo-700 hover:underline">
                          {fila.nombre}
                        </Link>
                      ) : (
                        fila.nombre
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                        {fila.clase}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">{fila.cantidad ?? 1}</td>
                    <td className="py-4 px-5">
                      <BadgeDisponibilidad estadoActual={fila.estado} estadoLabels={estadoLabels} />
                    </td>
                    <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                      {fila.desde ? fmtFechaIso(fila.desde) : '—'}
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {fila.motivo || '—'}
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
