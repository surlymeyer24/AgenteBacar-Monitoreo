import { useNavigate } from 'react-router-dom';
import { useEventosHardware } from '../hooks/useQueries';
import { StudioLoading } from './studio/StudioUi';
import { Monitor, HardDrive, Cpu, MemoryStick, ShieldAlert, ArrowRight } from 'lucide-react';

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_revision: 'bg-blue-100 text-blue-800',
  autorizado: 'bg-emerald-100 text-emerald-800',
  no_autorizado: 'bg-red-100 text-red-800',
  falso_positivo: 'bg-slate-100 text-slate-500',
};

const TIPO_EVENTO_BADGE = {
  agregado: 'bg-green-500',
  removido: 'bg-red-500',
  modificado: 'bg-orange-500',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  autorizado: 'Autorizado',
  no_autorizado: 'No autorizado',
  falso_positivo: 'Falso positivo',
};

function iconoComponente(tipo) {
  switch (tipo) {
    case 'monitor': return <Monitor className="w-4 h-4" />;
    case 'disco': return <HardDrive className="w-4 h-4" />;
    case 'procesador': return <Cpu className="w-4 h-4" />;
    case 'ram': return <MemoryStick className="w-4 h-4" />;
    default: return <ShieldAlert className="w-4 h-4" />;
  }
}

function fmtFecha(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function resumenDespues(despues) {
  if (!despues) return '';
  const parts = [];
  if (despues.nombre) parts.push(despues.nombre);
  if (despues.modelo) parts.push(despues.modelo);
  if (despues.capacidad_gb) parts.push(`${despues.capacidad_gb} GB`);
  if (despues.numero_serie) parts.push(`S/N: ${despues.numero_serie}`);
  return parts.join(' · ') || '—';
}

export default function ComputadoraEventosTimeline({ uuid }) {
  const navigate = useNavigate();
  const { data: eventos = [], isLoading, error } = useEventosHardware({ uuid });

  if (isLoading) return <StudioLoading message="Cargando timeline..." />;

  if (error) return (
    <div className="text-center py-8 text-red-500 text-sm font-medium">
      No se pudo cargar el historial de cambios de hardware.
    </div>
  );

  if (eventos.length === 0) return (
    <div className="text-center py-12 text-slate-400 text-sm">
      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
      No se registran cambios de hardware para esta PC.
    </div>
  );

  return (
    <div className="space-y-3">
      {eventos.map(ev => (
        <button
          key={ev.id}
          type="button"
          onClick={() => navigate(`/eventos-hardware/${encodeURIComponent(ev.id)}`)}
          className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0c66e4]/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            {/* Timeline dot */}
            <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${TIPO_EVENTO_BADGE[ev.tipoEvento] ?? 'bg-slate-400'}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {iconoComponente(ev.tipoComponente)}
                <span className="font-bold text-sm text-slate-800 capitalize">{ev.tipoComponente}</span>
                <span className="text-xs font-semibold text-slate-500 capitalize">{ev.tipoEvento}</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${ESTADO_BADGE[ev.estadoSeguimiento] ?? ''}`}>
                  {ESTADO_LABELS[ev.estadoSeguimiento] ?? ev.estadoSeguimiento}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1 truncate">
                {ev.tipoEvento === 'removido' ? resumenDespues(ev.antes) : resumenDespues(ev.despues)}
              </p>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 font-mono">{fmtFecha(ev.timestamp)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0c66e4] transition-colors" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
