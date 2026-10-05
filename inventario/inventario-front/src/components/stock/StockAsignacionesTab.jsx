import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor, Router, Package, RotateCcw, MapPin, Laptop, User, Cpu, Smartphone,
} from 'lucide-react';
import { devolverCelularAStock } from '../../api/celularApi';
import { devolverStockM } from '../../api/perifericoManualApi';
import { BadgeDisponibilidad } from '../StockEstadoBadges';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';
import WriteGate from '../WriteGate';
import {
  armarFilasAsignaciones,
  fmtFechaValor,
} from '../../utils/asignacionesStockHelpers';

const SOLAPAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'perifericos', label: 'Periféricos' },
  { id: 'infra', label: 'Infraestructura' },
  { id: 'computadoras', label: 'Computadoras' },
  { id: 'celulares', label: 'Celulares' },
];

const SOLAPA_ORIGEN = {
  perifericos: 'periferico',
  infra: 'infra',
  computadoras: 'pc',
  celulares: 'celular',
};

function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 ${colorBg} ${colorText} rounded-lg shrink-0`}>
        {Icon ? <Icon className="w-6 h-6" /> : null}
      </div>
      <div className="min-w-0">
        <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">{label}</span>
        <span className={`text-3xl font-black font-mono ${colorText}`}>{value}</span>
        {sub && <span className="text-xs text-slate-500 font-medium block mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

function textoError(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  return err.message || '';
}

export default function StockAsignacionesTab({
  lista,
  pcsAsignadas = [],
  celularesAsignados = [],
  estadoLabels,
  onRefresh,
  onRefreshCelulares,
  cargandoPcs = false,
  cargandoCelulares = false,
  errorPcs = null,
  errorCelulares = null,
}) {
  const [solapa, setSolapa] = useState('todos');
  const [buscar, setBuscar] = useState('');
  const [devolverFila, setDevolverFila] = useState(null);
  const [motivoDevolver, setMotivoDevolver] = useState('');
  const [devolviendo, setDevolviendo] = useState(false);

  const filas = useMemo(
    () => armarFilasAsignaciones({
      items: lista,
      pcs: pcsAsignadas,
      celulares: celularesAsignados,
      estadoLabels,
    }),
    [lista, pcsAsignadas, celularesAsignados, estadoLabels],
  );

  const conteos = useMemo(() => {
    const sum = (pred) => filas.filter(pred).reduce((s, f) => s + (f.cantidad ?? 1), 0);
    return {
      unidades: sum(() => true),
      perif: sum(f => f.origen === 'periferico'),
      infra: sum(f => f.origen === 'infra'),
      aPc: sum(f => f.destino?.tipo === 'pc'),
      pcs: sum(f => f.origen === 'pc'),
      celulares: sum(f => f.origen === 'celular'),
    };
  }, [filas]);

  const filtrados = useMemo(() => {
    const origen = SOLAPA_ORIGEN[solapa];
    let list = origen ? filas.filter(f => f.origen === origen) : filas;
    const q = buscar.trim().toLowerCase();
    if (!q) return list;
    return list.filter(f => f.busqueda.includes(q));
  }, [filas, solapa, buscar]);

  const refrescarCelulares = async () => {
    try {
      await onRefreshCelulares?.();
    } catch (refreshErr) {
      console.error(refreshErr);
    }
  };

  const handleDevolver = async () => {
    if (!devolverFila || devolviendo) return;
    const esCelular = devolverFila.origen === 'celular';
    setDevolviendo(true);
    try {
      if (esCelular) {
        await devolverCelularAStock(devolverFila.raw);
        await refrescarCelulares();
      } else {
        await devolverStockM(
          devolverFila.raw.id,
          motivoDevolver.trim() || 'Devolución a stock',
        );
        await onRefresh?.();
      }
      setDevolverFila(null);
      setMotivoDevolver('');
    } catch (err) {
      console.error(err);
      if (esCelular) {
        await refrescarCelulares();
        alert(err?.message || 'No se pudo devolver el celular a stock.');
      } else {
        alert('No se pudo devolver el ítem a stock.');
      }
    } finally {
      setDevolviendo(false);
    }
  };

  const avisoCarga = cargandoPcs && cargandoCelulares
    ? 'Cargando computadoras y celulares…'
    : cargandoPcs
      ? 'Cargando computadoras…'
      : cargandoCelulares
        ? 'Cargando celulares…'
        : null;

  return (
    <>
      {(avisoCarga || errorPcs || errorCelulares) && (
        <div className="space-y-2">
          {avisoCarga && (
            <p className="text-xs font-semibold text-slate-500">{avisoCarga}</p>
          )}
          {errorCelulares && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No se pudieron cargar los celulares
              {textoError(errorCelulares) ? `: ${textoError(errorCelulares)}` : ''}
              . Periféricos, infraestructura y computadoras siguen visibles.
            </p>
          )}
          {errorPcs && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No se pudieron cargar las computadoras
              {textoError(errorPcs) ? `: ${textoError(errorPcs)}` : ''}
              . El resto de las asignaciones sigue visible.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={Package}
          label="Total asignado"
          value={conteos.unidades}
          sub={`${filas.length} ítem(s) distintos`}
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
        <KpiCard
          icon={Cpu}
          label="Computadoras"
          value={conteos.pcs}
          sub="Origen stock, asignadas"
          colorBg="bg-teal-50"
          colorText="text-teal-600"
        />
        <KpiCard
          icon={Smartphone}
          label="Celulares"
          value={conteos.celulares}
          sub="Liberados del stock"
          colorBg="bg-sky-50"
          colorText="text-sky-600"
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
            placeholder="Buscar por ítem, S/N, IMEI, hostname o responsable…"
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
                filtrados.map(fila => (
                  <tr key={fila.key} className="hover:bg-slate-50/50">
                    <td className="py-4 px-5">
                      <Link
                        to={fila.linkTo}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        {fila.titulo}
                      </Link>
                      {fila.subtituloId && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{fila.subtituloId}</p>
                      )}
                      {fila.subtituloExtra && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {fila.subtituloExtra}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-xs font-bold capitalize text-slate-700">
                        {fila.tipoLabel}
                      </span>
                      {fila.estadoActual != null && String(fila.estadoActual).trim() !== '' && (
                        <div className="mt-1">
                          <BadgeDisponibilidad estadoActual={fila.estadoActual} estadoLabels={estadoLabels} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {fila.destino?.tipo === 'pc' && fila.destino.uuid ? (
                        <Link
                          to={`/computadoras/${encodeURIComponent(fila.destino.uuid)}`}
                          className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          {fila.destino.label}
                        </Link>
                      ) : fila.destino?.tipo === 'responsable' ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {fila.destino.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {fila.destino?.label || '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {fmtFechaValor(fila.fecha)}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-600 max-w-[200px] truncate" title={fila.motivo || ''}>
                      {fila.motivo || '—'}
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold">
                      {fila.cantidad ?? 1}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {fila.puedeDevolver ? (
                        <WriteGate>
                          <button
                            type="button"
                            onClick={() => {
                              setDevolverFila(fila);
                              setMotivoDevolver('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 rounded-lg font-bold text-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Devolver
                          </button>
                        </WriteGate>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {devolverFila && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-extrabold text-sm text-slate-900">Devolver a stock</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {devolverFila.titulo}
              </p>
            </div>
            <div className="p-5 space-y-4">
              {devolverFila.origen === 'celular' ? (
                <p className="text-xs text-slate-600 font-medium">
                  El celular vuelve a la solapa Celulares. El motivo no se guarda.
                </p>
              ) : (
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
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDevolverFila(null)}
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
