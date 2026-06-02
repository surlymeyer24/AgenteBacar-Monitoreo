import React, { useState } from 'react';
import { Asset, User, Consumable, ActivityLog } from '../types';
import { 
  BarChart, TrendingUp, DollarSign, Calendar, Sliders, RefreshCw, 
  Search, ShieldCheck, Download, Filter, HelpCircle, Laptop, Monitor, AlertCircle
} from 'lucide-react';

interface ReportsViewProps {
  assets: Asset[];
  users: User[];
  consumables: Consumable[];
  activities: ActivityLog[];
}

export default function ReportsView({ assets, users, consumables, activities }: ReportsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Create' | 'Assign' | 'Status' | 'Stock' | 'Return'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  // Financial summary
  const totalAssetCost = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const totalStockCost = consumables.reduce((sum, c) => sum + (c.stock * c.unitPrice), 0);
  const grandTotalCost = totalAssetCost + totalStockCost;

  // Department ratios
  const deptSpending = assets.reduce((acc, a) => {
    acc[a.department] = (acc[a.department] || 0) + (a.cost || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedDepts = Object.entries(deptSpending).sort((a, b) => b[1] - a[1]);

  // Manufacturer counts
  const mfrCounts = assets.reduce((acc, a) => {
    acc[a.manufacturer] = (acc[a.manufacturer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedMfrs = Object.entries(mfrCounts).sort((a, b) => b[1] - a[1]);

  // Filtered operational audit history logs
  const filteredActivities = activities.filter(act => {
    const matchesFilter = activeFilter === 'All' || act.type === activeFilter;
    const matchesSearch = act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          act.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Action: Export Simulated CSV
  const handleExportCSV = () => {
    setCsvStatus('Generando archivo...');
    setTimeout(() => {
      // Create a simulated CSV file download in browser
      const headers = 'ID,Fecha,Tipo,Operador,Descripcion,Detalles\n';
      const rows = filteredActivities.map(act => 
        `"${act.id}","${act.timestamp}","${act.type}","${act.user}","${act.description.replace(/"/g, '""')}","${(act.details || '').replace(/"/g, '""')}"`
      ).join('\n');
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `auditoria_inventario_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCsvStatus('¡Exportación con éxito!');
      setTimeout(() => setCsvStatus(null), 3000);
    }, 1200);
  };

  return (
    <div id="reports-view" className="space-y-6">

      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Auditoría, Depreciación y Reportes IT</h1>
          <p className="text-xs text-slate-500">Métricas analíticas financieras, amortizaciones, marcas de proveedores líderes e histórico de cambios estructurales.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors shadow-xs shrink-0"
        >
          <Download className="w-4 h-4" />
          {csvStatus || 'Exportar Auditoría (CSV)'}
        </button>
      </div>

      {/* Financial Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Cost KPI Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Inversión en Hardware</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 font-mono">${(totalAssetCost * 20).toLocaleString('es-MX')} MXN</h3>
            <p className="text-[10px] text-slate-500">Equivalente a ${(totalAssetCost).toLocaleString()} USD</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${(totalAssetCost / (grandTotalCost || 1)) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Representa el {((totalAssetCost / (grandTotalCost || 1)) * 100).toFixed(1)}% del capital tecnológico</span>
        </div>

        {/* Cost KPI Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Capital en Consumibles</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 font-mono">${(totalStockCost * 20).toLocaleString('es-MX')} MXN</h3>
            <p className="text-[10px] text-slate-500">Equivalente a ${(totalStockCost).toLocaleString()} USD</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full" style={{ width: `${(totalStockCost / (grandTotalCost || 1)) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Representa el {((totalStockCost / (grandTotalCost || 1)) * 100).toFixed(1)}% de licencias y consumos</span>
        </div>

        {/* Cost KPI Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Patrimonio IT Total</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-900 font-mono">${(grandTotalCost * 20).toLocaleString('es-MX')} MXN</h3>
            <p className="text-[10px] text-slate-500">Equivalente a ${(grandTotalCost).toLocaleString()} USD globales</p>
          </div>
          <div className="w-full bg-emerald-50 rounded h-1.5 border border-emerald-100 flex items-center justify-center">
            <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-widest">Activos Asegurados</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Suma consolidada de hardware físico mas activos digitales</span>
        </div>

      </div>

      {/* Main Charts block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Brand/Manufacturer distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">Distribución por Fabricante / Proveedor</h2>
            <p className="text-[11px] text-slate-400">Total de equipos segmentados por marca de manufactura.</p>
          </div>

          <div className="space-y-3">
            {sortedMfrs.map(([mfr, count]) => {
              const pct = (count / (assets.length || 1)) * 100;
              return (
                <div key={mfr} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{mfr}</span>
                    <span className="text-slate-900 font-mono">{count} {count === 1 ? 'unidad' : 'unidades'} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        mfr === 'Apple' ? 'bg-[#030712]' : 
                        mfr === 'Lenovo' ? 'bg-[#ff5630]' : 
                        mfr === 'Dell' ? 'bg-[#0055cc]' : 
                        mfr === 'Cisco' ? 'bg-[#36b37e]' : 'bg-[#7a869a]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department ratios chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">Inversión y Costos por Departamento Contractual</h2>
            <p className="text-[11px] text-slate-400 font-medium text-slate-400">Distribución del gasto consolidado de activos en pesos mexicanos.</p>
          </div>

          <div className="space-y-3">
            {sortedDepts.map(([dept, total]) => {
              const pctValue = (total / (totalAssetCost || 1)) * 100;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dept}</span>
                    <span className="text-slate-900 font-mono">
                      ${(total * 20).toLocaleString('es-MX')} ({pctValue.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${pctValue}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Audit Logs System Trail Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historial Técnico Integral de Auditoría</h2>
            <p className="text-[11px] text-slate-400">Validaciones de estado físicas e ingresos de inventario firmados.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1">
            {(['All', 'Create', 'Assign', 'Status', 'Stock', 'Return'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  activeFilter === t 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'All' ? 'TODOS' : 
                 t === 'Create' ? 'ALTAS' : 
                 t === 'Assign' ? 'ASIGNACIONES' : 
                 t === 'Status' ? 'TALLER' : 
                 t === 'Stock' ? 'STOCK' : 'DEVOLUCIONES'}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search and table in Audit */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Filtrar por descripción técnica o firma de operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-700"
            />
          </div>

          <div className="divide-y divide-slate-150 text-xs">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No se encontraron registros de auditoría que coincidan con la búsqueda.
              </div>
            ) : (
              filteredActivities.map(act => (
                <div key={act.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50/50 px-1 rounded text-[10px]">{act.id}</span>
                      <p className="font-semibold text-slate-800">{act.description}</p>
                    </div>
                    {act.details && <p className="text-[10px] text-slate-500 pl-1">{act.details}</p>}
                  </div>
                  
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-slate-600 font-medium block">{act.user}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{act.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
