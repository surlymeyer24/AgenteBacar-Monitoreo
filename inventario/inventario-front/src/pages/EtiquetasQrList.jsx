import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Search,
  Printer,
  MapPin,
  Monitor,
  Laptop,
  Check,
  AlertCircle,
  RefreshCw,
  Tag,
  Package,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
} from 'lucide-react';
import {
  fetchEtiquetaQr,
  actualizarProgresoLogisticaMasivo,
} from '../api/etiquetaQrApi';
import { useEtiquetasQr, useProgresosLogistica } from '../hooks/useQueries';
import {
  UBICACIONES_COMPUTADORA,
  labelUbicacionEnum,
  coincideUbicacionFiltro,
} from '../constants/ubicaciones';
import { FASES } from '../utils/logisticaProgreso';
import WriteGate from '../components/WriteGate';

const FILAS_POR_PAGINA = 50;
const cargarHerramientasQr = () => import('../lib/etiquetaQr');

const ICONOS_FASE = { etiquetado: Tag, embalado: Package, destino: MapPin };
const COLOR_ICONO_FASE = {
  etiquetado: 'text-indigo-600',
  embalado: 'text-amber-600',
  destino: 'text-emerald-600',
};

function ChipFase({ icon, pct, activoClase, parcialClase, titulo }) {
  const Icono = icon;
  const completa = pct === 100;
  return (
    <span
      title={`${titulo} (${pct}%)`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
        completa ? activoClase : pct > 0 ? parcialClase : 'bg-white text-slate-400 border border-slate-200'
      }`}
    >
      <Icono className="w-3.5 h-3.5" />
      <span>{completa ? '✓' : `${pct}%`}</span>
    </span>
  );
}

function FasesLogistica({ progreso, cargando }) {
  if (cargando) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Cargando fases…
      </span>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200">
      <ChipFase
        icon={Tag}
        titulo="Fase 1: etiquetado"
        pct={progreso?.etiquetadoPct ?? 0}
        activoClase="bg-indigo-600 text-white"
        parcialClase="bg-indigo-100 text-indigo-800"
      />
      <ChipFase
        icon={Package}
        titulo="Fase 2: embalado"
        pct={progreso?.embaladoPct ?? 0}
        activoClase="bg-amber-600 text-white"
        parcialClase="bg-amber-100 text-amber-800"
      />
      <ChipFase
        icon={MapPin}
        titulo="Fase 3: listo en destino"
        pct={progreso?.destinoPct ?? 0}
        activoClase="bg-emerald-600 text-white"
        parcialClase="bg-emerald-100 text-emerald-800"
      />
    </div>
  );
}

export default function EtiquetasQrList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const etiquetasQuery = useEtiquetasQr();
  const progresosQuery = useProgresosLogistica();
  const lista = useMemo(
    () => (Array.isArray(etiquetasQuery.data) ? etiquetasQuery.data : []),
    [etiquetasQuery.data],
  );
  const progresoIndex = useMemo(
    () => (progresosQuery.data && typeof progresosQuery.data === 'object' ? progresosQuery.data : {}),
    [progresosQuery.data],
  );
  const cargando = etiquetasQuery.isPending;
  const recargando = etiquetasQuery.isFetching || progresosQuery.isFetching;
  const error = etiquetasQuery.error;
  const [buscar, setBuscar] = useState('');
  const buscarDiferido = useDeferredValue(buscar);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroLogistica, setFiltroLogistica] = useState('');
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [imprimiendo, setImprimiendo] = useState(false);
  const [actualizandoFase, setActualizandoFase] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState(null);
  const headerCbRef = useRef(null);

  function cargarDatos() {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['etiquetasQr'] }),
      queryClient.invalidateQueries({ queryKey: ['progresosLogistica'] }),
    ]);
  }

  const filtradas = useMemo(() => {
    const q = buscarDiferido.trim().toLowerCase();
    return lista.filter(item => {
      if (!coincideUbicacionFiltro(item.ubicacion, filtroUbicacion)) return false;

      const prog = progresoIndex[item.uuid];
      if (filtroLogistica === 'pend_etiqueta') {
        if (prog && prog.etiquetadoPct === 100) return false;
      } else if (filtroLogistica === 'etiquetado') {
        if (!prog || prog.etiquetadoPct < 100) return false;
      } else if (filtroLogistica === 'embalado') {
        if (!prog || prog.embaladoPct < 100) return false;
      } else if (filtroLogistica === 'en_destino') {
        if (!prog || prog.destinoPct < 100) return false;
      }

      if (!q) return true;
      return [item.hostname, item.usuarioActual, item.ubicacion, item.uuid, item.tipoEquipo]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [lista, buscarDiferido, filtroUbicacion, filtroLogistica, progresoIndex]);

  const kpisLogistica = useMemo(() => {
    let cantEtiquetados = 0;
    let cantEmbalados = 0;
    let cantEnDestino = 0;

    lista.forEach(item => {
      const p = progresoIndex[item.uuid];
      if (!p) return;
      if (p.etiquetadoPct === 100) cantEtiquetados++;
      if (p.embaladoPct === 100) cantEmbalados++;
      if (p.destinoPct === 100) cantEnDestino++;
    });

    return {
      total: lista.length,
      cantEtiquetados,
      cantEmbalados,
      cantEnDestino,
      pctEtiquetados: lista.length > 0 ? Math.round((cantEtiquetados / lista.length) * 100) : 0,
      pctEmbalados: lista.length > 0 ? Math.round((cantEmbalados / lista.length) * 100) : 0,
      pctEnDestino: lista.length > 0 ? Math.round((cantEnDestino / lista.length) * 100) : 0,
    };
  }, [lista, progresoIndex]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [filtradas, paginaActual]);

  useEffect(() => {
    setPagina(1);
  }, [buscarDiferido, filtroUbicacion, filtroLogistica]);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  useEffect(() => {
    const idsVisibles = new Set(filtradas.map(e => e.uuid));
    setSeleccion(prev => new Set([...prev].filter(id => idsVisibles.has(id))));
  }, [filtradas]);

  useEffect(() => {
    if (!headerCbRef.current) return;
    const n = filtradas.length;
    const selCount = filtradas.filter(e => seleccion.has(e.uuid)).length;
    headerCbRef.current.indeterminate = selCount > 0 && selCount < n;
    headerCbRef.current.checked = n > 0 && selCount === n;
  }, [filtradas, seleccion]);

  function toggleTodas() {
    const ids = filtradas.map(e => e.uuid);
    const todasSeleccionadas = ids.length > 0 && ids.every(id => seleccion.has(id));
    setSeleccion(todasSeleccionadas ? new Set() : new Set(ids));
  }

  function toggleUna(uuid, e) {
    e.stopPropagation();
    setSeleccion(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  }

  async function ejecutarImpresionPc(items) {
    setImprimiendo(true);
    setMensajeEstado({ tipo: 'info', texto: `Generando ${items.length} código(s) QR para impresión térmica...` });
    try {
      const { generarQrDataUrl, imprimirEtiquetas, urlFichaEtiqueta } = await cargarHerramientasQr();
      const etiquetas = await Promise.all(items.map(async it => {
        const qrDataUrl = await generarQrDataUrl(urlFichaEtiqueta(it.uuid));
        return {
          qrDataUrl,
          hostname: it.hostname,
          usuarioActual: it.usuarioActual,
          ubicacionLabel: labelUbicacionEnum(it.ubicacion),
        };
      }));
      await imprimirEtiquetas(etiquetas);
      setMensajeEstado({
        tipo: 'success',
        texto: `Se enviaron a imprimir ${etiquetas.length} etiqueta(s) térmica(s) de PC (100×50 mm).`,
      });
    } catch (err) {
      setMensajeEstado({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'Error al generar la cola de impresión.',
      });
    } finally {
      setImprimiendo(false);
    }
  }

  async function handleImprimirSeleccionadas() {
    const items = filtradas.filter(e => seleccion.has(e.uuid));
    if (!items.length) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor seleccioná al menos una computadora.' });
      return;
    }
    await ejecutarImpresionPc(items);
  }

  async function handleImprimirFiltradas() {
    if (!filtradas.length) {
      setMensajeEstado({ tipo: 'error', texto: 'No hay computadoras que coincidan con los filtros actuales.' });
      return;
    }
    await ejecutarImpresionPc(filtradas);
  }

  async function handleImprimirMonitoresSeleccionadas() {
    const items = filtradas.filter(e => seleccion.has(e.uuid));
    if (!items.length) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor seleccioná al menos una computadora.' });
      return;
    }

    setImprimiendo(true);
    setMensajeEstado({ tipo: 'info', texto: 'Recopilando monitores asociados y generando códigos QR...' });
    try {
      const {
        generarQrDataUrl,
        imprimirEtiquetasMonitor,
        urlFichaEtiqueta,
      } = await cargarHerramientasQr();
      const fichas = await Promise.all(items.map(it => fetchEtiquetaQr(it.uuid)));
      const etiquetasMonitor = [];
      for (const f of fichas) {
        if (!f || !f.monitores?.length) continue;
        const ubicacionLabel = labelUbicacionEnum(f.ubicacion);
        const qrDataUrl = await generarQrDataUrl(urlFichaEtiqueta(f.uuid));
        for (const m of f.monitores) {
          etiquetasMonitor.push({
            qrDataUrl,
            hostname: f.hostname,
            ubicacionLabel,
            modelo: m.nombre || 'Monitor',
            serial: m.numeroSerie || '',
          });
        }
      }

      if (etiquetasMonitor.length === 0) {
        setMensajeEstado({
          tipo: 'error',
          texto: 'Las computadoras seleccionadas no tienen monitores registrados para imprimir.',
        });
        return;
      }

      await imprimirEtiquetasMonitor(etiquetasMonitor);
      setMensajeEstado({
        tipo: 'success',
        texto: `Se enviaron a imprimir ${etiquetasMonitor.length} etiqueta(s) térmica(s) de monitor.`,
      });
    } catch (err) {
      setMensajeEstado({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'Error al imprimir etiquetas de monitores.',
      });
    } finally {
      setImprimiendo(false);
    }
  }

  async function handleFaseMasiva(fases, completado) {
    const items = filtradas.filter(e => seleccion.has(e.uuid));
    if (!items.length) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor seleccioná al menos una computadora.' });
      return;
    }

    const nombres = fases.map(id => FASES.find(f => f.id === id)?.label ?? id).join(', ');
    const detalle = `${items.length} puesto(s)`;
    const ok = window.confirm(
      completado
        ? `¿Marcar al 100% ${fases.length > 1 ? 'las fases' : 'la fase'} "${nombres}" en ${detalle}?\n\nEsto afecta la PC, monitores y periféricos de cada estación.`
        : `¿Reiniciar el progreso logístico de ${detalle}?\n\nVuelven a estado pendiente en las 3 fases.`,
    );
    if (!ok) return;

    setActualizandoFase(true);
    setMensajeEstado({
      tipo: 'info',
      texto: completado
        ? `Marcando "${nombres}" en ${detalle}...`
        : `Reiniciando el progreso de ${detalle}...`,
    });
    try {
      const resultado = await actualizarProgresoLogisticaMasivo({
        uuids: items.map(it => it.uuid),
        fases,
        completado,
      });
      await queryClient.invalidateQueries({ queryKey: ['progresosLogistica'] });
      const omitidos = Array.isArray(resultado?.omitidos) ? resultado.omitidos.length : 0;
      const actualizados = resultado?.actualizados ?? items.length;
      setMensajeEstado({
        tipo: actualizados > 0 ? 'success' : 'error',
        texto: omitidos > 0
          ? `Se actualizaron ${actualizados} puesto(s). ${omitidos} no se encontraron.`
          : completado
            ? `Se marcó "${nombres}" al 100% en ${actualizados} puesto(s).`
            : `Se reinició el progreso de ${actualizados} puesto(s).`,
      });
    } catch (err) {
      setMensajeEstado({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'No se pudo actualizar la fase logística.',
      });
    } finally {
      setActualizandoFase(false);
    }
  }

  const seleccionadas = filtradas.filter(e => seleccion.has(e.uuid));
  const haySeleccion = seleccionadas.length > 0;
  const ocupado = imprimiendo || actualizandoFase;
  const totalMonitoresSeleccionados = seleccionadas.reduce((sum, e) => sum + (e.cantidadMonitores ?? 0), 0);

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-mono font-bold tracking-wide uppercase">
              <QrCode className="w-4 h-4" />
              Módulo de identificación física IT
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Etiquetas QR
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Mudanza · impresora Xprinter 410B · sticker térmico 100 × 50 mm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={ocupado || seleccionadas.length === 0}
              onClick={handleImprimirSeleccionadas}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 text-sm font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Imprime las etiquetas para el gabinete de las PCs seleccionadas"
            >
              <Printer className="w-4 h-4 text-red-600" />
              <span>Imprimir seleccionadas ({seleccionadas.length})</span>
            </button>

            <button
              type="button"
              disabled={ocupado || seleccionadas.length === 0 || totalMonitoresSeleccionados === 0}
              onClick={handleImprimirMonitoresSeleccionadas}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-700 text-sm font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer"
              title={
                totalMonitoresSeleccionados === 0
                  ? 'No hay monitores en las PCs seleccionadas'
                  : 'Imprime una etiqueta por cada monitor de las estaciones seleccionadas'
              }
            >
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Imprimir monitores ({totalMonitoresSeleccionados})</span>
            </button>

            <button
              type="button"
              disabled={ocupado || filtradas.length === 0}
              onClick={handleImprimirFiltradas}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Imprime todas las computadoras que coinciden con los filtros actuales"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir filtradas ({filtradas.length})</span>
            </button>
          </div>
        </div>
      </div>

      {filtradas.length > 0 && (
        <WriteGate>
          <div
            className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs transition-opacity ${
              haySeleccion ? '' : 'opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  haySeleccion ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                {haySeleccion ? (
                  <span>
                    <strong className="font-bold text-slate-900">{seleccionadas.length}</strong> seleccionadas
                  </span>
                ) : (
                  <span className="font-semibold text-slate-500">Fase masiva:</span>
                )}
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setSeleccion(new Set(filtradas.map(e => e.uuid)))}
                  className="font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Todas{haySeleccion ? '' : ` (${filtradas.length})`}
                </button>
                {haySeleccion && (
                  <>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSeleccion(new Set())}
                      className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 tracking-wide">Marcar 100%:</span>
              {FASES.map(fase => {
                const Icono = ICONOS_FASE[fase.id];
                return (
                  <button
                    key={fase.id}
                    type="button"
                    disabled={ocupado || !haySeleccion}
                    onClick={() => handleFaseMasiva([fase.id], true)}
                    title={`Marcar "${fase.label}" al 100% en los puestos seleccionados`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 text-sm font-bold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Icono className={`w-3.5 h-3.5 ${COLOR_ICONO_FASE[fase.id]}`} />
                    <span>
                      {fase.orden}. {fase.label}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                disabled={ocupado || !haySeleccion}
                onClick={() => handleFaseMasiva(FASES.map(f => f.id), true)}
                title="Marcar las 3 fases al 100% en los puestos seleccionados"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Todo 100%</span>
              </button>

              <button
                type="button"
                disabled={ocupado || !haySeleccion}
                onClick={() => handleFaseMasiva(FASES.map(f => f.id), false)}
                title="Reiniciar el progreso logístico de los puestos seleccionados"
                aria-label="Reiniciar progreso logístico"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${actualizandoFase ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </WriteGate>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estaciones IT</span>
            <Laptop className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-1 font-mono">{kpisLogistica.total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Equipos en inventario</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">1. Etiquetados</span>
            <Tag className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-black text-indigo-950 font-mono">{kpisLogistica.cantEtiquetados}</p>
            <span className="text-sm text-indigo-600 font-bold">
              / {kpisLogistica.total} ({kpisLogistica.pctEtiquetados}%)
            </span>
          </div>
          <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${kpisLogistica.pctEtiquetados}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">2. Embalados</span>
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-black text-amber-950 font-mono">{kpisLogistica.cantEmbalados}</p>
            <span className="text-sm text-amber-600 font-bold">
              / {kpisLogistica.total} ({kpisLogistica.pctEmbalados}%)
            </span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${kpisLogistica.pctEmbalados}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">3. En destino</span>
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-black text-emerald-950 font-mono">{kpisLogistica.cantEnDestino}</p>
            <span className="text-sm text-emerald-600 font-bold">
              / {kpisLogistica.total} ({kpisLogistica.pctEnDestino}%)
            </span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${kpisLogistica.pctEnDestino}%` }}
            />
          </div>
        </div>
      </div>

      {mensajeEstado && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 border transition-all ${
            mensajeEstado.tipo === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : mensajeEstado.tipo === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {mensajeEstado.tipo === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : mensajeEstado.tipo === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-indigo-600" />
            )}
            <span className="font-semibold">{mensajeEstado.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeEstado(null)}
            className="text-slate-500 hover:text-slate-900 text-sm underline cursor-pointer font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {progresosQuery.isError && (
        <div className="p-3 rounded-xl text-sm bg-amber-50 border border-amber-200 text-amber-800">
          Las fichas ya están disponibles, pero no se pudo actualizar el progreso logístico.
          Podés reintentarlo con el botón de recarga.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por hostname, usuario, ubicación o UUID..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-slate-900 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <select
              value={filtroLogistica}
              onChange={e => setFiltroLogistica(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500 cursor-pointer appearance-none pr-8 font-medium focus:bg-white"
            >
              <option value="">Todos los estados logísticos</option>
              <option value="pend_etiqueta">Pendiente de etiquetar</option>
              <option value="etiquetado">Etiquetado completo</option>
              <option value="embalado">Embalado en cajas</option>
              <option value="en_destino">Listo en destino</option>
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <select
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500 cursor-pointer appearance-none pr-8 font-medium focus:bg-white"
            >
              <option value="">Todas las ubicaciones ({lista.length})</option>
              {UBICACIONES_COMPUTADORA.map(u => (
                <option key={u} value={u}>
                  {labelUbicacionEnum(u)}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={cargarDatos}
            disabled={recargando}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Recargar lista de equipos"
          >
            <RefreshCw className={`w-4 h-4 ${recargando ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {cargando ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-sm font-mono font-medium tracking-wide">
              Cargando fichas de computadoras y periféricos...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <p className="text-base font-medium text-red-700">
              {error instanceof Error ? error.message : 'No se pudieron cargar las etiquetas.'}
            </p>
            <button
              type="button"
              onClick={cargarDatos}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      ref={headerCbRef}
                      type="checkbox"
                      onChange={toggleTodas}
                      aria-label="Seleccionar todas las computadoras visibles"
                      className="rounded border-slate-300 bg-white text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Hostname / Estación</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Usuario asignado</th>
                  <th className="py-3.5 px-4 text-center">Fases logística</th>
                  <th className="py-3.5 px-4 text-center"># Mon / Perif</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-medium text-slate-600">
                        No se encontraron equipos que coincidan con el filtro.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBuscar('');
                          setFiltroUbicacion('');
                          setFiltroLogistica('');
                        }}
                        className="text-xs text-red-600 hover:underline mt-2 font-mono font-medium cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    </td>
                  </tr>
                ) : (
                  filasPagina.map(item => {
                    const isSelected = seleccion.has(item.uuid);
                    const isNotebook = (item.tipoEquipo ?? '').toLowerCase().includes('notebook');

                    return (
                      <tr
                        key={item.uuid}
                        onClick={() => navigate(`/etiquetas-qr/${item.uuid}`)}
                        className={`group transition-colors cursor-pointer ${
                          isSelected ? 'bg-red-50/70 hover:bg-red-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => toggleUna(item.uuid, e)}
                            aria-label={`Seleccionar ${item.hostname}`}
                            className="rounded border-slate-300 bg-white text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isNotebook
                                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                                  : 'bg-slate-100 border border-slate-200 text-slate-600'
                              }`}
                            >
                              {isNotebook ? <Laptop className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-sm block group-hover:text-red-600 transition-colors">
                                {item.hostname || '—'}
                              </span>
                              <span className="text-xs text-slate-500 font-sans">{item.tipoEquipo}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            {labelUbicacionEnum(item.ubicacion)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {item.usuarioActual || <span className="text-slate-400 italic">SYSTEM</span>}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <FasesLogistica
                            progreso={progresoIndex[item.uuid]}
                            cargando={progresosQuery.isPending}
                          />
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-mono text-xs">
                            <span
                              title={`${item.cantidadMonitores} monitores`}
                              className={`px-2 py-1 rounded ${
                                item.cantidadMonitores > 0
                                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.cantidadMonitores}M
                            </span>
                            <span className="text-slate-300">/</span>
                            <span
                              title={`${item.cantidadPerifericos} periféricos`}
                              className={`px-2 py-1 rounded ${
                                item.cantidadPerifericos > 0
                                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.cantidadPerifericos}P
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/etiquetas-qr/${item.uuid}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-red-600 text-slate-700 hover:text-white rounded-lg font-bold text-xs transition-all cursor-pointer border border-slate-200 hover:border-red-600"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Ficha</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && !error && filtradas.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 font-mono">
            <div>
              Mostrando{' '}
              <span className="font-bold text-slate-900">
                {(paginaActual - 1) * FILAS_POR_PAGINA + 1}–
                {Math.min(paginaActual * FILAS_POR_PAGINA, filtradas.length)}
              </span>{' '}
              de <span className="font-bold text-slate-900">{filtradas.length}</span> filtradas /{' '}
              <span className="text-slate-900">{lista.length}</span> computadoras
              {seleccionadas.length > 0 && (
                <span className="text-red-600 font-bold ml-2">
                  ({seleccionadas.length} seleccionada{seleccionadas.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600">
                Página <strong className="text-slate-900">{paginaActual}</strong> de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
