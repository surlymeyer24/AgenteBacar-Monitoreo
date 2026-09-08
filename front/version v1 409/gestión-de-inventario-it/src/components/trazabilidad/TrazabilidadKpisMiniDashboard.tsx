import React from 'react';
import { KpisTrazabilidad, ComputadoraTrazable } from '../../types/trazabilidad';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Radio, 
  Box, 
  Sparkles,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface TrazabilidadKpisMiniDashboardProps {
  kpis: KpisTrazabilidad;
  computadoras: ComputadoraTrazable[];
}

export default function TrazabilidadKpisMiniDashboard({
  kpis,
  computadoras
}: TrazabilidadKpisMiniDashboardProps) {
  const totalPcs = computadoras.length;
  const coincideCount = computadoras.filter(c => c.estado_conciliacion === 'COINCIDE').length;
  const discrepanciaCount = computadoras.filter(c => c.estado_conciliacion === 'DISCREPANCIA').length;
  const pendientesCount = computadoras.filter(c => c.estado_conciliacion === 'PENDIENTE').length;
  const baselineListoCount = computadoras.filter(c => c.estado_conciliacion === 'BASELINE_LISTO').length;
  const sinBaselineCount = computadoras.filter(c => c.estado_conciliacion === 'SIN_BASELINE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#9c1313]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
            Métricas de Conciliación y Auditoría IT (Fase 4)
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Indicadores clave de convergencia entre el inventario patrimonial y la red de terminales activas.
        </p>
      </div>

      {/* 4 Main KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: % Validadas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Tasa de Validación</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.porcentaje_validadas}%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +4.2% mes
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Computadoras en estado <strong>COINCIDE</strong> respecto al parque activo.
          </p>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis.porcentaje_validadas}%` }}></div>
          </div>
        </div>

        {/* KPI 2: Discrepancias Abiertas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Discrepancias Abiertas</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{kpis.discrepancias_abiertas}</span>
            <span className="text-xs font-medium text-slate-400">casos a auditar</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Diferencias de CPU, RAM o monitor que requieren dictamen de IT.
          </p>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* KPI 3: Tiempo Medio Stock -> Agente */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Tiempo Medio Stock → Agente</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{kpis.tiempo_medio_stock_agente_dias}</span>
            <span className="text-xs font-bold text-slate-700">días promedio</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Plazo desde el armado del combo en depósito hasta la primera señal de red.
          </p>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* KPI 4: PCs > 30 días sin agente */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">En Stock &gt; 30 Días Sin Agente</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-mono">{kpis.pcs_mas_30_dias_sin_agente}</span>
            <span className="text-xs font-semibold text-amber-800">equipo estancado</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Equipos armados sin reporte que requieren verificación física en depósito.
          </p>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>

      </div>

      {/* Distribution Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Distribución por Estado de Conciliación
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Coincide (Validado)
              </span>
              <span className="font-mono font-bold text-slate-900">{coincideCount} ({Math.round(coincideCount / totalPcs * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Pendiente de Confirmación
              </span>
              <span className="font-mono font-bold text-slate-900">{pendientesCount} ({Math.round(pendientesCount / totalPcs * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                Baseline Listo (Esperando Agente)
              </span>
              <span className="font-mono font-bold text-slate-900">{baselineListoCount} ({Math.round(baselineListoCount / totalPcs * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Discrepancia Abierta
              </span>
              <span className="font-mono font-bold text-slate-900">{discrepanciaCount} ({Math.round(discrepanciaCount / totalPcs * 100)}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                Sin Baseline (Stock Puro)
              </span>
              <span className="font-mono font-bold text-slate-900">{sinBaselineCount} ({Math.round(sinBaselineCount / totalPcs * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* Origin Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Composición por Origen de Alta
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Stock Directo IT (Fase 1)
              </span>
              <span className="font-mono font-bold text-slate-900">
                {computadoras.filter(c => c.origen_alta === 'STOCK').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Detectadas por Agente
              </span>
              <span className="font-mono font-bold text-slate-900">
                {computadoras.filter(c => c.origen_alta === 'DETECTADA_POR_AGENTE').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                Vinculación Retroactiva
              </span>
              <span className="font-mono font-bold text-slate-900">
                {computadoras.filter(c => c.origen_alta === 'DETECTADA_VINCULADA_RETRO').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                Equipos Legacy
              </span>
              <span className="font-mono font-bold text-slate-900">
                {computadoras.filter(c => c.origen_alta === 'LEGACY').length}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
