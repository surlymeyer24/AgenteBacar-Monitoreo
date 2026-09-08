import React, { useState } from 'react';
import { 
  Monitor, 
  Printer, 
  Usb, 
  Mouse, 
  Keyboard, 
  Headphones, 
  Camera, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  SlidersHorizontal,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Tv,
  HelpCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { AgentComputer } from '../types';

interface ComputadoraPerifericosSectionProps {
  computer: AgentComputer;
  onUpdateComputer?: (updated: AgentComputer) => void;
  isReadOnly?: boolean;
}

type PeripheralCategory = 'all' | 'monitores' | 'impresoras' | 'usb' | 'otros';

export const ComputadoraPerifericosSection: React.FC<ComputadoraPerifericosSectionProps> = ({
  computer,
  onUpdateComputer,
  isReadOnly = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<PeripheralCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New peripheral form state
  const [newType, setNewType] = useState<'monitor' | 'impresora' | 'usb' | 'audio'>('monitor');
  const [newName, setNewName] = useState('');
  const [newDetail1, setNewDetail1] = useState(''); // resolution / driver / category
  const [newDetail2, setNewDetail2] = useState(''); // inches / port / manufacturer
  const [newIsDefault, setNewIsDefault] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const monitores = computer.perifericos?.monitores || [];
  const impresoras = computer.perifericos?.impresoras || [];
  const dispositivosUsb = computer.perifericos?.dispositivos_usb || [];

  const totalPerifericosCount = monitores.length + impresoras.length + dispositivosUsb.length;

  const handleAddPeripheral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onUpdateComputer) return;

    const currentPerifericos = computer.perifericos || {};
    let updatedPerifericos = { ...currentPerifericos };

    if (newType === 'monitor') {
      const newMon = {
        nombre: newName.trim(),
        resolucion: newDetail1.trim() || '1920x1080',
        pulgadas: newDetail2 ? parseFloat(newDetail2) : undefined
      };
      updatedPerifericos.monitores = [...(currentPerifericos.monitores || []), newMon];
    } else if (newType === 'impresora') {
      const newImp = {
        nombre: newName.trim(),
        driver: newDetail1.trim() || 'Generic / Text Only',
        puerto: newDetail2.trim() || 'USB001',
        predeterminada: newIsDefault,
        tipo_impresora: newDetail2.includes('.') ? 'física (red)' : 'física (local)'
      };
      updatedPerifericos.impresoras = [...(currentPerifericos.impresoras || []), newImp];
    } else {
      const newUsb = {
        nombre: newName.trim(),
        categoria: newDetail1.trim() || (newType === 'audio' ? 'Audio' : 'Input'),
        fabricante: newDetail2.trim() || 'Genérico'
      };
      updatedPerifericos.dispositivos_usb = [...(currentPerifericos.dispositivos_usb || []), newUsb];
    }

    const updatedComputer: AgentComputer = {
      ...computer,
      perifericos: updatedPerifericos
    };

    onUpdateComputer(updatedComputer);
    // Reset form
    setNewName('');
    setNewDetail1('');
    setNewDetail2('');
    setNewIsDefault(false);
    setShowAddForm(false);
  };

  const handleRemoveMonitor = (index: number) => {
    if (!onUpdateComputer || !confirm('¿Eliminar este monitor de la estación?')) return;
    const updated = {
      ...computer,
      perifericos: {
        ...computer.perifericos,
        monitores: (computer.perifericos?.monitores || []).filter((_, i) => i !== index)
      }
    };
    onUpdateComputer(updated);
  };

  const handleRemoveImpresora = (index: number) => {
    if (!onUpdateComputer || !confirm('¿Eliminar esta impresora de la estación?')) return;
    const updated = {
      ...computer,
      perifericos: {
        ...computer.perifericos,
        impresoras: (computer.perifericos?.impresoras || []).filter((_, i) => i !== index)
      }
    };
    onUpdateComputer(updated);
  };

  const handleRemoveUsb = (index: number) => {
    if (!onUpdateComputer || !confirm('¿Eliminar este dispositivo de la estación?')) return;
    const updated = {
      ...computer,
      perifericos: {
        ...computer.perifericos,
        dispositivos_usb: (computer.perifericos?.dispositivos_usb || []).filter((_, i) => i !== index)
      }
    };
    onUpdateComputer(updated);
  };

  // Helper for device category icon
  const getUsbIcon = (nombre: string, categoria?: string) => {
    const text = (nombre + ' ' + (categoria || '')).toLowerCase();
    if (text.includes('webcam') || text.includes('camera') || text.includes('c920')) {
      return <Camera className="w-4 h-4 text-purple-600" />;
    }
    if (text.includes('headset') || text.includes('audio') || text.includes('auricular') || text.includes('speaker') || text.includes('microfono')) {
      return <Headphones className="w-4 h-4 text-emerald-600" />;
    }
    if (text.includes('mouse') || text.includes('raton')) {
      return <Mouse className="w-4 h-4 text-amber-600" />;
    }
    if (text.includes('keyboard') || text.includes('teclado')) {
      return <Keyboard className="w-4 h-4 text-blue-600" />;
    }
    return <Usb className="w-4 h-4 text-cyan-600" />;
  };

  return (
    <div className="space-y-5">
      {/* Header & Quick stats overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">
                MAPA DE PERIFÉRICOS & DISPOSITIVOS
              </h3>
              <p className="text-[11px] text-slate-500">
                Dispositivos físicos, interfaces de red y periféricos USB vinculados a {computer.hostname}
              </p>
            </div>
          </div>

          {!isReadOnly && onUpdateComputer && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? 'Cancelar adición' : 'Vincular periférico manual'}
            </button>
          )}
        </div>

        {/* Metric summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeCategory === 'all'
                ? 'bg-blue-50/80 border-blue-200 text-blue-900 ring-1 ring-blue-400'
                : 'bg-slate-50/80 border-slate-150 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-base font-black block mt-0.5">{totalPerifericosCount}</span>
            <span className="text-[9px] text-slate-400">Todos los elementos</span>
          </button>

          <button
            onClick={() => setActiveCategory('monitores')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeCategory === 'monitores'
                ? 'bg-blue-50/80 border-blue-200 text-blue-900 ring-1 ring-blue-400'
                : 'bg-slate-50/80 border-slate-150 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Monitores</span>
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-base font-black block mt-0.5">{monitores.length}</span>
            <span className="text-[9px] text-slate-400">Pantallas detectadas</span>
          </button>

          <button
            onClick={() => setActiveCategory('impresoras')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeCategory === 'impresoras'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 ring-1 ring-emerald-400'
                : 'bg-slate-50/80 border-slate-150 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Impresoras</span>
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-base font-black block mt-0.5">{impresoras.length}</span>
            <span className="text-[9px] text-slate-400">Red & Virtuales</span>
          </button>

          <button
            onClick={() => setActiveCategory('usb')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeCategory === 'usb'
                ? 'bg-cyan-50/80 border-cyan-200 text-cyan-900 ring-1 ring-cyan-400'
                : 'bg-slate-50/80 border-slate-150 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Dispositivos USB</span>
              <Usb className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <span className="text-base font-black block mt-0.5">{dispositivosUsb.length}</span>
            <span className="text-[9px] text-slate-400">Entrada & Audio</span>
          </button>
        </div>
      </div>

      {/* MANUAL PERIPHERAL ATTACHMENT FORM */}
      {showAddForm && !isReadOnly && (
        <form onSubmit={handleAddPeripheral} className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm space-y-3 animate-fade-in ring-2 ring-blue-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Vincular Nuevo Periférico / Accesorio
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Registro en perfil de host</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">Tipo de Periférico</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:bg-white"
              >
                <option value="monitor">Monitor / Pantalla</option>
                <option value="impresora">Impresora (Red / USB)</option>
                <option value="usb">Dispositivo USB / Entrada</option>
                <option value="audio">Audio / Auricular / Micrófono</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">Nombre / Modelo</label>
              <input
                type="text"
                required
                placeholder={newType === 'monitor' ? 'ej. Samsung S24R350' : newType === 'impresora' ? 'ej. HP LaserJet Pro M404n' : 'ej. Logitech Webcam C920'}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">
                {newType === 'monitor' ? 'Resolución' : newType === 'impresora' ? 'Driver / Controlador' : 'Categoría'}
              </label>
              <input
                type="text"
                placeholder={newType === 'monitor' ? '1920x1080' : newType === 'impresora' ? 'HP Universal PCL6' : 'Cámara / Entrada'}
                value={newDetail1}
                onChange={(e) => setNewDetail1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">
                {newType === 'monitor' ? 'Pulgadas (opcional)' : newType === 'impresora' ? 'Puerto / IP' : 'Fabricante'}
              </label>
              <input
                type="text"
                placeholder={newType === 'monitor' ? '24' : newType === 'impresora' ? '192.168.0.67' : 'Logitech'}
                value={newDetail2}
                onChange={(e) => setNewDetail2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              />
            </div>

            {newType === 'impresora' && (
              <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsDefault"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="newIsDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Marcar como impresora predeterminada del sistema
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-3xs"
            >
              Guardar y Vincular
            </button>
          </div>
        </form>
      )}

      {/* 1. SECCIÓN: MONITORES */}
      {(activeCategory === 'all' || activeCategory === 'monitores') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                PANTALLAS & MONITORES ({monitores.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Salidas de video activas</span>
          </div>

          {monitores.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Monitor className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No se registran monitores externos mapeados</p>
              <p className="text-[10px] text-slate-400 mt-0.5">El equipo podría ser una terminal headless o tener el agente en espera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monitores.map((mon, idx) => {
                const cleanName = mon.nombre.replace(/\u0000/g, '').trim() || 'Monitor Genérico PNP';
                const isPrincipal = idx === 0 || mon.resolucion.toLowerCase().includes('principal');
                return (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 shadow-3xs hover:border-blue-200 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 leading-snug">{cleanName}</span>
                            {isPrincipal && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 text-[9px] font-black uppercase tracking-wider font-mono">
                                Principal
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Display #{idx + 1}</span>
                        </div>
                      </div>

                      {!isReadOnly && onUpdateComputer && (
                        <button
                          onClick={() => handleRemoveMonitor(idx)}
                          className="text-slate-300 hover:text-red-600 p-1 rounded hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar monitor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80 text-[11px]">
                      <div className="bg-slate-100/70 rounded-lg p-2">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Resolución</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] block mt-0.5 truncate" title={mon.resolucion}>
                          {mon.resolucion}
                        </span>
                      </div>
                      <div className="bg-slate-100/70 rounded-lg p-2">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Diagonal / Tamaño</span>
                        <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                          {mon.pulgadas ? `${mon.pulgadas} pulgadas` : 'Automático (DDC)'}
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

      {/* 2. SECCIÓN: IMPRESORAS */}
      {(activeCategory === 'all' || activeCategory === 'impresoras') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                IMPRESORAS & COLAS DE IMPRESIÓN ({impresoras.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Drivers & puertos asignados</span>
          </div>

          {impresoras.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Printer className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No hay impresoras enlazadas a esta estación</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Utilice el botón de vincular para agregar impresoras de red o locales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {impresoras.map((imp, idx) => {
                const isRed = imp.puerto.includes('.') || imp.tipo_impresora?.includes('red') || imp.puerto.startsWith('IP_') || imp.puerto.startsWith('192.');
                const isVirtual = imp.tipo_impresora?.includes('virtual') || imp.nombre.toLowerCase().includes('pdf') || imp.nombre.toLowerCase().includes('xps') || imp.nombre.toLowerCase().includes('onenote');

                return (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 shadow-3xs hover:border-emerald-200 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${imp.predeterminada ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Printer className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 leading-snug">{imp.nombre}</span>
                            {imp.predeterminada && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider font-mono">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRed ? 'bg-blue-500' : isVirtual ? 'bg-purple-400' : 'bg-slate-400'}`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                              {isRed ? 'Impresora de Red' : isVirtual ? 'Impresora Virtual / Software' : 'Impresora Local USB'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isReadOnly && onUpdateComputer && (
                        <button
                          onClick={() => handleRemoveImpresora(idx)}
                          className="text-slate-300 hover:text-red-600 p-1 rounded hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar impresora"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100/80 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 bg-slate-100/60 px-2 py-1 rounded">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Puerto:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800 text-[10px]">{imp.puerto}</span>
                          <button
                            onClick={() => copyToClipboard(imp.puerto)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Copiar puerto/IP"
                          >
                            {copiedText === imp.puerto ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 px-2 py-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Controlador (Driver):</span>
                        <span className="font-medium text-slate-700 text-[10px] truncate max-w-[160px]" title={imp.driver}>
                          {imp.driver}
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

      {/* 3. SECCIÓN: DISPOSITIVOS USB & ENTRADA */}
      {(activeCategory === 'all' || activeCategory === 'usb') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Usb className="w-4 h-4 text-cyan-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                DISPOSITIVOS USB, ENTRADA & MULTIMEDIA ({dispositivosUsb.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Puertos & periféricos PnP</span>
          </div>

          {dispositivosUsb.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Usb className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No se detectaron periféricos USB adicionales</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Cámaras web, diademas, lectores y teclados aparecerán listados aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dispositivosUsb.map((usb, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-3xs hover:border-cyan-200 transition-all flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-150 shrink-0 mt-0.5">
                      {getUsbIcon(usb.nombre, usb.categoria)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">{usb.nombre}</span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {usb.categoria && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold uppercase font-mono">
                            {usb.categoria}
                          </span>
                        )}
                        {usb.fabricante && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {usb.fabricante}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isReadOnly && onUpdateComputer && (
                    <button
                      onClick={() => handleRemoveUsb(idx)}
                      className="text-slate-300 hover:text-red-600 p-1 rounded hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar dispositivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informative footer */}
      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Sincronización Automática con Agente BACAR:</span>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Las pantallas e impresoras conectadas se actualizan periódicamente vía WMI/PowerShell. Los cambios o periféricos asignados manualmente se conservan en la base de inventario para control de mudanzas y resguardos.
          </p>
        </div>
      </div>
    </div>
  );
};
