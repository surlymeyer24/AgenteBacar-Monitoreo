import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchConciliaciones,
  fetchStockSinAgente,
  confirmarConciliacion,
  rechazarConciliacion,
  posponerConciliacion,
} from '../api/conciliacionApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioFilterBar,
} from '../components/studio/StudioUi';
import { GitCompare, Monitor, Package, Check, X, Clock } from 'lucide-react';

const SCORE_BADGE = (score) => {
  if (score >= 70) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function SugerenciaCard({ item, onAccion, procesando }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompare className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-sm text-slate-900 truncate">¿Es la misma máquina?</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${SCORE_BADGE(item.score)}`}>
          Score {item.score}
        </span>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="p-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Agente reportó</div>
          <div className="font-semibold text-slate-900">{item.agenteHostname || item.agenteUuid}</div>
          <div className="text-sm text-slate-600">{item.agenteResumen || '—'}</div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Stock declarado</div>
          <div className="font-semibold text-slate-900">{item.stockHostname || item.candidatoStockUuid}</div>
          <div className="text-sm text-slate-600">{item.stockResumen || '—'}</div>
        </div>
      </div>

      {(item.camposCoincidentes?.length > 0 || item.notasMatch?.length > 0) && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          {item.camposCoincidentes?.length > 0 && (
            <div>Coinciden: {item.camposCoincidentes.join(', ')}</div>
          )}
          {item.notasMatch?.map((n, i) => (
            <div key={i} className="text-amber-700 italic">{n}</div>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
        <span className="text-xs text-slate-400">{fmtFecha(item.fecha)}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={procesando}
            onClick={() => onAccion('confirmar', item.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Confirmar
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => onAccion('rechazar', item.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> Rechazar
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => onAccion('posponer', item.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" /> Posponer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConciliacionesList() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('pendientes');
  const [procesandoId, setProcesandoId] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const { data: pendientesData, isLoading: cargandoPendientes, error: errorPendientes } = useQuery({
    queryKey: ['conciliaciones', 'PENDIENTE'],
    queryFn: () => fetchConciliaciones({ decision: 'PENDIENTE', limit: 50 }),
    refetchInterval: 120000,
  });

  const { data: stockSinAgente = [], isLoading: cargandoStock } = useQuery({
    queryKey: ['conciliaciones', 'stock-sin-agente'],
    queryFn: fetchStockSinAgente,
    enabled: tab === 'stock',
  });

  async function onAccion(tipo, id) {
    if (!window.confirm(tipo === 'confirmar'
      ? '¿Confirmar que el reporte del agente corresponde a esta PC de stock?'
      : tipo === 'rechazar'
        ? '¿Rechazar esta sugerencia de vinculación?'
        : '¿Posponer esta sugerencia?')) {
      return;
    }
    setProcesandoId(id);
    setErrorAccion(null);
    try {
      if (tipo === 'confirmar') await confirmarConciliacion(id, {});
      else if (tipo === 'rechazar') await rechazarConciliacion(id, {});
      else await posponerConciliacion(id);
      await queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
    } catch (e) {
      setErrorAccion(e.message || 'No se pudo completar la acción');
    } finally {
      setProcesandoId(null);
    }
  }

  const pendientes = pendientesData?.items ?? [];

  return (
    <StudioPageShell
      title="Conciliaciones stock ↔ agente"
      subtitle="Sugerencias de vinculación entre baseline de stock y primer reporte del agente"
      icon={GitCompare}
    >
      <StudioFilterBar>
        <button
          type="button"
          onClick={() => setTab('pendientes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'pendientes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Pendientes ({pendientesData?.total ?? pendientes.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'stock' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Stock sin agente
        </button>
      </StudioFilterBar>

      {errorAccion && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{errorAccion}</div>
      )}

      {tab === 'pendientes' && (
        <>
          {cargandoPendientes && <StudioLoading />}
          {errorPendientes && <StudioError message={errorPendientes.message} />}
          {!cargandoPendientes && !errorPendientes && pendientes.length === 0 && (
            <p className="text-slate-500 text-sm py-8 text-center">No hay sugerencias pendientes de confirmación.</p>
          )}
          <div className="space-y-4">
            {pendientes.map(item => (
              <SugerenciaCard
                key={item.id}
                item={item}
                onAccion={onAccion}
                procesando={procesandoId === item.id}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'stock' && (
        <>
          {cargandoStock && <StudioLoading />}
          {!cargandoStock && stockSinAgente.length === 0 && (
            <p className="text-slate-500 text-sm py-8 text-center">No hay PCs con baseline listo sin reporte de agente.</p>
          )}
          <div className="space-y-2">
            {stockSinAgente.map(pc => (
              <div key={pc.uuid} className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <Link to={`/computadoras/${pc.uuid}`} className="font-semibold text-sm text-indigo-700 hover:underline truncate block">
                      {pc.hostname || pc.uuid}
                    </Link>
                    <div className="text-xs text-slate-500">{pc.condicion || '—'} · Baseline listo</div>
                  </div>
                </div>
                <Monitor className="w-4 h-4 text-slate-300 shrink-0" title="Sin sync agente" />
              </div>
            ))}
          </div>
        </>
      )}
    </StudioPageShell>
  );
}
