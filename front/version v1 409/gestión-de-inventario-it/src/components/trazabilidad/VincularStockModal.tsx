import React, { useState } from 'react';
import { ComputadoraTrazable } from '../../types/trazabilidad';
import { 
  X, 
  Search, 
  Link2, 
  Box, 
  Radio, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface VincularStockModalProps {
  computadoraDetectada: ComputadoraTrazable;
  computadorasStock: ComputadoraTrazable[];
  onClose: () => void;
  onConfirmarVinculacion: (detectadaUuid: string, stockUuid: string) => void;
}

export default function VincularStockModal({
  computadoraDetectada,
  computadorasStock,
  onClose,
  onConfirmarVinculacion
}: VincularStockModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockUuid, setSelectedStockUuid] = useState<string>('');

  const stockDisponibles = computadorasStock.filter(c => 
    c.origen_alta === 'STOCK' && 
    (c.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (c.ubicacion && c.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleConfirmar = () => {
    if (!selectedStockUuid) return;
    onConfirmarVinculacion(computadoraDetectada.uuid, selectedStockUuid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">
              Vincular Máquina Detectada a Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs bg-slate-50/50">
          
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between text-blue-900">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-600">Terminal Detectada</span>
              <span className="font-mono font-bold text-sm text-slate-900">{computadoraDetectada.hostname}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">AnyDesk: {computadoraDetectada.hardware_real?.anydesk_id || 'N/A'}</span>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10.5px] block">
              Buscar Activo en Stock para Asociar:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por hostname o ubicación..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl bg-white p-2">
            {stockDisponibles.length === 0 ? (
              <p className="text-center text-slate-400 py-6 italic text-[11px]">No hay activos de stock que coincidan.</p>
            ) : (
              stockDisponibles.map(comp => (
                <div
                  key={comp.uuid}
                  onClick={() => setSelectedStockUuid(comp.uuid)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedStockUuid === comp.uuid
                      ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-2xs font-semibold'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold block">{comp.hostname}</span>
                    <span className="text-[10.5px] text-slate-500">{comp.tipo_equipo} • {comp.ubicacion}</span>
                  </div>
                  {comp.combo_resumen && (
                    <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {comp.combo_resumen}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Al vincular retroactivamente, el activo pasará a origen <strong>DETECTADA_VINCULADA_RETRO</strong> y unificará telemetría con baseline de stock.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedStockUuid}
            onClick={handleConfirmar}
            className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Vinculación</span>
          </button>
        </div>

      </div>
    </div>
  );
}
