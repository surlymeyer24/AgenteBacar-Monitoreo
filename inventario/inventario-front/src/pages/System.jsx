import { useMemo, useState } from 'react';
import { useComputadorasHW } from '../hooks/useComputadorasHW';
import { useComandoHW, enviarComandoAMaquinas } from '../hooks/useComandoHW';
import {
  useLogsActualizacion,
  LOGS_SNAPSHOT_CAP,
} from '../hooks/useLogsActualizacion';
import { useLogsDebug } from '../hooks/useLogsDebug';
import { formatTimestamp } from '../lib/formatFirestore';
import { EVENTO_BADGE_HW } from '../lib/comandoLogBadges';
import { useConfigAgenteDescarga } from '../hooks/useConfigAgenteDescarga';
import { nivelActividadSync, tituloSyncDot, syncDotInlineStyle } from '../utils/syncActividad';
import { 
  Cpu, Search, Settings, CloudLightning, RefreshCw, Ban, 
  CheckSquare, Square, Trash2, Download
} from 'lucide-react';

// ─── helpers de fecha ───────────────────────────────────────────────────────
function inicioDiaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function finDiaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}
function versionInstaladaTexto(c) {
  const v = c.version_agente ?? c.version;
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}
function coincideUuidHostname(needleRaw, uuid, hostname) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  return String(uuid ?? '').toLowerCase().includes(needle) ||
         String(hostname ?? '').toLowerCase().includes(needle);
}
function coincideVersionTexto(needleRaw, versionStr) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  return String(versionStr ?? '').trim().toLowerCase().includes(needle);
}

