import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Router, Package, RotateCcw, MapPin, Laptop } from 'lucide-react';
import { devolverStockM } from '../../api/perifericoManualApi';
import { labelTipoStock, normalizarTipoStock } from '../../constants/tiposStock';
import {
  filtrarAsignados,
  esAsignacionInfra,
  esAsignacionPeriferico,
  destinoAsignacion,
  fmtFechaAsignacion,
  motivoAsignacionDesdeHistorial,
  resumenItemAsignado,
} from '../../utils/asignacionesStockHelpers';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';
import WriteGate from '../WriteGate';
import { BadgeDisponibilidad } from '../StockEstadoBadges';

const SOLAPAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'perifericos', label: 'Periféricos' },
  { id: 'infra', label: 'Infraestructura' },
];

function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 ${colorBg} ${colorText} rounded-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">{label}</span>
        <span className={`text-3xl font-black font-mono ${colorText}`}>{value}</span>
        {sub && <span className="text-xs text-slate-500 font-medium block mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function StockAsignacionesTab({ lista, estadoLabels, onRefresh }) {
  const [solapa, setSolapa] = useState('todos');
  const [buscar, setBuscar] = useState('');
  const [devolverItem, setDevolverItem] = useState(null);
  const [motivoDevolver, setMotivoDevolver] = useState('');
  const [devolviendo, setDevolviendo] = useState(false);

  const asignados = useMemo(
    () => filtrarAsignados(lista, estadoLabels),
    [lista, estadoLabels],
  );

  const conteos = useMemo(() => {
    const perif = asignados.filter(i => esAsignacionPeriferico(i, estadoLabels));
    const infra = asignados.filter(i => esAsignacionInfra(i, estadoLabels));
    const unidades = asignados.reduce((s, i) => s + (i.cantidad ?? 1), 0);
    const aPc = asignados.filter(i => destinoAsignacion(i).tipo === 'pc');
    return {
      unidades,
      perif: perif.reduce((s, i) => s + (i.cantidad ?? 1), 0),
      infra: infra.reduce((s, i) => s + (i.cantidad ?? 1), 0),
      aPc: aPc.reduce((s, i) => s + (i.cantidad ?? 1), 0),
    };
  }, [asignados, estadoLabels]);

  const filtrados = useMemo(() => {
    let list = asignados;
    if (solapa === 'perifericos') {
      list = list.filter(i => esAsignacionPeriferico(i, estadoLabels));
    } else if (solapa === 'infra') {
      list = list.filter(i => esAsignacionInfra(i, estadoLabels));
    }
    const q = buscar.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item => {
      const dest = destinoAsignacion(item);
      const blob = [
        item.id,
        item.nombre,
        item.fabricante,
        item.numeroSerie,
        item.tipo,
        dest.label,
        item.computadoraHostname,
        motivoAsignacionDesdeHistorial(item),
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [asignados, solapa, buscar, estadoLabels]);

  const handleDevolver = async () => {
    if (!devolverItem) return;
    setDevolviendo(true);
    try {
      await devolverStockM(
        devolverItem.id,
        motivoDevolver.trim() || 'Devolución a stock',
      );
      setDevolverItem(null);
      setMotivoDevolver('');
      await onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('No se pudo devolver el ítem a stock.');
    } finally {
      setDevolviendo(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Total asignado"
          value={conteos.unidades}
          sub={`${asignados.length} ítem(s) distintos`}
          colorBg="bg-indigo-50"
          colorText="text-indigo-600"
        />
        <KpiCard
          icon={Monitor}
          label="Periféricos"
          value={conteos.perif}
          sub="En uso / en PC"
          colorBg="bg-blue-50"
          colorText="text-blue-600"
        />
        <KpiCard
          icon={Router}
          label="Infraestructura"
          value={conteos.infra}
          sub="Instalados en campo"
          colorBg="bg-orange-50"
          colorText="text-orange-600"
        />
        <KpiCard
          icon={Laptop}
          label="Vinculados a PC"
          value={conteos.aPc}
          sub="Con hostname destino"
          colorBg="bg-violet-50"
          colorText="text-violet-600"
        />
      </div>

      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {SOLAPAS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSolapa(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              solapa === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por ítem, S/N, PC, ubicación…"
          />
        </TableFilters>
      </StudioFilterBar>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Ítem</th>
                <th className="py-4 px-5">Tipo</th>
                <th className="py-4 px-5">Destino</th>
                <th className="py-4 px-5">Asignado</th>
                <th className="py-4 px-5">Motivo</th>
                <th className="py-4 px-5 text-center">Cant.</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No hay asignaciones activas
                    {solapa !== 'todos' ? ' en esta categoría' : ''}
                    . Asigná ítems desde la solapa <strong>Stock</strong>.
                  </td>
                </tr>
              ) : (
                filtrados.map(item => {
                  const dest = destinoAsignacion(item);
                  const motivo = motivoAsignacionDesdeHistorial(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-5">
                        <Link
                          to={`/perifericos/stock/${encodeURIComponent(item.id)}`}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {resumenItemAsignado(item)}
                        </Link>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.id}</p>
                        {item.numeroSerie && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            S/N:
                            {' '}
                            {item.numeroSerie}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-bold capitalize text-slate-700">
                          {labelTipoStock(normalizarTipoStock(item.tipo))}
                        </span>
                        <div className="mt-1">
                          <BadgeDisponibilidad estadoActual={item.estado} estadoLabels={estadoLabels} />
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {dest.tipo === 'pc' && dest.uuid ? (
                          <Link
                            to={`/computadoras/${encodeURIComponent(dest.uuid)}`}
                            className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                          >
                            <Laptop className="w-3.5 h-3.5" />
                            {dest.label}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {dest.label}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {fmtFechaAsignacion(item)}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-600 max-w-[200px] truncate" title={motivo || ''}>
                        {motivo || '—'}
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-bold">
                        {item.cantidad ?? 1}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <WriteGate>
                          <button
                            type="button"
                            onClick={() => {
                              setDevolverItem(item);
                              setMotivoDevolver('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 rounded-lg font-bold text-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Devolver
                          </button>
                        </WriteGate>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {devolverItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-extrabold text-sm text-slate-900">Devolver a stock</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {resumenItemAsignado(devolverItem)}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo</label>
                <input
                  type="text"
                  value={motivoDevolver}
                  onChange={e => setMotivoDevolver(e.target.value)}
                  placeholder="Ej: Fin de proyecto, reemplazo…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDevolverItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDevolver}
                  disabled={devolviendo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold"
                >
                  {devolviendo ? 'Devolviendo…' : 'Confirmar devolución'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
