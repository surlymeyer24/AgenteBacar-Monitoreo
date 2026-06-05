import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchComputadora,
  updateUbicacion,
  updateEstado,
  updateResponsableInventario,
  deleteComputadora,
} from '../api/computadoraApi';
import { useOptionalComputadorasList } from '../context/ComputadorasListContext';
import AgregarPerifericoForms from '../components/AgregarPerifericoForms';
import { UBICACIONES_COMPUTADORA } from '../constants/ubicaciones';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { textoConexionAgente } from '../utils/estadoConexion';
import { filtrarUsbParaInventario, filtrarAudioParaInventario, esTeclado, esMouse, esWebcamClaseCamera } from '../utils/perifericos';
import {
  ArrowLeft, Trash2, Info, HardDrive, MemoryStick, Printer, Usb, Monitor, Speaker, Component, Terminal, CheckCircle, Shield, ShieldCheck, RotateCcw, Play, Clock, User, ChevronLeft, Laptop, Search
} from 'lucide-react';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';

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

function fmtUbicacion(u) {
  if (!u) return 'Sin asignar';
  return u.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
}

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return '—';
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : '—';
}

const WIN_VER_KEYS_ORDER = ['edicion', 'display_version', 'build', 'ubr', 'build_lab'];

const WIN_VER_LABELS = {
  edicion: 'Edición',
  display_version: 'Versión mostrada',
  build: 'Build',
  ubr: 'UBR',
  build_lab: 'Build lab',
};

function clavesWindowsVersionDetallada(m) {
  if (!m || typeof m !== 'object') return [];
  const keys = new Set(Object.keys(m));
  const ordered = WIN_VER_KEYS_ORDER.filter(k => keys.has(k));
  const rest = [...keys].filter(k => !WIN_VER_KEYS_ORDER.includes(k)).sort();
  return [...ordered, ...rest];
}

