import React from 'react';
import { 
  Tag, Package, MapPin, RotateCcw, 
  Check, Layers
} from 'lucide-react';

interface EtiquetasQrBulkAccionesProps {
  seleccionadasCount: number;
  totalFiltradasCount: number;
  onSeleccionarTodas: () => void;
  onLimpiarSeleccion: () => void;
  onActualizarFase: (fase: 'etiquetado' | 'embalado' | 'enDestino' | 'todas', valor: boolean) => void;
}

export function EtiquetasQrBulkAcciones({
  seleccionadasCount,
  totalFiltradasCount,
  onSeleccionarTodas,
  onLimpiarSeleccion,
  onActualizarFase,
}: EtiquetasQrBulkAccionesProps) {
  const tieneSeleccion = seleccionadasCount > 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Izquierda: Selección y Accesos Rápidos */}
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg shrink-0 ${
          tieneSeleccion ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
        }`}>
          <Layers className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {tieneSeleccion ? (
              <>
                <span className="font-mono font-bold text-slate-900">{seleccionadasCount}</span>
                <span className="text-slate-500 font-normal"> seleccionadas</span>
              </>
            ) : (
              <span className="text-slate-500 font-normal">Fase masiva:</span>
            )}
          </span>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>·</span>
            {seleccionadasCount < totalFiltradasCount ? (
              <button
                type="button"
                onClick={onSeleccionarTodas}
                className="text-slate-600 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
              >
                Todas ({totalFiltradasCount})
              </button>
            ) : (
              <span className="text-emerald-600 font-medium">Todas</span>
            )}

            {tieneSeleccion && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onLimpiarSeleccion}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Derecha: Botones directos de fase 1-click */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-400 hidden sm:inline mr-1">Marcar 100%:</span>

        {/* 1. Etiquetado */}
        <button
          type="button"
          disabled={!tieneSeleccion}
          onClick={() => onActualizarFase('etiquetado', true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium rounded-lg border border-slate-200 transition-all cursor-pointer"
          title="Marca la fase 1 (Etiquetado) como 100% para las seleccionadas"
        >
          <Tag className="w-3 h-3 text-indigo-600" />
          <span>1. Etiquetado</span>
        </button>

        {/* 2. Embalado */}
        <button
          type="button"
          disabled={!tieneSeleccion}
          onClick={() => onActualizarFase('embalado', true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium rounded-lg border border-slate-200 transition-all cursor-pointer"
          title="Marca la fase 2 (Embalado) como 100% para las seleccionadas"
        >
          <Package className="w-3 h-3 text-amber-600" />
          <span>2. Embalado</span>
        </button>

        {/* 3. En Destino */}
        <button
          type="button"
          disabled={!tieneSeleccion}
          onClick={() => onActualizarFase('enDestino', true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium rounded-lg border border-slate-200 transition-all cursor-pointer"
          title="Marca la fase 3 (En Destino) como 100% para las seleccionadas"
        >
          <MapPin className="w-3 h-3 text-emerald-600" />
          <span>3. En Destino</span>
        </button>

        {/* Todas 100% */}
        <button
          type="button"
          disabled={!tieneSeleccion}
          onClick={() => onActualizarFase('todas', true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
          title="Completa las 3 fases simultáneamente para las estaciones seleccionadas"
        >
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Todo 100%</span>
        </button>

        {/* Botón Reinicio */}
        <button
          type="button"
          disabled={!tieneSeleccion}
          onClick={() => onActualizarFase('todas', false)}
          className="inline-flex items-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 transition-all cursor-pointer"
          title="Reinicia todo el progreso a 0% para las seleccionadas"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
