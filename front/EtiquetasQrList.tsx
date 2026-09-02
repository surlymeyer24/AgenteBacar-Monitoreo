import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  QrCode, Search, Printer, MapPin, Monitor, Laptop, Check, AlertCircle, 
  ExternalLink, CheckSquare, Square, MinusSquare, RefreshCw, Layers, ArrowUpDown,
  Tag, Package, ShieldCheck, CheckCircle2, Circle, Clock
} from 'lucide-react';
import { fetchEtiquetasQr, fetchEtiquetaQr, EtiquetaQrListItem } from '../api/etiquetaQrApi';
import { generarQrDataUrl, imprimirEtiquetas, imprimirEtiquetasMonitor, urlFichaEtiqueta } from '../lib/etiquetaQr';
import { UBICACIONES_COMPUTADORA, labelUbicacionEnum, coincideUbicacionFiltro } from '../constants/ubicaciones';
import { getAllProgresoIndex, EstadoGeneralPuesto } from '../utils/logisticaProgreso';

interface EtiquetasQrListProps {
  onSelectComputer: (uuid: string) => void;
}

export default function EtiquetasQrList({ onSelectComputer }: EtiquetasQrListProps) {
  const [lista, setLista] = useState<EtiquetaQrListItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buscar, setBuscar] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroLogistica, setFiltroLogistica] = useState<string>('');
  const [progresoIndex, setProgresoIndex] = useState(() => getAllProgresoIndex());
  const [seleccion, setSeleccion] = useState<Set<string>>(() => new Set());
  const [imprimiendo, setImprimiendo] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'info' | 'error' | 'success'; texto: string } | null>(null);
  
  const headerCbRef = useRef<HTMLInputElement>(null);

  const cargarDatos = () => {
    setCargando(true);
    setError(null);
    setProgresoIndex(getAllProgresoIndex());
    fetchEtiquetasQr()
      .then(data => {
        setLista(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las etiquetas.');
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
    const onFocus = () => setProgresoIndex(getAllProgresoIndex());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Filtrado reactivo
  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return lista.filter(item => {
      if (!coincideUbicacionFiltro(item.ubicacion, filtroUbicacion)) return false;
      
      // Filtro de fase logística
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
  }, [lista, buscar, filtroUbicacion, filtroLogistica, progresoIndex]);

  // Contadores globales de progreso logístico
  const kpisLogistica = useMemo(() => {
    let cantEtiquetados = 0;
    let cantEmbalados = 0;
    let cantEnDestino = 0;

    lista.forEach(item => {
      const p = progresoIndex[item.uuid];
      if (p) {
        if (p.etiquetadoPct === 100) cantEtiquetados++;
        if (p.embaladoPct === 100) cantEmbalados++;
        if (p.destinoPct === 100) cantEnDestino++;
      }
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

  // Limpiar selección cuando se filtra (solo conservar los IDs visibles)
  useEffect(() => {
    const idsVisibles = new Set(filtradas.map(e => e.uuid));
    setSeleccion(prev => new Set([...prev].filter(id => idsVisibles.has(id))));
  }, [filtradas]);

  // Sincronizar estado indeterminate y checked del checkbox maestro
  useEffect(() => {
    if (!headerCbRef.current) return;
    const n = filtradas.length;
    const selCount = filtradas.filter(e => seleccion.has(e.uuid)).length;
    headerCbRef.current.indeterminate = selCount > 0 && selCount < n;
    headerCbRef.current.checked = n > 0 && selCount === n;
  }, [filtradas, seleccion]);

  const toggleTodas = () => {
    const ids = filtradas.map(e => e.uuid);
    const todasSeleccionadas = ids.length > 0 && ids.every(id => seleccion.has(id));
    if (todasSeleccionadas) {
      setSeleccion(new Set());
    } else {
      setSeleccion(new Set(ids));
    }
  };

  const toggleUna = (uuid: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSeleccion(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  // 1. Imprimir seleccionadas (etiquetas de PC)
  const handleImprimirSeleccionadas = async () => {
    const items = filtradas.filter(e => seleccion.has(e.uuid));
    if (!items.length) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor selecciona al menos una computadora.' });
      return;
    }
    await ejecutarImpresionPc(items);
  };

  // 2. Imprimir monitores de las seleccionadas
  const handleImprimirMonitoresSeleccionadas = async () => {
    const items = filtradas.filter(e => seleccion.has(e.uuid));
    if (!items.length) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor selecciona al menos una computadora.' });
      return;
    }

    setImprimiendo(true);
    setMensajeEstado({ tipo: 'info', texto: 'Recopilando monitores asociados y generando códigos QR...' });

    try {
      const fichas = await Promise.all(items.map(it => fetchEtiquetaQr(it.uuid)));
      const etiquetasMonitor = [];

      for (const f of fichas) {
        if (!f || !f.monitores?.length) continue;
        const ubicacionLabel = labelUbicacionEnum(f.ubicacion);
        for (const m of f.monitores) {
          const qrDataUrl = await generarQrDataUrl(urlFichaEtiqueta(f.uuid));
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
  };

  // 3. Imprimir todas las filtradas
  const handleImprimirFiltradas = async () => {
    if (!filtradas.length) {
      setMensajeEstado({ tipo: 'error', texto: 'No hay computadoras que coincidan con los filtros actuales.' });
      return;
    }
    await ejecutarImpresionPc(filtradas);
  };

  const ejecutarImpresionPc = async (items: EtiquetaQrListItem[]) => {
    setImprimiendo(true);
    setMensajeEstado({ tipo: 'info', texto: `Generando ${items.length} código(s) QR para impresión térmica...` });

    try {
      const etiquetas = [];
      for (const it of items) {
        const qrDataUrl = await generarQrDataUrl(urlFichaEtiqueta(it.uuid));
        etiquetas.push({
          qrDataUrl,
          hostname: it.hostname,
          usuarioActual: it.usuarioActual,
          ubicacionLabel: labelUbicacionEnum(it.ubicacion),
        });
      }

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
  };

  const seleccionadas = filtradas.filter(e => seleccion.has(e.uuid));
  const totalMonitoresSeleccionados = seleccionadas.reduce((sum, e) => sum + (e.cantidadMonitores ?? 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Principal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 text-[11px] font-mono font-bold tracking-wide uppercase">
              <QrCode className="w-3.5 h-3.5" />
              Módulo de Identificación Física IT
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Etiquetas QR
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Mudanza · impresora Xprinter 410B · sticker térmico 100 × 50 mm
            </p>
          </div>

          {/* Barra de Acciones de Impresión Masiva */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={imprimiendo || seleccionadas.length === 0}
              onClick={handleImprimirSeleccionadas}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Imprime las etiquetas para el gabinete de las PCs seleccionadas"
            >
              <Printer className="w-4 h-4 text-red-600" />
              <span>Imprimir seleccionadas ({seleccionadas.length})</span>
            </button>

            <button
              type="button"
              disabled={imprimiendo || seleccionadas.length === 0 || totalMonitoresSeleccionados === 0}
              onClick={handleImprimirMonitoresSeleccionadas}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer"
              title={totalMonitoresSeleccionados === 0 ? 'No hay monitores en las PCs seleccionadas' : 'Imprime una etiqueta por cada monitor de las estaciones seleccionadas'}
            >
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Imprimir monitores ({totalMonitoresSeleccionados})</span>
            </button>

            <button
              type="button"
              disabled={imprimiendo || filtradas.length === 0}
              onClick={handleImprimirFiltradas}
              className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Imprime todas las computadoras que coinciden con los filtros actuales"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir filtradas ({filtradas.length})</span>
            </button>
          </div>
        </div>

        {/* Texto de Ayuda / Instrucción Técnica de Impresión Térmica */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block mb-0.5">Guía de Configuración de Impresión Térmica:</span>
            En el diálogo de impresión de Windows, selecciona la impresora <span className="font-mono text-slate-900 font-bold">Xprinter 410B</span>, configura el papel en <span className="font-semibold text-slate-900">100 × 50 mm</span> (o tamaño del rollo continuo) y establece la escala en <span className="font-semibold text-slate-900">100% / Tamaño real</span> (sin la opción “ajustar a la página”).
          </div>
        </div>
      </div>

      {/* KPI Cards de Progreso Logístico */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estaciones IT</span>
            <Laptop className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{kpisLogistica.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Equipos en inventario</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">1. Etiquetados</span>
            <Tag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-black text-indigo-950 font-mono">{kpisLogistica.cantEtiquetados}</p>
            <span className="text-xs text-indigo-600 font-bold">/ {kpisLogistica.total} ({kpisLogistica.pctEtiquetados}%)</span>
          </div>
          <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${kpisLogistica.pctEtiquetados}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">2. Embalados</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-black text-amber-950 font-mono">{kpisLogistica.cantEmbalados}</p>
            <span className="text-xs text-amber-600 font-bold">/ {kpisLogistica.total} ({kpisLogistica.pctEmbalados}%)</span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${kpisLogistica.pctEmbalados}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">3. En Destino</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-black text-emerald-950 font-mono">{kpisLogistica.cantEnDestino}</p>
            <span className="text-xs text-emerald-600 font-bold">/ {kpisLogistica.total} ({kpisLogistica.pctEnDestino}%)</span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${kpisLogistica.pctEnDestino}%` }} />
          </div>
        </div>
      </div>

      {/* Alertas y Mensajes de Estado */}
      {mensajeEstado && (
        <div 
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border transition-all ${
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
            className="text-slate-500 hover:text-slate-900 text-xs underline cursor-pointer font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por hostname, usuario, ubicación o UUID..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-slate-900 rounded-lg pl-10 pr-4 py-2 text-xs font-mono placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[170px]">
            <select
              value={filtroLogistica}
              onChange={e => setFiltroLogistica(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-red-500 cursor-pointer appearance-none pr-8 font-medium focus:bg-white"
            >
              <option value="">Todos los estados logísticos</option>
              <option value="pend_etiqueta">⏳ Pendiente de Etiquetar</option>
              <option value="etiquetado">🏷️ Etiquetado Completo</option>
              <option value="embalado">📦 Embalado en Cajas</option>
              <option value="en_destino">📍 Listo en Destino</option>
            </select>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[190px]">
            <select
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-red-500 cursor-pointer appearance-none pr-8 font-medium focus:bg-white"
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
            disabled={cargando}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Recargar lista de equipos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Equipos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {cargando ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-xs font-mono font-medium tracking-wide">Cargando fichas de computadoras y periféricos...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={cargarDatos}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
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
                  <th className="py-3.5 px-4">Usuario Asignado</th>
                  <th className="py-3.5 px-4 text-center">Fases Logística</th>
                  <th className="py-3.5 px-4 text-center"># Mon / Perif</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-medium text-slate-600">No se encontraron equipos que coincidan con el filtro.</p>
                      <button
                        type="button"
                        onClick={() => { setBuscar(''); setFiltroUbicacion(''); }}
                        className="text-[11px] text-red-600 hover:underline mt-2 font-mono font-medium"
                      >
                        Limpiar filtros
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtradas.map(item => {
                    const isSelected = seleccion.has(item.uuid);
                    const isNotebook = item.tipoEquipo.toLowerCase().includes('notebook');

                    return (
                      <tr
                        key={item.uuid}
                        onClick={() => onSelectComputer(item.uuid)}
                        className={`group transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-red-50/70 hover:bg-red-50' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox celda */}
                        <td 
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleUna(item.uuid, e)}
                            aria-label={`Seleccionar ${item.hostname}`}
                            className="rounded border-slate-300 bg-white text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        {/* Hostname + Tipo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isNotebook ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
                              {isNotebook ? <Laptop className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-xs block group-hover:text-red-600 transition-colors">
                                {item.hostname || '—'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">
                                {item.tipoEquipo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]">
                            <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                            {labelUbicacionEnum(item.ubicacion)}
                          </span>
                        </td>

                        {/* Usuario */}
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {item.usuarioActual || <span className="text-slate-400 italic">SYSTEM</span>}
                        </td>

                        {/* Fases Logística (3 Fases) */}
                        <td className="py-3.5 px-4 text-center">
                          {(() => {
                            const p = progresoIndex[item.uuid];
                            const etqOk = p && p.etiquetadoPct === 100;
                            const embOk = p && p.embaladoPct === 100;
                            const destOk = p && p.destinoPct === 100;

                            return (
                              <div className="inline-flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200">
                                {/* Fase 1: Etiquetado */}
                                <span 
                                  title={`Fase 1: Etiquetado (${p?.etiquetadoPct ?? 0}%)`}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    etqOk 
                                      ? 'bg-indigo-600 text-white' 
                                      : (p?.etiquetadoPct ?? 0) > 0
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-white text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{etqOk ? '✓' : `${p?.etiquetadoPct ?? 0}%`}</span>
                                </span>

                                {/* Fase 2: Embalado */}
                                <span 
                                  title={`Fase 2: Embalado (${p?.embaladoPct ?? 0}%)`}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    embOk 
                                      ? 'bg-amber-600 text-white' 
                                      : (p?.embaladoPct ?? 0) > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-white text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  <Package className="w-2.5 h-2.5" />
                                  <span>{embOk ? '✓' : `${p?.embaladoPct ?? 0}%`}</span>
                                </span>

                                {/* Fase 3: En Destino */}
                                <span 
                                  title={`Fase 3: Listo en Destino (${p?.destinoPct ?? 0}%)`}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    destOk 
                                      ? 'bg-emerald-600 text-white' 
                                      : (p?.destinoPct ?? 0) > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-white text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{destOk ? '✓' : `${p?.destinoPct ?? 0}%`}</span>
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* # Monitores / Periféricos combinados */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <span 
                              title={`${item.cantidadMonitores} Monitores`}
                              className={`px-1.5 py-0.5 rounded ${item.cantidadMonitores > 0 ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-400'}`}
                            >
                              {item.cantidadMonitores}M
                            </span>
                            <span className="text-slate-300">/</span>
                            <span 
                              title={`${item.cantidadPerifericos} Periféricos`}
                              className={`px-1.5 py-0.5 rounded ${item.cantidadPerifericos > 0 ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-400'}`}
                            >
                              {item.cantidadPerifericos}P
                            </span>
                          </div>
                        </td>

                        {/* Botón Ficha */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectComputer(item.uuid);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-600 text-slate-700 hover:text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer border border-slate-200 hover:border-red-600"
                          >
                            <QrCode className="w-3.5 h-3.5" />
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

        {/* Footer de resumen */}
        {!cargando && !error && filtradas.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-mono">
            <div>
              Mostrando <span className="font-bold text-slate-900">{filtradas.length}</span> de <span className="text-slate-900">{lista.length}</span> computadoras
              {seleccionadas.length > 0 && (
                <span className="text-red-600 font-bold ml-2">
                  ({seleccionadas.length} seleccionada{seleccionadas.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              Click en cualquier fila para inspeccionar o imprimir su ficha individual
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