function valorWindowsDetallado(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function limpiarNombreMonitor(n) {
  return (n ?? '—').replace(/\u0000/g, '');
}

function ramTotalGb(modulos) {
  if (!modulos?.length) return null;
  const sum = modulos.reduce((acc, m) => acc + (Number(m.capacidadGB) || 0), 0);
  return sum > 0 ? sum : null;
}

function ComputadoraDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const listado = useOptionalComputadorasList();
  const mergeEnListadoRef = useRef(listado?.mergeEnListado);
  mergeEnListadoRef.current = listado?.mergeEnListado;
  const [c, setC] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ubicacionSel, setUbicacionSel] = useState('');
  const [guardandoUbi, setGuardandoUbi] = useState(false);
  const [msgUbi, setMsgUbi] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [textoResponsableInv, setTextoResponsableInv] = useState('');
  const [guardandoRi, setGuardandoRi] = useState(false);
  const [msgRi, setMsgRi] = useState(null);
  const [solapa, setSolapa] = useState('hardware');
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState(null);
  const [copiedAnydesk, setCopiedAnydesk] = useState(false);
  const [buscarPrograma, setBuscarPrograma] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchComputadora(uuid)
      .then(data => {
        if (cancelled) return;
        setC(data);
        if (data?.ubicacion) setUbicacionSel(data.ubicacion);
        setTextoResponsableInv(data?.responsableInventario ?? '');
        if (data) mergeEnListadoRef.current?.(data);
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

  function guardarUbicacion(e) {
    e?.preventDefault();
    if (!ubicacionSel) return;
    setGuardandoUbi(true);
    setMsgUbi(null);
    updateUbicacion(uuid, ubicacionSel)
      .then(data => {
        if (data) { setC(data); listado?.mergeEnListado?.(data); alert('Ubicación de red actualizada exitosamente.'); }
        else setMsgUbi('No se encontró la computadora');
      })
      .catch(() => setMsgUbi('No se pudo guardar la ubicación'))
      .finally(() => setGuardandoUbi(false));
  }

  function guardarResponsableInventario(e) {
    e?.preventDefault();
    setGuardandoRi(true);
    setMsgRi(null);
    updateResponsableInventario(uuid, textoResponsableInv.trim() || null)
      .then(data => {
        if (data) {
          setC(data);
          setTextoResponsableInv(data.responsableInventario ?? '');
          listado?.mergeEnListado?.(data);
          alert('Se ha guardado la asignación de inventario con éxito.');
        } else {
          setMsgRi('No se encontró la computadora');
        }
      })
      .catch(() => setMsgRi('No se pudo guardar el asignado (IT)'))
      .finally(() => setGuardandoRi(false));
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
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  function solicitarEliminar() {
    const nombre = (c.hostname && String(c.hostname).trim()) ? c.hostname : 'esta PC';
    if (!window.confirm(`¿Confirma que desea dar de baja y eliminar físicamente el nodo "${nombre}" del sistema? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    setMsgEliminar(null);
    deleteComputadora(uuid)
      .then(ok => {
        if (ok) { alert(`PC "${nombre}" desvinculada exitosamente del sistema de inventario.`); listado?.removeEnListado?.(uuid); navigate('/computadoras'); }
        else setMsgEliminar('No se encontró la computadora (quizá ya fue borrada).');
      })
      .catch(() => setMsgEliminar('No se pudo eliminar la computadora'))
      .finally(() => setEliminando(false));
  }

  const historial = c.historialEstados ?? [];
  const programas = c.programas ?? [];
  const winVer = c.windowsVersionDetallada;
  const winVerKeys = clavesWindowsVersionDetallada(winVer);
  const totalRam = ramTotalGb(c.modulos);
  const conexionTexto = textoConexionAgente(c);
  const isActivo = conexionTexto?.toLowerCase().includes('activ');
  const esNotebook = (c.tipoEquipo ?? '').toLowerCase().includes('notebook');

  const programasFiltrados = programas.filter(p => {
    if (!buscarPrograma) return true;
    const term = buscarPrograma.toLowerCase();
    const nombre = String(p.nombre ?? p.name ?? '').toLowerCase();
    const editor = String(p.editor ?? p.fabricante ?? p.publisher ?? '').toLowerCase();
    return nombre.includes(term) || editor.includes(term);
  });

  // Periféricos
  const usbFiltrados = filtrarUsbParaInventario(c.perifericos?.dispositivosUsb ?? []);
  const teclados = usbFiltrados.filter(u => esTeclado(u));
  const mouse    = usbFiltrados.filter(u => esMouse(u));
  const webcams  = usbFiltrados.filter(u => esWebcamClaseCamera(u));
  const otrosUsb = usbFiltrados.filter(u => !esTeclado(u) && !esMouse(u) && !esWebcamClaseCamera(u));

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-7xl max-h-full overflow-hidden ring-1 ring-slate-900/5">
      
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
            <h3 className="font-extrabold text-xl sm:text-2xl text-white leading-tight flex items-center gap-2">
              {esNotebook ? <Laptop className="w-5 h-5 text-slate-300" /> : <Monitor className="w-5 h-5 text-slate-300" />}
              {c.hostname}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              UUID: <span className="font-mono text-slate-300">{c.uuid}</span> <span className="text-slate-600 mx-1.5">•</span> <span className="font-bold text-slate-200">{fmtUbicacion(c.ubicacion)}</span>
            </p>
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
              className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0 font-mono"
              title="Copiar ID de AnyDesk"
            >
              {copiedAnydesk ? (
                <span className="text-emerald-400 font-bold">¡Copiado!</span>
              ) : (
                <span>AnyDesk: {(c.anydeskId ?? c.anydesk_id).replace(/(\d{3})(?=\d)/g, '$1 ')}</span>
              )}
            </button>
          )}

          <button 
            onClick={solicitarEliminar}
            disabled={eliminando}
            className="px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 hover:border-red-800 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {eliminando ? 'Eliminando...' : 'Eliminar esta PC'}
          </button>
        </div>
      </div>

      {/* Sub-tab selection bar */}
      <div className="flex border-b border-slate-200 bg-white px-8 shrink-0">
        <button 
          onClick={() => setSolapa('hardware')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition-all mr-2 ${solapa === 'hardware' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hardware
        </button>
        <button 
          onClick={() => setSolapa('software')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${solapa === 'software' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Software
        </button>
        <button 
          onClick={() => setSolapa('asignacion')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${solapa === 'asignacion' ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Inventario / Asignación
        </button>
      </div>

      {/* Scrollable Modal Content Body */}
      <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-slate-50">
        
        {/* 1. HARDWARE TAB CONTENTS */}
        {solapa === 'hardware' && (
          <div className="space-y-8">
            
            {/* Resource CPU/RAM Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Procesador</span>
                <span className="text-sm sm:text-base font-bold text-slate-800 block mt-2 leading-snug">{c.procesador?.nombreRaw ?? c.procesador?.nombre ?? '—'}</span>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Memoria Total</span>
                <span className="text-2xl font-black text-slate-900 block mt-2">{totalRam != null ? `${totalRam.toFixed(2)} GB` : '—'}</span>
                <span className="text-xs text-slate-400 block mt-1">{c.modulos?.length ?? 0} módulo(s) físico(s) reportados</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-wider">Arquitectura</span>
                <span className="text-2xl font-black text-slate-900 block mt-2">{c.arquitectura ?? '—'}</span>
                <span className="text-xs text-emerald-600 font-bold block mt-1 flex items-center gap-1 font-mono">
                  <CheckCircle className="w-4 h-4 inline text-emerald-500" /> Operativo
                </span>
              </div>
            </div>

            {/* Almacenamiento */}
            {c.discos?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-[#0c66e4]" />
                  Almacenamiento
                </h3>
                <div className="space-y-5 text-sm border-t border-slate-100 pt-5">
                  {c.discos.map((d, i) => {
                    const pct = Number(d.porcentajeUsado) || 0;
                    const progressCls = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-[#0c66e4]';
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center font-bold gap-1 sm:gap-0">
                          <span className="text-slate-800 font-mono">
                            {d.letra ?? d.puntoMontaje ?? d.nombre ?? `Disco ${i + 1}`} 
                            <span className="text-slate-500 ml-2 font-normal">({d.modeloDisco || 'Disco Genérico'}{d.tipoDisco ? ` - ${d.tipoDisco}` : ''})</span>
                          </span>
                          <span className="text-slate-700 font-mono text-xs sm:text-sm">{d.libreGB ? `${Number(d.libreGB).toFixed(1)} GB Libres` : ''} de {Number(d.totalGB || 0).toFixed(0)} GB ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full ${progressCls} transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Periféricos enlazados */}
            <div className="pt-2">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Usb className="w-6 h-6 text-slate-600" />
                Periféricos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Monitores */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Monitor className="w-4 h-4 text-[#0c66e4]" />
                    Monitores Conectados
                  </h4>
                  <div className="space-y-2">
                    {c.perifericos?.monitores?.length > 0 ? (
                      c.perifericos.monitores.map((m, i) => (
                        <div key={i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                          <span className="font-extrabold text-slate-800 block text-[11px]">{limpiarNombreMonitor(m.nombre)}</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Resolución: {m.resolucion || '—'} <span className="text-slate-300 mx-1">|</span> {fmtNumOGuion(m.pulgadas, 1)}"</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">No detectados.</div>
                    )}
                  </div>
                </div>

                {/* Impresoras */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Printer className="w-4 h-4 text-[#0c66e4]" />
                    Impresoras Enlazadas
                  </h4>
                  <div className="space-y-2">
                    {c.perifericos?.impresoras?.length > 0 ? (
                      c.perifericos.impresoras.map((prn, i) => (
                        <div key={i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                          <span className="font-extrabold text-slate-800 block text-[11px]">{prn.nombre || '—'}</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Driver: {prn.driver || '—'} <span className="text-slate-300 mx-1">|</span> Pto: {prn.puerto || '—'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">No detectadas.</div>
                    )}
                  </div>
                </div>

                {/* Teclados / Mouse */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <MemoryStick className="w-4 h-4 text-[#0c66e4]" />
                    Entrada (USB)
                  </h4>
                  <div className="space-y-2">
                    {teclados.length > 0 || mouse.length > 0 ? (
                      <>
                        {teclados.map((t, i) => (
                          <div key={'t'+i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                            <span className="font-extrabold text-slate-800 block text-[11px]">{t.nombre}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Dispositivo: Teclado {t.fabricante ? `<span class="text-slate-300 mx-1">|</span> Fab: ${t.fabricante}` : ''}</span>
                          </div>
                        ))}
                        {mouse.map((m, i) => (
                          <div key={'m'+i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                            <span className="font-extrabold text-slate-800 block text-[11px]">{m.nombre}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Dispositivo: Mouse {m.fabricante ? `<span class="text-slate-300 mx-1">|</span> Fab: ${m.fabricante}` : ''}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No detectados.</div>
                    )}
                  </div>
                </div>

                {/* Multimedia (Audio / Webcams) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Speaker className="w-4 h-4 text-[#0c66e4]" />
                    Multimedia & Otros
                  </h4>
                  <div className="space-y-2">
                    {webcams.length > 0 || otrosUsb.length > 0 ? (
                      <>
                        {webcams.map((w, i) => (
                          <div key={'w'+i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                            <span className="font-extrabold text-slate-800 block text-[11px]">{w.nombre}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Dispositivo: Webcam {w.fabricante ? `<span class="text-slate-300 mx-1">|</span> Fab: ${w.fabricante}` : ''}</span>
                          </div>
                        ))}
                        {otrosUsb.slice(0, 3).map((o, i) => (
                          <div key={'o'+i} className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-sm hover:bg-slate-100/50 transition-colors">
                            <span className="font-extrabold text-slate-800 block text-[11px] truncate" title={o.nombre}>{o.nombre}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Dispositivo: Genérico {o.fabricante ? `<span class="text-slate-300 mx-1">|</span> Fab: ${o.fabricante}` : ''}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No detectados.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Agregar Periférico Manualmente */}
              <div className="mt-6 bg-slate-50/50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Usb className="w-4 h-4 text-slate-500" />
                  Agregar Periférico Manualmente
                </h4>
                <div className="pt-2">
                  <AgregarPerifericoForms uuid={uuid} onActualizado={data => { setC(data); listado?.mergeEnListado?.(data); }} />
                </div>
              </div>
            </div>



          </div>
        )}

        {/* 2. SOFTWARE TAB CONTENTS (MATCHES SECOND SCREENSHOT) */}
        {solapa === 'software' && (
          <div className="space-y-6">
            
            {/* Operating System details card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
                <CheckCircle className="w-5 h-5 text-[#0c66e4]" />
                Sistema operativo
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Sistema Operativo</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.sistemaOperativo || '—'}</span>
                </div>
                {winVerKeys.map(k => (
                  <div key={k} className={k === 'build_lab' ? 'overflow-hidden col-span-2 md:col-span-1' : ''}>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{WIN_VER_LABELS[k] ?? k}</span>
                    <span className={`font-semibold text-slate-800 block mt-1 ${k === 'build_lab' ? 'select-all font-mono text-xs truncate' : ''}`} title={valorWindowsDetallado(winVer[k])}>
                      {valorWindowsDetallado(winVer[k])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Programas Instalados table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-500 rotate-90 shrink-0 select-none pb-0.5" />
                  Programas instalados
                </h4>
                <div className="relative max-w-sm w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar programa..." 
                    value={buscarPrograma}
                    onChange={e => setBuscarPrograma(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 font-medium focus:bg-white focus:outline-none focus:border-[#0c66e4]"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5 font-bold">NOMBRE</th>
                      <th className="py-3 px-5 font-bold">VERSIÓN</th>
                      <th className="py-3 px-5 font-bold">EDITOR</th>
                      <th className="py-3 px-5 font-bold">FECHA_INSTALACIÓN</th>
                      <th className="py-3 px-5 font-bold">RUTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {programasFiltrados.length > 0 ? programasFiltrados.map((prog, i) => (
                      <tr key={prog.documentoId ?? i} className="hover:bg-slate-50/50 transition-colors text-xs leading-snug">
                        <td className="py-3 px-5 font-bold text-slate-900">{prog.nombre ?? prog.name ?? '—'}</td>
                        <td className="py-3 px-5 font-mono text-slate-700">{prog.version ?? '—'}</td>
                        <td className="py-3 px-5 text-slate-500 font-semibold">{prog.editor ?? prog.fabricante ?? prog.publisher ?? '—'}</td>
                        <td className="py-3 px-5 font-mono text-slate-500">{prog.fecha_instalacion ?? prog.fechaInstalacion ?? '—'}</td>
                        <td className="py-3 px-5 font-mono text-slate-400 truncate max-w-[200px]" title={prog.ruta ?? prog.ruta_instalacion ?? prog.install_location}>{prog.ruta ?? prog.ruta_instalacion ?? prog.install_location ?? '—'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                          {buscarPrograma ? 'No se encontraron programas con esa bǭsqueda.' : 'No hay programas registrados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      
        {/* 3. ASIGNACIÓN TAB CONTENTS */}
        {solapa === 'asignacion' && (
          <div className="space-y-8">
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
                  <span className="font-semibold text-slate-800 block mt-1">{fmtUbicacion(c.ubicacion)}</span>
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
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Usuario</span>
                  <span className="font-semibold text-slate-800 block mt-1">{c.usuarioActual ?? 'SYSTEM'} {c.responsableInventario ? `/ ${c.responsableInventario}` : ''}</span>
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
              </div>
            </div>

            {/* Operational controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ASIGNADO EN INVENTARIO */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Asignado en Inventario</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Señale el nombre o clave de la persona que tiene en resguardo físico esta PC.</p>
                </div>
                <form className="flex gap-2 text-xs text-slate-800" onSubmit={guardarResponsableInventario}>
                  <input 
                    type="text" 
                    value={textoResponsableInv}
                    onChange={(e) => setTextoResponsableInv(e.target.value)}
                    placeholder="ej. Juan Pérez (Soporte)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
                  />
                  <button 
                    type="submit"
                    disabled={guardandoRi}
                    className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </form>
                {msgRi && <p className="text-xs text-red-600 m-0">{msgRi}</p>}
              </div>

              {/* CAMBIAR UBICACIÓN */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Cambiar Ubicación</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Modifique la zona administrativa vinculada de red para sincronización de políticas.</p>
                </div>
                <form className="flex gap-2 text-xs text-slate-800" onSubmit={guardarUbicacion}>
                  <select 
                    value={ubicacionSel}
                    onChange={(e) => setUbicacionSel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {UBICACIONES_COMPUTADORA.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button 
                    type="submit"
                    disabled={guardandoUbi || !ubicacionSel}
                    className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </form>
                {msgUbi && <p className="text-xs text-red-600 m-0">{msgUbi}</p>}
              </div>

            </div>

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
                    {ESTADOS_OPERATIVOS.map(k => (
                      <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
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

            {/* HISTORIAL DE ESTADOS (IT) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-[#0c66e4]" />
                Historial de Estados (IT)
              </h4>
              <div className="space-y-3 pt-1">
                {historial && historial.length > 0 ? (
                  historial.map((entry, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-start shadow-sm transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold bg-blue-50 border px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono ${entry.activo ? 'border-blue-200 text-[#0c66e4]' : 'border-slate-200 text-slate-500'}`}>
                            {entry.estado} {entry.activo && '(VIGENTE)'}
                          </span>
                        </div>
                        {entry.motivo && <p className="text-slate-700 font-semibold leading-relaxed mt-1">{entry.motivo}</p>}
                        {entry.autor && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1">
                            <User className="w-3.5 h-3.5" /> Administrador: <span className="font-bold text-slate-500">{entry.autor}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono text-right flex flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0">
                        <span className="font-bold text-slate-500 bg-slate-200/50 border border-slate-200/70 p-1 px-2.5 rounded">{fmtFechaIso(entry.fechaHoraInicio)}</span>
                        {entry.fechaHoraFin && <span>Fin: {fmtFechaIso(entry.fechaHoraFin)}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic">No hay registros previos en la bitácora de activos IT.</div>
                )}
              </div>
            </div>


          </div>
        )}
</div>
      </div>
    </div>
  );
}

export default ComputadoraDetail;