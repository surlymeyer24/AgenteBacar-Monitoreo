import React, { useState } from 'react';
import { Asset, User, Consumable, ActivityLog } from '../types';
import { 
  Laptop, Monitor, Smartphone, Cpu, Layers, HardDrive, Network, 
  AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, 
  Users, Layers2, ShieldAlert, Plus, ArrowRight, RefreshCw, ClipboardList, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  assets: Asset[];
  users: User[];
  consumables: Consumable[];
  activities: ActivityLog[];
  onNavigate: (tab: string) => void;
  onQuickAddAsset: () => void;
}

export default function Dashboard({ assets, users, consumables, activities, onNavigate, onQuickAddAsset }: DashboardProps) {
  const [selectedChartType, setSelectedChartType] = useState<'type' | 'status'>('type');

  // Compute stats
  const totalAssets = assets.length;
  const assignedAssetsCount = assets.filter(a => a.status === 'Assigned').length;
  const availableAssetsCount = assets.filter(a => a.status === 'Available').length;
  const repairAssetsCount = assets.filter(a => a.status === 'In Repair').length;
  const retiredAssetsCount = assets.filter(a => a.status === 'Retired').length;
  
  const totalCost = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const formattedTotalCost = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(totalCost * 20); // Simulating MXN

  // Low stock alert thresholds
  const lowStockConsumables = consumables.filter(c => c.stock <= c.minStock);
  const criticalStockCount = lowStockConsumables.length;

  // Breakdown by Asset Type
  const typeCounts = assets.reduce((acc, current) => {
    acc[current.type] = (acc[current.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCosts = assets.reduce((acc, current) => {
    acc[current.type] = (acc[current.type] || 0) + (current.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  const assetTypes = Object.keys(typeCounts) as Array<keyof typeof typeCounts>;
  const totalAssetTypeCount = assetTypes.reduce((sum, t) => sum + typeCounts[t], 0);

  // Status breakdown list helper
  const statusItems = [
    { name: 'Asignado', count: assignedAssetsCount, color: 'bg-indigo-600 text-indigo-600', bgLight: 'bg-indigo-50', textColor: 'text-indigo-700', percentage: (assignedAssetsCount / totalAssets) * 100 || 0 },
    { name: 'Disponible', count: availableAssetsCount, color: 'bg-emerald-600 text-emerald-600', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700', percentage: (availableAssetsCount / totalAssets) * 100 || 0 },
    { name: 'En Reparación', count: repairAssetsCount, color: 'bg-amber-600 text-amber-600', bgLight: 'bg-amber-50', textColor: 'text-amber-700', percentage: (repairAssetsCount / totalAssets) * 100 || 0 },
    { name: 'Retirado', count: retiredAssetsCount, color: 'bg-rose-600 text-rose-600', bgLight: 'bg-rose-50', textColor: 'text-rose-700', percentage: (retiredAssetsCount / totalAssets) * 100 || 0 }
  ];

  // Map icons for asset types
  const getAssetTypeIcon = (type: string, className = "w-5 h-5") => {
    switch (type) {
      case 'Laptop': return <Laptop className={className} />;
      case 'Monitor': return <Monitor className={className} />;
      case 'Mobile': return <Smartphone className={className} />;
      case 'Peripheral': return <Cpu className={className} />;
      case 'Server': return <HardDrive className={className} />;
      case 'Network': return <Network className={className} />;
      default: return <Layers className={className} />;
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner / Corporate Greeting */}
      <div id="dashboard-welcome-banner" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Consola de Control de Inventario IT</h1>
          <p className="text-slate-500 text-sm">Estado de activos, stock de periféricos y asignaciones de personal del corporativo en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="dash-quick-add-btn"
            onClick={onQuickAddAsset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] active:bg-[#09326c] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Registrar Activo
          </button>
          <button 
            id="dash-assign-nav"
            onClick={() => onNavigate('assignments')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors"
          >
            Nueva Asignación
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip - Inspired by Microsoft Admin Center */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div id="kpi-total" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Activos Registrados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalAssets}</span>
              <span className="text-xs text-slate-500">unid.</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                {availableAssetsCount} disponibles
              </span>
              <span>en almacén</span>
            </div>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div id="kpi-cost" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Inversión en Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formattedTotalCost}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Promedio: ${(totalCost / (totalAssets || 1) * 20).toFixed(0)} MXN</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div id="kpi-users" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Colaboradores</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{users.length}</span>
              <span className="text-xs text-slate-500">activos</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{assignedAssetsCount} con equipos asignados</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div id="kpi-critical" className={`bg-white rounded-xl border p-5 shadow-xs flex items-start justify-between transition-all ${criticalStockCount > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Alertas de Stock</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${criticalStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{criticalStockCount}</span>
              <span className="text-xs text-slate-500">insignias</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {criticalStockCount > 0 ? (
                <span className="flex items-center gap-1 text-amber-700 font-medium animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> Requiere reabastecimiento
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Todo en orden
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${criticalStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick IP Telephony Directory row */}
      <div id="dashboard-telephony-shortcut" className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Directorio Rápido de Teléfonos IP</span>
            </h2>
            <p className="text-xs text-slate-500">Acceso inmediato a conmutador e internos de seguridad corporativa.</p>
          </div>
          <button 
            onClick={() => onNavigate('telefonos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>Ver Conmutador Completo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { name: 'Guardia', ext: '2100', location: 'Acceso Principal', status: 'ONLINE' },
            { name: 'Monitoreo', ext: '2101', location: 'Sala CCTV', status: 'ONLINE' },
            { name: 'Sosa Rafael', ext: '2102', location: 'Sistemas', status: 'ONLINE' },
            { name: 'Supervisores SF', ext: '2103', location: 'Supervisión', status: 'ONLINE' },
            { name: 'Operaciones', ext: '2104', location: 'Mesa de Operaciones', status: 'ONLINE' }
          ].map((tel) => (
            <div 
              key={tel.ext} 
              onClick={() => onNavigate('telefonos')}
              className="p-3 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-705 transition-colors">{tel.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="ONLINE"></span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Int: {tel.ext}</span>
                <span className="text-[9px] text-slate-400 font-medium">{tel.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Content Area: Charts & Alerts */}
      <div id="dashboard-middle-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Asset Breakdown Visualizer - Card 1 */}
        <div id="breakdown-chart-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-slate-900">Métricas de Catálogo e Inversión</h2>
              <p className="text-xs text-slate-500">Análisis distributivo físico y financiero por tipo de activo.</p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button 
                id="chart-toggle-type"
                onClick={() => setSelectedChartType('type')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedChartType === 'type' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Por Categoría
              </button>
              <button 
                id="chart-toggle-status"
                onClick={() => setSelectedChartType('status')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedChartType === 'status' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Por Estado
              </button>
            </div>
          </div>

          {selectedChartType === 'type' ? (
            <div className="space-y-5 py-2">
              {/* Custom High Fidelity Horizontal Bar Chart */}
              <div className="space-y-4.5">
                {assetTypes.map((type) => {
                  const count = typeCounts[type];
                  const cost = typeCosts[type] * 20; // Simulating MXN
                  const percentage = (count / totalAssetTypeCount) * 100;
                  
                  return (
                    <div key={type} className="group space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="text-slate-400 group-hover:text-amber-500 transition-colors">
                            {getAssetTypeIcon(type, "w-4 h-4")}
                          </span>
                          <span>{type === 'Mobile' ? 'Móvil' : type === 'Peripheral' ? 'Periférico' : type === 'Server' ? 'Servidor' : type === 'Network' ? 'Red' : type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono">{count} {count === 1 ? 'unidad' : 'unidades'}</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(cost)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Interactive Bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            type === 'Laptop' ? 'bg-[#0c66e4]' : 
                            type === 'Monitor' ? 'bg-[#00a3bf]' : 
                            type === 'Mobile' ? 'bg-[#6554c0]' : 
                            type === 'Peripheral' ? 'bg-[#ff5630]' : 
                            type === 'Server' ? 'bg-[#36b37e]' : 'bg-[#ffab00]'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 items-center text-xs text-slate-600 justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex gap-2.5 items-center">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#0c66e4]"></span> <span>Laptops</span>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#00a3bf]"></span> <span>Monitores</span>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#6554c0]"></span> <span>Móviles</span>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#ff5630]"></span> <span>Periféricos</span>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#36b37e]"></span> <span>Servidores</span>
                  <span className="inline-block w-2.5 h-2.5 rounded bg-[#ffab00]"></span> <span>Red</span>
                </div>
              </div>
            </div>
          ) : (
            /* Status Breakdown UI list */
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                {statusItems.map((item) => (
                  <div key={item.name} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold ${item.textColor}`}>{item.name}</span>
                      <span className="text-2xl font-bold text-slate-900 font-mono">{item.count}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color.split(' ')[0]}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-[10px] font-mono">{item.percentage.toFixed(0)}% del total</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/10 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-indigo-900">Análisis de Ciclo de Vida IT</h4>
                  <p className="text-[11px] text-slate-600">
                    El <span className="font-semibold text-slate-800">{(availableAssetsCount / totalAssets * 100).toFixed(1)}%</span> de los equipos están listos para entrega inmediata. Un <span className="font-semibold text-slate-800">{(repairAssetsCount / totalAssets * 100).toFixed(1)}%</span> se encuentra en el taller de servicio crítico.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Center & Critical Alerts - Card 2 */}
        <div id="alerts-activity-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-slate-900">Acciones de Atención</h2>
                <p className="text-xs text-slate-500">Alertas automáticas y requisiciones IT.</p>
              </div>
              {criticalStockCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  {criticalStockCount} Críticas
                </span>
              )}
            </div>

            {/* List and Actions */}
            <div className="space-y-3.5 mt-4 overflow-y-auto max-h-[300px] pr-1">
              {criticalStockCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <span className="text-xs font-medium">No hay alertas de reabastecimiento en el stock.</span>
                </div>
              ) : (
                lowStockConsumables.map((c) => (
                  <div key={c.id} className="p-3 border border-amber-200 bg-amber-50/30 rounded-lg flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{c.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Categoría: {c.category === 'License' ? 'Licencia' : c.category === 'Peripheral' ? 'Periférico' : c.category === 'Component' ? 'Componente' : 'Accesorio'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-medium text-amber-700">Stock: {c.stock}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">Mínimo: {c.minStock}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate('stock')}
                      className="text-xs bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 font-medium px-2 py-1 rounded transition-colors shrink-0"
                    >
                      Surtir
                    </button>
                  </div>
                ))
              )}

              {/* General System Info alerts */}
              <div className="p-3 border border-indigo-100 bg-indigo-50/20 rounded-lg flex items-start gap-2 text-xs">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-indigo-900">Depreciación Mensual</span>
                  <p className="text-[11px] text-slate-600">Calculada el primer día natural del mes. 2 activos próximos a cumplir garantía.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button 
              onClick={() => onNavigate('stock')}
              className="w-full inline-flex items-center justify-between text-xs font-semibold text-[#0c66e4] hover:text-[#0055cc] group"
            >
              <span>Ver Catálogo Completo de Consumibles</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities & Logs - Bottom section */}
      <div id="recent-activities-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-slate-900">Historial Reciente de Operaciones IT</h2>
            <p className="text-xs text-slate-500">Transacciones de hardware firmadas digitalmente por los técnicos asignados.</p>
          </div>
          <button 
            onClick={() => onNavigate('reports')}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ver Auditoría Completa
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.slice(0, 4).map((act) => {
            let badgeColor = "bg-slate-100 text-slate-700";
            if (act.type === 'Create') badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-100";
            if (act.type === 'Assign') badgeColor = "bg-indigo-50 text-indigo-700 border border-indigo-100";
            if (act.type === 'Return') badgeColor = "bg-purple-50 text-purple-700 border border-purple-100";
            if (act.type === 'Stock') badgeColor = "bg-amber-50 text-amber-700 border border-amber-100";
            if (act.type === 'Status') badgeColor = "bg-rose-50 text-rose-700 border border-rose-100";

            return (
              <div key={act.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 mt-0.5 ${badgeColor}`}>
                    {act.type === 'Create' ? 'Alta' : 
                     act.type === 'Assign' ? 'Asignado' : 
                     act.type === 'Return' ? 'Devolución' : 
                     act.type === 'Stock' ? 'Inventario' : 
                     act.type === 'Status' ? 'Taller' : 'Eliminado'}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">{act.description}</p>
                    {act.details && <p className="text-slate-500 text-[11px]">{act.details}</p>}
                    <span className="text-slate-400 text-[10px] block md:hidden">{act.timestamp} • Por {act.user}</span>
                  </div>
                </div>
                <div className="hidden md:block text-right shrink-0">
                  <span className="text-slate-700 font-medium block">{act.user}</span>
                  <span className="text-slate-400 text-[10px]">{act.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
