import { useState } from 'react';
import {
  Monitor,
  Printer,
  Usb,
  Mouse,
  Keyboard,
  Headphones,
  Camera,
  Plus,
  Copy,
  Check,
  SlidersHorizontal,
  Layers,
  Info,
  Tv,
} from 'lucide-react';
import { filtrarUsbParaInventario, filtrarAudioParaInventario, esTeclado, esMouse, esWebcamClaseCamera } from '../utils/perifericos';
import AgregarPerifericoForms from './AgregarPerifericoForms';
import WriteGate from './WriteGate';

function limpiarNombreMonitor(n) {
  return (n ?? '—').replace(/\u0000/g, '').trim() || 'Monitor genérico PNP';
}

function fmtNumOGuion(n, dec = 1) {
  if (n == null || n === '') return null;
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : null;
}

function getUsbIcon(d) {
  const text = `${d?.nombre ?? ''} ${d?.categoria ?? ''} ${d?.clase ?? ''}`.toLowerCase();
  if (esWebcamClaseCamera(d) || text.includes('webcam') || text.includes('camera')) {
    return <Camera className="w-4 h-4 text-purple-600" />;
  }
  if (esTeclado(d)) {
    return <Keyboard className="w-4 h-4 text-blue-600" />;
  }
  if (esMouse(d)) {
    return <Mouse className="w-4 h-4 text-amber-600" />;
  }
  if (text.includes('headset') || text.includes('audio') || text.includes('auricular') || text.includes('speaker') || text.includes('microfono')) {
    return <Headphones className="w-4 h-4 text-emerald-600" />;
  }
  return <Usb className="w-4 h-4 text-cyan-600" />;
}

