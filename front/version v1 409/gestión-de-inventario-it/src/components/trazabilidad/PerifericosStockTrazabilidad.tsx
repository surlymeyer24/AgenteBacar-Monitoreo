import React, { useState } from 'react';
import { 
  PerifericoStockItem, 
  ComputadoraTrazable 
} from '../../types/trazabilidad';
import { 
  BadgeOrigen, 
  BadgeConciliacion, 
  BadgeTipoEquipo, 
  BadgeCondicion 
} from './TrazabilidadBadges';
import { 
  Monitor, 
  Box, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Tag, 
  MapPin, 
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface PerifericosStockTrazabilidadProps {
  perifericos: PerifericoStockItem[];
  computadoras: ComputadoraTrazable[];
  onOpenArmarModal: (uuid?: string) => void;
  onSelectComputadora: (uuid: string) => void;
}

export default function PerifericosStockTrazabilidad({
  perifericos,
  computadoras,
  onOpenArmarModal,
  onSelectComputadora
}: PerifericosStockTrazabilidadProps) {
  const [activeTab, setActiveTab] = useState<'perifericos' | 'computadoras_stock'>('perifericos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const pcsEnStock = computadoras.filter(c => c.origen_alta === 'STOCK');

  const filteredPerifericos = perifericos.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fabricante.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Box className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
                Stock y Periféricos para Armado
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Gestión de monitores, teclados y mouse en depósito disponibles para ensamblado de combos IT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenArmarModal()}
              className="px-4 py-2 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Armar computadora</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('perifericos')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'perifericos'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Periféricos en depósito ({perifericos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('computadoras_stock')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'computadoras_stock'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Computadoras en Stock ({pcsEnStock.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERIFÉRICOS */}
      {activeTab === 'perifericos' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por marca, modelo o serial..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Tipo:</span>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="todos">Todos los periféricos</option>
                <option value="monitor">Monitores</option>
                <option value="teclado">Teclados</option>
                <option value="mouse">Mouse</option>
              </select>
            </div>
          </div>

          {/* Peripherals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPerifericos.map((p) => (
              <div 
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {p.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.estado === 'disponible' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.estado}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                      {p.nombre}
                    </h4>
                    <span className="text-[11px] text-slate-500">{p.fabricante} • Mod: {p.modelo}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Número de Serie:</span>
                    <span className="font-mono font-bold text-slate-800">{p.numero_serie}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{p.ubicacion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: COMPUTADORAS EN STOCK */}
      {activeTab === 'computadoras_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pcsEnStock.map((comp) => (
            <div 
              key={comp.uuid}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900">{comp.hostname}</span>
                <BadgeConciliacion estado={comp.estado_conciliacion} />
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <BadgeTipoEquipo tipo={comp.tipo_equipo} />
                  <BadgeCondicion condicion={comp.condicion} />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Ubicación:</span> {comp.ubicacion}
                </div>
                {comp.combo_resumen && (
                  <div>
                    <span className="font-semibold text-slate-700">Combo:</span> {comp.combo_resumen}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectComputadora(comp.uuid)}
                  className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver detalle</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {comp.estado_conciliacion === 'SIN_BASELINE' && (
                  <button
                    type="button"
                    onClick={() => onOpenArmarModal(comp.uuid)}
                    className="px-3 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Armar combo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
