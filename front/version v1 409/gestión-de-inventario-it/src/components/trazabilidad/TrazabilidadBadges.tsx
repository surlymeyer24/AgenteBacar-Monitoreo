import React from 'react';
import { 
  OrigenAlta, 
  EstadoConciliacion, 
  TipoEquipo, 
  CondicionEquipo 
} from '../../types/trazabilidad';
import { 
  Box, 
  Radio, 
  Link2, 
  Archive, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  HelpCircle,
  Laptop, 
  Monitor, 
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

// Origen Badge: STOCK (verde), DETECTADA_POR_AGENTE (azul), DETECTADA_VINCULADA_RETRO (violeta), LEGACY (gris)
export function BadgeOrigen({ origen }: { origen: OrigenAlta }) {
  switch (origen) {
    case 'STOCK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
          <Box className="w-3 h-3 text-emerald-600" />
          <span>Stock</span>
        </span>
      );
    case 'DETECTADA_POR_AGENTE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
          <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
          <span>Detectada por agente</span>
        </span>
      );
    case 'DETECTADA_VINCULADA_RETRO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs whitespace-nowrap">
          <Link2 className="w-3 h-3 text-purple-600" />
          <span>Vinc. retroactiva</span>
        </span>
      );
    case 'LEGACY':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
          <Archive className="w-3 h-3 text-slate-500" />
          <span>Legacy</span>
        </span>
      );
  }
}

// Conciliación Badge:
// SIN_BASELINE (gris), BASELINE_LISTO (cyan), PENDIENTE (ámbar), COINCIDE (verde), DISCREPANCIA (rojo), NO_APLICA (gris)
export function BadgeConciliacion({ estado }: { estado: EstadoConciliacion }) {
  switch (estado) {
    case 'SIN_BASELINE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Sin baseline</span>
        </span>
      );
    case 'BASELINE_LISTO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-2xs whitespace-nowrap">
          <Clock className="w-3 h-3 text-cyan-600" />
          <span>Baseline listo</span>
        </span>
      );
    case 'PENDIENTE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Pendiente confirmación</span>
        </span>
      );
    case 'COINCIDE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Coincide</span>
        </span>
      );
    case 'DISCREPANCIA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs whitespace-nowrap">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>Discrepancia</span>
        </span>
      );
    case 'NO_APLICA':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-slate-400 border border-slate-200 bg-slate-50 whitespace-nowrap">
          <span>No aplica</span>
        </span>
      );
  }
}

// Score Badge: >= 70 Verde "Alta confianza", 40-69 Ámbar "Revisión manual", < 40 Rojo
export function BadgeScore({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
        <span className="font-mono font-black text-xs text-emerald-700">{score}%</span>
        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
        <span className="text-[11px] font-bold uppercase tracking-tight text-emerald-700">Alta confianza</span>
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
        <span className="font-mono font-black text-xs text-amber-700">{score}%</span>
        <span className="w-1 h-1 rounded-full bg-amber-500"></span>
        <span className="text-[11px] font-bold uppercase tracking-tight text-amber-700">Revisión manual</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
      <span className="font-mono font-black text-xs text-rose-700">{score}%</span>
      <span className="w-1 h-1 rounded-full bg-rose-500"></span>
      <span className="text-[11px] font-bold uppercase tracking-tight text-rose-700">Baja coincidencia</span>
    </div>
  );
}

export function BadgeTipoEquipo({ tipo }: { tipo: TipoEquipo }) {
  switch (tipo) {
    case 'notebook':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <Laptop className="w-3 h-3 text-slate-500" />
          <span>Notebook</span>
        </span>
      );
    case 'mini_pc':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <Box className="w-3 h-3 text-slate-500" />
          <span>Mini PC</span>
        </span>
      );
    case 'desktop':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <Monitor className="w-3 h-3 text-slate-500" />
          <span>Desktop</span>
        </span>
      );
  }
}

export function BadgeCondicion({ condicion }: { condicion: CondicionEquipo }) {
  return condicion === 'nueva' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
      Nueva
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
      Usada
    </span>
  );
}
