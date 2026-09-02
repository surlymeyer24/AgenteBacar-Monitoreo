import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Laptop,
  Monitor,
  QrCode,
  Printer,
  MapPin,
  Usb,
  Keyboard,
  Mouse,
  Volume2,
  Package,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Info,
  Share2,
  Maximize2,
  X,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { fetchEtiquetaQr } from '../api/etiquetaQrApi';
import {
  generarQrDataUrl,
  imprimirEtiquetas,
  imprimirEtiquetasMonitor,
  urlFichaEtiqueta,
} from '../lib/etiquetaQr';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { EtiquetaQrChecklistProgreso } from '../components/EtiquetaQrChecklistProgreso';
import { esPerifericoParaFichaQr } from '../utils/perifericos';

function getIconoPorTipo(tipo) {
  const t = (tipo ?? '').toLowerCase();
  if (t.includes('teclado') || t.includes('keyboard')) return Keyboard;
  if (t.includes('mouse') || t.includes('raton')) return Mouse;
  if (t.includes('parlante') || t.includes('audio') || t.includes('speaker')) return Volume2;
  if (t.includes('depósito') || t.includes('deposito')) return Package;
  return Usb;
}

export default function EtiquetaQrFicha() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState('');
  const [copiadoUuid, setCopiadoUuid] = useState(false);
  const [copiadoUrl, setCopiadoUrl] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);

  const [tabMobile, setTabMobile] = useState('equipos');
  const [qrZoomOpen, setQrZoomOpen] = useState(false);

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

  useEffect(() => {
    if (!ficha?.uuid) {
      setQrDataUrl('');
      return;
    }
    let cancelado = false;
    generarQrDataUrl(urlFichaEtiqueta(ficha.uuid))
      .then(dataUrl => {
        if (!cancelado) setQrDataUrl(dataUrl);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [ficha?.uuid]);

  const esNotebook = (ficha?.tipoEquipo ?? '').toLowerCase().includes('notebook');
  const monitores = useMemo(() => ficha?.monitores ?? [], [ficha]);
  const perifericos = useMemo(
    () => (ficha?.perifericos ?? []).filter(esPerifericoParaFichaQr),
    [ficha],
  );

  const gruposPerifericos = useMemo(() => {
    const mapa = new Map();
    for (const item of perifericos) {
      const tipo = item.tipo?.trim() || 'Otros';
      if (!mapa.has(tipo)) mapa.set(tipo, []);
      mapa.get(tipo).push(item);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [perifericos]);

  function handleCopiarUuid() {
    if (!ficha?.uuid) return;
    navigator.clipboard.writeText(ficha.uuid);
    setCopiadoUuid(true);
    setTimeout(() => setCopiadoUuid(false), 2000);
  }

  function handleCopiarUrl() {
    if (!ficha?.uuid) return;
    navigator.clipboard.writeText(urlFichaEtiqueta(ficha.uuid));
    setCopiadoUrl(true);
    setTimeout(() => setCopiadoUrl(false), 2000);
  }

  function textoCompartir() {
    const url = urlFichaEtiqueta(ficha.uuid);
    const ubicacion = labelUbicacionEnum(ficha.ubicacion);
    return `📦 *Ficha de Mudanza IT - Bacar*\n🖥️ *Equipo:* ${ficha.hostname} (${ficha.tipoEquipo})\n📍 *Ubicación:* ${ubicacion}\n👤 *Usuario:* ${ficha.usuarioActual || 'SYSTEM'}\n🔗 *Enlace:* ${url}`;
  }

  async function handleCompartir() {
    if (!ficha) return;
    const texto = textoCompartir();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mudanza IT - ${ficha.hostname}`,
          text: texto,
          url: urlFichaEtiqueta(ficha.uuid),
        });
        return;
      } catch {
        // el usuario canceló el diálogo nativo
      }
    }

    navigator.clipboard.writeText(texto);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 2500);
  }

  function handleCompartirWhatsApp() {
    if (!ficha) return;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir())}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleImprimirPc() {
    if (!ficha) return;
    setImprimiendo(true);
    setErrorImpresion('');
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
      setErrorImpresion(err instanceof Error ? err.message : 'Error al imprimir la etiqueta.');
    } finally {
      setImprimiendo(false);
    }
  }

  async function handleImprimirMonitores() {
    if (!ficha || monitores.length === 0) return;
    setImprimiendo(true);
    setErrorImpresion('');
    try {
      const qrUrl = qrDataUrl || (await generarQrDataUrl(urlFichaEtiqueta(ficha.uuid)));
      const ubicacionLabel = labelUbicacionEnum(ficha.ubicacion);
      await imprimirEtiquetasMonitor(
        monitores.map(m => ({
          qrDataUrl: qrUrl,
          hostname: ficha.hostname,
          ubicacionLabel,
          modelo: m.nombre || 'Monitor',
          serial: m.numeroSerie || '',
        })),
      );
    } catch (err) {
      setErrorImpresion(err instanceof Error ? err.message : 'Error al imprimir las etiquetas de monitores.');
    } finally {
      setImprimiendo(false);
    }
  }

  if (cargando) {
    return (
      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/etiquetas-qr')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-slate-500 shadow-sm">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-sm font-mono font-medium">Cargando ficha liviana de mudanza...</p>
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
          <h2 className="text-lg font-bold text-slate-900">Ficha no encontrada</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error || 'No pudimos localizar la estación de trabajo correspondiente a este código QR.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/etiquetas-qr')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de etiquetas</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-16 px-3 sm:px-6">
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => navigate('/etiquetas-qr')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Volver al listado</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCompartirWhatsApp}
            className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Compartir por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCompartir}
            className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Compartir enlace o datos"
          >
            {copiadoTexto ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-slate-600" />
            )}
            <span className="hidden sm:inline">{copiadoTexto ? 'Copiado' : 'Compartir'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopiarUrl}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl text-sm transition-all cursor-pointer shadow-2xs"
            title="Copiar URL directa"
          >
            {copiadoUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setQrZoomOpen(true)}
            className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm transition-all cursor-pointer shadow-2xs sm:hidden"
            title="Ver QR en pantalla completa"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copiadoTexto && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Datos de mudanza copiados al portapapeles listos para enviar!</span>
        </div>
      )}

      {errorImpresion && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorImpresion}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 sm:p-6 bg-slate-50/90 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
                esNotebook
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {esNotebook ? (
                <Laptop className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <Monitor className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight break-all">
                  {ficha.hostname || 'PC-ESTACION'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono tracking-wider bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {ficha.tipoEquipo}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  {labelUbicacionEnum(ficha.ubicacion)}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleCopiarUuid}
                  className="inline-flex items-center gap-1 min-w-0 max-w-full font-mono text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Copiar UUID"
                >
                  <span className="truncate">UUID: {ficha.uuid}</span>
                  {copiadoUuid ? (
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-4 bg-slate-100/80 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTabMobile('equipos')}
              title="Equipos"
              aria-label="Equipos"
              className={`py-2.5 px-2 text-center rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'equipos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Usb className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline truncate">
                Equipos ({monitores.length + perifericos.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabMobile('checklist')}
              title="Logística y checklist"
              aria-label="Logística y checklist"
              className={`py-2.5 px-2 text-center rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'checklist' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline truncate">Logística & Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setTabMobile('qr')}
              title="Código QR"
              aria-label="Código QR"
              className={`py-2.5 px-2 text-center rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tabMobile === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
              <span className="hidden sm:inline truncate">Código QR</span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-8 space-y-6 sm:space-y-8">
          {tabMobile === 'equipos' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Info className="w-4 h-4 text-red-600" />
                    Datos de equipamiento
                  </h2>
                  <span className="text-xs text-slate-500 font-mono font-medium">Operativo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-mono font-bold text-slate-500 block">Hostname</span>
                    <p className="font-mono font-bold text-slate-900 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 break-all">
                      {ficha.hostname}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase font-mono font-bold text-slate-500 block">
                      Ubicación destino / actual
                    </span>
                    <p className="font-semibold text-slate-800 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="min-w-0 break-words">{labelUbicacionEnum(ficha.ubicacion)}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase font-mono font-bold text-slate-500 block">
                      Tipo de dispositivo
                    </span>
                    <p className="font-semibold text-slate-800 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200">
                      {ficha.tipoEquipo}
                    </p>
                  </div>

                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <span className="text-xs uppercase font-mono font-bold text-slate-500 block">
                      Bultos a trasladar
                    </span>
                    <p className="font-mono font-bold text-red-600 text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 break-words">
                      1 CPU · {monitores.length} monitor(es) · {perifericos.length} acc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Usb className="w-5 h-5 text-emerald-600 shrink-0" />
                    Periféricos
                  </h2>
                  <span className="text-base text-slate-500 font-medium font-mono">
                    {monitores.length + perifericos.length} acc.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-base uppercase tracking-wider font-mono text-indigo-900 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-indigo-600 shrink-0" />
                        Monitores ({monitores.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {monitores.length === 0 ? (
                        <p className="text-base text-slate-400 italic py-2">Sin monitores externos detectados</p>
                      ) : (
                        monitores.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-mono font-bold text-base text-slate-900 break-words min-w-0">
                                {m.nombre}
                              </p>
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                                #{idx + 1}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 font-sans break-words">{m.detalle}</p>
                            {m.numeroSerie && (
                              <p className="text-sm font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 break-all">
                                S/N: <span className="text-slate-800 font-semibold">{m.numeroSerie}</span>
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {gruposPerifericos.map(([tipo, items]) => {
                    const IconoComp = getIconoPorTipo(tipo);
                    const esDeposito =
                      tipo.toLowerCase().includes('depósito') || tipo.toLowerCase().includes('deposito');

                    return (
                      <div
                        key={tipo}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span
                            className={`font-bold text-base uppercase tracking-wider font-mono flex items-center gap-2 min-w-0 break-words ${
                              esDeposito ? 'text-amber-900' : 'text-emerald-900'
                            }`}
                          >
                            <IconoComp
                              className={`w-5 h-5 shrink-0 ${esDeposito ? 'text-amber-600' : 'text-emerald-600'}`}
                            />
                            {tipo} ({items.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                            >
                              <p className="font-bold text-base text-slate-900 break-words">{it.nombre}</p>
                              <p className="text-sm text-slate-600 font-sans break-words">{it.detalle}</p>
                              {it.numeroSerie && (
                                <p className="text-sm font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 break-all">
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
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-2 shadow-2xs">
                      <span className="font-bold text-base uppercase tracking-wider font-mono text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-200">
                        <Usb className="w-5 h-5 text-slate-400 shrink-0" />
                        Periféricos USB (0)
                      </span>
                      <p className="text-base text-slate-400 italic py-2">No se registraron periféricos adicionales.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tabMobile === 'checklist' && <EtiquetaQrChecklistProgreso key={ficha.uuid} ficha={ficha} />}

          {tabMobile === 'qr' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xs">
                <div
                  onClick={() => setQrZoomOpen(true)}
                  className="p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-full cursor-pointer relative group"
                  title="Tocá para ampliar el QR"
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Código QR de ${ficha.hostname}`}
                      className="w-44 h-44 sm:w-56 sm:h-56 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 sm:w-56 sm:h-56 max-w-full flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl">
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
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono block">
                    Sticker térmico para gabinete
                  </span>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Escaneá este código con cualquier teléfono para abrir esta ficha operativa en el navegador.
                  </p>
                </div>

                <div className="w-full flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQrZoomOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4 shrink-0" />
                    <span>Pantalla completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImprimirPc}
                    disabled={imprimiendo}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Imprimir QR</span>
                  </button>

                  {monitores.length > 0 && (
                    <button
                      type="button"
                      onClick={handleImprimirMonitores}
                      disabled={imprimiendo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 text-sm font-bold rounded-xl shadow-2xs cursor-pointer"
                    >
                      <Monitor className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Imprimir monitores ({monitores.length})</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-sm text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-amber-700 shrink-0" />
                  Parámetros de impresión Xprinter 410B:
                </span>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Formato: 100 mm ancho × 50 mm alto · escala 100% / tamaño real · sin márgenes automáticos.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-500 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200">
            <p className="leading-relaxed">
              <span className="font-bold text-slate-800">Nota de mudanza:</span> la ficha y la etiqueta listan solo
              lo que se desenchufa y viaja con la PC.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/computadoras/${ficha.uuid}`)}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold underline transition-colors cursor-pointer text-left sm:shrink-0"
            >
              <span>Ver ficha técnica completa</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

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
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase font-mono font-bold text-red-600 tracking-wider">
                Escaneo directo en pantalla
              </span>
              <h3 className="text-lg font-black text-slate-900 font-mono">{ficha.hostname}</h3>
              <p className="text-sm text-slate-500">
                {labelUbicacionEnum(ficha.ubicacion)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
              {qrDataUrl && (
                <img src={qrDataUrl} alt={`QR ${ficha.hostname}`} className="w-60 h-60 object-contain mx-auto" />
              )}
            </div>

            <p className="text-xs text-slate-500 leading-snug">
              Apuntá la cámara de otro smartphone para abrir esta ficha directamente.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={imprimiendo}
                onClick={handleImprimirPc}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir QR
              </button>
              {monitores.length > 0 && (
                <button
                  type="button"
                  disabled={imprimiendo}
                  onClick={handleImprimirMonitores}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 font-bold text-sm rounded-xl cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  Imprimir monitores ({monitores.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setQrZoomOpen(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer"
              >
                Cerrar visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
