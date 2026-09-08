import React, { useState } from 'react';
import { 
  ComputadoraTrazable, 
  OrigenAlta, 
  EstadoConciliacion, 
  TipoEquipo 
} from '../../types/trazabilidad';
import { 
  BadgeOrigen, 
  BadgeConciliacion, 
  BadgeTipoEquipo, 
  BadgeCondicion 
} from './TrazabilidadBadges';
import { 
  Search, 
  Filter, 
  Box, 
  Plus, 
  ChevronRight, 
  Radio, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Archive,
  Layers,
  MapPin,
  User,
  SlidersHorizontal
} from 'lucide-react';

interface ComputadorasTrazabilidadListProps {
  computadoras: ComputadoraTrazable[];
  onSelectComputadora: (uuid: string) => void;
  onOpenArmarModal: (uuid?: string) => void;
  onOpenVincularModal?: (comp: ComputadoraTrazable) => void;
  onNuevaComputadoraStock?: () => void;
}

export default function ComputadorasTrazabilidadList({
  computadoras,
  onSelectComputadora,
  onOpenArmarModal,
  onOpenVincularModal,
  onNuevaComputadoraStock
}: ComputadorasTrazabilidadListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [origenFilter, setOrigenFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [incluirLegacy, setIncluirLegacy] = useState<boolean>(false);

  // Filter logic
  const filtered = computadoras.filter(c => {
    // Legacy filter toggle
    if (!incluirLegacy && c.origen_alta === 'LEGACY') return false;

    // Search filter
    const matchesSearch = 
      c.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ubicacion && c.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.responsable && c.responsable.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.combo_resumen && c.combo_resumen.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Origen filter
    if (origenFilter !== 'todos' && c.origen_alta !== origenFilter) return false;

    // Estado filter
    if (estadoFilter !== 'todos' && c.estado_conciliacion !== estadoFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#9c1313]">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
                Inventario de Computadoras
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Vista unificada con origen de alta, condición, estado de baseline y conciliación con el agente C#.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onNuevaComputadoraStock && (
              <button
                type="button"
                onClick={onNuevaComputadoraStock}
                className="px-3.5 py-2 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Alta PC en Stock</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por hostname, responsable o sector..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 focus:bg-white text-slate-800"
            />
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Origen:</span>
              <select
                value={origenFilter}
                onChange={(e) => setOrigenFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
              >
                <option value="todos">Todos los orígenes</option>
                <option value="STOCK">Stock (Depósito)</option>
                <option value="DETECTADA_POR_AGENTE">Detectada por agente</option>
                <option value="DETECTADA_VINCULADA_RETRO">Vinc. retroactiva</option>
                <option value="LEGACY">Legacy</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Conciliación:</span>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
              >
                <option value="todos">Todos los estados</option>
                <option value="SIN_BASELINE">Sin baseline</option>
                <option value="BASELINE_LISTO">Baseline listo</option>
                <option value="PENDIENTE">Pendiente confirmación</option>
                <option value="COINCIDE">Coincide</option>
                <option value="DISCREPANCIA">Discrepancia</option>
              </select>
            </div>

            {/* Legacy Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 select-none">
              <input
                type="checkbox"
                checked={incluirLegacy}
                onChange={(e) => setIncluirLegacy(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-[11px] font-semibold text-slate-700">Incluir legacy</span>
            </label>

          </div>

        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hostname</th>
                <th className="py-3 px-4">Tipo y Condición</th>
                <th className="py-3 px-4">Origen de Alta</th>
                <th className="py-3 px-4">Estado Conciliación</th>
                <th className="py-3 px-4">Ubicación / Sector</th>
                <th className="py-3 px-4">Combo / Hardware</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((comp) => (
                <tr 
                  key={comp.uuid}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectComputadora(comp.uuid)}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-[#9c1313] transition-colors block">
                      {comp.hostname}
                    </span>
                    {comp.responsable && (
                      <span className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {comp.responsable}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <BadgeTipoEquipo tipo={comp.tipo_equipo} />
                      <BadgeCondicion condicion={comp.condicion} />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <BadgeOrigen origen={comp.origen_alta} />
                  </td>

                  <td className="py-3 px-4">
                    <BadgeConciliacion estado={comp.estado_conciliacion} />
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]" title={comp.ubicacion || 'Sin ubicación'}>
                        {comp.ubicacion || 'Sin ubicación'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <span className="truncate max-w-[180px] block text-[11px]" title={comp.combo_resumen || comp.hardware_real?.cpu || 'Sin combo armado'}>
                      {comp.combo_resumen || (comp.hardware_real ? `${comp.hardware_real.cpu}` : '—')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {comp.estado_conciliacion === 'SIN_BASELINE' && (
                        <button
                          type="button"
                          onClick={() => onOpenArmarModal(comp.uuid)}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#9c1313] border border-red-200 text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                        >
                          Armar
                        </button>
                      )}

                      {comp.origen_alta === 'DETECTADA_POR_AGENTE' && onOpenVincularModal && (
                        <button
                          type="button"
                          onClick={() => onOpenVincularModal(comp)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                        >
                          Vincular
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectComputadora(comp.uuid)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Ver detalle"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No se encontraron computadoras con los filtros aplicados.
          </div>
        )}
      </div>

    </div>
  );
}
