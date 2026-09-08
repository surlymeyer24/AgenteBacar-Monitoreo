import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentComputer, RamModulo, RamDetalles } from '../types';
import { getComputerRamDetails } from '../utils/ramHelpers';
import { 
  Cpu, HardDrive, Server, Copy, CheckCircle, AlertTriangle, 
  Info, Plus, SlidersHorizontal, Trash2, Edit3, X, Zap, 
  Check, ArrowUpRight, Layers, Gauge, Activity
} from 'lucide-react';

interface ComputadoraHardwareSectionProps {
  computer: AgentComputer;
  onUpdateComputer: (updated: AgentComputer) => void;
  onNavigateToPerifericos?: () => void;
}

export const ComputadoraHardwareSection: React.FC<ComputadoraHardwareSectionProps> = ({
  computer,
  onUpdateComputer,
  onNavigateToPerifericos,
}) => {
  const ramDetails: RamDetalles = getComputerRamDetails(computer);
  
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ isNew: boolean; index: number; module: RamModulo } | null>(null);

  // Form states for adding/editing RAM stick
  const [slotName, setSlotName] = useState('');
  const [capacidadGb, setCapacidadGb] = useState<number>(8);
  const [fabricante, setFabricante] = useState('');
  const [tipo, setTipo] = useState('DDR4 SDRAM');
  const [velocidadMhz, setVelocidadMhz] = useState<number>(3200);
  const [partNumber, setPartNumber] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [factorForma, setFactorForma] = useState('DIMM (288-pin)');
  const [voltaje, setVoltaje] = useState('1.20V');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenAddModule = (targetSlot?: string) => {
    const nextSlotNum = ramDetails.modulos.length + 1;
    setSlotName(targetSlot || `Slot ${nextSlotNum} (DIMM ${nextSlotNum})`);
    setCapacidadGb(8);
    setFabricante('Kingston');
    setTipo(ramDetails.tipo_memoria || 'DDR4 SDRAM');
    setVelocidadMhz(ramDetails.frecuencia_mhz || 3200);
    setPartNumber('');
    setNumeroSerie('');
    setFactorForma(ramDetails.factor_forma || 'DIMM (288-pin)');
    setVoltaje('1.20V');
    setEditingModule({
      isNew: true,
      index: -1,
      module: {
        slot: targetSlot || `Slot ${nextSlotNum}`,
        capacidad_gb: 8,
        fabricante: 'Kingston',
        tipo: 'DDR4 SDRAM',
        velocidad_mhz: 3200,
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModule = (index: number, mod: RamModulo) => {
    setSlotName(mod.slot);
    setCapacidadGb(mod.capacidad_gb);
    setFabricante(mod.fabricante);
    setTipo(mod.tipo);
    setVelocidadMhz(mod.velocidad_mhz);
    setPartNumber(mod.part_number || '');
    setNumeroSerie(mod.numero_serie || '');
    setFactorForma(mod.factor_forma || 'DIMM (288-pin)');
    setVoltaje(mod.voltaje || '1.20V');
    setEditingModule({
      isNew: false,
      index,
      module: mod
    });
    setIsModalOpen(true);
  };

  const handleSaveModule = () => {
    if (!editingModule) return;

    const newModuleData: RamModulo = {
      slot: slotName.trim() || `Slot ${ramDetails.modulos.length + 1}`,
      capacidad_gb: Number(capacidadGb) || 8,
      fabricante: fabricante.trim() || 'Desconocido',
      tipo: tipo.trim() || 'DDR4',
      velocidad_mhz: Number(velocidadMhz) || 3200,
      part_number: partNumber.trim() || undefined,
      numero_serie: numeroSerie.trim() || undefined,
      factor_forma: factorForma,
      voltaje: voltaje,
    };

    let updatedModulos = [...ramDetails.modulos];
    if (editingModule.isNew) {
      updatedModulos.push(newModuleData);
    } else {
      updatedModulos[editingModule.index] = newModuleData;
    }

    // Recompute total GB from modules
    const newTotalGb = updatedModulos.reduce((acc, curr) => acc + curr.capacidad_gb, 0);
    const newSlotsOcupados = updatedModulos.length;
    const newSlotsTotales = Math.max(ramDetails.slots_totales, newSlotsOcupados);
    const newCanales = newSlotsOcupados >= 2 ? 'Dual-Channel (128-bit)' : 'Single-Channel (64-bit)';

    const updatedRamDetails: RamDetalles = {
      ...ramDetails,
      total_gb: newTotalGb,
      slots_totales: newSlotsTotales,
      slots_ocupados: newSlotsOcupados,
      canales: newCanales,
      modulos: updatedModulos,
    };

    const updatedComputer: AgentComputer = {
      ...computer,
      ram_total_gb: newTotalGb,
      ram_detalles: updatedRamDetails,
    };

    onUpdateComputer(updatedComputer);
    setIsModalOpen(false);
    setEditingModule(null);
  };

  const handleDeleteModule = (index: number) => {
    if (confirm('¿Está seguro de remover este módulo de memoria RAM del inventario físico?')) {
      const updatedModulos = ramDetails.modulos.filter((_, i) => i !== index);
      const newTotalGb = updatedModulos.reduce((acc, curr) => acc + curr.capacidad_gb, 0);
      const newSlotsOcupados = updatedModulos.length;

      const updatedRamDetails: RamDetalles = {
        ...ramDetails,
        total_gb: Math.max(1, newTotalGb),
        slots_ocupados: newSlotsOcupados,
        modulos: updatedModulos,
      };

      const updatedComputer: AgentComputer = {
        ...computer,
        ram_total_gb: Math.max(1, newTotalGb),
        ram_detalles: updatedRamDetails,
      };

      onUpdateComputer(updatedComputer);
    }
  };

  // Processor detailed or fallback
  const cpuDetallado = computer.procesador_detallado || {
    fabricante: computer.procesador.toLowerCase().includes('amd') ? 'AMD' : 'Intel',
    frecuencia_max_mhz: 3601,
    gama: computer.procesador.toLowerCase().includes('i7') ? 'i7' : computer.procesador.toLowerCase().includes('i5') ? 'i5' : 'i5',
    generacion: 3,
    modelo: '3470',
    nombre_completo: computer.procesador,
    nucleos_fisicos: 4,
    nucleos_logicos: 4,
  };

  // Motherboard RAM specs
  const ramPlaca = computer.ram_placa || {
    canal_modo: ramDetails.canales?.toLowerCase().includes('dual') ? 'dual' : 'single',
    max_capacidad_gb: ramDetails.max_capacidad_gb || 32,
    slots_ocupados: ramDetails.slots_ocupados,
    slots_totales: ramDetails.slots_totales,
  };

  // RAM usage color
  const ramUsagePct = ramDetails.porcentaje_uso || computer.ram_uso_porcentaje || 50;
  const ramUsageBarColor = ramUsagePct > 85 ? 'bg-rose-500' : ramUsagePct > 70 ? 'bg-amber-500' : 'bg-blue-600';
  const ramUsageTextColor = ramUsagePct > 85 ? 'text-rose-700 bg-rose-50 border-rose-200' : ramUsagePct > 70 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-200';

  // Empty slots generation for motherboard slot preview
  const emptySlotsCount = Math.max(0, ramDetails.slots_totales - ramDetails.modulos.length);
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, idx) => {
    const slotNumber = ramDetails.modulos.length + idx + 1;
    return `Slot ${slotNumber} (DIMM ${slotNumber})`;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HARDWARE KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CPU Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Procesador (CPU)
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  {cpuDetallado.fabricante}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                  x86_64
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-850 block leading-snug truncate" title={cpuDetallado.nombre_completo || computer.procesador}>
              {cpuDetallado.nombre_completo || computer.procesador}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {cpuDetallado.gama ? `Core ${cpuDetallado.gama}-${cpuDetallado.modelo}` : cpuDetallado.modelo}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                Gen {cpuDetallado.generacion}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                {cpuDetallado.nucleos_fisicos}C / {cpuDetallado.nucleos_logicos}T
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Frecuencia & Uso</span>
            <span className="font-mono font-bold text-slate-800">
              {cpuDetallado.frecuencia_max_mhz} MHz · {computer.cpu_uso_porcentaje.toFixed(1)}% uso
            </span>
          </div>
        </div>
        
        {/* RAM Total Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Memoria RAM Total
              </span>
              <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${ramUsageTextColor}`}>
                {ramUsagePct.toFixed(1)}% en uso
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {ramDetails.total_gb.toFixed(1)} GB
              </span>
              <span className="text-xs font-bold text-slate-500">
                {ramDetails.tipo_memoria} · Modo {ramPlaca.canal_modo.toUpperCase()}
              </span>
            </div>

            {/* RAM Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 mt-2">
              <div 
                className={`h-full ${ramUsageBarColor} transition-all duration-500`}
                style={{ width: `${Math.min(100, ramUsagePct)}%` }}
              />
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Usado: <strong className="text-slate-800">{ramDetails.en_uso_gb} GB</strong>
            </span>
            <span className="text-slate-500">
              Libre: <strong className="text-emerald-700">{ramDetails.libre_gb} GB</strong>
            </span>
          </div>
        </div>

        {/* Architecture & Motherboard RAM Capacity Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Placa Base & Capacidad
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Máx {ramPlaca.max_capacidad_gb} GB
              </span>
            </div>
            <span className="text-lg font-black text-slate-900 block mt-1">
              {ramPlaca.slots_ocupados} de {ramPlaca.slots_totales} Ranuras ({ramPlaca.canal_modo.toUpperCase()})
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                <CheckCircle className="w-3 h-3 text-emerald-600 inline" /> UEFI Seguro
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                TPM 2.0 Activo
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Factor de Forma</span>
            <span className="font-semibold text-slate-700">{ramDetails.factor_forma}</span>
          </div>
        </div>

      </div>

      {/* 2. DEDICATED PROCESSOR SPECIFICATIONS PANEL (CPU DETALLADO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Cpu className="w-4 h-4 text-blue-600" />
              FICHA TÉCNICA DEL PROCESADOR (CPU)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Especificaciones de microarquitectura, fabricante, frecuencias operativas, núcleos físicos y lógicos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              {computer.cpu_uso_porcentaje.toFixed(1)}% uso actual
            </span>
          </div>
        </div>

        {/* CPU Header Banner */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 text-sm sm:text-base font-mono">
                  {cpuDetallado.nombre_completo || computer.procesador}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-md font-mono uppercase">
                  {cpuDetallado.fabricante}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Gama: <strong className="text-slate-900">Intel Core {cpuDetallado.gama}</strong> · Modelo: <strong className="text-slate-900">{cpuDetallado.modelo}</strong> · Generación: <strong className="text-slate-900">{cpuDetallado.generacion}ª Gen</strong>
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 gap-1 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Frecuencia Máxima</span>
            <span className="text-base font-black text-blue-700 font-mono">
              {cpuDetallado.frecuencia_max_mhz} MHz
            </span>
            <span className="text-[10px] text-slate-500 font-semibold font-mono">
              ~{(cpuDetallado.frecuencia_max_mhz / 1000).toFixed(2)} GHz Turbo
            </span>
          </div>
        </div>

        {/* 6-Metrics Grid for Processor */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fabricante</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block">{cpuDetallado.fabricante}</span>
            <span className="text-[10px] text-slate-500 font-medium">Intel Corp.</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gama & Serie</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block">Core {cpuDetallado.gama}</span>
            <span className="text-[10px] text-slate-500 font-medium">Gama Media IT</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Generación</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block">{cpuDetallado.generacion}ª Gen</span>
            <span className="text-[10px] text-slate-500 font-medium">Arquitectura x64</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modelo</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block font-mono">{cpuDetallado.modelo}</span>
            <span className="text-[10px] text-slate-500 font-medium">Serie Desktop</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Núcleos Físicos</span>
            <span className="font-black text-blue-700 text-sm mt-0.5 block font-mono">{cpuDetallado.nucleos_fisicos} Cores</span>
            <span className="text-[10px] text-slate-500 font-medium">Procesamiento real</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-3xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Núcleos Lógicos</span>
            <span className="font-black text-indigo-700 text-sm mt-0.5 block font-mono">{cpuDetallado.nucleos_logicos} Threads</span>
            <span className="text-[10px] text-slate-500 font-medium">Hilos de ejecución</span>
          </div>
        </div>

        {/* CPU Technical Architecture Note */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-[11px] text-slate-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Procesador <strong>{cpuDetallado.fabricante} Core {cpuDetallado.gama}-{cpuDetallado.modelo}</strong> ({cpuDetallado.nucleos_fisicos} núcleos físicos / {cpuDetallado.nucleos_logicos} hilos lógicos) operando a una frecuencia máxima de <strong>{cpuDetallado.frecuencia_max_mhz} MHz</strong> (~{(cpuDetallado.frecuencia_max_mhz / 1000).toFixed(2)} GHz).
            </span>
          </div>
          <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 text-[10px]">
            LGA1155 · 64-bit
          </span>
        </div>
      </div>

      {/* 3. DETAILED RAM MODULES AND MOTHERBOARD SLOTS SECTION (RAM_PLACA) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        
        {/* Header with Title and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-indigo-600" />
              MÓDULOS DE MEMORIA RAM & RANURAS DE PLACA (SLOTS)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inventario de bancos físicos, capacidad individual, número de parte, velocidad de bus y límites de placa base.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
              {ramPlaca.slots_ocupados} de {ramPlaca.slots_totales} slots ocupados
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              Placa máx: {ramPlaca.max_capacidad_gb} GB
            </span>
            <button
              onClick={() => handleOpenAddModule()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-3xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Módulo
            </button>
          </div>
        </div>

        {/* Global Memory Bus & Motherboard Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Canal de Memoria</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Modo {ramPlaca.canal_modo.toUpperCase()}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capacidad Máx. Placa</span>
            <span className="font-bold text-emerald-700 font-mono mt-0.5 block">
              {ramPlaca.max_capacidad_gb} GB RAM
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Frecuencia / Bus</span>
            <span className="font-bold text-slate-800 font-mono mt-0.5 block">
              {ramDetails.frecuencia_mhz} MT/s (MHz)
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tecnología</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {ramDetails.tipo_memoria}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Uso de Memoria</span>
            <span className="font-bold text-slate-800 font-mono mt-0.5 block">
              {ramUsagePct.toFixed(1)}% ({ramDetails.en_uso_gb} GB / {ramDetails.total_gb.toFixed(1)} GB)
            </span>
          </div>
        </div>

        {/* Grid of Slots (Installed Modules + Empty Slots) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          
          {/* 1. Installed Physical RAM Modules */}
          {ramDetails.modulos.map((mod, idx) => (
            <div 
              key={idx}
              className="bg-white border-2 border-indigo-100 hover:border-indigo-300 transition-all rounded-xl p-4 shadow-3xs flex flex-col justify-between relative group"
            >
              {/* Top Slot Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 font-mono">{mod.slot}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Detectado
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                        {mod.fabricante}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-3xs">
                    {mod.capacidad_gb} GB
                  </span>
                </div>

                {/* Module Details Grid */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-[11px] mt-3.5 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tipo & Frecuencia</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {mod.tipo} @ {mod.velocidad_mhz} MHz
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Voltaje</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {mod.voltaje || '1.20V'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Part Number</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-bold text-slate-800 text-[10px] truncate max-w-[130px]" title={mod.part_number || 'N/D'}>
                        {mod.part_number || 'KVR26N19S8/8'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(mod.part_number || 'KVR26N19S8/8')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                        title="Copiar Part Number"
                      >
                        {copiedText === (mod.part_number || 'KVR26N19S8/8') ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Número de Serie</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-slate-600 text-[10px] truncate max-w-[110px]" title={mod.numero_serie || '73B182C0'}>
                        {mod.numero_serie || '73B182C0'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(mod.numero_serie || '73B182C0')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                        title="Copiar Número de Serie"
                      >
                        {copiedText === (mod.numero_serie || '73B182C0') ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium font-mono">
                  {mod.factor_forma || 'DIMM (Sobremesa)'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModule(idx, mod)}
                    className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition-colors"
                    title="Editar información de este módulo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(idx)}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Eliminar este módulo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}

          {/* 2. Empty / Free RAM Slots */}
          {emptySlots.map((emptySlotName, idx) => (
            <div 
              key={`empty-${idx}`}
              className="bg-slate-50/70 border-2 border-dashed border-slate-250 hover:border-blue-300 transition-all rounded-xl p-4 flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-200/70 text-slate-400 rounded-lg shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-700 block">{emptySlotName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Ranura disponible en placa base</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-600">
                    VACÍO
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-3 mt-3 text-[11px] space-y-1">
                  <p className="text-slate-600 font-medium">
                    ✨ Admite ampliación hasta <strong>16 GB o 32 GB {ramDetails.tipo_memoria}</strong>.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Instale un módulo para habilitar Dual-Channel y duplicar el ancho de banda de memoria.
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 flex justify-end">
                <button
                  onClick={() => handleOpenAddModule(emptySlotName)}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-blue-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-3xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Instalar Módulo en {emptySlotName}
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* Technical IT Recommendation Note */}
        <div className={`rounded-xl p-3.5 flex items-start gap-3 text-xs border ${
          ramUsagePct > 80 
            ? 'bg-amber-50/80 border-amber-200/90 text-amber-950' 
            : 'bg-blue-50/60 border-blue-200/80 text-blue-900'
        }`}>
          {ramUsagePct > 80 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-[11px] leading-relaxed">
            <span className={`font-bold block ${ramUsagePct > 80 ? 'text-amber-950' : 'text-blue-950'}`}>
              {ramUsagePct > 80 
                ? `Alerta de Telemetría: Alto consumo de memoria RAM (${ramUsagePct.toFixed(1)}% en uso)`
                : 'Diagnóstico de Rendimiento de Memoria:'}
            </span>
            <p className={ramUsagePct > 80 ? 'text-amber-800' : 'text-blue-800'}>
              {ramUsagePct > 80 ? (
                <>
                  El equipo tiene <strong>{ramDetails.en_uso_gb} GB</strong> en uso de sus <strong>{ramDetails.total_gb.toFixed(1)} GB</strong> disponibles ({ramPlaca.slots_ocupados}/{ramPlaca.slots_totales} ranuras ocupadas en modo <strong>{ramPlaca.canal_modo.toUpperCase()}</strong>). Dado que la placa base admite una capacidad máxima de hasta <strong>{ramPlaca.max_capacidad_gb} GB</strong>, se recomienda evaluar la sustitución de los módulos actuales por dos módulos de 8 GB o 16 GB para evitar cuellos de botella por paginación en disco.
                </>
              ) : ramPlaca.slots_ocupados === 1 && ramPlaca.slots_totales > 1 ? (
                <>
                  Este equipo opera actualmente en modo <strong>Single-Channel (64-bit)</strong> con 1 ranura física libre. Agregar un segundo módulo de memoria idéntico activará <strong>Dual-Channel</strong> y aumentará el ancho de banda efectivo del bus hasta en un 30%. Capacidad máxima de placa: <strong>{ramPlaca.max_capacidad_gb} GB</strong>.
                </>
              ) : (
                <>
                  La configuración de memoria física está operando a <strong>{ramDetails.frecuencia_mhz} MHz</strong> en modo <strong>{ramPlaca.canal_modo.toUpperCase()} (Dual-Channel 128-bit)</strong> con balance equilibrado de recursos. Capacidad máxima admitida por la placa base: <strong>{ramPlaca.max_capacidad_gb} GB</strong>.
                </>
              )}
            </p>
          </div>
        </div>

      </div>

      {/* 3. QUICK PERIPHERAL TEASER BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Periféricos & Dispositivos Vinculados</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {computer.perifericos?.monitores?.length || 0} monitor(es) • {computer.perifericos?.impresoras?.length || 0} impresora(s) • {computer.perifericos?.dispositivos_usb?.length || 0} periférico(s) USB
            </p>
          </div>
        </div>
        {onNavigateToPerifericos && (
          <button
            onClick={onNavigateToPerifericos}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1"
          >
            Ver y administrar periféricos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. DISK DRIVE PARTITIONS LIST */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <HardDrive className="w-4 h-4 text-blue-600" />
          PARTICIONES DE DISCO DURO & UNIDADES DE ALMACENAMIENTO
        </h3>
        <div className="space-y-4 text-xs border-t border-slate-100 pt-4">
          {computer.discos?.map((d) => {
            const progressCls = d.porcentaje_usado > 85 ? 'bg-rose-600' : d.porcentaje_usado > 65 ? 'bg-amber-600' : 'bg-blue-600';
            return (
              <div key={d.punto_montaje} className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-800 font-mono flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    Unidad {d.punto_montaje} ({d.tipo_disco})
                  </span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {d.libre_gb.toFixed(1)} GB Libres de {d.total_gb.toFixed(0)} GB ({d.porcentaje_usado.toFixed(1)}% ocupado)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-205">
                  <div className={`h-full ${progressCls} transition-all duration-300`} style={{ width: `${d.porcentaje_usado}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DATOS GENERALES GRID PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2.5 border-b border-slate-100 font-mono">
          <Info className="w-4 h-4 text-blue-600" />
          DATOS GENERALES DE HARDWARE & SISTEMA
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">UUID del Sistema</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-semibold text-slate-800 font-mono select-all text-[11px] truncate block">{computer.uuid}</span>
              <button
                onClick={() => copyToClipboard(computer.uuid)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                title="Copiar UUID"
              >
                {copiedText === computer.uuid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ubicación</span>
            <span className="font-semibold text-slate-800 block mt-0.5">{computer.ubicacion || 'CAPITAL_HUMANO'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Arquitectura</span>
            <span className="font-semibold text-slate-800 block mt-0.5">AMD64 / x86_64</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado Conexión</span>
            <span className={`inline-flex items-center px-2 py-0.5 mt-1 font-bold rounded text-[10px] ${computer.estado_conexion === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-250'}`}>
              {computer.estado_conexion}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado (IT)</span>
            <span className="font-extrabold text-[#0c66e4] block mt-0.5">{computer.estado_it || 'Asignada'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Custodio actual</span>
            <span className="font-semibold text-slate-800 block mt-0.5">{computer.responsable_inventario || 'No asignada'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sistema Operativo</span>
            <span className="font-semibold text-slate-800 block mt-0.5">{computer.sistema_operativo}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conexión (Agente)</span>
            <span className="font-bold text-emerald-600 block mt-0.5">Activo</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Última Sincronización</span>
            <span className="font-mono text-slate-600 text-[11px] block mt-0.5">
              {new Date(computer.ultima_sincronizacion).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* 6. MODAL TO ADD / EDIT RAM MODULE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingModule?.isNew ? 'Registrar Módulo de Memoria RAM' : 'Editar Módulo de Memoria RAM'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configuración física del banco y especificaciones del stick
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nombre / Identificador de Slot</label>
                    <input
                      type="text"
                      value={slotName}
                      onChange={(e) => setSlotName(e.target.value)}
                      placeholder="ej. Slot 1 (DIMM A1)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Capacidad del Módulo (GB)</label>
                    <select
                      value={capacidadGb}
                      onChange={(e) => setCapacidadGb(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value={2}>2 GB</option>
                      <option value={4}>4 GB</option>
                      <option value={8}>8 GB</option>
                      <option value={16}>16 GB</option>
                      <option value={32}>32 GB</option>
                      <option value={64}>64 GB</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Fabricante / Marca</label>
                    <input
                      type="text"
                      value={fabricante}
                      onChange={(e) => setFabricante(e.target.value)}
                      placeholder="ej. Kingston / Samsung / Crucial"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tecnología de Memoria</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="DDR4 SDRAM">DDR4 SDRAM</option>
                      <option value="DDR5 SDRAM">DDR5 SDRAM</option>
                      <option value="DDR3 SDRAM">DDR3 SDRAM</option>
                      <option value="LPDDR4x">LPDDR4x</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Frecuencia / Velocidad (MHz)</label>
                    <select
                      value={velocidadMhz}
                      onChange={(e) => setVelocidadMhz(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value={2400}>2400 MHz</option>
                      <option value={2666}>2666 MHz</option>
                      <option value={2933}>2933 MHz</option>
                      <option value={3200}>3200 MHz</option>
                      <option value={3600}>3600 MHz</option>
                      <option value={4800}>4800 MHz (DDR5)</option>
                      <option value={5600}>5600 MHz (DDR5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Factor de Forma</label>
                    <select
                      value={factorForma}
                      onChange={(e) => setFactorForma(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="DIMM (288-pin)">DIMM (Sobremesa / Desktop)</option>
                      <option value="SO-DIMM (260-pin)">SO-DIMM (Laptop / Notebook)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número de Parte (Part Number)</label>
                    <input
                      type="text"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      placeholder="ej. KF432C16BB1/16"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número de Serie (Opcional)</label>
                    <input
                      type="text"
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                      placeholder="ej. 9C28FA10"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveModule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-3xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingModule?.isNew ? 'Registrar Módulo' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
