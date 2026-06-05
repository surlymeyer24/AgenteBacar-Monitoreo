import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentComputer } from '../types';
import { 
  Laptop, Monitor, Search, Filter, Copy, CheckCircle, AlertTriangle, 
  RefreshCw, Cpu, Activity, Database, Server, Printer, ExternalLink, 
  Terminal, AlertCircle, Shield, RotateCcw, Clock, ShieldCheck, Play, HelpCircle,
  ChevronLeft, Trash2, Calendar, User, Info, HardDrive, ShieldAlert, Plus, UserCheck
} from 'lucide-react';

const DEFAULT_PROGRAMS = [
  { id: 'adobe-acrobat-64-bit-828e17db', nombre: 'Adobe Acrobat (64-bit)', version: '26.001.21563', editor: 'Adobe', arquitectura: 'x64', fecha_instalacion: '2026-05-17' },
  { id: 'anydesk-77783093', nombre: 'AnyDesk', version: 'ad 9.0.10', editor: 'AnyDesk Software GmbH', arquitectura: 'x86', fecha_instalacion: '2026-04-12' },
  { id: 'argente-registry-cleaner-3-1-0-6-5a086179', nombre: 'Argente - Registry Cleaner 3.1.0.6', version: '3.1.0.6', editor: 'Argente Software', arquitectura: 'x86', fecha_instalacion: '2026-05-20' },
  { id: 'biostar-1-93-ecefc0b1', nombre: 'BioStar 1.93', version: '1.93.171122', editor: 'Suprema Inc.', arquitectura: 'x64', fecha_instalacion: '2026-05-02' },
  { id: 'comprobacin-de-estado-de-pc-windows-133bc7b6', nombre: 'Comprobación de estado de PC Windows', version: '3.6.2204.08001', editor: 'Microsoft Corporation', arquitectura: 'x64', fecha_instalacion: '2026-05-11' },
  { id: 'copilot-bb9ba583', nombre: 'Copilot', version: '148.0.3967.70', editor: 'Microsoft Corporation', arquitectura: 'x64', fecha_instalacion: '2026-05-15' },
  { id: 'crystaldiskinfo-8-3-2-ca8b86b9', nombre: 'CrystalDiskInfo 8.3.2', version: '8.3.2', editor: 'Crystal Dew World', arquitectura: 'x86', fecha_instalacion: '2026-04-20' },
  { id: 'google-chrome-76868ae8', nombre: 'Google Chrome', version: '148.0.7778.217', editor: 'Google LLC', arquitectura: 'x64', fecha_instalacion: '2026-03-24' },
  { id: 'google-drive-e0daf398', nombre: 'Google Drive', version: '126.0.5.0', editor: 'Google LLC', arquitectura: 'x64', fecha_instalacion: '2026-03-25' },
  { id: 'intel-r-chipset-device-software-cc3f27fa', nombre: 'Intel(R) Chipset Device Software', version: '10.1.19199.8340', editor: 'Intel(R) Corporation', arquitectura: 'x64', fecha_instalacion: '2026-01-10' }
];

interface ComputadorasListProps {
  computers: AgentComputer[];
  onUpdateComputer: (comp: AgentComputer) => void;
  onAddComputer?: (comp: AgentComputer) => void;
  onRefreshTelemetry: () => void;
}

