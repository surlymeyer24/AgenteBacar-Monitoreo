import React, { useState, useEffect } from 'react';
import { AgentComputer } from '../types';
import { 
  Laptop, Monitor, Search, Filter, Copy, CheckCircle, AlertTriangle, 
  RefreshCw, Cpu, Activity, Database, Server, Printer, ExternalLink, 
  Terminal, AlertCircle, Shield, RotateCcw, Clock, ShieldCheck, Play, HelpCircle
} from 'lucide-react';

interface ComputadorasListProps {
  computers: AgentComputer[];
  onUpdateComputer: (comp: AgentComputer) => void;
  onRefreshTelemetry: () => void;
}

export default function ComputadorasList({ computers, onUpdateComputer, onRefreshTelemetry }: ComputadorasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOS, setSelectedOS] = useState<string>('All');
  
  // Selection for details drilldown modal
  const [selectedComp, setSelectedComp] = useState<AgentComputer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);

  // Auto-simulate live fluctuating loads to make telemetry look genuinely active!
  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(() => {
      // Pick a random online computer and fluctuate CPU/RAM slightly
      const onlineComps = computers.filter(c => c.estado_conexion === 'ONLINE');
      if (onlineComps.length === 0) return;
      const target = onlineComps[Math.floor(Math.random() * onlineComps.length)];
      
      const updated = {
        ...target,
        cpu_uso_porcentaje: Math.max(1, Math.min(99, Math.round((target.cpu_uso_porcentaje + (Math.random() * 6 - 3)) * 10) / 10)),
        ram_uso_porcentaje: Math.max(10, Math.min(98, Math.round((target.ram_uso_porcentaje + (Math.random() * 4 - 2)) * 10) / 10)),
        ultima_sincronizacion: new Date().toISOString()
      };
      onUpdateComputer(updated);
    }, 4500);

    return () => clearInterval(interval);
  }, [computers, simulationActive, onUpdateComputer]);

  // Extract unique locations and OSs for filter list
  const locations = ['All', ...Array.from(new Set(computers.map(c => c.ubicacion || 'ALMACEN').filter(Boolean)))];
  const operatingSystems = ['All', 'Windows 10', 'Windows 11'];

  // Handle AnyDesk copy
  const handleCopyAnydesk = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleManualSync = () => {
    setIsRefreshing(true);
    onRefreshTelemetry();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  // Filter the list
  const filteredComputers = computers.filter(c => {
    const matchesSearch = 
      c.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.anydesk_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.procesador && c.procesador.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.ip_publica && c.ip_publica.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation = selectedLocation === 'All' || c.ubicacion === selectedLocation;
    const matchesStatus = selectedStatus === 'All' || c.estado_conexion === selectedStatus;
    const matchesOS = selectedOS === 'All' || c.sistema_operativo.includes(selectedOS);

    return matchesSearch && matchesLocation && matchesStatus && matchesOS;
  });

  return (
    <div id="computadoras-telemetry-view" className="space-y-6">
      
      {/* View Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Laptop className="w-5 h-5" />
            </span>
            Monitoreo en Vivo de Computadoras (Bacar Agent)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualización en tiempo real del estado operativo, disco duro, recursos consumidos, periféricos y Service Logs.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${simulationActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
            title="Activar/Desactivar fluctuación en vivo simulada"
          >
            <Activity className="w-3.5 h-3.5" />
            {simulationActive ? 'Telemetría Viva OS: ON' : 'Telemetría Viva OS: OFF'}
          </button>
          
          <button 
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 font-semibold text-xs text-white hover:bg-slate-800 disabled:bg-slate-400 rounded-lg shadow-3xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Sincronizando...' : 'Sincronizar Agentes'}
          </button>
        </div>
      </div>

      {/* Advanced Telemetry Filters */}
      <div id="telemetry-filters" className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Main Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              id="telemetry-search"
              type="text"
              placeholder="Buscar por Hostname, AnyDesk ID, UUID fragmentado, IP pública, etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Ubicación select */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
              <span>Ubicación:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc === 'All' ? 'Todas' : loc}</option>
                ))}
              </select>
            </div>

            {/* Operating System filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
              <span>S.O.</span>
              <select
                value={selectedOS}
                onChange={(e) => setSelectedOS(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                {operatingSystems.map(os => (
                  <option key={os} value={os}>{os === 'All' ? 'Todos' : os}</option>
                ))}
              </select>
            </div>

            {/* Online Status filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
              <span>Conexión:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                <option value="All">Todos</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            
          </div>
        </div>

        {/* Counter indicator of telemetry search results */}
        {(searchTerm || selectedLocation !== 'All' || selectedOS !== 'All' || selectedStatus !== 'All') && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-semibold text-blue-600">Resultados del Agente Bacar: {filteredComputers.length} equipos</span>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('All');
                setSelectedOS('All');
                setSelectedStatus('All');
              }}
              className="text-blue-600 hover:underline font-bold"
            >
              Restablecer Filtros de Telemetría
            </button>
          </div>
        )}
      </div>

      {/* Main Computers Live Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-widest">
                <th className="py-3 px-4 text-center">SYNC</th>
                <th className="py-3 px-4">HOSTNAME</th>
                <th className="py-3 px-4">ANYDESK ID</th>
                <th className="py-3 px-4">SISTEMA OPERATIVO</th>
                <th className="py-3 px-4">UBICACIÓN</th>
                <th className="py-3 px-4">CPU</th>
                <th className="py-3 px-4">MEMORIA RAM</th>
                <th className="py-3 px-4">DISK C:\</th>
                <th className="py-3 px-4 text-center">ANOMALÍAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredComputers.map((c) => {
                const pendingCrit = c.windows_updates?.criticos_pendientes || 0;
                const hasDiskError = c.errores_recientes?.some(e => e.fuente === 'disk');
                const outdatedAntivirus = c.software_critico?.antivirus.some(a => a.firmas_desactualizadas);
                const totalAlerts = (pendingCrit > 0 ? 1 : 0) + (hasDiskError ? 1 : 0) + (outdatedAntivirus ? 1 : 0);

                // CPU colors
                let cpuColor = 'text-slate-700 bg-slate-100';
                if (c.cpu_uso_porcentaje > 80) cpuColor = 'text-red-700 bg-red-50 font-bold border border-red-200 animate-pulse';
                else if (c.cpu_uso_porcentaje > 50) cpuColor = 'text-amber-700 bg-amber-50 border border-amber-200';
                
                // RAM usage colors
                let ramColor = 'text-slate-700 bg-slate-100';
                if (c.ram_uso_porcentaje > 85) ramColor = 'text-red-700 bg-red-100 font-bold';
                else if (c.ram_uso_porcentaje > 70) ramColor = 'text-amber-700 bg-amber-100';

                // OS badge or string
                const isWin11 = c.sistema_operativo.includes('11');

                // Disk usage %
                const diskC = c.discos.find(d => d.punto_montaje === 'C:\\') || c.discos[0];
                const diskUsedPct = diskC ? diskC.porcentaje_usado : 0;
                const devType = c.hostname.toLowerCase().startsWith('note') || c.hostname.toLowerCase().includes('guada') || c.hostname.toLowerCase().includes('carolina') ? 'Notebook' : 'Desktop';

                return (
                  <tr 
                    key={c.uuid}
                    onClick={() => setSelectedComp(c)}
                    className="hover:bg-slate-50/75 cursor-pointer transition-colors group"
                  >
                    {/* Sync Column */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span 
                          className={`w-2.5 h-2.5 rounded-full inline-block ${c.estado_conexion === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-slate-300'}`} 
                          title={c.estado_conexion === 'ONLINE' ? 'Sincronizado vía Agente' : 'Agente Desconectado'}
                        />
                      </div>
                    </td>

                    {/* Hostname Column */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="leading-tight">
                          <span>{c.hostname}</span>
                          <span className="text-[10px] text-slate-400 font-normal block font-mono">
                            {c.uuid.substring(c.uuid.lastIndexOf('-') + 1)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* AnyDesk ID Column */}
                    <td className="py-3.5 px-4">
                      <button 
                        onClick={(e) => handleCopyAnydesk(c.anydesk_id, e)}
                        className="font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold px-2 py-1 rounded transition-colors flex items-center gap-1"
                        title="Copiar ID de AnyDesk"
                      >
                        <span>{c.anydesk_id.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                        {copiedId === c.anydesk_id && (
                          <span className="text-[9px] bg-blue-600 text-white px-1 rounded animate-fade-in">Listo</span>
                        )}
                      </button>
                    </td>

                    {/* Operating System Column */}
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isWin11 ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>
                          {c.sistema_operativo}
                        </span>
                      </div>
                    </td>

                    {/* Ubicación Column */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.ubicacion || 'Bodega'}
                      </span>
                    </td>

                    {/* CPU Usage Column */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-1.5 py-0.5 rounded ${cpuColor}`}>
                        {c.cpu_uso_porcentaje}%
                      </span>
                    </td>

                    {/* RAM Usage Column */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 leading-none">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 font-mono">
                          <span>{c.ram_uso_porcentaje}%</span>
                          <span className="text-[9px] text-slate-400 font-normal">{(c.ram_total_gb * (c.ram_uso_porcentaje / 100)).toFixed(1)}GB</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${c.ram_uso_porcentaje > 85 ? 'bg-red-500' : c.ram_uso_porcentaje > 70 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${c.ram_uso_porcentaje}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Disk Column */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono text-[10px]">
                        <div className="flex justify-between leading-none mb-0.5">
                          <span className="font-bold text-slate-700">{diskUsedPct}%</span>
                          <span className="text-[9px] text-slate-400">{diskC ? Math.round(diskC.libre_gb) : 0} GB libre</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${diskUsedPct > 85 ? 'bg-red-500' : diskUsedPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${diskUsedPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Anomalies/Security Column */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {totalAlerts > 0 ? (
                          <span 
                            className="p-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center gap-1 font-bold text-[9px]"
                            title={`${totalAlerts} Alertas detectadas`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{totalAlerts}</span>
                          </span>
                        ) : (
                          <span className="p-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100" title="Ninguna anomalía">
                            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPREHENSIVE DETAIL MODAL (DRILLDOWN FROM SELECTION) */}
      <AnimatePresence>
        {selectedComp && (
          <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop click to dismiss */}
            <div className="absolute inset-0" onClick={() => setSelectedComp(null)} />
            
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Modal header with hostname and status sync */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-950 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full inline-block ${selectedComp.estado_conexion === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.73)]' : 'bg-slate-400'}`} />
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-wide">{selectedComp.hostname}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">UUID: {selectedComp.uuid}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded font-mono">
                    AnyDesk ID: {selectedComp.anydesk_id}
                  </span>
                  <button 
                    onClick={() => setSelectedComp(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white font-medium text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable multi-section detail body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Section A: KPI Resource Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* CPU Use widget */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Uso CPU</span>
                      <span className="text-xl font-extrabold text-slate-900 font-mono">{selectedComp.cpu_uso_porcentaje}%</span>
                      <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedComp.cpu_uso_porcentaje > 80 ? 'bg-red-500' : selectedComp.cpu_uso_porcentaje > 50 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                          style={{ width: `${selectedComp.cpu_uso_porcentaje}%` }} 
                        />
                      </div>
                    </div>
                    <Cpu className="w-8 h-8 text-slate-400" />
                  </div>

                  {/* RAM Total/Available widget */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Uso RAM</span>
                      <span className="text-xl font-extrabold text-slate-900 font-mono">{selectedComp.ram_uso_porcentaje}%</span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(selectedComp.ram_total_gb * (selectedComp.ram_uso_porcentaje / 100)).toFixed(1)} / {selectedComp.ram_total_gb.toFixed(1)} GB
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-neutral-400" />
                  </div>

                  {/* Network details widget */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Dirección IP</span>
                      <span className="text-xs font-bold text-slate-800 font-mono block truncate">{selectedComp.ip_publica}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono">Puertos: TCP 81</span>
                    </div>
                    <Server className="w-8 h-8 text-slate-400" />
                  </div>

                  {/* Sync date widget */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sincronización</span>
                      <span className="text-[11px] font-bold text-slate-800 font-mono block leading-tight">
                        {new Date(selectedComp.ultima_sincronizacion).toISOString().replace('T', ' ').substring(0, 19)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block">PROTOCOLO BACAR_JSON V2.1</span>
                    </div>
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                </div>

                {/* Section B: Hard Disks and Antivirus status side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Disks Storage partitions list */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                      <Database className="w-4 h-4 text-blue-600" />
                      Unidades de Almacenamiento Local
                    </h4>
                    
                    <div className="space-y-3.5">
                      {selectedComp.discos.map((d, index) => {
                        const usageColor = d.porcentaje_usado > 85 ? 'bg-red-500' : d.porcentaje_usado > 65 ? 'bg-amber-500' : 'bg-emerald-500';
                        return (
                          <div key={index} className="space-y-1 border-b border-slate-100 pb-2 last:border-none last:pb-0">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 font-mono">{d.punto_montaje} ({d.tipo_disco})</span>
                              <span className="font-mono text-slate-600">
                                {Math.round(d.total_gb - d.libre_gb)} GB / {Math.round(d.total_gb)} GB ({d.porcentaje_usado}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${usageColor}`} style={{ width: `${d.porcentaje_usado}%` }} />
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold block uppercase font-mono">
                              Estado de Partición: OPTIMO. {Math.round(d.libre_gb)} GB de almacenamiento restante.
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security Compliance & Windows Updates details */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Compliance de Seguridad Operativa
                    </h4>

                    {selectedComp.software_critico?.antivirus.map((av, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{av.nombre}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${av.habilitado ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {av.habilitado ? 'PROTECCION ACTIVA' : 'SISTEMA INACTIVO'}
                          </span>
                        </div>
                        <div className="text-[10px] space-y-0.5 font-mono text-slate-600">
                          <p>Última act. firmas: <span className="font-bold">{av.ultima_act_firmas}</span></p>
                          {av.firmas_desactualizadas ? (
                            <p className="text-red-600 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Signaturas críticas desactualizadas
                            </p>
                          ) : (
                            <p className="text-emerald-700 font-semibold mt-1">✓ Sistema al corriente</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="p-3 bg-blue-50/20 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Soporte Windows Update</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Paquetes pendientes por descargar de servidores WSUS.</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600 block leading-none">{selectedComp.windows_updates?.total_pendientes || 0}</span>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Paquetes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Monitors, Printers and connected devices */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Hardware Periférico Enlazado
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Monitor Card listing */}
                    <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Monitor className="w-4 h-4 text-cyan-600" /> Monitores
                      </span>
                      {selectedComp.perifericos?.monitores && selectedComp.perifericos.monitores.length > 0 ? (
                        selectedComp.perifericos.monitores.map((m, i) => (
                          <div key={i} className="leading-tight border-l-2 border-cyan-500 pl-2">
                            <p className="font-semibold text-slate-900 truncate">{m.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Res: {m.resolucion} | {m.pulgadas || 22}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-amber-600 italic text-[10px]">Sin monitores virtuales reportados</p>
                      )}
                    </div>

                    {/* Printer Card listing */}
                    <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Printer className="w-4 h-4 text-green-600" /> Impresoras Enlace
                      </span>
                      {selectedComp.perifericos?.impresoras && selectedComp.perifericos.impresoras.length > 0 ? (
                        selectedComp.perifericos.impresoras.slice(0, 3).map((pr, i) => (
                          <div key={i} className="leading-tight border-l-2 border-green-500 pl-2">
                            <p className="font-semibold text-slate-900 truncate">{pr.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-mono text-ellipsis overflow-hidden">
                              Puerto: {pr.puerto} {pr.predeterminada ? '(Predet.)' : ''}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-[10px]">Sin drivers de impresión</p>
                      )}
                    </div>

                    {/* Active USB devices */}
                    <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Terminal className="w-4 h-4 text-purple-600" /> Dispositivos USB
                      </span>
                      {selectedComp.perifericos?.dispositivos_usb && selectedComp.perifericos.dispositivos_usb.length > 0 ? (
                        selectedComp.perifericos.dispositivos_usb.slice(0, 3).map((usb, i) => (
                          <div key={i} className="leading-tight border-l-2 border-purple-500 pl-2">
                            <p className="font-semibold text-slate-900 truncate">{usb.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Fabricante: {usb.fabricante || 'Desconocido'}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-[10px]">Sin periféricos USB activos</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section D: Event logs / Log del sistema */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-slate-950 text-slate-300">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Terminal className="w-4 h-4 text-red-500" />
                    Visor de Eventos Administrativo (Bacar EventLogger)
                  </h4>
                  
                  <div className="font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto space-y-3 pr-1">
                    {selectedComp.errores_recientes && selectedComp.errores_recientes.length > 0 ? (
                      selectedComp.errores_recientes.map((error, idx) => (
                        <div key={idx} className="border-l-2 border-red-500 pl-3">
                          <div className="flex justify-between font-bold text-red-400">
                            <span>[{error.fuente}] - {error.tipo}</span>
                            <span className="text-slate-400 text-[9px]">{error.fecha}</span>
                          </div>
                          <p className="text-[#F1F5F9] whitespace-pre-line mt-1 bg-slate-900/50 p-2 rounded border border-slate-900">{error.mensaje}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-400 italic font-semibold">
                        [SUCCESS_LOGS] El agente BACAR no ha detectado anomalías de registro de Windows en las últimas 72 horas. Todo en orden.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom control trigger actions */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between gap-2 shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      alert('Comando temporal enviado vía UDP 81 de Agente Mac. Re-sincronizando en 2 seg.');
                      handleManualSync();
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 font-semibold text-xs text-white hover:bg-blue-700 rounded transition-colors"
                  >
                    Mandar Alerta Agente
                  </button>
                  <button 
                    onClick={() => {
                      alert('Comisión de reinicio forzado enviada a ' + selectedComp.hostname);
                    }}
                    className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded transition-colors"
                  >
                    Reiniciar Agente
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedComp(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
                >
                  Cerrar Consola
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