export default function ComputadoraPerifericosSection({ computadora, uuid, onActualizado }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedText, setCopiedText] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const monitores = computadora.perifericos?.monitores ?? [];
  const impresoras = computadora.perifericos?.impresoras ?? [];
  const usbFiltrados = filtrarUsbParaInventario(computadora.perifericos?.dispositivosUsb ?? []);
  const audioEntrada = filtrarAudioParaInventario(computadora.perifericos?.audio?.entrada ?? []);
  const audioSalida = filtrarAudioParaInventario(computadora.perifericos?.audio?.salida ?? []);
  const dispositivosUsbCount = usbFiltrados.length + audioEntrada.length + audioSalida.length;
  const totalPerifericosCount = monitores.length + impresoras.length + dispositivosUsbCount;

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const cardBtn = (id, activeExtra) =>
    `p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
      activeCategory === id
        ? activeExtra
        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70 text-slate-700'
    }`;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">
                Mapa de periféricos & dispositivos
              </h3>
              <p className="text-sm text-slate-500">
                Dispositivos físicos, impresoras y periféricos USB vinculados a {computadora.hostname}
              </p>
            </div>
          </div>

          <WriteGate>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? 'Cancelar adición' : 'Vincular periférico manual'}
            </button>
          </WriteGate>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cardBtn('all', 'bg-blue-50/80 border-blue-200 text-blue-900 ring-1 ring-blue-400')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Total</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-lg font-black block mt-0.5">{totalPerifericosCount}</span>
            <span className="text-sm text-slate-400">Todos los elementos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('monitores')}
            className={cardBtn('monitores', 'bg-blue-50/80 border-blue-200 text-blue-900 ring-1 ring-blue-400')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Monitores</span>
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-lg font-black block mt-0.5">{monitores.length}</span>
            <span className="text-sm text-slate-400">Pantallas detectadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('impresoras')}
            className={cardBtn('impresoras', 'bg-emerald-50/80 border-emerald-200 text-emerald-900 ring-1 ring-emerald-400')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Impresoras</span>
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-lg font-black block mt-0.5">{impresoras.length}</span>
            <span className="text-sm text-slate-400">Red & virtuales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('usb')}
            className={cardBtn('usb', 'bg-cyan-50/80 border-cyan-200 text-cyan-900 ring-1 ring-cyan-400')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Dispositivos USB</span>
              <Usb className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <span className="text-lg font-black block mt-0.5">{dispositivosUsbCount}</span>
            <span className="text-sm text-slate-400">Entrada, audio y PnP</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <WriteGate>
          <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm space-y-3 ring-2 ring-blue-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Vincular nuevo periférico / accesorio
              </h4>
              <span className="text-sm text-slate-400 font-mono">Registro en perfil de host</span>
            </div>
            <AgregarPerifericoForms
              uuid={uuid}
              onActualizado={(data) => {
                onActualizado?.(data);
                setShowAddForm(false);
              }}
            />
          </div>
        </WriteGate>
      )}

      {(activeCategory === 'all' || activeCategory === 'monitores') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                Pantallas & monitores ({monitores.length})
              </h4>
            </div>
            <span className="text-sm font-mono text-slate-400">Salidas de video activas</span>
          </div>

          {monitores.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Monitor className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-slate-600">No se registran monitores externos mapeados</p>
              <p className="text-sm text-slate-400 mt-0.5">El equipo podría ser una terminal headless o el agente aún no reportó pantallas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monitores.map((mon, idx) => {
                const cleanName = limpiarNombreMonitor(mon.nombre);
                const isPrincipal = idx === 0 || String(mon.resolucion ?? '').toLowerCase().includes('principal');
                const pulgadas = fmtNumOGuion(mon.pulgadas, 1);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 leading-snug">{cleanName}</span>
                          {isPrincipal && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 text-sm font-black uppercase tracking-wider font-mono">
                              Principal
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-400 block font-mono mt-0.5">Display #{idx + 1}</span>
                        {mon.fabricante && (
                          <span className="text-sm text-slate-500 block mt-0.5">{mon.fabricante}</span>
                        )}
                        {mon.numeroSerie && (
                          <span className="text-sm text-slate-400 font-mono block mt-0.5">S/N: {mon.numeroSerie}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80 text-sm">
                      <div className="bg-slate-100/70 rounded-lg p-2">
                        <span className="text-sm font-bold text-slate-400 block uppercase">Resolución</span>
                        <span className="font-mono font-bold text-slate-800 text-sm block mt-0.5 truncate" title={mon.resolucion}>
                          {mon.resolucion || '—'}
                        </span>
                      </div>
                      <div className="bg-slate-100/70 rounded-lg p-2">
                        <span className="text-sm font-bold text-slate-400 block uppercase">Diagonal / Tamaño</span>
                        <span className="font-bold text-slate-800 text-sm block mt-0.5">
                          {pulgadas ? `${pulgadas} pulgadas` : 'Automático (DDC)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeCategory === 'all' || activeCategory === 'impresoras') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                Impresoras & colas de impresión ({impresoras.length})
              </h4>
            </div>
            <span className="text-sm font-mono text-slate-400">Drivers & puertos asignados</span>
          </div>

          {impresoras.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Printer className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-slate-600">No hay impresoras enlazadas a esta estación</p>
              <p className="text-sm text-slate-400 mt-0.5">Usá vincular periférico para agregar impresoras de red o locales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {impresoras.map((imp, idx) => {
                const puerto = imp.puerto ?? '';
                const tipo = String(imp.tipoImpresora ?? '');
                const isRed = puerto.includes('.') || tipo.toLowerCase().includes('red') || puerto.startsWith('IP_') || puerto.startsWith('192.');
                const isVirtual = tipo.toLowerCase().includes('virtual') || String(imp.nombre ?? '').toLowerCase().includes('pdf') || String(imp.nombre ?? '').toLowerCase().includes('xps') || String(imp.nombre ?? '').toLowerCase().includes('onenote');

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${imp.predeterminada ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 leading-snug">{imp.nombre || '—'}</span>
                          {imp.predeterminada && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-sm font-black uppercase tracking-wider font-mono">
                              Predeterminada
                            </span>
                          )}
                          {imp.compartida && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-sm font-black uppercase tracking-wider font-mono">
                              Compartida
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRed ? 'bg-blue-500' : isVirtual ? 'bg-purple-400' : 'bg-slate-400'}`} />
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">
                            {isRed ? 'Impresora de red' : isVirtual ? 'Impresora virtual / software' : 'Impresora local USB'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100/80 text-sm">
                      <div className="flex items-center justify-between text-slate-600 bg-slate-100/60 px-2 py-1 rounded">
                        <span className="text-sm text-slate-400 font-bold uppercase">Puerto:</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-mono font-bold text-slate-800 text-sm truncate">{puerto || '—'}</span>
                          {puerto ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(puerto)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Copiar puerto/IP"
                            >
                              {copiedText === puerto ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 px-2 py-0.5 gap-2">
                        <span className="text-sm text-slate-400 font-bold uppercase shrink-0">Controlador:</span>
                        <span className="font-medium text-slate-700 text-sm truncate max-w-[200px]" title={imp.driver}>
                          {imp.driver || '—'}
                        </span>
                      </div>
                      {imp.estado && (
                        <div className="flex items-center justify-between text-slate-600 px-2 py-0.5">
                          <span className="text-sm text-slate-400 font-bold uppercase">Estado:</span>
                          <span className="font-medium text-slate-700 text-sm">{imp.estado}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeCategory === 'all' || activeCategory === 'usb') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Usb className="w-4 h-4 text-cyan-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                Dispositivos USB, entrada & multimedia ({dispositivosUsbCount})
              </h4>
            </div>
            <span className="text-sm font-mono text-slate-400">Puertos & periféricos PnP</span>
          </div>

          {dispositivosUsbCount === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Usb className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-slate-600">No se detectaron periféricos USB adicionales</p>
              <p className="text-sm text-slate-400 mt-0.5">Cámaras web, diademas, lectores y teclados aparecerán listados aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {usbFiltrados.map((usb, idx) => (
                <div
                  key={`usb-${idx}`}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-cyan-200 transition-all flex items-start gap-2.5"
                >
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    {getUsbIcon(usb)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 block leading-tight">{usb.nombre}</span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {(usb.categoria || usb.clase) && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-sm font-bold uppercase font-mono">
                          {usb.categoria || usb.clase}
                        </span>
                      )}
                      {usb.fabricante && (
                        <span className="text-sm text-slate-500 font-medium">{usb.fabricante}</span>
                      )}
                    </div>
                    {(usb.vid || usb.pid) && (
                      <span className="text-sm text-slate-400 font-mono block mt-1">
                        {[usb.vid && `VID_${usb.vid}`, usb.pid && `PID_${usb.pid}`].filter(Boolean).join('/')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {audioEntrada.map((a, idx) => (
                <div
                  key={`ain-${idx}`}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-cyan-200 transition-all flex items-start gap-2.5"
                >
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 block leading-tight">{a.nombre}</span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-sm font-bold uppercase font-mono">
                        Audio entrada
                      </span>
                      {a.fabricante && <span className="text-sm text-slate-500 font-medium">{a.fabricante}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {audioSalida.map((a, idx) => (
                <div
                  key={`aout-${idx}`}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-cyan-200 transition-all flex items-start gap-2.5"
                >
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    <Headphones className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-900 block leading-tight">{a.nombre}</span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-800 text-sm font-bold uppercase font-mono">
                        Audio salida
                      </span>
                      {a.fabricante && <span className="text-sm text-slate-500 font-medium">{a.fabricante}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2 text-sm text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Sincronización automática con el agente:</span>
          <p className="text-sm text-blue-700 leading-relaxed">
            Las pantallas e impresoras conectadas se actualizan periódicamente vía WMI/PowerShell. Los periféricos asignados de forma manual se conservan en el inventario.
          </p>
        </div>
      </div>
    </div>
  );
}
