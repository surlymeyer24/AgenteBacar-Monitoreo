import React, { useState } from 'react';
import { 
  ComputadoraTrazable, 
  PerifericoStockItem, 
  BaselineEsperado 
} from '../../types/trazabilidad';
import { 
  X, 
  AlertTriangle, 
  Check, 
  Monitor, 
  Cpu, 
  Server, 
  HardDrive, 
  ShieldAlert, 
  Box, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ArmarComputadoraModalProps {
  computadora?: ComputadoraTrazable;
  computadorasDisponibles?: ComputadoraTrazable[];
  perifericosStock: PerifericoStockItem[];
  onClose: () => void;
  onConfirmarArmado: (data: {
    uuid: string;
    baseline: BaselineEsperado;
    comboResumen: string;
    perifericosIds: string[];
  }) => void;
}

export default function ArmarComputadoraModal({
  computadora,
  computadorasDisponibles = [],
  perifericosStock,
  onClose,
  onConfirmarArmado
}: ArmarComputadoraModalProps) {
  // If no computer was passed directly, allow picking from available stock computers
  const [selectedUuid, setSelectedUuid] = useState<string>(computadora?.uuid || computadorasDisponibles[0]?.uuid || '');
  
  // Peripheral selections (max 1 of each type)
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>('');
  const [selectedTecladoId, setSelectedTecladoId] = useState<string>('');
  const [selectedMouseId, setSelectedMouseId] = useState<string>('');

  // Hardware specs expected
  const [cpuModelo, setCpuModelo] = useState<string>('Intel Core i5-12400');
  const [ramGb, setRamGb] = useState<number>(16);
  const [discoResumen, setDiscoResumen] = useState<string>('SSD NVMe 512GB Kingston');
  const [errorAviso, setErrorAviso] = useState<string | null>(null);

  const activeComputer = computadora || computadorasDisponibles.find(c => c.uuid === selectedUuid);

  // Available stock items filtered
  const monitoresDisponibles = perifericosStock.filter(p => p.tipo === 'monitor' && p.estado === 'disponible');
  const tecladosDisponibles = perifericosStock.filter(p => p.tipo === 'teclado' && p.estado === 'disponible');
  const mousesDisponibles = perifericosStock.filter(p => p.tipo === 'mouse' && p.estado === 'disponible');

  const monitorSeleccionado = perifericosStock.find(p => p.id === selectedMonitorId);
  const tecladoSeleccionado = perifericosStock.find(p => p.id === selectedTecladoId);
  const mouseSeleccionado = perifericosStock.find(p => p.id === selectedMouseId);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComputer) {
      setErrorAviso('Selecciona una computadora de stock');
      return;
    }

    const perifericosBaseline = [];
    const comboParts = [];
    const perifericosIds = [];

    if (monitorSeleccionado) {
      perifericosBaseline.push({
        tipo: 'monitor' as const,
        id_stock: monitorSeleccionado.id,
        nombre: monitorSeleccionado.nombre,
        fabricante: monitorSeleccionado.fabricante,
        numero_serie: monitorSeleccionado.numero_serie
      });
      comboParts.push(`Monitor ${monitorSeleccionado.fabricante} ${monitorSeleccionado.modelo}`);
      perifericosIds.push(monitorSeleccionado.id);
    }

    if (tecladoSeleccionado) {
      perifericosBaseline.push({
        tipo: 'teclado' as const,
        id_stock: tecladoSeleccionado.id,
        nombre: tecladoSeleccionado.nombre,
        fabricante: tecladoSeleccionado.fabricante,
        numero_serie: tecladoSeleccionado.numero_serie
      });
      comboParts.push(`Teclado ${tecladoSeleccionado.fabricante}`);
      perifericosIds.push(tecladoSeleccionado.id);
    }

    if (mouseSeleccionado) {
      perifericosBaseline.push({
        tipo: 'mouse' as const,
        id_stock: mouseSeleccionado.id,
        nombre: mouseSeleccionado.nombre,
        fabricante: mouseSeleccionado.fabricante,
        numero_serie: mouseSeleccionado.numero_serie
      });
      comboParts.push(`Mouse ${mouseSeleccionado.fabricante}`);
      perifericosIds.push(mouseSeleccionado.id);
    }

    const newBaseline: BaselineEsperado = {
      cpu_modelo: cpuModelo,
      ram_total_gb: Number(ramGb),
      disco_resumen: discoResumen,
      perifericos: perifericosBaseline,
      armado_at: new Date().toISOString(),
      armado_por: 'mfernandez@bacarsa.com.ar'
    };

    onConfirmarArmado({
      uuid: activeComputer.uuid,
      baseline: newBaseline,
      comboResumen: comboParts.length > 0 ? comboParts.join(' + ') : 'Sin periféricos asociados',
      perifericosIds
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Box className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">
                Armar computadora (Combo de Stock)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Asocia periféricos de stock y establece el baseline inmutable de hardware
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
          
          {/* CRITICAL WARNING BANNER */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                Atención: Generación de Baseline Inmutable
              </h4>
              <p className="text-[11.5px] text-amber-800 font-semibold">
                Esta acción no se puede deshacer desde la aplicación.
              </p>
              <p className="text-[11px] text-amber-700">
                Al confirmar el armado, los periféricos seleccionados se reservarán formalmente y el hardware constituirá el patrón oficial esperado para el agente CyberWatch.
              </p>
            </div>
          </div>

          {/* Computer Target Selector if not preselected */}
          {!computadora && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Seleccionar Computadora de Stock
              </label>
              <select
                value={selectedUuid}
                onChange={(e) => setSelectedUuid(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-red-500"
              >
                {computadorasDisponibles.map(c => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.hostname} ({c.tipo_equipo.toUpperCase()} - {c.condicion.toUpperCase()}) - {c.ubicacion}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeComputer && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipo Destino</span>
                <span className="font-mono font-bold text-sm text-slate-900">{activeComputer.hostname}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo y Condición</span>
                <span className="font-semibold text-slate-700">{activeComputer.tipo_equipo} | {activeComputer.condicion}</span>
              </div>
            </div>
          )}

          {/* Peripherals Selection (1 Monitor, 1 Teclado, 1 Mouse) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              1. Selección de Periféricos en Stock (Opcionales, máx. 1 por tipo)
            </span>

            {/* Monitor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                <span>Monitor (Máx. 1 unidad)</span>
              </label>
              <select
                value={selectedMonitorId}
                onChange={(e) => setSelectedMonitorId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500"
              >
                <option value="">-- Sin monitor (o provisto por usuario) --</option>
                {monitoresDisponibles.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} [S/N: {m.numero_serie}] - {m.ubicacion}
                  </option>
                ))}
              </select>
            </div>

            {/* Teclado */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <span>⌨</span>
                <span>Teclado (Máx. 1 unidad)</span>
              </label>
              <select
                value={selectedTecladoId}
                onChange={(e) => setSelectedTecladoId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500"
              >
                <option value="">-- Sin teclado --</option>
                {tecladosDisponibles.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} [S/N: {t.numero_serie}]
                  </option>
                ))}
              </select>
            </div>

            {/* Mouse */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <span>🖱</span>
                <span>Mouse (Máx. 1 unidad)</span>
              </label>
              <select
                value={selectedMouseId}
                onChange={(e) => setSelectedMouseId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500"
              >
                <option value="">-- Sin mouse --</option>
                {mousesDisponibles.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} [S/N: {m.numero_serie}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hardware Specs: CPU, RAM, Disco */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              2. Especificaciones de Hardware Esperado (Baseline)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Modelo CPU</label>
                <input
                  type="text"
                  value={cpuModelo}
                  onChange={(e) => setCpuModelo(e.target.value)}
                  placeholder="Ej: Intel Core i5-12400"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">RAM Total (GB)</label>
                <select
                  value={ramGb}
                  onChange={(e) => setRamGb(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500 font-mono font-bold"
                >
                  <option value={8}>8 GB</option>
                  <option value={16}>16 GB</option>
                  <option value={32}>32 GB</option>
                  <option value={64}>64 GB</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Disco / Almacenamiento</label>
                <input
                  type="text"
                  value={discoResumen}
                  onChange={(e) => setDiscoResumen(e.target.value)}
                  placeholder="Ej: SSD 512GB Kingston"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Live Preview of resulting baseline */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2 border border-slate-800 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 font-sans">
              <span className="text-[10px] uppercase font-bold text-red-400">Preview del JSON de Baseline</span>
              <span>armado_por: mfernandez@bacarsa.com.ar</span>
            </div>
            <div className="text-slate-300">
              <p>CPU: <strong className="text-emerald-400">{cpuModelo}</strong></p>
              <p>RAM: <strong className="text-emerald-400">{ramGb} GB</strong></p>
              <p>Disco: <strong className="text-emerald-400">{discoResumen}</strong></p>
              <p>
                Periféricos vinculados: {monitorSeleccionado ? `[Monitor: ${monitorSeleccionado.nombre}] ` : ''}
                {tecladoSeleccionado ? `[Teclado: ${tecladoSeleccionado.nombre}] ` : ''}
                {mouseSeleccionado ? `[Mouse: ${mouseSeleccionado.nombre}]` : ''}
                {!monitorSeleccionado && !tecladoSeleccionado && !mouseSeleccionado && 'Ninguno'}
              </p>
            </div>
          </div>

          {errorAviso && (
            <div className="text-rose-600 font-bold text-xs">{errorAviso}</div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#9c1313] hover:bg-red-800 active:bg-red-900 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Armar combo y fijar baseline</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
