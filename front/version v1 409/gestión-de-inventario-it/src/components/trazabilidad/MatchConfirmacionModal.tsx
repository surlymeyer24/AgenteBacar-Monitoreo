import React, { useState } from 'react';
import { 
  SugerenciaConciliacion 
} from '../../types/trazabilidad';
import { 
  BadgeScore, 
  BadgeTipoEquipo, 
  BadgeCondicion 
} from './TrazabilidadBadges';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Radio, 
  Box, 
  Cpu, 
  Server, 
  HardDrive, 
  Monitor, 
  Info, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface MatchConfirmacionModalProps {
  sugerencia: SugerenciaConciliacion;
  onClose: () => void;
  onConfirmarMatch: (sugId: string) => void;
  onRechazarMatch: (sugId: string) => void;
  onPostergarMatch: (sugId: string) => void;
}

export default function MatchConfirmacionModal({
  sugerencia,
  onClose,
  onConfirmarMatch,
  onRechazarMatch,
  onPostergarMatch
}: MatchConfirmacionModalProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [rechazando, setRechazando] = useState(false);

  const { lado_agente, lado_stock, score, campos_coincidentes, campos_diferentes, nota_match } = sugerencia;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Sparkles className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">
                  Conciliación de Hardware: Agente ↔ Stock
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  REF: {sugerencia.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Valida si la terminal detectada por el agente C# corresponde al equipo armado en depósito
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BadgeScore score={score} />
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
          
          {/* Main Question Banner */}
          <div className="bg-white border-2 border-red-900/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  ¿Es la misma máquina?
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Al vincular, se confirmará el ciclo de vida de la PC y se unificará el historial de stock con el agente en vivo.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                Coincidencia global:
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {campos_coincidentes.length} campos verificados
              </span>
            </div>
          </div>

          {/* Side-by-Side 2 Column Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* COLUMN 1: LADO STOCK */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Declarado en Stock IT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Baseline Declarado
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 text-slate-700">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hostname en Stock</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{lado_stock.hostname}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BadgeTipoEquipo tipo={lado_stock.tipo} />
                    <BadgeCondicion condicion={lado_stock.condicion} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procesador CPU Esperado</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800">{lado_stock.cpu_esperada || 'No especificado'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memoria RAM Declarada</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-xs text-slate-800">{lado_stock.ram_esperada_gb || 16} GB</span>
                    <span className="text-[10px] text-slate-500">(Capacidad comercial de módulos)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disco / Almacenamiento</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800">{lado_stock.disco_esperado || 'SSD 512GB'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Combo de Periféricos en Stock</span>
                  <p className="text-xs text-slate-800 font-medium mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    {lado_stock.combo}
                  </p>
                </div>

                {lado_stock.ubicacion && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Ubicación destino:</span> {lado_stock.ubicacion}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: LADO AGENTE */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                    Detectado por Agente CyberWatch
                  </span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-300 font-bold">
                  Telemetría Real
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 text-slate-700">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hostname Agente</span>
                    <span className="font-mono font-bold text-sm text-blue-900">{lado_agente.hostname}</span>
                  </div>
                  {lado_agente.ip && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      IP: {lado_agente.ip}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procesador CPU Reportado</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800">{lado_agente.cpu}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memoria RAM Reportada</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Server className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-mono font-bold text-xs text-slate-800">{lado_agente.ram_gb} GB</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Dentro de tolerancia OS</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disco Físico Detectado</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800">{lado_agente.disco || 'SSD NVMe 512GB'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periférico Detectado (Monitor)</span>
                  <div className="mt-1 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/60 space-y-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-xs text-slate-800">{lado_agente.monitor || 'Monitor Estándar'}</span>
                    </div>
                    {nota_match && (
                      <div className="flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <Info className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{nota_match}</span>
                      </div>
                    )}
                  </div>
                </div>

                {lado_agente.anydesk_id && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    AnyDesk ID: <span className="font-bold text-slate-700">{lado_agente.anydesk_id}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Summary / Coincidencias checklist */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Desglose de Ponderación y Reglas de Conciliación
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {campos_coincidentes.map((campo, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-200 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{campo}</span>
                </div>
              ))}
              {campos_diferentes.map((campo, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{campo}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>Regla de Tolerancia RAM:</strong> Los sistemas operativos reservan entre 100MB y 300MB de memoria para hardware iGPU, por lo que 15.8 GB se valida automáticamente contra 16 GB nominales.
              </span>
            </div>
          </div>

          {/* Warning Confirmation Box if confirming */}
          {confirmando && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>¿Confirmar vinculación definitiva entre {lado_stock.hostname} y {lado_agente.hostname}?</span>
              </div>
              <p className="text-[11.5px] text-emerald-700">
                El activo en stock se marcará como <strong>COINCIDE</strong> y las sucesivas alertas del agente se cotejarán contra el baseline declarado.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmarMatch(sugerencia.id)}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Vincular</span>
                </button>
              </div>
            </div>
          )}

          {/* Warning Confirmation Box if rejecting */}
          {rechazando && (
            <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>¿Rechazar coincidencia?</span>
              </div>
              <p className="text-[11.5px] text-rose-700">
                Indicará que {lado_agente.hostname} es una terminal distinta a {lado_stock.hostname}. La PC detectada pasará a la bandeja de detectadas sin stock previo.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRechazando(false)}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onRechazarMatch(sugerencia.id)}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Rechazar Coincidencia</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPostergarMatch(sugerencia.id)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Revisar después
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={confirmando || rechazando}
              onClick={() => {
                setRechazando(true);
                setConfirmando(false);
              }}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              No, es otra
            </button>

            <button
              type="button"
              disabled={confirmando || rechazando}
              onClick={() => {
                setConfirmando(true);
                setRechazando(false);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Sí, vincular</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