// ─── sub-componente: fila de nodo con comandos individuales ──────────────────
function NodoComando({ computadora, computadoraId, hostname, versionLabel, seleccionada, onToggleSeleccion, versionEtiqueta }) {
  const { enviarActualizarDatos, enviarActualizarAgente, sendingComando, sending, error, okMsg } = useComandoHW(computadoraId);
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [errorReset, setErrorReset] = useState(null);
  const [okReset, setOkReset] = useState(null);
  const nivelSync = nivelActividadSync(computadora);

  async function handleActualizarAgente(e) {
    e.stopPropagation();
    const etiqueta = versionEtiqueta ?? 'configurada';
    if (!window.confirm(
      `¿Enviar ACTUALIZAR_AGENTE a ${hostname || computadoraId}?\n\n` +
      `El agente descargará e instalará la versión ${etiqueta}.`,
    )) return;
    await enviarActualizarAgente();
  }

  async function handleResetUuid(e) {
    e.stopPropagation();
    if (!window.confirm(
      `¿Enviar RESETEAR_ID a ${hostname || computadoraId}?\n\n` +
      'El agente borrará su ID del registro de Windows y se reiniciará; al volver puede registrarse con un UUID nuevo.',
    )) return;
    setEnviandoReset(true);
    setErrorReset(null);
    setOkReset(null);
    const res = await enviarComandoAMaquinas([computadoraId], 'RESETEAR_ID');
    setEnviandoReset(false);
    if (!res.ok) setErrorReset(res.message);
    else setOkReset('Comando RESETEAR_ID enviado.');
  }

  const ocupado = sending || enviandoReset;
  const feedback = error ? { ok: false, text: error } : okMsg ? { ok: true, text: okMsg } : errorReset ? { ok: false, text: errorReset } : okReset ? { ok: true, text: okReset } : null;
  const isOutdated = versionEtiqueta && versionLabel !== versionEtiqueta.replace('v', '');

  return (
    <div 
      onClick={onToggleSeleccion}
      className={`p-3.5 border rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all cursor-pointer ${
        seleccionada 
          ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' 
          : 'bg-white border-slate-200/80 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          {seleccionada ? (
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              title={tituloSyncDot(nivelSync)}
              style={syncDotInlineStyle(nivelSync)}
            />
            <span className="font-extrabold text-sm text-slate-900 truncate">{hostname || computadoraId}</span>
            {isOutdated && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-black text-[9px] uppercase tracking-wide border border-amber-200">
                Desactualizado
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
            <span>UUID: <code className="font-mono bg-indigo-50/50 text-slate-500 p-0.5 px-1 rounded">{computadoraId}</code></span>
          </div>
          {feedback && (
            <p className={`text-xs font-semibold mt-1 mb-0 ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {feedback.text}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-xs font-extrabold text-slate-500 mr-2 bg-slate-50 border border-slate-200 p-1 px-2 rounded font-mono">
          v{versionLabel}
        </span>
        <button
          type="button"
          disabled={ocupado}
          onClick={(e) => { e.stopPropagation(); void enviarActualizarDatos(); }}
          className="px-3 py-1.5 text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-black transition-colors disabled:opacity-50"
          title="Sincronizar telemetría de hardware inmediatamente"
        >
          {sendingComando === 'ACTUALIZAR_DATOS' ? 'Enviando…' : 'Sync'}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={handleActualizarAgente}
          className="px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-black transition-colors disabled:opacity-50"
          title="Actualizar agente a la versión configurada"
        >
          {sendingComando === 'ACTUALIZAR_AGENTE' ? 'Enviando…' : 'Update'}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={handleResetUuid}
          className="px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-xs font-black transition-colors"
          title="Forzar borrado de ID local (Reset UUID)"
        >
          Reset UUID
        </button>
      </div>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function System() {
  // — Datos desde Firebase —
  const { computadoras, loading: loadingPcs, error: errorPcs } = useComputadorasHW();
  const { urlDescarga, versionEtiqueta, nombreArchivo, loading: loadingConfig } = useConfigAgenteDescarga();

  // — Filtros de fecha para logs —
  const [logFechaDesde, setLogFechaDesde] = useState('');
  const [logFechaHasta, setLogFechaHasta] = useState('');

  const rangoFechasInvalido = Boolean(
    logFechaDesde && logFechaHasta && logFechaDesde > logFechaHasta,
  );

  const filtroLogsFirestore = useMemo(() => {
    if (rangoFechasInvalido) return { desde: null, hasta: null };
    return {
      desde: logFechaDesde ? inicioDiaLocal(logFechaDesde) : null,
      hasta: logFechaHasta ? finDiaLocal(logFechaHasta)   : null,
    };
  }, [logFechaDesde, logFechaHasta, rangoFechasInvalido]);

  // — Suscripciones a ambas colecciones de logs —
  const { logs: logsActualizaciones, loading: loadingAct, error: errorAct } =
    useLogsActualizacion(filtroLogsFirestore);
  const { logs: logsDebug, loading: loadingDbg, error: errorDbg } =
    useLogsDebug(filtroLogsFirestore);

  const loadingLogs = loadingAct || loadingDbg;
  const errorLogs = errorAct || errorDbg;

  // — Combinar y ordenar logs por timestamp desc —
  const logsCombinados = useMemo(() => {
    const tagged = [
      ...logsActualizaciones.map(l => ({ ...l, _fuente: 'actualizaciones' })),
      ...logsDebug,                          // ya vienen con _fuente: 'debug'
    ];
    tagged.sort((a, b) => {
      const ta = a.timestamp?.toDate?.().getTime() ?? 0;
      const tb = b.timestamp?.toDate?.().getTime() ?? 0;
      return tb - ta;
    });
    return tagged.slice(0, LOGS_SNAPSHOT_CAP);
  }, [logsActualizaciones, logsDebug]);

  // — Filtros de búsqueda en historial —
  const [busquedaHistorialLogs, setBusquedaHistorialLogs]   = useState('');
  const [filtroVersionHistorial, setFiltroVersionHistorial] = useState('');
  const [filtroFuenteLogs, setFiltroFuenteLogs]             = useState('actualizaciones'); // 'actualizaciones' | 'debug' | 'errores'

  const logsErrores = useMemo(() => logsCombinados.filter(l => {
    if (l.nivel && l.nivel.toLowerCase() === 'error') return true;
    if (l.evento === 'ERROR' || l.evento === 'DESCARGA_FALLIDA') return true;
    if (l.detalle && l.detalle.toLowerCase().includes('error')) return true;
    return false;
  }), [logsCombinados]);

  const logsFiltrados = useMemo(() =>
    logsCombinados.filter(l => {
      const okPc  = coincideUuidHostname(busquedaHistorialLogs, l.uuid, l.hostname);
      const okVer = coincideVersionTexto(filtroVersionHistorial, l.version_agente);
      
      let okFuente = false;
      if (filtroFuenteLogs === 'errores') {
        okFuente = (l.nivel && l.nivel.toLowerCase() === 'error') || 
                   l.evento === 'ERROR' || l.evento === 'DESCARGA_FALLIDA' || 
                   (l.detalle && l.detalle.toLowerCase().includes('error'));
      } else {
        okFuente = l._fuente === filtroFuenteLogs;
      }

      return okPc && okVer && okFuente;
    }),
  [logsCombinados, busquedaHistorialLogs, filtroVersionHistorial, filtroFuenteLogs]);

  // El borrado de logs se quitó de la UI: las reglas de Firestore dejan
  // logs_actualizaciones como solo lectura para el cliente, así que borrar desde el
  // navegador siempre falla. Debe rehacerse como endpoint del backend para ADMINISTRADOR.

  // — Comandos a máquinas —
  const [busquedaComandosMaquinas, setBusquedaComandosMaquinas] = useState('');
  const [filtroVersionComandos, setFiltroVersionComandos]       = useState('');
  const [idsAgenteSeleccion, setIdsAgenteSeleccion]             = useState(() => new Set());
  const [enviandoActualizarTodas, setEnviandoActualizarTodas]   = useState(false);
  const [errorActualizarTodas, setErrorActualizarTodas]         = useState(null);
  const [enviandoAgenteSeleccion, setEnviandoAgenteSeleccion]   = useState(false);
  const [enviandoResetSeleccion, setEnviandoResetSeleccion]     = useState(false);
  const [errorAgenteSeleccion, setErrorAgenteSeleccion]         = useState(null);
  const [okAgenteSeleccion, setOkAgenteSeleccion]             = useState(null);

  const computadorasFiltradas = useMemo(() =>
    computadoras.filter(c => {
      const okHost = coincideUuidHostname(busquedaComandosMaquinas, c.id, c.hostname ?? '');
      const okVer  = coincideVersionTexto(filtroVersionComandos, versionInstaladaTexto(c));
      return okHost && okVer;
    }),
  [computadoras, busquedaComandosMaquinas, filtroVersionComandos]);

  const idsValidos = useMemo(() => {
    const allIds = new Set(computadoras.map(c => c.id));
    return new Set([...idsAgenteSeleccion].filter(id => allIds.has(id)));
  }, [idsAgenteSeleccion, computadoras]);

  function toggleSeleccion(id) {
    setIdsAgenteSeleccion(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleActualizarDatosTodas() {
    const n = computadoras.length;
    if (!window.confirm(`¿Enviar ACTUALIZAR_DATOS a las ${n} máquina${n !== 1 ? 's' : ''} listadas?\n\nCada agente hará una sincronización completa.`)) return;
    setErrorActualizarTodas(null);
    setEnviandoActualizarTodas(true);
    const res = await enviarComandoAMaquinas(computadoras.map(c => c.id), 'ACTUALIZAR_DATOS');
    setEnviandoActualizarTodas(false);
    if (!res.ok) setErrorActualizarTodas(res.message);
  }

  async function handleActualizarAgenteSeleccionadas() {
    const ids = [...idsValidos];
    if (ids.length === 0) return;
    if (!window.confirm(`¿Enviar ACTUALIZAR_AGENTE a ${ids.length} máquina${ids.length !== 1 ? 's' : ''}?\n\nCada una descargará el instalador desde la URL configurada.`)) return;
    setErrorAgenteSeleccion(null);
    setOkAgenteSeleccion(null);
    setEnviandoAgenteSeleccion(true);
    const res = await enviarComandoAMaquinas(ids, 'ACTUALIZAR_AGENTE');
    setEnviandoAgenteSeleccion(false);
    if (!res.ok) setErrorAgenteSeleccion(res.message);
    else setOkAgenteSeleccion(`ACTUALIZAR_AGENTE enviado a ${res.enviados ?? ids.length} máquina(s).`);
  }

  async function handleResetearUuidSeleccionadas() {
    const ids = [...idsValidos];
    if (ids.length === 0) return;
    if (!window.confirm(`¿Enviar RESETEAR_ID a ${ids.length} máquina${ids.length !== 1 ? 's' : ''}?\n\nLos agentes borrarán su ID del registro de Windows.`)) return;
    setErrorAgenteSeleccion(null);
    setEnviandoResetSeleccion(true);
    const res = await enviarComandoAMaquinas(ids, 'RESETEAR_ID');
    setEnviandoResetSeleccion(false);
    if (!res.ok) setErrorAgenteSeleccion(res.message);
  }

  // ─── render ────────────────────────────────────────────────────────────────
  if (loadingPcs) {
    return (
      <div className="page">
        <h1>Sistema</h1>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (errorPcs) {
    return (
      <div className="page">
        <h1>Sistema</h1>
        <p className="error">{errorPcs}</p>
        <p className="muted">
          Esta pantalla usa Firebase directamente (<code>computadoras</code>,{' '}
          <code>logs_actualizaciones</code>, <code>logs_debug</code>). Revisá las variables{' '}
          <code>VITE_FIREBASE_*</code> en el <code>.env</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="page sys-page">
      <div>
        <h1>Sistema</h1>
        <p className="muted" style={{ marginTop: '0.2rem' }}>Comandos y logs en tiempo real vía Firestore. El agente identifica cada PC por UUID.</p>
      </div>

      {/* ── Cards de resumen ──────────────────────────────────────────────── */}
      <div className="sys-stats-grid">
        <div className="sys-stat-card">
          <div className="sys-stat-card-body">
            <div className="sys-stat-label">Terminales registrados</div>
            <div className="sys-stat-value">{computadoras.length}</div>
          </div>
          <div className="sys-stat-icon sys-stat-icon--blue">💻</div>
        </div>
        <div className="sys-stat-card">
          <div className="sys-stat-card-body">
            <div className="sys-stat-label">Versión configurada</div>
            <div className="sys-stat-value sys-stat-value--blue">{versionEtiqueta ?? '—'}</div>
          </div>
          <div className="sys-stat-icon sys-stat-icon--amber">🔖</div>
        </div>
        
        {/* ── Tarjeta Instalador Agente ── */}
        <div className="sys-stat-card sys-stat-card--installer">
          <div className="sys-stat-card-installer-body flex items-center gap-3 min-w-0">
            <div className="sys-stat-icon sys-stat-icon--blue flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="sys-stat-label">Instalador del agente</div>
              <div className="text-xs text-slate-500 font-medium">Compatible con Windows</div>
            </div>
          </div>

          <div className="sys-stat-card-installer-actions">
            {loadingConfig ? (
              <span className="text-xs text-slate-400">Sincronizando...</span>
            ) : urlDescarga ? (
              <a
                href={urlDescarga}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 shadow-sm"
                target="_blank"
                rel="noopener noreferrer"
                download={nombreArchivo}
              >
                <Download className="w-3.5 h-3.5" /> Descargar {versionEtiqueta}
              </a>
            ) : (
              <span className="text-xs text-slate-400">Sin URL configurada</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Comandos a máquinas (Ancho completo) ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mt-6 mb-2">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider mb-0.5">Comandos a Máquinas</h3>
                <p className="text-xs text-slate-400 font-medium m-0">Lanzamiento masivo de instrucciones vía Firestore</p>
              </div>
            </div>
            
            {versionEtiqueta && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-3 py-1 rounded text-xs tracking-wider uppercase">
                Agente Oficial {versionEtiqueta}
              </span>
            )}
          </div>
        </div>

        {/* Config & Search actions */}
        <div className="p-5 border-b border-dashed border-slate-100 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="search" 
                placeholder="Búsqueda por UUID o Hostname..."
                value={busquedaComandosMaquinas}
                onChange={(e) => setBusquedaComandosMaquinas(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-250 bg-white rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none">
                <Settings className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="search" 
                placeholder="Filtrar por Versión de Agente..."
                value={filtroVersionComandos}
                onChange={(e) => setFiltroVersionComandos(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-250 bg-white rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onClick={() => setIdsAgenteSeleccion(new Set(computadorasFiltradas.map(c => c.id)))}
                disabled={computadorasFiltradas.length === 0}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-250 rounded-md font-bold text-sm text-slate-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                Seleccionar Todas ({computadorasFiltradas.length})
              </button>
              
              {idsValidos.size > 0 && (
                <button 
                  type="button" 
                  onClick={() => setIdsAgenteSeleccion(new Set())}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-sm transition-colors"
                >
                  Deseleccionar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-slate-500 font-semibold">Marcadas:</span>
              <strong className="text-indigo-600 p-1.5 px-3 bg-indigo-50 rounded-lg text-base">{idsValidos.size}</strong>
            </div>
          </div>

          {idsValidos.size > 0 && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-xl flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm font-extrabold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                <CloudLightning className="w-5 h-5 text-indigo-600 animate-bounce" /> Acciones por Lote ({idsValidos.size}):
              </span>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  disabled={enviandoAgenteSeleccion}
                  onClick={() => void handleActualizarAgenteSeleccionadas()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {enviandoAgenteSeleccion ? 'Procesando...' : 'Actualizar Agente'}
                </button>

                <button 
                  type="button"
                  disabled={enviandoResetSeleccion}
                  onClick={() => void handleResetearUuidSeleccionadas()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {enviandoResetSeleccion ? 'Mandando...' : 'Resetear UUID'}
                </button>
              </div>
              </div>
              {errorAgenteSeleccion && (
                <p className="text-sm font-semibold text-rose-600 m-0">{errorAgenteSeleccion}</p>
              )}
              {okAgenteSeleccion && (
                <p className="text-sm font-semibold text-emerald-600 m-0">{okAgenteSeleccion}</p>
              )}
            </div>
          )}

          {errorActualizarTodas && (
            <p className="text-sm font-semibold text-rose-600 mt-2 mb-0">{errorActualizarTodas}</p>
          )}
        </div>

        {/* List nodes */}
        <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Máquinas ({computadorasFiltradas.length})</span>
            <button 
              type="button"
              disabled={enviandoActualizarTodas}
              onClick={() => void handleActualizarDatosTodas()}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${enviandoActualizarTodas ? 'animate-spin' : ''}`} />
              Forzar Lectura General
            </button>
          </div>

          {computadorasFiltradas.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center text-slate-400">
              <Ban className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <p className="text-base font-medium mt-3">
                {computadoras.length === 0
                  ? 'No hay computadoras en Firestore.'
                  : 'Ninguna máquina coincide con los filtros.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {computadorasFiltradas.map(c => (
                <NodoComando
                  key={c.id}
                  computadora={c}
                  computadoraId={c.id}
                  hostname={c.hostname ?? c.id}
                  versionLabel={versionInstaladaTexto(c)}
                  versionEtiqueta={versionEtiqueta}
                  seleccionada={idsValidos.has(c.id)}
                  onToggleSeleccion={() => toggleSeleccion(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Terminal: Historial de comandos (ancho completo) ─────────────── */}
      <div className="sys-terminal">

        {/* Header de la terminal */}
        <div className="sys-terminal-header">
          <div className="sys-terminal-title-group">
            <span className="sys-terminal-icon">⌨</span>
            <div>
              <div className="sys-terminal-title">Historial de Comandos Telemétricos</div>
              <div className="sys-terminal-subtitle">
                Eventos en tiempo real · <code>logs_actualizaciones</code> +{' '}
                <code>logs_debug</code> · máx. {LOGS_SNAPSHOT_CAP} registros c/u
              </div>
            </div>
          </div>
          <div className="sys-terminal-badges">
            <span className="sys-terminal-src-badge sys-terminal-src-badge--act">
              actualizaciones: {logsActualizaciones.length}
            </span>
            <span className="sys-terminal-src-badge sys-terminal-src-badge--dbg">
              debug: {logsDebug.length}
            </span>
          </div>
        </div>

        {/* Tabs de fuente */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <button
            style={{ 
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', 
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 700,
              background: filtroFuenteLogs === 'actualizaciones' ? 'rgba(59,130,246,0.05)' : 'transparent',
              color: filtroFuenteLogs === 'actualizaciones' ? '#2563eb' : '#64748b',
              borderBottom: filtroFuenteLogs === 'actualizaciones' ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
            onClick={() => setFiltroFuenteLogs('actualizaciones')}
          >
            Logs Actualizaciones ({logsActualizaciones.length})
          </button>
          <button
            style={{ 
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', 
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 700,
              background: filtroFuenteLogs === 'debug' ? 'rgba(100,116,139,0.05)' : 'transparent',
              color: filtroFuenteLogs === 'debug' ? '#475569' : '#94a3b8',
              borderBottom: filtroFuenteLogs === 'debug' ? '2px solid #64748b' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
            onClick={() => setFiltroFuenteLogs('debug')}
          >
            Logs Debug ({logsDebug.length})
          </button>
          <button
            style={{ 
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', 
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 700,
              background: filtroFuenteLogs === 'errores' ? 'rgba(239,68,68,0.05)' : 'transparent',
              color: filtroFuenteLogs === 'errores' ? '#dc2626' : '#94a3b8',
              borderBottom: filtroFuenteLogs === 'errores' ? '2px solid #dc2626' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
            onClick={() => setFiltroFuenteLogs('errores')}
          >
            Solo Errores ({logsErrores.length})
          </button>
        </div>

        {/* Filtros */}
        <div className="sys-terminal-filters">
          <div className="filter-field" style={{ flex: '1 1 14rem' }}>
            <label className="sys-terminal-label" htmlFor="busqueda-historial-logs">UUID o Hostname</label>
            <input
              id="busqueda-historial-logs"
              type="search"
              className="sys-terminal-input"
              placeholder="Buscar en historial…"
              value={busquedaHistorialLogs}
              onChange={e => setBusquedaHistorialLogs(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filter-field" style={{ flex: '0 1 9rem' }}>
            <label className="sys-terminal-label" htmlFor="filtro-version-historial">Versión agente</label>
            <input
              id="filtro-version-historial"
              type="search"
              className="sys-terminal-input"
              placeholder="Ej.: 6.5"
              value={filtroVersionHistorial}
              onChange={e => setFiltroVersionHistorial(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="filter-field" style={{ flex: '0 1 9rem' }}>
            <label className="sys-terminal-label" htmlFor="logs-fecha-desde">Desde</label>
            <input
              id="logs-fecha-desde"
              type="date"
              className="sys-terminal-input"
              value={logFechaDesde}
              onChange={e => setLogFechaDesde(e.target.value)}
            />
          </div>
          <div className="filter-field" style={{ flex: '0 1 9rem' }}>
            <label className="sys-terminal-label" htmlFor="logs-fecha-hasta">Hasta</label>
            <input
              id="logs-fecha-hasta"
              type="date"
              className="sys-terminal-input"
              value={logFechaHasta}
              onChange={e => setLogFechaHasta(e.target.value)}
            />
          </div>
        </div>

        {/* Barra de stats + acciones */}
        <div className="sys-terminal-actionbar">
          <div className="sys-terminal-count">
            Registros:{' '}
            <strong className="sys-count-highlight">
              {logsFiltrados.length}
            </strong>
            {(logFechaDesde || logFechaHasta || busquedaHistorialLogs || filtroVersionHistorial) && (
              <button
                type="button"
                className="sys-clear-filters"
                onClick={() => {
                  setLogFechaDesde('');
                  setLogFechaHasta('');
                  setBusquedaHistorialLogs('');
                  setFiltroVersionHistorial('');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Mensajes de estado */}
        {rangoFechasInvalido && (
          <div className="sys-terminal-feedback sys-terminal-feedback--err">
            [ERROR] La fecha «Desde» no puede ser posterior a «Hasta».
          </div>
        )}
        {errorLogs && (
          <div className="sys-terminal-feedback sys-terminal-feedback--err">
            Logs: {errorLogs}
          </div>
        )}

        {/* Tabla de logs */}
        <div className="sys-terminal-table-wrap">
          {loadingLogs ? (
            <p className="sys-terminal-empty">Cargando logs…</p>
          ) : logsFiltrados.length === 0 ? (
            <p className="sys-terminal-empty">
              {logsCombinados.length === 0
                ? 'Sin entradas aún en ninguna de las dos colecciones.'
                : 'Ningún log coincide con los filtros activos.'}
            </p>
          ) : (
            <table className="sys-terminal-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Terminal / Host</th>
                  <th>Evento / Tipo</th>
                  <th>Detalle / Mensaje</th>
                  <th>Versión</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map(l => (
                  <tr key={l.id} className={l._fuente === 'debug' ? 'sys-row-debug' : ''}>
                    <td className="sys-td-ts" style={{ whiteSpace: 'nowrap' }}>
                      {l.timestamp ? formatTimestamp(l.timestamp) : '—'}
                    </td>
                    <td>
                      <div className="sys-td-host">{l.hostname || '—'}</div>
                      {l.uuid && (
                        <div className="sys-td-uuid">
                          <code className="uuid-inline">{l.uuid || '—'}</code>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${EVENTO_BADGE_HW[l.evento] ?? 'badge-neutral'}`}>
                        {l.evento || '—'}
                      </span>
                    </td>
                    <td className="td-detalle-log">{l.detalle || '—'}</td>
                    <td className="sys-td-ver">{l.version_agente || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
