import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { fetchEventoHardware, actualizarEventoHardware } from '../api/eventosHardwareApi';
import WriteGate from '../components/WriteGate';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import {
  ChevronLeft, Monitor, HardDrive, Cpu, MemoryStick,
  ShieldAlert, CheckCircle, XCircle, Ban, AlertTriangle,
} from 'lucide-react';

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  autorizado: 'Autorizado',
  no_autorizado: 'No autorizado',
  falso_positivo: 'Falso positivo',
};

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_revision: 'bg-blue-100 text-blue-800 border-blue-200',
  autorizado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  no_autorizado: 'bg-red-100 text-red-800 border-red-200',
  falso_positivo: 'bg-slate-100 text-slate-600 border-slate-200',
};

function fmtFecha(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
}

function iconoComponente(tipo) {
  switch (tipo) {
    case 'monitor': return <Monitor className="w-5 h-5 text-slate-300" />;
    case 'disco': return <HardDrive className="w-5 h-5 text-slate-300" />;
    case 'procesador': return <Cpu className="w-5 h-5 text-slate-300" />;
    case 'ram': return <MemoryStick className="w-5 h-5 text-slate-300" />;
    default: return <ShieldAlert className="w-5 h-5 text-slate-300" />;
  }
}

function SnapshotPanel({ title, data, accent }) {
  if (!data) return (
    <div className={`flex-1 rounded-xl border p-4 ${accent}`}>
      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h5>
      <p className="text-sm text-slate-400 italic">Sin datos (componente no existía)</p>
    </div>
  );
  return (
    <div className={`flex-1 rounded-xl border p-4 ${accent}`}>
      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{title}</h5>
      <dl className="space-y-1.5">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm">
            <dt className="font-semibold text-slate-500 min-w-[120px]">{k.replace(/_/g, ' ')}</dt>
            <dd className="font-mono text-slate-800">{v != null ? String(v) : '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EventoHardwareDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ev, setEv] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [notasIt, setNotasIt] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    fetchEventoHardware(id)
      .then(data => {
        if (cancelled) return;
        setEv(data);
        setNotasIt(data?.notasIt ?? '');
        if (data && data.leido === false) {
          actualizarEventoHardware(id, { leido: true }).then(updated => {
            if (!cancelled && updated) {
              setEv(updated);
              queryClient.invalidateQueries({ queryKey: ['eventosHardware'] });
              queryClient.invalidateQueries({ queryKey: ['eventosHardwarePendientesCount'] });
            }
          });
        }
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el evento'); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [id, queryClient]);

  function cambiarEstado(nuevoEstado) {
    setGuardando(true);
    setMsg(null);
    const body = { estadoSeguimiento: nuevoEstado };
    if (notasIt.trim()) body.notasIt = notasIt.trim();
    actualizarEventoHardware(id, body)
      .then(data => {
        if (data) {
          setEv(data);
          queryClient.invalidateQueries({ queryKey: ['eventosHardware'] });
          queryClient.invalidateQueries({ queryKey: ['eventosHardwarePendientesCount'] });
          setMsg({ tipo: 'ok', texto: `Estado cambiado a "${ESTADO_LABELS[nuevoEstado]}"` });
        } else {
          setMsg({ tipo: 'error', texto: 'Evento no encontrado' });
        }
      })
      .catch(() => setMsg({ tipo: 'error', texto: 'Error al actualizar el evento' }))
      .finally(() => setGuardando(false));
  }

  function guardarNotas() {
    setGuardando(true);
    setMsg(null);
    actualizarEventoHardware(id, { notasIt: notasIt.trim() || null })
      .then(data => {
        if (data) {
          setEv(data);
          setMsg({ tipo: 'ok', texto: 'Notas guardadas' });
        }
      })
      .catch(() => setMsg({ tipo: 'error', texto: 'Error al guardar notas' }))
      .finally(() => setGuardando(false));
  }

  if (cargando) return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <StudioLoading />
    </div>
  );
  if (error || !ev) return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md">
        <StudioError message={error || 'Evento no encontrado'} />
        <button onClick={() => navigate('/eventos-hardware')} className="mt-4 text-sm text-blue-600 hover:underline">Volver</button>
      </div>
    </div>
  );

  const tipoEventoLabel = { agregado: 'Agregado', removido: 'Removido', modificado: 'Modificado' }[ev.tipoEvento] ?? ev.tipoEvento;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-4xl max-h-full overflow-hidden ring-1 ring-slate-900/5">

        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/eventos-hardware')}
              className="p-1 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Volver"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            {iconoComponente(ev.tipoComponente)}
            <div>
              <h3 className="font-extrabold text-xl text-white leading-tight capitalize">
                {ev.tipoComponente} — {tipoEventoLabel}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {ev.hostname} <span className="text-slate-600 mx-1">•</span>
                <span className="font-mono text-slate-300 text-xs">{ev.uuid}</span>
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${ESTADO_BADGE[ev.estadoSeguimiento] ?? ''}`}>
            {ESTADO_LABELS[ev.estadoSeguimiento] ?? ev.estadoSeguimiento}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">

          {/* Metadata */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Fecha</span>
                <span className="font-semibold text-slate-800 mt-1 block">{fmtFecha(ev.timestamp)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Fingerprint</span>
                <span className="font-mono text-slate-600 text-xs mt-1 block">{ev.fingerprint}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Origen</span>
                <span className="font-semibold text-slate-800 mt-1 block capitalize">{ev.origen}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Versión agente</span>
                <span className="font-mono text-slate-600 mt-1 block">{ev.versionAgente ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Antes / Después */}
          <div className="flex flex-col sm:flex-row gap-4">
            <SnapshotPanel title="Antes" data={ev.antes} accent="bg-red-50/50 border-red-100" />
            <SnapshotPanel title="Después" data={ev.despues} accent="bg-green-50/50 border-green-100" />
          </div>

          {/* Revisión */}
          {ev.revisadoPor && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm">
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Revisado por</span>
              <span className="font-semibold text-slate-800">{ev.revisadoPor}</span>
              {ev.revisadoEn && <span className="text-slate-400 ml-2">— {fmtFecha(ev.revisadoEn)}</span>}
            </div>
          )}

          {/* Notas IT */}
          <WriteGate>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Notas IT</h4>
            <textarea
              value={notasIt}
              onChange={e => setNotasIt(e.target.value)}
              rows={3}
              placeholder="Observaciones del equipo IT sobre este cambio..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4] resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={guardarNotas}
                disabled={guardando}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Guardar notas
              </button>
            </div>
          </div>
          </WriteGate>

          {/* Acciones de workflow */}
          <WriteGate>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Resolución</h4>
            <div className="flex flex-wrap gap-2">
              {ev.estadoSeguimiento === 'pendiente' && (
                <button
                  onClick={() => cambiarEstado('en_revision')}
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Tomar en revisión
                </button>
              )}
              <button
                onClick={() => cambiarEstado('autorizado')}
                disabled={guardando || ev.estadoSeguimiento === 'autorizado'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Autorizado
              </button>
              <button
                onClick={() => cambiarEstado('no_autorizado')}
                disabled={guardando || ev.estadoSeguimiento === 'no_autorizado'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                No autorizado
              </button>
              <button
                onClick={() => cambiarEstado('falso_positivo')}
                disabled={guardando || ev.estadoSeguimiento === 'falso_positivo'}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Falso positivo
              </button>
            </div>
          </div>
          </WriteGate>

          {/* Feedback message */}
          {msg && (
            <div className={`text-sm font-bold px-4 py-2 rounded-lg ${msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {msg.texto}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventoHardwareDetail;
