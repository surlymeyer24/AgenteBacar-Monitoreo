import React, { useState, useEffect } from 'react';
import { 
  Laptop, Monitor, QrCode, Printer, MapPin, User, Usb, Keyboard, Mouse, 
  Volume2, Package, ArrowLeft, ExternalLink, RefreshCw, AlertCircle, Copy, Check, Info,
  Share2, CheckCircle2, Circle, Maximize2, X, Sparkles, MessageCircle, ShieldCheck, Tag
} from 'lucide-react';
import { fetchEtiquetaQr, EtiquetaQrDetalle, MonitorItem, PerifericoItem } from '../api/etiquetaQrApi';
import { generarQrDataUrl, imprimirEtiquetas, imprimirEtiquetasMonitor, urlFichaEtiqueta } from '../lib/etiquetaQr';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { EtiquetaQrChecklistProgreso } from './EtiquetaQrChecklistProgreso';
import { getProgresoFicha, calcularResumenProgreso } from '../utils/logisticaProgreso';

interface EtiquetaQrFichaProps {
  uuid: string;
  onBack: () => void;
  onNavigateToComputadoras?: (uuid: string) => void;
}

type TabMobile = 'equipos' | 'checklist' | 'qr';

export default function EtiquetaQrFicha({ uuid, onBack, onNavigateToComputadoras }: EtiquetaQrFichaProps) {
  const [ficha, setFicha] = useState<EtiquetaQrDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [imprimiendo, setImprimiendo] = useState(false);
  const [copiadoUuid, setCopiadoUuid] = useState(false);
  const [copiadoUrl, setCopiadoUrl] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  
  // Estados para vista Mobile interactiva
  const [tabMobile, setTabMobile] = useState<TabMobile>('equipos');
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!uuid) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    setFicha(null);

    fetchEtiquetaQr(uuid)
      .then(data => {
        if (cancelado) return;
        if (!data) {
          setError('No existe una computadora registrada con ese identificador.');
          return;
        }
        setFicha(data);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar la información de la ficha.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [uuid]);

  // Generar el código QR para la ficha
  useEffect(() => {
    if (!ficha?.uuid) {
      setQrDataUrl('');
      return;
    }
    let cancelado = false;
    const url = urlFichaEtiqueta(ficha.uuid);

    generarQrDataUrl(url)
      .then(dataUrl => {
        if (!cancelado) setQrDataUrl(dataUrl);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [ficha?.uuid]);

  const handleCopiarUuid = () => {
    if (!ficha?.uuid) return;
    navigator.clipboard.writeText(ficha.uuid);
    setCopiadoUuid(true);
    setTimeout(() => setCopiadoUuid(false), 2000);
  };

  const handleCopiarUrl = () => {
    if (!ficha?.uuid) return;
    navigator.clipboard.writeText(urlFichaEtiqueta(ficha.uuid));
    setCopiadoUrl(true);
    setTimeout(() => setCopiadoUrl(false), 2000);
  };

  // Compartir ficha nativa / WhatsApp
  const handleCompartir = async () => {
    if (!ficha) return;
    const url = urlFichaEtiqueta(ficha.uuid);
    const ubicacion = labelUbicacionEnum(ficha.ubicacion);
    const textoCompartir = `📦 *Ficha de Mudanza IT - Bacar*\n🖥️ *Equipo:* ${ficha.hostname} (${ficha.tipoEquipo})\n📍 *Ubicación:* ${ubicacion}\n👤 *Usuario:* ${ficha.usuarioActual || 'SYSTEM'}\n🔗 *Enlace:* ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mudanza IT - ${ficha.hostname}`,
          text: textoCompartir,
          url: url,
        });
        return;
      } catch (err) {
        // Ignora si el usuario canceló el share
      }
    }

    // Fallback: copiar texto formateado
    navigator.clipboard.writeText(textoCompartir);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 2500);
  };

  const handleCompartirWhatsApp = () => {
    if (!ficha) return;
    const url = urlFichaEtiqueta(ficha.uuid);
    const ubicacion = labelUbicacionEnum(ficha.ubicacion);
    const texto = `📦 *Ficha de Mudanza IT - Bacar*\n🖥️ *Equipo:* ${ficha.hostname} (${ficha.tipoEquipo})\n📍 *Ubicación:* ${ubicacion}\n👤 *Usuario:* ${ficha.usuarioActual || 'SYSTEM'}\n🔗 ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Impresión de la etiqueta individual de PC
  const handleImprimirPc = async () => {
    if (!ficha) return;
    setImprimiendo(true);
    try {
      const qrUrl = qrDataUrl || (await generarQrDataUrl(urlFichaEtiqueta(ficha.uuid)));
      await imprimirEtiquetas([
        {
          qrDataUrl: qrUrl,
          hostname: ficha.hostname,
          usuarioActual: ficha.usuarioActual,
          ubicacionLabel: labelUbicacionEnum(ficha.ubicacion),
        },
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al imprimir etiqueta.');
    } finally {
      setImprimiendo(false);
    }
  };

  // Impresión de las etiquetas de los monitores de esta PC
  const handleImprimirMonitores = async () => {
    if (!ficha || !ficha.monitores?.length) return;
    setImprimiendo(true);
    try {
      const qrUrl = qrDataUrl || (await generarQrDataUrl(urlFichaEtiqueta(ficha.uuid)));
      const etiquetasMonitor = ficha.monitores.map(m => ({
        qrDataUrl: qrUrl,
        hostname: ficha.hostname,
        ubicacionLabel: labelUbicacionEnum(ficha.ubicacion),
        modelo: m.nombre || 'Monitor',
        serial: m.numeroSerie || '',
      }));
      await imprimirEtiquetasMonitor(etiquetasMonitor);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al imprimir etiquetas de monitores.');
    } finally {
      setImprimiendo(false);
    }
  };

  const esNotebook = (ficha?.tipoEquipo ?? '').toLowerCase().includes('notebook');
  const monitores = ficha?.monitores || [];
  const perifericos = ficha?.perifericos || [];

  // Toggle de checklist individual
  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      // Feedback háptico ligero si el móvil lo soporta
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
      return next;
    });
  };

  // Lista plana de todos los elementos a controlar en el checklist
  const itemsChecklist = React.useMemo(() => {
    if (!ficha) return [];
    const list = [
      {
        id: `pc-${ficha.uuid}`,
        tipo: esNotebook ? 'Notebook' : 'Gabinete PC',
        nombre: ficha.hostname,
        detalle: `${ficha.tipoEquipo} · ${labelUbicacionEnum(ficha.ubicacion)}`,
        serial: ficha.uuid,
      },
    ];

    monitores.forEach((m, idx) => {
      list.push({
        id: `mon-${idx}-${m.nombre}`,
        tipo: 'Monitor',
        nombre: m.nombre,
        detalle: m.detalle || 'Pantalla externa',
        serial: m.numeroSerie || '',
      });
    });

    perifericos.forEach((p, idx) => {
      list.push({
        id: `perif-${idx}-${p.nombre}`,
        tipo: p.tipo || 'Periférico',
        nombre: p.nombre,
        detalle: p.detalle || 'Accesorio de puesto',
        serial: p.numeroSerie || '',
      });
    });

    return list;
  }, [ficha, monitores, perifericos, esNotebook]);

  const totalCheckItems = itemsChecklist.length;
  const countChecked = itemsChecklist.filter(item => checkedItems[item.id]).length;
  const checklistCompletado = totalCheckItems > 0 && countChecked === totalCheckItems;

  const marcarTodosChecklist = () => {
    const todos: Record<string, boolean> = {};
    itemsChecklist.forEach(it => { todos[it.id] = true; });
    setCheckedItems(todos);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  };

  const limpiarChecklist = () => {
    setCheckedItems({});
  };

  // Agrupar periféricos por tipo
  const gruposPerifericos = React.useMemo(() => {
    const mapa = new Map<string, PerifericoItem[]>();
    for (const item of perifericos) {
      const tipo = item.tipo?.trim() || 'Otros';
      if (!mapa.has(tipo)) mapa.set(tipo, []);
      mapa.get(tipo)!.push(item);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [perifericos]);

  const getIconoPorTipo = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('teclado') || t.includes('keyboard')) return Keyboard;
    if (t.includes('mouse') || t.includes('raton')) return Mouse;
    if (t.includes('parlante') || t.includes('audio') || t.includes('speaker')) return Volume2;
    if (t.includes('depósito') || t.includes('deposito')) return Package;
    return Usb;
  };

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-slate-500 shadow-sm">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-xs font-mono font-medium">Cargando ficha liviana de mudanza...</p>
        </div>
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="max-w-xl mx-auto p-6 my-8 sm:my-12 bg-white border border-slate-200 rounded-2xl text-center space-y-5 shadow-sm">
        <div className="p-4 bg-red-50 border border-red-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Ficha no encontrada (404)</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'No pudimos localizar la estación de trabajo correspondiente a este código QR.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de Etiquetas</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-28 sm:pb-16 px-3 sm:px-6">
      
      {/* Barra superior de navegación / Mobile-First */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Volver al listado</span>
          <span className="sm:hidden">Volver</span>
        </button>

        {/* Acciones Rápidas Mobile */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCompartirWhatsApp}
            className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Compartir por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCompartir}
            className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Compartir enlace o datos"
          >
            {copiadoTexto ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
            <span className="hidden sm:inline">{copiadoTexto ? 'Copiado' : 'Compartir'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopiarUrl}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
            title="Copiar URL directa"
          >
            {copiadoUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setQrZoomOpen(true)}
            className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs transition-all cursor-pointer shadow-2xs sm:hidden"
            title="Ver QR en pantalla completa"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FEEDBACK COPIADO FLOTANTE */}
      {copiadoTexto && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Datos de mudanza copiados al portapapeles listos para enviar!</span>
        </div>
      )}

      {/* TARJETA PRINCIPAL HEADER (Light Frame) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Header Hero Mobile-Friendly */}
        <div className="p-4 sm:p-6 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 ${esNotebook ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {esNotebook ? <Laptop className="w-6 h-6 sm:w-7 sm:h-7" /> : <Monitor className="w-6 h-6 sm:w-7 sm:h-7" />}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight break-all">
                  {ficha.hostname || 'PC-ESTACION'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {ficha.tipoEquipo}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  {labelUbicacionEnum(ficha.ubicacion)}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleCopiarUuid}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copiar UUID"
                >
                  <span className="truncate max-w-[150px] sm:max-w-none">UUID: {ficha.uuid}</span>
                  {copiadoUuid ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Botones de Impresión en Desktop */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={imprimiendo}
              onClick={handleImprimirPc}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir etiqueta PC</span>
            </button>

            {monitores.length > 0 && (
              <button
                type="button"
                disabled={imprimiendo}
                onClick={handleImprimirMonitores}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Monitor className="w-4 h-4 text-indigo-600" />
                <span>Monitores ({monitores.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS MOBILE (Segmented Control) */}
        <div className="p-2 sm:p-4 bg-slate-100/80 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTabMobile('equipos')}
              className={`py-2 px-2 text-center rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'equipos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Usb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Equipos ({monitores.length + perifericos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabMobile('checklist')}
              className={`py-2 px-2 text-center rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'checklist'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">Logística & Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setTabMobile('qr')}
              className={`py-2 px-2 text-center rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'qr'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">Código QR</span>
            </button>
          </div>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

          {/* VISTA 1: DETALLE DE EQUIPOS & MUDANZA */}
          {(tabMobile === 'equipos' || typeof window === 'undefined') && (
            <div className="space-y-6">
              
              {/* Tarjeta de Datos Operativos */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Info className="w-4 h-4 text-red-600" />
                    Datos de Mudanza y Ubicación
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">Operativo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Hostname</span>
                    <p className="font-mono font-bold text-slate-900 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200">
                      {ficha.hostname}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Ubicación Destino / Actual</span>
                    <p className="font-semibold text-slate-800 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      {labelUbicacionEnum(ficha.ubicacion)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Usuario Asignado</span>
                    <p className="font-semibold text-slate-800 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      {ficha.usuarioActual || 'SYSTEM'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Tipo de Dispositivo</span>
                    <p className="font-semibold text-slate-800 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200">
                      {ficha.tipoEquipo}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Responsable de Inventario</span>
                    <p className="font-medium text-slate-700 text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 truncate">
                      {ficha.responsableInventario || 'No asignado'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Bultos a Trasladar</span>
                    <p className="font-mono font-bold text-red-600 text-xs bg-white px-3 py-2 rounded-xl border border-slate-200">
                      1 CPU + {monitores.length} Monitor(es) + {perifericos.length} Acc.
                    </p>
                  </div>
                </div>
              </div>

              {/* Equipamiento Asociado (lo que se desenchufa y viaja) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Usb className="w-4 h-4 text-emerald-600" />
                    Equipamiento que Viaja con la PC
                  </h2>
                  <span className="text-xs text-slate-500 font-medium font-mono">
                    {monitores.length + perifericos.length} acc.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* Tarjeta Monitores */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-xs uppercase tracking-wider font-mono text-indigo-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-indigo-600" />
                        Monitores ({monitores.length})
                      </span>
                      {monitores.length > 0 && (
                        <button
                          type="button"
                          onClick={handleImprimirMonitores}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Stickers
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {monitores.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">Sin monitores externos detectados</p>
                      ) : (
                        monitores.map((m, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-mono font-bold text-xs text-slate-900 break-words">
                                {m.nombre}
                              </p>
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                                #{idx + 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-sans">
                              {m.detalle}
                            </p>
                            {m.numeroSerie && (
                              <p className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                S/N: <span className="text-slate-800 font-semibold">{m.numeroSerie}</span>
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tarjetas agrupadas por Periférico */}
                  {gruposPerifericos.map(([tipo, items]) => {
                    const IconoComp = getIconoPorTipo(tipo);
                    const esDeposito = tipo.toLowerCase().includes('depósito') || tipo.toLowerCase().includes('deposito');

                    return (
                      <div key={tipo} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className={`font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 ${esDeposito ? 'text-amber-900' : 'text-emerald-900'}`}>
                            <IconoComp className={`w-4 h-4 ${esDeposito ? 'text-amber-600' : 'text-emerald-600'}`} />
                            {tipo} ({items.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {items.map((it, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                              <p className="font-bold text-xs text-slate-900 break-words">
                                {it.nombre}
                              </p>
                              <p className="text-[11px] text-slate-600 font-sans">
                                {it.detalle}
                              </p>
                              {it.numeroSerie && (
                                <p className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  S/N: <span className="text-slate-800 font-semibold">{it.numeroSerie}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {gruposPerifericos.length === 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                      <span className="font-bold text-xs uppercase tracking-wider font-mono text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-200">
                        <Usb className="w-4 h-4 text-slate-400" />
                        Periféricos USB (0)
                      </span>
                      <p className="text-xs text-slate-400 italic py-2">No se registraron periféricos adicionales.</p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* VISTA 2: CHECKLIST INTERACTIVO DE TRASLADO */}
          {tabMobile === 'checklist' && (
            <EtiquetaQrChecklistProgreso ficha={ficha} />
          )}

          {/* VISTA 3: CÓDIGO QR Y GUÍA DE IMPRESIÓN */}
          {tabMobile === 'qr' && (
            <div className="space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xs">
                <div 
                  onClick={() => setQrZoomOpen(true)}
                  className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block cursor-pointer relative group"
                  title="Toca para ampliar QR"
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Código QR de ${ficha.hostname}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl">
                      <QrCode className="w-16 h-16 animate-pulse text-red-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/10 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="p-2 bg-white rounded-full shadow-md text-slate-800">
                      <Maximize2 className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1 max-w-sm">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono block">
                    Sticker Térmico para Gabinete
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Escanea este código con cualquier teléfono para abrir esta ficha operativa en el navegador.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQrZoomOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Pantalla completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImprimirPc}
                    disabled={imprimiendo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir 100×50 mm</span>
                  </button>
                </div>
              </div>

              {/* Guía Xprinter 410B */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-amber-700" />
                  Parámetros de impresión Xprinter 410B:
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Formato: 100 mm ancho × 50 mm alto · Escala 100% / Tamaño real · Sin márgenes automáticos.
                </p>
              </div>

            </div>
          )}

          {/* Copy y Enlace a Ficha Completa */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="leading-relaxed">
              <span className="font-bold text-slate-800">Nota de mudanza:</span> La ficha y la etiqueta listan solo lo que se desenchufa y viaja con la PC.
            </p>
            {onNavigateToComputadoras && (
              <button
                type="button"
                onClick={() => onNavigateToComputadoras(ficha.uuid)}
                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold underline transition-colors cursor-pointer shrink-0"
              >
                <span>Ver ficha técnica completa en inventario</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* DOCK FLOTANTE MOBILE INFERIOR (Sticky Bottom Bar para Celulares) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 sm:hidden shadow-lg">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            type="button"
            disabled={imprimiendo}
            onClick={handleImprimirPc}
            className="flex items-center justify-center gap-2 py-3 px-3 bg-linear-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="truncate">Imprimir PC</span>
          </button>

          {monitores.length > 0 ? (
            <button
              type="button"
              disabled={imprimiendo}
              onClick={handleImprimirMonitores}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <Monitor className="w-4 h-4 shrink-0 text-indigo-600" />
              <span className="truncate">Monitores ({monitores.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="truncate">WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL ZOOM QR PANTALLA COMPLETA (Para escanear directamente desde otro celular) */}
      {qrZoomOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setQrZoomOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 text-center shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrZoomOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-red-600 tracking-wider">
                Escaneo Directo en Pantalla
              </span>
              <h3 className="text-lg font-black text-slate-900 font-mono">
                {ficha.hostname}
              </h3>
              <p className="text-xs text-slate-500">
                {labelUbicacionEnum(ficha.ubicacion)} · {ficha.usuarioActual || 'SYSTEM'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR ${ficha.hostname}`}
                  className="w-60 h-60 object-contain mx-auto"
                />
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Apunta la cámara de otro smartphone para abrir esta ficha directamente.
            </p>

            <button
              type="button"
              onClick={() => setQrZoomOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Cerrar visor
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