export default function ComputadorasList({ computers, onUpdateComputer, onAddComputer, onRefreshTelemetry }: ComputadorasListProps) {
  // Main view perspectives and live filters
  const [viewPerspective, setViewPerspective] = useState<'inventario' | 'asignacion'>('inventario');
  const [selectedAssignSubTab, setSelectedAssignSubTab] = useState<'todas' | 'asignadas' | 'baja' | 'sin_asignar' | 'mantenimiento'>('todas');
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [assignFilterLocation, setAssignFilterLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All'); // Connection Status filter
  const [assignSortOrder, setAssignSortOrder] = useState<string>('hostname-asc');
  
  // Selection for details drilldown modal
  const [selectedComp, setSelectedComp] = useState<AgentComputer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);

  // Detail Modal Sub-states for edit forms and tabs
  const [activeTab, setActiveTab2] = useState<'hardware' | 'software'>('hardware');
  const [invAssignee, setInvAssignee] = useState('');
  const [newUbicacion, setNewUbicacion] = useState('');
  const [newEstadoIt, setNewEstadoIt] = useState('');
  const [changeMotive, setChangeMotive] = useState('');

  // Inline tracking edits helper structures
  const [rowAssignee, setRowAssignee] = useState<{ [uuid: string]: string }>({});
  const [rowNewStatus, setRowNewStatus] = useState<{ [uuid: string]: string }>({});
  const [rowMotive, setRowMotive] = useState<{ [uuid: string]: string }>({});

  // Registration modal for "Nueva computadora"
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHost, setNewHost] = useState('');
  const [newUbi, setNewUbi] = useState('CAPITAL_HUMANO');
  const [newOs, setNewOs] = useState('Windows 11');
  const [newAnydesk, setNewAnydesk] = useState('');
  const [newCpu, setNewCpu] = useState('Intel Core i5, 4 núcleos');
  const [newRam, setNewRam] = useState(8);
  const [newInitialAssignee, setNewInitialAssignee] = useState('');
  const [newInitialStatus, setNewInitialStatus] = useState('Disponible');

  useEffect(() => {
    if (selectedComp) {
      setActiveTab2('hardware');
      setInvAssignee(selectedComp.responsable_inventario || '');
      setNewUbicacion(selectedComp.ubicacion || '');
      setNewEstadoIt(selectedComp.estado_it || 'Asignada');
      setChangeMotive('');
    }
  }, [selectedComp]);

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

  // Extract unique locations for filter lists
  const locations = ['All', ...Array.from(new Set(computers.map(c => c.ubicacion || 'ALMACEN').filter(Boolean)))];

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

  // Calculate IT status subtab quantities from core data
  const countTodas = computers.length;
  const countAsignadas = computers.filter(c => (c.estado_it || 'Asignada') === 'Asignada').length;
  const countBaja = computers.filter(c => c.estado_it === 'Retirada').length;
  const countSinAsignar = computers.filter(c => c.estado_it === 'Disponible').length;
  const countMantenimiento = computers.filter(c => c.estado_it === 'En Reparación').length;

  // Single unified and consolidated filter pipeline
  let unifiedFilteredComputers = computers.filter(c => {
    const term = assignSearchTerm.toLowerCase();
    const matchesSearch = 
      c.hostname.toLowerCase().includes(term) || 
      c.uuid.toLowerCase().includes(term) ||
      c.anydesk_id.toLowerCase().includes(term) ||
      (c.responsable_inventario && c.responsable_inventario.toLowerCase().includes(term)) ||
      (c.ubicacion && c.ubicacion.toLowerCase().includes(term)) ||
      (c.procesador && c.procesador.toLowerCase().includes(term)) ||
      (c.ip_publica && c.ip_publica.toLowerCase().includes(term));

    const matchesLocation = assignFilterLocation === 'All' || c.ubicacion === assignFilterLocation;
    const matchesConnStatus = selectedStatus === 'All' || c.estado_conexion === selectedStatus;

    const itState = c.estado_it || 'Asignada';
    let matchesItTab = true;
    if (selectedAssignSubTab === 'asignadas') matchesItTab = (itState === 'Asignada');
    else if (selectedAssignSubTab === 'baja') matchesItTab = (itState === 'Retirada');
    else if (selectedAssignSubTab === 'sin_asignar') matchesItTab = (itState === 'Disponible');
    else if (selectedAssignSubTab === 'mantenimiento') matchesItTab = (itState === 'En Reparación');

    return matchesSearch && matchesLocation && matchesConnStatus && matchesItTab;
  });

  // Apply Sort logic over the unified list
  unifiedFilteredComputers.sort((a, b) => {
    if (assignSortOrder === 'hostname-asc') return a.hostname.localeCompare(b.hostname);
    if (assignSortOrder === 'hostname-desc') return b.hostname.localeCompare(a.hostname);
    if (assignSortOrder === 'uuid-asc') return a.uuid.localeCompare(b.uuid);
    return 0;
  });

  // Handle manual assignee registration (save on-the-spot registry)
  const handleSaveCustody = (comp: AgentComputer) => {
    const value = rowAssignee[comp.uuid] !== undefined ? rowAssignee[comp.uuid] : (comp.responsable_inventario || '');
    
    // Automatically flag as Asignada if they written something but state was empty, or leave it intact
    let activeState = comp.estado_it || 'Asignada';
    if (value.trim() && activeState === 'Disponible') {
      activeState = 'Asignada';
    }

    const updated = {
      ...comp,
      responsable_inventario: value.trim() || undefined,
      estado_it: activeState
    };

    onUpdateComputer(updated);
    alert(`Asignado físico actualizado para "${comp.hostname}". Copia guardada en registro.`);
  };

  // Handle inline transition with obligatoy motive
  const handleApplyStateChange = (comp: AgentComputer) => {
    const nextState = rowNewStatus[comp.uuid] || comp.estado_it || 'Asignada';
    const motiveText = rowMotive[comp.uuid] || '';

    if (!motiveText.trim()) {
      alert('Debe especificar un motivo detallado obligatoriamente para cambiar el estado.');
      return;
    }

    const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const historyEntry = {
      fecha: nowStr,
      autor: 'Daniel Ortega (IT Admin)',
      estado_anterior: comp.estado_it || 'Asignada',
      estado_nuevo: nextState,
      motivo: motiveText
    };

    const nextHistory = comp.historial_estados ? [historyEntry, ...comp.historial_estados] : [historyEntry];
    
    // Clear assignee if computer is sent to storage or decommissioned
    let nextAssignee = rowAssignee[comp.uuid] !== undefined ? rowAssignee[comp.uuid] : (comp.responsable_inventario || '');
    if (nextState === 'Disponible' || nextState === 'Retirada') {
      nextAssignee = '';
    }

    const updated = {
      ...comp,
      estado_it: nextState,
      responsable_inventario: nextAssignee.trim() || undefined,
      historial_estados: nextHistory
    };

    onUpdateComputer(updated);

    // Reset this row's motive input
    setRowMotive(prev => ({ ...prev, [comp.uuid]: '' }));
    alert(`Se actualizó el estado a "${nextState}" correctamente.`);
  };

  // Submit new computer registration manually
  const handleAddComputerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHost.trim()) {
      alert('Especifique el nombre de host (HOSTNAME).');
      return;
    }

    const mockUuid = 'PC-' + Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase();
    const finalAnydesk = newAnydesk.trim() || Math.floor(100000000 + Math.random() * 900000000).toString();

    const createdComputer: AgentComputer = {
      uuid: mockUuid,
      hostname: newHost.toUpperCase(),
      sistema_operativo: newOs,
      anydesk_id: finalAnydesk,
      estado_conexion: 'ONLINE',
      ubicacion: newUbi,
      ram_uso_porcentaje: 20,
      ram_total_gb: Number(newRam) || 8,
      cpu_uso_porcentaje: 8,
      procesador: newCpu,
      ip_publica: '192.168.20.' + Math.floor(5 + Math.random() * 240),
      discos: [
        { punto_montaje: 'C:\\', total_gb: 480, libre_gb: 430, tipo_disco: 'SSD', porcentaje_usado: 10.4 }
      ],
      software_critico: {
        antivirus: [
          { nombre: 'Windows Defender', habilitado: true, "ultima_act_firmas": 'Hoy', firmas_desactualizadas: false }
        ]
      },
      windows_updates: {
        total_pendientes: 0,
        criticos_pendientes: 0
      },
      ultima_sincronizacion: new Date().toISOString(),
      estado_it: newInitialAssignee.trim() ? 'Asignada' : newInitialStatus,
      responsable_inventario: newInitialAssignee.trim() || undefined,
      historial_estados: [
        {
          fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          autor: 'Daniel Ortega (IT Admin)',
          estado_anterior: 'Ninguno',
          estado_nuevo: newInitialAssignee.trim() ? 'Asignada' : newInitialStatus,
          motivo: 'Registro manual inicial del equipamiento.'
        }
      ]
    };

    if (onAddComputer) {
      onAddComputer(createdComputer);
      alert(`Computadora "${createdComputer.hostname}" cargada exitosamente al inventario de red.`);
      setShowAddModal(false);
      
      // Clear inputs
      setNewHost('');
      setNewAnydesk('');
      setNewInitialAssignee('');
    } else {
      alert('Error: El componente no recibió la función para dar de alta equipos.');
    }
  };

  return (
    <div id="computadoras-telemetry-view" className="space-y-6">
      
      {/* 1. Header with parent view title and "Nueva computadora" button as shown in screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Asignaciones
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra el resguardo de computadoras de la organización de forma directa y flexible sin dependencias rígidas.
          </p>
        </div>
        
        <div>
          <button 
            id="register-new-pc-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva computadora
          </button>
        </div>
      </div>

      {/* 2. MAIN CATEGORY TABS: Styled like browser tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100/60 px-4 pt-2.5 rounded-t-xl gap-2 text-slate-700">
        <div className="flex items-end gap-1 overflow-x-auto">
          {/* Inventario Tab */}
          <button
            id="tab-inventario-btn"
            onClick={() => setViewPerspective('inventario')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all relative rounded-t-lg border-t border-l border-r ${
              viewPerspective === 'inventario'
                ? 'bg-white border-slate-200 text-slate-900 border-b-transparent translate-y-[1px] z-10 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventario</span>
            {viewPerspective === 'inventario' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>

          {/* Asignación Tab */}
          <button
            id="tab-asignacion-btn"
            onClick={() => setViewPerspective('asignacion')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all relative rounded-t-lg border-t border-l border-r ${
              viewPerspective === 'asignacion'
                ? 'bg-white border-slate-200 text-slate-900 border-b-transparent translate-y-[1px] z-10 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Asignación</span>
            {viewPerspective === 'asignacion' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>
        
        <div className="ml-auto pb-1.5 text-[10px] font-semibold text-slate-400 hidden sm:block">
          Telemetría activa • Resguardo
        </div>
      </div>

      {/* ======================= TAB 1: INVENTARIO ======================= */}
      {viewPerspective === 'inventario' && (
        <div id="inventario-telemetry-section" className="space-y-6">
          
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex gap-2 items-center">
              <span className="p-1 bg-blue-600 rounded text-white"><Cpu className="w-4 h-4" /></span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">Inventario Técnico (Agente Telemetría Bacar)</h3>
                <p className="text-[10px] text-slate-500">Monitoreo técnico de hardware, recursos consumidos, software crítico y sincronización remota.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulationActive(!simulationActive)}
                className={`px-3 py-1 bg-white rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${simulationActive ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-slate-500 border-slate-200'}`}
              >
                <Activity className="w-3 h-3 text-emerald-500" />
                {simulationActive ? 'En vivo' : 'Pausado'}
              </button>
              
              <button 
                onClick={handleManualSync}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 font-bold text-xs text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Sincronizando' : 'Sincronizar'}
              </button>
            </div>
          </div>

          {/* Telemetry Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 font-medium text-slate-700">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por Hostname, AnyDesk ID, UUID fragmentado..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-800 font-semibold"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                  <span>Ubicación:</span>
                  <select
                    value={assignFilterLocation}
                    onChange={(e) => setAssignFilterLocation(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-800 cursor-pointer"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc === 'All' ? 'Todas' : loc}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                  <span>Conexión:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="All">Todos</option>
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4">HOSTNAME</th>
                    <th className="py-3 px-4">ANYDESK ID</th>
                    <th className="py-3 px-4">SISTEMA OPERATIVO</th>
                    <th className="py-3 px-4">UBICACIÓN</th>
                    <th className="py-3 px-4 text-center">ESTADO IT</th>
                    <th className="py-3 px-4 text-center">ANOMALÍAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {unifiedFilteredComputers.map((c) => {
                    const totalAlerts = (c.windows_updates?.criticos_pendientes || 0) + (c.software_critico?.antivirus.some(a => a.firmas_desactualizadas) ? 1 : 0);
                    return (
                      <tr 
                        key={c.uuid}
                        onClick={() => setSelectedComp(c)}
                        className="hover:bg-slate-50 hover:text-slate-900 cursor-pointer text-slate-800"
                      >
                        <td className="py-3.5 px-4 text-center">
                          <span className={`w-2 h-2 rounded-full inline-block ${c.estado_conexion === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.hostname}</td>
                        <td className="py-3.5 px-4">
                          <button 
                            onClick={(e) => handleCopyAnydesk(c.anydesk_id, e)}
                            className="font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-700 flex items-center gap-1 shrink-0"
                          >
                            {c.anydesk_id}
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4">{c.sistema_operativo}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700">{c.ubicacion}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600">{c.estado_it || 'Asignada'}</td>
                        <td className="py-3.5 px-4 text-center">
                          {totalAlerts > 0 ? (
                            <span className="p-1 px-1.5 bg-amber-50 text-amber-700 border-amber-200 border rounded text-[10px] font-bold"><AlertTriangle className="w-3 h-3 inline text-amber-500 mr-0.5" />{totalAlerts}</span>
                          ) : (
                            <span className="p-1 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-100 border rounded text-[10px] font-bold">✓ OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ASIGNACIÓN ======================= */}
      {viewPerspective === 'asignacion' && (
        <div id="asignaciones-board-section" className="space-y-6">
          
          {/* Top category quantity indicators */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-slate-500 text-xs border-b border-slate-100 pb-2">
            <span>
              {unifiedFilteredComputers.length} de {computers.length} equipos • {selectedAssignSubTab === 'todas' ? 'Todos' : selectedAssignSubTab === 'asignadas' ? 'Asignadas' : selectedAssignSubTab === 'baja' ? 'Baja' : selectedAssignSubTab === 'sin_asignar' ? 'Sin Asignar' : 'Mantenimiento'}
            </span>
          </div>

          {/* Subtabs for Asignación View */}
          <div className="flex border-b border-slate-200 text-xs gap-4 overflow-x-auto whitespace-nowrap pb-1">
            <button
              onClick={() => setSelectedAssignSubTab('todas')}
              className={`pb-2.5 font-extrabold relative transition-all px-1 ${selectedAssignSubTab === 'todas' ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Todo ({countTodas})
            </button>
            <button
              onClick={() => setSelectedAssignSubTab('asignadas')}
              className={`pb-2.5 font-extrabold relative transition-all px-1 ${selectedAssignSubTab === 'asignadas' ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Asignadas ({countAsignadas})
            </button>
            <button
              onClick={() => setSelectedAssignSubTab('baja')}
              className={`pb-2.5 font-extrabold relative transition-all px-1 ${selectedAssignSubTab === 'baja' ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Baja ({countBaja})
            </button>
            <button
              onClick={() => setSelectedAssignSubTab('sin_asignar')}
              className={`pb-2.5 font-extrabold relative transition-all px-1 ${selectedAssignSubTab === 'sin_asignar' ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sin asignar ({countSinAsignar})
            </button>
            <button
              onClick={() => setSelectedAssignSubTab('mantenimiento')}
              className={`pb-2.5 font-extrabold relative transition-all px-1 ${selectedAssignSubTab === 'mantenimiento' ? 'text-slate-900 border-b-2 border-slate-900 font-black' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mantenimiento ({countMantenimiento})
            </button>
          </div>

          {/* Dynamic Search & Location Filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-3xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Hostname, responsable, usuario agente, UUID..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-700 font-medium"
                />
              </div>

              {/* Ubicación dropdown filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
                <span className="text-[10px] uppercase text-slate-400">Ubicación</span>
                <select
                  value={assignFilterLocation}
                  onChange={(e) => setAssignFilterLocation(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-900 cursor-pointer font-extrabold w-full"
                >
                  <option value="All">Todas ({computers.length})</option>
                  {locations.filter(l => l !== 'All').map(loc => {
                    const locQty = computers.filter(c => c.ubicacion === loc).length;
                    return <option key={loc} value={loc}>{loc} ({locQty})</option>;
                  })}
                </select>
              </div>

              {/* Ordenar list dropdown */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
                <span className="text-[10px] uppercase text-slate-400">Ordenar</span>
                <select
                  value={assignSortOrder}
                  onChange={(e) => setAssignSortOrder(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-900 cursor-pointer font-extrabold w-full"
                >
                  <option value="hostname-asc">Hostname A-Z</option>
                  <option value="hostname-desc">Hostname Z-A</option>
                  <option value="uuid-asc">UUID A-Z</option>
                </select>
              </div>

            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                    <th className="py-2.5 px-4">HOSTNAME</th>
                    <th className="py-2.5 px-4">UUID</th>
                    <th className="py-2.5 px-4">USUARIO (AGENTE)</th>
                    <th className="py-2.5 px-4 min-w-[200px]">ASIGNADO (REGISTRO MANUAL)</th>
                    <th className="py-2.5 px-4">UBICACIÓN</th>
                    <th className="py-2.5 px-4">ESTADO</th>
                    <th className="py-2.5 px-4 min-w-[250px]">CAMBIAR ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {unifiedFilteredComputers.length > 0 ? (
                    unifiedFilteredComputers.map((c) => {
                      // Temp state or existing inventory state
                      const currentAssignee = rowAssignee[c.uuid] !== undefined ? rowAssignee[c.uuid] : (c.responsable_inventario || '');
                      const nextStateSelected = rowNewStatus[c.uuid] || c.estado_it || 'Asignada';
                      const currentMotiveText = rowMotive[c.uuid] || '';

                      return (
                        <tr 
                          key={c.uuid}
                          className="hover:bg-slate-50 text-slate-800 transition-colors"
                          onClick={() => setSelectedComp(c)}
                        >
                          {/* Hostname */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {c.hostname}
                          </td>

                          {/* UUID short display */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-400 select-all">
                            {c.uuid.substring(0, 8)}
                          </td>

                          {/* Active user reported by the agent */}
                          <td className="py-3 px-4 text-slate-500 font-semibold">
                            SYSTEM
                          </td>

                          {/* Manual Resguardo Register with free input box */}
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1.5 max-w-sm">
                              <input 
                                type="text"
                                placeholder="Nombre o referencia"
                                value={currentAssignee}
                                onChange={(evt) => setRowAssignee(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-[11px] rounded transition-all font-semibold text-slate-700 w-full"
                              />
                              <button
                                onClick={() => handleSaveCustody(c)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase border border-slate-200">
                              {c.ubicacion || 'CAPITAL_HUMANO'}
                            </span>
                          </td>

                          {/* Current estate badges */}
                          <td className="py-3 px-4">
                            {c.estado_it === 'Asignada' || !c.estado_it ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700">Asignada</span>
                            ) : c.estado_it === 'Disponible' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">Disponible</span>
                            ) : c.estado_it === 'En Reparación' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 border border-amber-200 text-amber-700">Reparación</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 border border-rose-200 text-rose-700">De baja</span>
                            )}
                          </td>

                          {/* Mini Change State Form with motive */}
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-1 max-w-lg bg-slate-50/70 p-1.5 rounded border border-slate-200">
                              <div className="flex gap-1.5 mb-1">
                                <select
                                  value={nextStateSelected}
                                  onChange={(evt) => setRowNewStatus(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                                  className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold cursor-pointer"
                                >
                                  <option value="Asignada">Asignada</option>
                                  <option value="Disponible">Disponible (Sin asignar)</option>
                                  <option value="En Reparación">En Reparación</option>
                                  <option value="Retirada">Retirada (Dar de baja)</option>
                                </select>
                              </div>

                              <div className="flex gap-1.5">
                                <input 
                                  type="text"
                                  placeholder="Motivo (obligatorio)"
                                  value={currentMotiveText}
                                  onChange={(evt) => setRowMotive(prev => ({ ...prev, [c.uuid]: evt.target.value }))}
                                  className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 text-[10px] rounded transition-all font-medium text-slate-800 w-full"
                                />
                                <button
                                  onClick={() => handleApplyStateChange(c)}
                                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded transition-colors shrink-0"
                                >
                                  Aplicar estado
                                </button>
                              </div>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                        No se encontraron computadoras registradas bajo esta categoría / filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REGISTRAR NUEVA COMPUTADORA DIALOG ===================== */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
            
            <fieldset className="relative bg-white border border-slate-350 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  Registrar Nueva Computadora
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">Cerrar</button>
              </div>

              <form onSubmit={handleAddComputerForm} className="space-y-4 text-xs text-slate-700 font-medium">
                {/* Hostname & AnyDesk */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hostname (de RED) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MARKETING-05"
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">ID AnyDesk (opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Autogenerado si vacío"
                      value={newAnydesk}
                      onChange={(e) => setNewAnydesk(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Ubicacion & OS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Ubicación / Red</label>
                    <select
                      value={newUbi}
                      onChange={(e) => setNewUbi(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer"
                    >
                      <option value="CAPITAL_HUMANO">Capital Humano</option>
                      <option value="SOPORTE_IT">Soporte IT</option>
                      <option value="INGENIERIA">Ingeniería</option>
                      <option value="VENTAS_MKTG">Ventas & Mktg</option>
                      <option value="FINANZAS">Finanzas</option>
                      <option value="ALMACEN_CENTRAL">Almacén Central</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Sistema Operativo</label>
                    <select
                      value={newOs}
                      onChange={(e) => setNewOs(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer"
                    >
                      <option value="Windows 11">Windows 11</option>
                      <option value="Windows 10">Windows 10</option>
                    </select>
                  </div>
                </div>

                {/* RAM & CPU specs info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Procesador (CPU)</label>
                    <input 
                      type="text" 
                      value={newCpu}
                      onChange={(e) => setNewCpu(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">RAM Total (GB)</label>
                    <input 
                      type="number" 
                      value={newRam}
                      onChange={(e) => setNewRam(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Custody Assignment Registry (Nombre o referencia) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Custodia inicial</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block">Identificación del custodio (e.g. Agustina Lopez):</label>
                    <input 
                      type="text" 
                      placeholder="Dejar vacío si no se asignará inmediatamente"
                      value={newInitialAssignee}
                      onChange={(e) => setNewInitialAssignee(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {!newInitialAssignee.trim() && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Estado inicial del activo</label>
                      <select
                        value={newInitialStatus}
                        onChange={(e) => setNewInitialStatus(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        <option value="Disponible">Disponible (En almacén)</option>
                        <option value="En Reparación">En Reparación (En mantenimiento)</option>
                        <option value="Retirada">Retirada (Dado de baja)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-500 font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                  >
                    Dar de alta PC
                  </button>
                </div>
              </form>
            </fieldset>
          </div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE DETAIL MODAL (DRILLDOWN FROM SELECTION) */}
      <AnimatePresence>
        {selectedComp && (
          <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop click to dismiss */}
            <div className="absolute inset-0" onClick={() => setSelectedComp(null)} />
            
            <div className="relative bg-[#f8fafc] rounded-xl border border-slate-250 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Modal header */}
              <div className="bg-white p-6 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedComp(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    title="Volver al Listado"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className={`w-3 h-3 rounded-full inline-block ${selectedComp.estado_conexion === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.73)] animate-pulse' : 'bg-slate-400'}`} />
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                      {selectedComp.hostname}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      UUID: <span className="font-mono text-slate-600">{selectedComp.uuid}</span> <span className="text-slate-300 mx-1.5">•</span> <span className="font-bold text-slate-700 uppercase">{selectedComp.ubicacion || 'CAPITAL_HUMANO'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (confirm(`¿Confirma que desea dar de baja y eliminar físicamente el nodo "${selectedComp.hostname}" del agente BACAR?`)) {
                        alert(`PC "${selectedComp.hostname}" desvinculada exitosamente del sistema de telemetría.`);
                        setSelectedComp(null);
                      }
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-rose-50 hover:border-red-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar esta PC
                  </button>
                </div>
              </div>

              {/* Sub-tab selection bar */}
              <div className="flex border-b border-slate-250 bg-white px-6 shrink-0">
                <button 
                  onClick={() => setActiveTab2('hardware')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all mr-2 ${activeTab === 'hardware' ? 'border-primary border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Hardware
                </button>
                <button 
                  onClick={() => setActiveTab2('software')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'software' ? 'border-primary border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Software
                </button>
              </div>

              {/* Scrollable Modal Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 max-h-[64vh]">
                
                {/* 1. HARDWARE TAB CONTENTS */}
                {activeTab === 'hardware' && (
                  <div className="space-y-6">
                    
                    {/* Resource CPU/RAM Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Procesador</span>
                        <span className="text-xs font-bold text-slate-850 block mt-1.5 leading-snug">{selectedComp.procesador}</span>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Memoria Total</span>
                        <span className="text-lg font-black text-slate-900 block mt-1">{selectedComp.ram_total_gb.toFixed(2)} GB</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">1 módulo(s) físico(s) en canal principal</span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Arquitectura</span>
                        <span className="text-lg font-black text-slate-900 block mt-1">AMD64 / x86_64</span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 flex items-center gap-0.5 font-mono">
                          <CheckCircle className="w-3.5 h-3.5 inline text-emerald-500" /> Arranque Seguro UEFI
                        </span>
                      </div>
                    </div>

                    {/* Datos Generales Grid panel */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2.5 border-b border-slate-100 font-mono">
                        <Info className="w-4 h-4 text-blue-600" />
                        DATOS GENERALES
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">UUID del Sistema</span>
                          <span className="font-semibold text-slate-800 font-mono select-all text-[11px] block mt-0.5">{selectedComp.uuid}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ubicación</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">{selectedComp.ubicacion || 'CAPITAL_HUMANO'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Arquitectura</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">AMD64</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado Conexión (Crudo)</span>
                          <span className={`inline-flex items-center px-2 py-0.5 mt-1 font-bold rounded text-[10px] ${selectedComp.estado_conexion === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-250'}`}>{selectedComp.estado_conexion}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estado (IT)</span>
                          <span className="font-extrabold text-[#0c66e4] block mt-0.5">{selectedComp.estado_it || 'Asignada'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Custodio actual</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">{selectedComp.responsable_inventario || 'No asignada'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sistema Operativo</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">{selectedComp.sistema_operativo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conexión (Agente)</span>
                          <span className="font-bold text-emerald-600 block mt-0.5">Activo</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Última Sincronización</span>
                          <span className="font-mono text-slate-600 text-[11px] block mt-0.5">{new Date(selectedComp.ultima_sincronizacion).toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* ASIGNADO EN INVENTARIO */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Asignado de Custodia (Resguardo)</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tipo libre: Señale el nombre o referencia de la persona asignada a esta PC.</p>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-800">
                          <input 
                            type="text" 
                            value={invAssignee}
                            onChange={(e) => setInvAssignee(e.target.value)}
                            placeholder="ej. Juan Pérez (Soporte)"
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-1.5 font-semibold text-slate-750 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          <button 
                            onClick={() => {
                              const updated = { 
                                ...selectedComp, 
                                responsable_inventario: invAssignee.trim() || undefined,
                                estado_it: invAssignee.trim() && selectedComp.estado_it === 'Disponible' ? 'Asignada' : selectedComp.estado_it
                              };
                              onUpdateComputer(updated);
                              setSelectedComp(updated);
                              alert('Asignación archivada exitosamente.');
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>

                      {/* CAMBIAR UBICACIÓN */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide block">Cambiar Ubicación</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Modifique la zona administrativa vinculada de red para sincronización de políticas.</p>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-800">
                          <select 
                            value={newUbicacion}
                            onChange={(e) => setNewUbicacion(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-1.5 font-bold text-slate-750 focus:bg-white focus:outline-none cursor-pointer"
                          >
                            <option value="CAPITAL_HUMANO">CAPITAL_HUMANO</option>
                            <option value="SOPORTE_IT">SOPORTE_IT</option>
                            <option value="INGENIERIA">INGENIERIA</option>
                            <option value="VENTAS_MKTG">VENTAS_MKTG</option>
                            <option value="FINANZAS">FINANZAS</option>
                            <option value="SEGURIDAD_PRIVADA">SEGURIDAD_PRIVADA</option>
                            <option value="ALMACEN_CENTRAL">ALMACEN_CENTRAL</option>
                          </select>
                          <button 
                            onClick={() => {
                              const updated = { ...selectedComp, ubicacion: newUbicacion };
                              onUpdateComputer(updated);
                              setSelectedComp(updated);
                              alert('Ubicación de red actualizada exitosamente.');
                            }}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* CAMBIAR ESTADO (IT) WITH motive */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Cambiar Estado (IT)</h4>
                        <p className="text-[10px] text-slate-420 mt-0.5">Modifique el ciclo de vida de este activo computacional con justificación técnica obligatoria.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-800">
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-700 block">Nuevo Estado IT</label>
                          <select 
                            value={newEstadoIt}
                            onChange={(e) => setNewEstadoIt(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-1.5 font-bold text-slate-755 cursor-pointer focus:bg-white"
                          >
                            <option value="Asignada">Asignada (En uso activo)</option>
                            <option value="Disponible">Disponible (En almacén IT)</option>
                            <option value="En Reparación">En Reparación (En taller)</option>
                            <option value="Retirada">Retirada (Descompuesta/Baja)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="font-extrabold text-slate-700 block">Motivo (Obligatorio)</label>
                          <input 
                            type="text"
                            value={changeMotive}
                            onChange={(e) => setChangeMotive(e.target.value)}
                            placeholder="Describa el motivo detallado de esta transición de activos..."
                            className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-1.5 font-medium text-slate-750 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            if (!changeMotive.trim()) {
                              alert('El campo "Motivo o justificación técnica" es obligatorio.');
                              return;
                            }
                            const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
                            const historyEntry = {
                              fecha: nowStr,
                              autor: 'Daniel Ortega (IT Admin)',
                              focusedOn: 'custodia',
                              estado_anterior: selectedComp.estado_it || 'Asignada',
                              estado_nuevo: newEstadoIt,
                              motivo: changeMotive
                            };
                            const updatedHistory = selectedComp.historial_estados ? [historyEntry, ...selectedComp.historial_estados] : [historyEntry];
                            
                            // Clear assignee if computer is sent to storage or decommissioned
                            let finalCustodio = invAssignee;
                            if (newEstadoIt === 'Disponible' || newEstadoIt === 'Retirada') {
                              finalCustodio = '';
                            }

                            const updated = {
                              ...selectedComp,
                              estado_it: newEstadoIt,
                              responsable_inventario: finalCustodio.trim() || undefined,
                              historial_estados: updatedHistory
                            };
                            onUpdateComputer(updated);
                            setSelectedComp(updated);
                            setChangeMotive('');
                            setInvAssignee(finalCustodio);
                            alert('Estado de activo IT actualizado y archivado exitosamente.');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-3xs cursor-pointer"
                        >
                          Cambiar estado
                        </button>
                      </div>
                    </div>

                    {/* HISTORIAL DE ESTADOS (IT) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Historial de Estados / Resguardo (IT)
                      </h4>
                      <div className="space-y-3 pt-1">
                        {selectedComp.historial_estados && selectedComp.historial_estados.length > 0 ? (
                          selectedComp.historial_estados.map((entry, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs flex justify-between gap-4 items-start shadow-3xs animate-fade-in text-slate-850">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-450 line-through">{entry.estado_anterior}</span>
                                  <span className="text-slate-400 font-bold">➔</span>
                                  <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono">{entry.estado_nuevo}</span>
                                </div>
                                <p className="text-slate-700 font-semibold leading-relaxed">{entry.motivo}</p>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" /> Administrador: <span className="font-bold text-slate-500">{entry.autor}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 border border-slate-200/70 p-1 px-2.5 rounded font-mono shrink-0">{entry.fecha}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic">No hay registros previos en la bitácora de activos IT.</div>
                        )}
                      </div>
                    </div>

                    {/* Disk drive partitions list */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <HardDrive className="w-4.5 h-4.5 text-blue-600" />
                        Particiones de Disco Duro
                      </h3>
                      <div className="space-y-4 text-xs border-t border-slate-100 pt-4">
                        {selectedComp.discos?.map((d) => {
                          const progressCls = d.porcentaje_usado > 85 ? 'bg-rose-600' : d.porcentaje_usado > 65 ? 'bg-amber-600' : 'bg-blue-600';
                          return (
                            <div key={d.punto_montaje} className="space-y-2">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-slate-800 font-mono">{d.punto_montaje} ({d.tipo_disco})</span>
                                <span className="text-slate-700 font-mono">{d.libre_gb.toFixed(1)} GB Libres de {d.total_gb.toFixed(0)} GB ({d.porcentaje_usado.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-205">
                                <div className={`h-full ${progressCls} transition-all duration-300`} style={{ width: `${d.porcentaje_usado}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. SOFTWARE TAB CONTENTS */}
                {activeTab === 'software' && (
                  <div className="space-y-6">
                    
                    {/* Operating System details card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-1.5 pb-2.5 border-b border-slate-100 font-mono">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        SISTEMA OPERATIVO
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sistema Operativo</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">{selectedComp.sistema_operativo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Versión Mostrada</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">
                            {selectedComp.os_detalles?.version_mostrada || '22H2'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">UBR</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">
                            {selectedComp.os_detalles?.ubr || '3448'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Edición</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">
                            {selectedComp.os_detalles?.edicion || 'Windows 10 Pro'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Build</span>
                          <span className="font-semibold text-slate-800 block mt-0.5">
                            {selectedComp.os_detalles?.build || '19045'}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Build Lab</span>
                          <span className="font-semibold text-slate-800 select-all font-mono text-[10px] block truncate mt-0.5" title={selectedComp.os_detalles?.build_lab || '19041.1.amd64fre.vb_release.191206-1406'}>
                            {selectedComp.os_detalles?.build_lab || '19041.1.amd64fre.vb_release.191206-1406'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance de Seguridad & Parches */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 font-mono">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        COMPLIANCE DE SEGURIDAD & PARCHES
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        
                        {/* Antivirus info */}
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3.5">
                          <div className="font-bold text-slate-850 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Antivirus de Endpoint
                          </div>
                          {selectedComp.software_critico?.antivirus.map((anti, idx) => (
                            <div key={idx} className="space-y-1 text-[11px]">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-slate-700">{anti.nombre}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${anti.habilitado ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {anti.habilitado ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Firmas actualizadas: {anti.ultima_act_firmas}</p>
                              {anti.firmas_desactualizadas && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 border border-rose-200 text-rose-700 mt-1">
                                  Firmas Desactualizadas (Requiere Antivirus)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Windows Updates */}
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3.5">
                          <div className="font-bold text-slate-850 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                            <RotateCcw className="w-4 h-4 text-indigo-500" />
                            Sincronización Windows Update
                          </div>
                          <div className="text-[11px] space-y-2 font-medium">
                            <p className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-700">
                              <span>Actualizaciones Totales Pendientes:</span>
                              <span className="font-mono text-slate-900 bg-slate-200/50 px-1.5 py-0.5 rounded font-extrabold">{selectedComp.windows_updates?.total_pendientes || 0} paquetes</span>
                            </p>
                            <p className="flex justify-between text-slate-755">
                              <span>Faltan Parches Críticos:</span>
                              <span className={`font-mono px-1.5 py-0.5 rounded font-bold ${selectedComp.windows_updates?.criticos_pendientes ? 'text-rose-700 bg-rose-50 animate-pulse' : 'text-emerald-700 bg-emerald-50'}`}>
                                {selectedComp.windows_updates?.criticos_pendientes || 0} pendientes
                              </span>
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Programas Instalados table */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest flex items-center gap-1 font-mono">
                        <Play className="w-3.5 h-3.5 text-emerald-500 rotate-90 shrink-0 select-none pb-0.5" />
                        PROGRAMAS INSTALADOS
                      </h4>
                      
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-550 uppercase tracking-wider">
                              <th className="py-2.5 px-4 font-bold">ID DOCUMENTO</th>
                              <th className="py-2.5 px-4 font-bold">NOMBRE</th>
                              <th className="py-2.5 px-4 font-bold">VERSIÓN</th>
                              <th className="py-2.5 px-4 font-bold">EDITOR</th>
                              <th className="py-2.5 px-4 font-bold">ARQUITECTURA</th>
                              <th className="py-2.5 px-4 font-bold">FECHA_INSTALACION</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(selectedComp.programas_instalados || DEFAULT_PROGRAMS).map((prog) => (
                              <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors text-[11px] leading-snug">
                                <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 select-all tracking-tight truncate max-w-[140px]" title={prog.id}>{prog.id}</td>
                                <td className="py-2.5 px-4 font-bold text-slate-900">{prog.nombre}</td>
                                <td className="py-2.5 px-4 font-mono text-slate-700 text-[10px]">{prog.version}</td>
                                <td className="py-2.5 px-4 text-slate-500 font-semibold">{prog.editor}</td>
                                <td className="py-2.5 px-4 font-mono text-slate-405 text-center">{prog.arquitectura}</td>
                                <td className="py-2.5 px-4 font-mono text-slate-450 text-[10px]">{prog.fecha_instalacion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Bottom Control Action Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between gap-2 shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      alert('Re-sincronizando agente...');
                      onRefreshTelemetry();
                    }}
                    className="px-3.5 py-1.5 font-semibold text-xs text-white hover:bg-blue-700 rounded-lg bg-blue-600 transition-colors cursor-pointer"
                  >
                    Mandar Alerta Agente
                  </button>
                  <button 
                    onClick={() => {
                      alert('Orden de reinicio forzado enviada con éxito al host: ' + selectedComp.hostname);
                    }}
                    className="px-3.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Reiniciar Agente
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedComp(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
