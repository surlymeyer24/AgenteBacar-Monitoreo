import { useState, useEffect, useRef, Fragment } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchComputadora,
  updateEstado,
  updateFicha,
} from '../api/computadoraApi';
import { useOptionalComputadorasList } from '../context/ComputadorasListContext';
import { useCatalogo, opcionesEnumCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';
import { labelUbicacion } from '../constants/ubicaciones';
import { textoConexionAgente } from '../utils/estadoConexion';
import { filtrarUsbParaInventario, filtrarAudioParaInventario } from '../utils/perifericos';
import WriteGate from '../components/WriteGate';
import ComputadoraPerifericosSection from '../components/ComputadoraPerifericosSection';
import ComputadoraSoftwareSection from '../components/ComputadoraSoftwareSection';
import ComputadoraHardwareSection from '../components/ComputadoraHardwareSection';
import ComputadoraEventosTimeline from '../components/ComputadoraEventosTimeline';
import { getComputerRamDetails } from '../utils/ramHelpers';
import {
  Trash2, Info, Monitor, CheckCircle, Clock, User, ChevronLeft, Laptop, SlidersHorizontal, ShieldCheck, ShieldAlert, Package
} from 'lucide-react';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import ArmarComboModal, { BaselineEsperadoBlock, EspecificacionEsperadaBlock } from '../components/ArmarComboModal';

function fmtFechaIso(s) {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR');
}

function textoHaceDesde(date) {
  let diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'fecha en el futuro';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'hace instantes';
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? 'hace 1 minuto' : `hace ${min} minutos`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`;
  const days = Math.floor(h / 24);
  if (days < 7) return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months < 12) return months <= 1 ? 'hace ~1 mes' : `hace ~${months} meses`;
  const years = Math.floor(days / 365);
  return years <= 1 ? 'hace más de 1 año' : `hace más de ${years} años`;
}

function fmtUltimaSincronizacion(raw) {
  if (raw == null || raw === '') return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  const legible = d.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
  const rel = textoHaceDesde(d);
  return `${legible} (${rel})`;
}

const ORIGEN_ALTA_MAP = {
  STOCK: { label: 'Stock', cls: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' },
  LEGACY: { label: 'Legacy', cls: 'bg-slate-700/50 text-slate-300 border border-slate-600' },
  DETECTADA_POR_AGENTE: { label: 'Agente', cls: 'bg-blue-900/40 text-blue-300 border border-blue-700/50' },
  DETECTADA_VINCULADA_RETRO: { label: 'Vinc. retro', cls: 'bg-purple-900/40 text-purple-300 border border-purple-700/50' },
};

const ESTADO_HISTORIAL_LABEL = {
  SIN_ASIGNAR: 'Sin asignar',
  ASIGNADA: 'Asignada',
  EN_MANTENIMIENTO: 'En mantenimiento',
  BAJA: 'Baja',
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva',
};

const TIPO_HISTORIAL_LABEL = {
  ALTA_MANUAL: 'Alta manual',
  ALTA_AUTOMATICA: 'Alta automática',
  FICHA: 'Cambio de ficha',
  ESTADO: 'Cambio de estado',
  MIGRACION_INICIAL: 'Migración inicial',
};

const CAMPO_HISTORIAL_LABEL = {
  hostname: 'Hostname',
  ubicacion: 'Ubicación',
  responsable: 'Responsable',
  serie: 'Serie',
  anydesk: 'AnyDesk',
  notas: 'Notas',
  tipo_equipo: 'Tipo de equipo',
  condicion: 'Condición',
  sistema_operativo: 'Sistema operativo',
  arquitectura: 'Arquitectura',
  ubicacion_stock: 'Ubicación de stock',
};

function labelEstadoHistorial(valor) {
  if (valor == null || valor === '') return '—';
  return ESTADO_HISTORIAL_LABEL[valor] || valor;
}

function opcionesConActual(items, actual) {
  const opciones = opcionesEnumCatalogo(items);
  if (actual && !opciones.some(o => o.value === actual)) {
    return [{ value: actual, label: actual }, ...opciones];
  }
  return opciones;
}

function valorVisible(campo, valor) {
  if (valor == null || valor === '') return '—';
  if (campo === 'ubicacion') return valor;
  return String(valor);
}

const ESTADO_CONCILIACION_MAP = {
  SIN_BASELINE: { label: 'Sin baseline', cls: 'bg-slate-700/50 text-slate-300 border border-slate-600' },
  NO_APLICA: { label: 'No aplica', cls: 'bg-slate-700/50 text-slate-400 border border-slate-600' },
  BASELINE_LISTO: { label: 'Baseline listo', cls: 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50' },
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-900/40 text-amber-300 border border-amber-700/50' },
  COINCIDE: { label: 'Coincide', cls: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' },
  DISCREPANCIA: { label: 'Discrepancia', cls: 'bg-red-900/40 text-red-300 border border-red-700/50' },
};

function ComputadoraDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const listado = useOptionalComputadorasList();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');
  const { items: condicionesItems } = useCatalogo('condiciones_equipo');
  const mergeEnListadoRef = useRef(listado?.mergeEnListado);
  mergeEnListadoRef.current = listado?.mergeEnListado;
  const [c, setC] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ficha, setFicha] = useState({
    hostname: '',
    ubicacion: '',
    responsableInventario: '',
    serialEquipo: '',
    anydeskId: '',
    notas: '',
    tipoEquipo: '',
    condicion: '',
  });
  const [guardandoFicha, setGuardandoFicha] = useState(false);
  const [msgFicha, setMsgFicha] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [solapa, setSolapa] = useState('hardware');
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState(null);
  const [copiedAnydesk, setCopiedAnydesk] = useState(false);
  const [armarComboOpen, setArmarComboOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchComputadora(uuid)
      .then(data => {
        if (cancelled) return;
        setC(data);
        if (data) {
          setFicha({
            hostname: data.hostname ?? '',
            ubicacion: data.ubicacion ?? '',
            responsableInventario: data.responsableInventario ?? '',
            serialEquipo: data.serialEquipo ?? '',
            anydeskId: data.anydeskId ?? '',
            notas: data.notas ?? '',
            tipoEquipo: data.tipoEquipo ?? '',
            condicion: data.condicion ?? '',
          });
          mergeEnListadoRef.current?.(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el detalle');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });
    return () => { cancelled = true; };
  }, [uuid]);

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;
  if (!c) return <StudioError message="Computadora no encontrada" />;

  const puedeArmarCombo = c.origenAlta === 'STOCK'
    && c.estadoConciliacion === 'SIN_BASELINE'
    && (c.estadoActual ?? '').toLowerCase() === 'sin asignar';
  const puedeIngresarStock = c.origenAlta === 'STOCK'
    && (c.estadoActual ?? '').toLowerCase() !== 'sin asignar';

  function aplicarFicha(data) {
    setC(data);
    setFicha({
      hostname: data.hostname ?? '',
      ubicacion: data.ubicacion ?? '',
      responsableInventario: data.responsableInventario ?? '',
      serialEquipo: data.serialEquipo ?? '',
      anydeskId: data.anydeskId ?? '',
      notas: data.notas ?? '',
      tipoEquipo: data.tipoEquipo ?? '',
      condicion: data.condicion ?? '',
    });
    listado?.mergeEnListado?.(data);
  }

  function guardarFicha(e) {
    e?.preventDefault();
    if (!ficha.hostname.trim()) {
      setMsgFicha('El hostname es obligatorio.');
      return;
    }
    setGuardandoFicha(true);
    setMsgFicha(null);
    updateFicha(uuid, {
      hostname: ficha.hostname.trim(),
      ubicacion: ficha.ubicacion,
      responsableInventario: ficha.responsableInventario.trim(),
      serialEquipo: ficha.serialEquipo.trim(),
      anydeskId: ficha.anydeskId.trim(),
      notas: ficha.notas.trim(),
      tipoEquipo: ficha.tipoEquipo,
      condicion: ficha.condicion,
    })
      .then(data => {
        if (data) {
          aplicarFicha(data);
          alert('Ficha guardada. El historial quedó registrado.');
        } else {
          setMsgFicha('No se encontró la computadora');
        }
      })
      .catch(err => setMsgFicha(err?.message || 'No se pudo guardar la ficha'))
      .finally(() => setGuardandoFicha(false));
  }

  function guardarEstado(e) {
    e?.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstado(uuid, estadoSel, motivoEstado.trim())
      .then(data => {
        if (data) { setC(data); setMotivoEstado(''); listado?.mergeEnListado?.(data); alert('Estado de activo IT actualizado y archivado exitosamente.'); }
        else { setMsgEstado('No se encontró la computadora'); }
      })
      .catch(err => setMsgEstado(err?.message || 'No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  function solicitarBaja() {
    const nombre = (c.hostname && String(c.hostname).trim()) ? c.hostname : 'esta PC';
    const motivo = window.prompt(`Motivo de la baja de "${nombre}". La ficha se conserva.`);
    if (motivo == null) return;
    if (!motivo.trim()) {
      setMsgEliminar('El motivo es obligatorio para dar de baja.');
      return;
    }
    setEliminando(true);
    setMsgEliminar(null);
    updateEstado(uuid, 'BAJA', motivo.trim())
      .then(data => {
        if (data) {
          aplicarFicha(data);
          alert('La PC quedó en baja. La ficha y el historial siguen disponibles.');
        } else {
          setMsgEliminar('No se encontró la computadora');
        }
      })
      .catch(err => setMsgEliminar(err?.message || 'No se pudo dar de baja'))
      .finally(() => setEliminando(false));
  }

  const historial = c.historial ?? [];
  const conexionTexto = textoConexionAgente(c);
  const isActivo = conexionTexto?.toLowerCase().includes('activ');
  const esNotebook = String(c.tipoEquipo ?? '').trim().toLowerCase() === 'notebook';

  const countMonitores = c.perifericos?.monitores?.length ?? 0;
  const countImpresoras = c.perifericos?.impresoras?.length ?? 0;
  const countUsb = filtrarUsbParaInventario(c.perifericos?.dispositivosUsb ?? []).length;
  const countAudio =
    filtrarAudioParaInventario(c.perifericos?.audio?.entrada ?? []).length +
    filtrarAudioParaInventario(c.perifericos?.audio?.salida ?? []).length;
  const countPerifericos = countUsb + countAudio;
  const ramResumen = getComputerRamDetails(c);
  const ramTabBadge = ramResumen.totalGb > 0
    ? `${Math.round(ramResumen.totalGb)} GB RAM`
    : null;

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <Fragment>
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-7xl max-h-full overflow-hidden ring-1 ring-slate-900/5 computadora-detail-modal">
      
      {/* Modal header with hostname and status sync */}
      <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/computadoras')}
            className="p-1 hover:bg-slate-800 rounded-md transition-colors mr-1 cursor-pointer"
            title="Volver al Listado"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <span className={`w-3.5 h-3.5 rounded-full inline-block ${isActivo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.73)] animate-pulse' : 'bg-slate-400'}`} />
          <div>
            <h3 className="font-extrabold text-2xl sm:text-[1.75rem] text-white leading-tight flex items-center gap-2">
              {esNotebook ? <Laptop className="w-6 h-6 text-slate-300" /> : <Monitor className="w-6 h-6 text-slate-300" />}
              {c.hostname}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              UUID: <span className="font-mono text-slate-300">{c.uuid}</span> <span className="text-slate-600 mx-1.5">•</span> <span className="font-bold text-slate-200">{labelUbicacion(c.ubicacion, ubicCompItems) || 'Sin asignar'}</span>
            </p>
            {(c.origenAlta || c.estadoConciliacion) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {c.origenAlta && ORIGEN_ALTA_MAP[c.origenAlta] && (
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${ORIGEN_ALTA_MAP[c.origenAlta].cls}`}>
                    {ORIGEN_ALTA_MAP[c.origenAlta].label}
                  </span>
                )}
                {c.estadoConciliacion && ESTADO_CONCILIACION_MAP[c.estadoConciliacion] && (
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${ESTADO_CONCILIACION_MAP[c.estadoConciliacion].cls}`}>
                    {ESTADO_CONCILIACION_MAP[c.estadoConciliacion].label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(c.anydeskId ?? c.anydesk_id) && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(c.anydeskId ?? c.anydesk_id);
                setCopiedAnydesk(true);
                setTimeout(() => setCopiedAnydesk(false), 1800);
              }}
              className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-base rounded-lg flex items-center gap-2 transition-colors shrink-0 font-mono"
              title="Copiar ID de AnyDesk"
            >
              {copiedAnydesk ? (
                <span className="text-emerald-400 font-bold">¡Copiado!</span>
              ) : (
                <span>AnyDesk: {(c.anydeskId ?? c.anydesk_id).replace(/(\d{3})(?=\d)/g, '$1 ')}</span>
              )}
            </button>
          )}

          <WriteGate>
          {puedeIngresarStock && (
            <Link
              to={`/perifericos/stock?tab=unidades&editarPc=${encodeURIComponent(c.uuid)}`}
              className="px-4 py-2 border border-teal-700/50 bg-teal-950/40 text-teal-200 hover:bg-teal-900/50 font-bold text-base rounded-lg flex items-center gap-2 transition-colors shrink-0"
            >
              <Package className="w-4 h-4" />
              Ingresar a stock
            </Link>
          )}
          {puedeArmarCombo && (
            <button
              type="button"
              onClick={() => setArmarComboOpen(true)}
              className="px-4 py-2 border border-indigo-700/50 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/50 font-bold text-base rounded-lg flex items-center gap-2 transition-colors shrink-0"
            >
              <Package className="w-4 h-4" />
              Armar combo
            </button>
          )}
          <button 
            onClick={solicitarBaja}
            disabled={eliminando}
            className="px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 hover:border-red-800 font-bold text-base rounded-lg flex items-center gap-2 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {eliminando ? 'Guardando baja...' : 'Dar de baja'}
          </button>
          {msgEliminar && <p className="text-xs text-red-300 m-0 w-full">{msgEliminar}</p>}
          </WriteGate>
        </div>
      </div>

      {/* Sub-tab selection bar */}
      <div className="flex border-b border-slate-200 bg-white px-8 shrink-0 gap-1 overflow-x-auto">
        <button 
          onClick={() => setSolapa('hardware')}
          className={`py-4 px-4 text-base font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${solapa === 'hardware' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hardware
          {ramTabBadge && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-mono font-bold">
              {ramTabBadge}
            </span>
          )}
        </button>
        <button 
          onClick={() => setSolapa('perifericos')}
          className={`py-4 px-4 text-base font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${solapa === 'perifericos' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Periféricos & Conexiones
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-mono font-bold">
            {countPerifericos}
          </span>
        </button>
        <button 
          onClick={() => setSolapa('software')}
          className={`py-4 px-4 text-base font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${solapa === 'software' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          Software
        </button>
        <button
          onClick={() => setSolapa('asignacion')}
          className={`py-4 px-4 text-base font-bold border-b-2 transition-all shrink-0 ${solapa === 'asignacion' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Inventario / Asignación
        </button>
        <button
          onClick={() => setSolapa('auditoria')}
          className={`py-4 px-4 text-base font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${solapa === 'auditoria' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ShieldAlert className="w-4 h-4" />
          Auditoría HW
        </button>
      </div>

      {/* Scrollable Modal Content Body */}
      <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-slate-50">
        
        {/* 1. HARDWARE TAB CONTENTS */}
        {solapa === 'hardware' && (
          <ComputadoraHardwareSection
            computadora={c}
            onNavigateToPerifericos={() => setSolapa('perifericos')}
            countMonitores={countMonitores}
            countImpresoras={countImpresoras}
            countPerifericos={countUsb + countAudio}
          />
        )}

        {solapa === 'perifericos' && (
          <ComputadoraPerifericosSection
            computadora={c}
            uuid={uuid}
            onActualizado={data => { setC(data); listado?.mergeEnListado?.(data); }}
          />
        )}

        {solapa === 'software' && (
          <ComputadoraSoftwareSection computadora={c} />
        )}

      
        {/* 3. ASIGNACIÓN TAB CONTENTS */}
        {solapa === 'asignacion' && (
          <div className="space-y-8">
            <EspecificacionEsperadaBlock
              especificacionEsperada={c.especificacionEsperada}
              loteOrigenId={c.loteOrigenId}
            />
            <BaselineEsperadoBlock baseline={c.baselineEsperado} />
            {/* Datos Generales Grid panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                <Info className="w-5 h-5 text-[#0c66e4]" />
                Datos generales
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">UUID del Sistema</span>
                  <span className="font-semibold text-slate-800 font-mono select-all text-xs block mt-1">{c.uuid}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Ubicación</span>
                  <span className="font-semibold text-slate-800 block mt-1">{labelUbicacion(c.ubicacion, ubicCompItems) || 'Sin asignar'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Arquitectura</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.arquitectura ?? '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estado Conexión (Crudo)</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 mt-1.5 font-bold rounded text-xs ${isActivo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {c.estadoConexion || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estado (IT)</span>
                  <span className="font-extrabold text-[#0c66e4] block mt-1">{c.estadoActual || 'Sin asignar'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Usuario (agente)</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.usuarioActual ?? 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Asignado a</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.responsableInventario ?? '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Sistema Operativo</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.sistemaOperativo ?? '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Conexión (Agente)</span>
                  <span className={`font-bold block mt-1 ${isActivo ? 'text-emerald-600' : 'text-slate-500'}`}>{conexionTexto ?? 'Sin datos'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Última Sincronización</span>
                  <span className="font-mono text-slate-600 text-xs block mt-1">{fmtUltimaSincronizacion(c.ultimaSincronizacion)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tipo de equipo</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {c.tipoEquipo ? labelDeCatalogo(tiposEquipoItems, c.tipoEquipo) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Condición</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {c.condicion ? labelDeCatalogo(condicionesItems, c.condicion) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Operational controls */}
            <WriteGate>
            <form onSubmit={guardarFicha} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Datos de la ficha</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Un guardado deja un solo renglón con los campos que cambiaron.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-800">
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Hostname</span>
                  <input
                    value={ficha.hostname}
                    onChange={e => setFicha(f => ({ ...f, hostname: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Ubicación</span>
                  <select
                    value={ficha.ubicacion}
                    onChange={e => setFicha(f => ({ ...f, ubicacion: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Sin definir</option>
                    {opcionesConActual(ubicCompItems, ficha.ubicacion).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Responsable</span>
                  <input
                    value={ficha.responsableInventario}
                    onChange={e => setFicha(f => ({ ...f, responsableInventario: e.target.value }))}
                    placeholder="ej. Juan Pérez (Soporte)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Serie</span>
                  <input
                    value={ficha.serialEquipo}
                    onChange={e => setFicha(f => ({ ...f, serialEquipo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">AnyDesk</span>
                  <input
                    value={ficha.anydeskId}
                    onChange={e => setFicha(f => ({ ...f, anydeskId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Tipo de equipo</span>
                  <select
                    value={ficha.tipoEquipo}
                    onChange={e => setFicha(f => ({ ...f, tipoEquipo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Sin definir</option>
                    {opcionesConActual(tiposEquipoItems, ficha.tipoEquipo).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-extrabold text-slate-700 block">Condición</span>
                  <select
                    value={ficha.condicion}
                    onChange={e => setFicha(f => ({ ...f, condicion: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Sin definir</option>
                    {opcionesConActual(condicionesItems, ficha.condicion).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="font-extrabold text-slate-700 block">Notas</span>
                  <input
                    value={ficha.notas}
                    onChange={e => setFicha(f => ({ ...f, notas: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </label>
              </div>
              {msgFicha && <p className="text-xs text-red-600 m-0">{msgFicha}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={guardandoFicha}
                  className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {guardandoFicha ? 'Guardando...' : 'Guardar ficha'}
                </button>
              </div>
            </form>

            {/* CAMBIAR ESTADO (IT) WITH motive */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Cambiar Estado (IT)</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Modifique el ciclo de vida de este activo computacional con justificación técnica obligatoria.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-800">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Nuevo Estado IT</label>
                  <select 
                    value={estadoSel}
                    onChange={(e) => setEstadoSel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
                  >
                    <option value="">Seleccionar estado...</option>
                    {opcionesEnumCatalogo(estadoItems).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-extrabold text-slate-700 block">Motivo (Obligatorio)</label>
                  <input 
                    type="text"
                    value={motivoEstado}
                    onChange={(e) => setMotivoEstado(e.target.value)}
                    placeholder="Describa el motivo detallado de esta transición de activos..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                </div>
              </div>

              {msgEstado && <p className="text-xs text-red-600 m-0">{msgEstado}</p>}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button 
                  onClick={guardarEstado}
                  disabled={guardandoEstado || !estadoSel || !motivoEstado.trim()}
                  className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {guardandoEstado ? 'Guardando...' : 'Cambiar estado'}
                </button>
              </div>
            </div>
            </WriteGate>

            {/* HISTORIAL DE ESTADOS (IT) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-[#0c66e4]" />
                Historial de cambios
              </h4>
              <div className="space-y-3 pt-1">
                {historial.length > 0 ? (
                  historial.map((entry, idx) => (
                    <div key={`${entry.actoId ?? 'r'}-${idx}`} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-start shadow-sm">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-extrabold bg-blue-50 border px-2.5 py-0.5 rounded-full text-[10px] uppercase ${entry.vigente ? 'border-blue-200 text-[#0c66e4]' : 'border-slate-200 text-slate-500'}`}>
                            {TIPO_HISTORIAL_LABEL[entry.tipo] || entry.tipo}
                            {entry.vigente ? ' (vigente)' : ''}
                          </span>
                          {entry.origen && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.origen === 'MIGRACION' ? 'Migración' : entry.origen === 'AGENTE' ? 'Agente' : entry.origen === 'MANUAL' ? 'Manual' : entry.origen}</span>
                          )}
                        </div>
                        {(entry.tipo === 'ESTADO' || entry.tipo === 'ALTA_MANUAL' || entry.tipo === 'ALTA_AUTOMATICA' || entry.tipo === 'MIGRACION_INICIAL') && (
                          <p className="text-slate-800 font-semibold m-0">
                            {entry.estadoAnterior ? `${labelEstadoHistorial(entry.estadoAnterior)} → ` : ''}
                            {labelEstadoHistorial(entry.estado)}
                          </p>
                        )}
                        {entry.pasadoDesconocido && (
                          <p className="text-amber-800 font-semibold m-0">Pasado desconocido. No hay evidencia anterior a esta migración.</p>
                        )}
                        {entry.motivo && <p className="text-slate-700 font-semibold leading-relaxed m-0">{entry.motivo}</p>}
                        {Array.isArray(entry.cambios) && entry.cambios.length > 0 && (
                          <ul className="m-0 pl-4 space-y-1 text-slate-700">
                            {entry.cambios.map((cambio, i) => (
                              <li key={`${cambio.campo}-${i}`}>
                                <span className="font-bold">{CAMPO_HISTORIAL_LABEL[cambio.campo] || cambio.campo}:</span>{' '}
                                {valorVisible(cambio.campo, cambio.valorAnterior)} → {valorVisible(cambio.campo, cambio.valorNuevo)}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-bold text-slate-500">{entry.quienNombre || entry.quienUid || '—'}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono text-right flex flex-col sm:items-end gap-1 shrink-0">
                        <span className="font-bold text-slate-500 bg-slate-200/50 border border-slate-200/70 p-1 px-2.5 rounded">
                          {fmtFechaIso(entry.cuando || entry.desde)}
                        </span>
                        {entry.hasta && <span>Fin: {fmtFechaIso(entry.hasta)}</span>}
                        {entry.vigente && <span>Sin fecha de fin</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">Esta ficha todavía no tiene historial nuevo.</div>
                )}
              </div>
            </div>


          </div>
        )}

        {solapa === 'auditoria' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-3 border-b border-slate-100 mb-4">
                <ShieldAlert className="w-4 h-4 text-[#0c66e4]" />
                Cambios de hardware detectados
              </h4>
              <ComputadoraEventosTimeline uuid={uuid} />
            </div>
          </div>
        )}
</div>
      </div>
    </div>

    {armarComboOpen && (
      <ArmarComboModal
        computadora={c}
        onClose={() => setArmarComboOpen(false)}
        onSuccess={data => {
          setC(data);
          listado?.mergeEnListado?.(data);
          setSolapa('asignacion');
        }}
      />
    )}
    </Fragment>
  );
}

export default ComputadoraDetail;