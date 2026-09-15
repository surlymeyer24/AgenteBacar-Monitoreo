import { useNavigate } from 'react-router-dom';
import {
  Monitor, HardDrive, Cpu, MemoryStick, ShieldAlert, ArrowRight,
  Clock, GitMerge, Activity, Settings2,
} from 'lucide-react';
import { useComputadoraTimeline } from '../hooks/useQueries';
import { StudioLoading } from './studio/StudioUi';

const TIPO_CONFIG = {
  CAMBIO_ESTADO: {
    dot: 'bg-blue-500',
    icon: Clock,
    label: 'Estado IT',
  },
  EVENTO_HARDWARE: {
    dot: 'bg-orange-500',
    icon: ShieldAlert,
    label: 'Hardware (agente)',
  },
  CONCILIACION: {
    dot: 'bg-violet-500',
    icon: GitMerge,
    label: 'Conciliación',
  },
  SISTEMA: {
    dot: 'bg-slate-400',
    icon: Settings2,
    label: 'Sistema',
  },
};

const TIPO_EVENTO_DOT = {
  agregado: 'bg-green-500',
  removido: 'bg-red-500',
  modificado: 'bg-orange-500',
};

const ESTADO_HW_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_revision: 'bg-blue-100 text-blue-800',
  autorizado: 'bg-emerald-100 text-emerald-800',
  no_autorizado: 'bg-red-100 text-red-800',
  falso_positivo: 'bg-slate-100 text-slate-500',
};

const DECISION_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CONFIRMADA: 'bg-emerald-100 text-emerald-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  POSPUESTA: 'bg-slate-100 text-slate-600',
};

function fmtFecha(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function iconoComponente(tipo) {
  switch (tipo) {
    case 'monitor': return Monitor;
    case 'disco': return HardDrive;
    case 'procesador': return Cpu;
    case 'ram': return MemoryStick;
    default: return Activity;
  }
}

function resolveEnlace(item) {
  if (item.tipo === 'CONCILIACION') return '/conciliaciones';
  return item.enlace || null;
}

export default function ComputadoraTimelineUnificada({ uuid }) {
  const navigate = useNavigate();
  const { data: items = [], isLoading, error, refetch } = useComputadoraTimeline(uuid);

  if (isLoading) return <StudioLoading message="Cargando historial..." />;

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 text-sm font-medium">
        No se pudo cargar el historial unificado.
        {' '}
        <button type="button" onClick={() => refetch()} className="underline font-bold">Reintentar</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        Sin eventos registrados para esta PC.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[5px] top-3 bottom-3 w-px bg-slate-200" aria-hidden />
      {items.map((item, idx) => {
        const cfg = TIPO_CONFIG[item.tipo] ?? TIPO_CONFIG.SISTEMA;
        const Icon = item.tipo === 'EVENTO_HARDWARE' && item.metadata?.tipoComponente
          ? iconoComponente(item.metadata.tipoComponente)
          : cfg.icon;
        const dotCls = item.tipo === 'EVENTO_HARDWARE' && item.metadata?.tipoEvento
          ? (TIPO_EVENTO_DOT[item.metadata.tipoEvento] ?? cfg.dot)
          : cfg.dot;
        const enlace = resolveEnlace(item);
        const Wrapper = enlace ? 'button' : 'div';
        const wrapperProps = enlace
          ? {
              type: 'button',
              onClick: () => navigate(enlace),
              className: 'w-full text-left group cursor-pointer',
            }
          : { className: 'w-full text-left' };

        return (
          <div key={`${item.tipo}-${item.sourceId ?? idx}-${item.timestamp}`} className="relative pl-6 pb-4">
            <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${dotCls}`} />
            <Wrapper {...wrapperProps}>
              <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all ${enlace ? 'group-hover:border-[#0c66e4]/40 group-hover:shadow-md' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {cfg.label}
                      </span>
                      {item.tipo === 'EVENTO_HARDWARE' && item.metadata?.estadoSeguimiento && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ESTADO_HW_BADGE[item.metadata.estadoSeguimiento] ?? ''}`}>
                          {item.metadata.estadoSeguimiento.replace('_', ' ')}
                        </span>
                      )}
                      {item.tipo === 'CONCILIACION' && item.metadata?.decision && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${DECISION_BADGE[item.metadata.decision] ?? ''}`}>
                          {item.metadata.decision}
                        </span>
                      )}
                      {item.metadata?.activo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Vigente
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm text-slate-800 mt-1">{item.titulo}</p>
                    {item.descripcion && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400 font-mono">{fmtFecha(item.timestamp)}</span>
                      {enlace && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0c66e4] transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Wrapper>
          </div>
        );
      })}
    </div>
  );
}
