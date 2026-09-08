import React, { useState, useMemo } from 'react';
import { Asset, User, Consumable, ActivityLog, AssetType, AgentComputer } from '../types';
import { 
  Laptop, Monitor, Smartphone, Cpu, Layers, HardDrive, Network, 
  AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, 
  Users, Layers2, ShieldAlert, Plus, ArrowRight, RefreshCw, ClipboardList,
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, ArrowUpRight, Zap,
  Keyboard, Video, Phone, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  assets: Asset[];
  users: User[];
  computers?: AgentComputer[];
  consumables: Consumable[];
  activities: ActivityLog[];
  onNavigate: (tab: string) => void;
  onQuickAddAsset: () => void;
}

export default function Dashboard({ assets, users, computers = [], consumables, activities, onNavigate, onQuickAddAsset }: DashboardProps) {
  // Navigation & Interactive States
  const [selectedChartTab, setSelectedChartTab] = useState<'type' | 'status'>('type');
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState<string>('All');
  const [logFilter, setLogFilter] = useState<'All' | 'Create' | 'Assign' | 'Status' | 'Stock'>('All');
  
  // Quick restock simulator states
  const [selectedConsumableForRestock, setSelectedConsumableForRestock] = useState<Consumable | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(5);
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string>('');

  // 1. Calculate General Statistics
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.status === 'Assigned');
  const availableAssets = assets.filter(a => a.status === 'Available');
  const repairAssets = assets.filter(a => a.status === 'In Repair');
  const retiredAssets = assets.filter(a => a.status === 'Retired');

  // Critical Low Stock
  const lowStockConsumables = consumables.filter(c => c.stock <= c.minStock);
  const criticalStockCount = lowStockConsumables.length;

  // 2. Peripheral and camera statistics calculation
  const peripheralStats = useMemo(() => {
    let monitores = 0;
    let teclados = 0;
    let mouses = 0;
    let impresoras = 0;
    let webcams = 0;
    let audio = 0;

    // Count from manual assets
    assets.forEach(asset => {
      if (asset.type === 'Peripheral' || asset.type === 'Monitor') {
        const name = asset.name.toLowerCase();
        if (name.includes('monitor') || name.includes('pantalla')) monitores++;
        else if (name.includes('teclado')) teclados++;
        else if (name.includes('mouse') || name.includes('raton')) mouses++;
        else if (name.includes('impresora') || name.includes('ricoh') || name.includes('hp')) impresoras++;
        else if (name.includes('camara') || name.includes('webcam') || name.includes('camera')) webcams++;
        else if (name.includes('parlante') || name.includes('auricular') || name.includes('headset')) audio++;
        else teclados++; // default fallback
      }
    });

    // Count from computer telemetry (since computers have peripherals detected)
    computers.forEach(comp => {
      if (comp.perifericos) {
        if (comp.perifericos.impresoras) impresoras += comp.perifericos.impresoras.length;
        monitores += 1; // Each computer typically has 1 main monitor detected
        teclados += 1;  
        mouses += 1;
        
        if (comp.perifericos.dispositivos_usb) {
          comp.perifericos.dispositivos_usb.forEach(usb => {
            const cat = usb.categoria?.toLowerCase() || '';
            const name = usb.nombre.toLowerCase();
            if (cat === 'camera' || cat === 'video' || name.includes('webcam') || name.includes('camara') || name.includes('camera')) {
              webcams++;
            } else if (cat === 'audio' || name.includes('headset') || name.includes('bocina') || name.includes('speaker') || name.includes('microphone') || name.includes('audio')) {
              audio++;
            }
          });
        }
      }
    });

    const totalPeripheralsCount = monitores + teclados + mouses + impresoras + audio;
    return {
      totalPeripherals: totalPeripheralsCount,
      totalCameras: webcams,
      monitores,
      teclados,
      mouses,
      impresoras,
      audio
    };
  }, [assets, computers]);

  // Compute total CCTV cameras plus webcams
  const totalCamsCount = useMemo(() => {
    let infraCams = 5; // default
    const cachedCams = localStorage.getItem('bacarsa_infra_camaras');
    if (cachedCams) {
      try {
        const parsed = JSON.parse(cachedCams);
        if (Array.isArray(parsed)) {
          infraCams = parsed.length;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    
    // Add webcam counts
    return infraCams + (peripheralStats.totalCameras || 0);
  }, [peripheralStats.totalCameras]);

  // Load IP Phone Directory list from Cache or Fallback
  const ipPhonesList = useMemo(() => {
    const cached = localStorage.getItem('bacarsa_infra_telefonos');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Error reading telefonos cache', err);
      }
    }
    return [
      { id: 'TEL-2100', name: 'Guardia', ip: '192.168.0.70', location: 'Casilla de Guardia', details: 'Teléfono IP Grandstream - Guardia Principal de Acceso', status: 'ONLINE', load: 'Ext: 2100' },
      { id: 'TEL-2101', name: 'Monitoreo', ip: '192.168.0.71', location: 'Sala CCTV', details: 'Teléfono IP Polycom - Operación de Monitoreo CCTV', status: 'ONLINE', load: 'Ext: 2101' },
      { id: 'TEL-2102', name: 'Sosa Rafael', ip: '192.168.0.72', location: 'Oficina IT / Sistemas', details: 'Teléfono IP Cisco - Coordinación de Sistemas', status: 'ONLINE', load: 'Ext: 2102' },
      { id: 'TEL-2103', name: 'Supervisores SF', ip: '192.168.0.73', location: 'Sala Supervisores', details: 'Teléfono IP Fanvil - Central de Supervisión General', status: 'ONLINE', load: 'Ext: 2103' },
      { id: 'TEL-2104', name: 'Operaciones', ip: '192.168.0.74', location: 'Mesa de Operaciones', details: 'Teléfono IP Grandstream - Logística, Tránsito y Despacho', status: 'ONLINE', load: 'Ext: 2104' },
      { id: 'TEL-2105', name: 'Sala Armas', ip: '192.168.0.75', location: 'Sala de Armas / Acceso Búnker', details: 'Teléfono IP Blindado - Personal Militar de Custodia', status: 'ONLINE', load: 'Ext: 2105' },
      { id: 'TEL-2106', name: 'Seguridad Privada', ip: '192.168.0.76', location: 'Puesto de Guardia Privada', details: 'Teléfono IP Grandstream - Seguridad Física Externa', status: 'ONLINE', load: 'Ext: 2106' },
      { id: 'TEL-2200', name: 'Marcela Santucho', ip: '192.168.0.80', location: 'Oficina Administración', details: 'Teléfono IP Yealink - Encargada de Administración y RRHH', status: 'ONLINE', load: 'Ext: 2200' },
      { id: 'TEL-2201', name: 'Filmec', ip: '192.168.0.81', location: 'Sala Control Filmec', details: 'Teléfono IP Cisco - Despacho de Blindados', status: 'ONLINE', load: 'Ext: 2201' }
    ];
  }, []);

  // 3. Resource distribution calculations
  const typeCounts = useMemo(() => {
    return assets.reduce((acc, current) => {
      acc[current.type] = (acc[current.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const assetTypes = Object.keys(typeCounts) as AssetType[];

  // 4. Departments list derived from actual assets
  const departments = useMemo(() => {
    const list = new Set(assets.map(a => a.department).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [assets]);

  // 5. Assets filtered by selected department
  const filteredAssetsByDept = useMemo(() => {
    if (activeDepartmentFilter === 'All') return assets.slice(0, 5);
    return assets.filter(a => a.department === activeDepartmentFilter);
  }, [assets, activeDepartmentFilter]);

  // 6. Activity log filter
  const filteredActivities = useMemo(() => {
    if (logFilter === 'All') return activities.slice(0, 5);
    return activities.filter(act => act.type === logFilter).slice(0, 5);
  }, [activities, logFilter]);

  // Map icon helper
  const getAssetIcon = (type: string, className = "w-4 h-4") => {
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

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsumableForRestock) return;
    
    // Simulate updating stock locally
    selectedConsumableForRestock.stock += restockAmount;
    setRestockSuccessMsg(`Se añadieron ${restockAmount} unidades a "${selectedConsumableForRestock.name}" correctamente.`);
    setSelectedConsumableForRestock(null);
    setRestockAmount(5);

    setTimeout(() => {
      setRestockSuccessMsg('');
    }, 4000);
  };

  return (
    <div id="premium-bento-dashboard" className="space-y-6 bg-slate-50 text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm">
      
      {/* 1. TOP TACTICAL CONTROL HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs">
        {/* Sleek dual color top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-slate-300 to-red-600" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] tracking-widest text-blue-500 font-mono font-bold uppercase">Control de Activos IT</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase font-sans">
              Consola General <span className="text-blue-500">Bacar Inventario</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Gestión unificada de hardware, telefonía de emergencia, periféricos y bodega de consumibles.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => onNavigate('conciliaciones')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c1313] hover:bg-red-800 text-white rounded-lg font-bold text-xs transition-all border border-red-700 uppercase tracking-wider shadow-md shadow-red-900/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-red-200" />
              <span>Bandeja Conciliaciones</span>
              <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px] font-mono font-black">3</span>
            </button>
            <button 
              onClick={onQuickAddAsset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all border border-blue-500 uppercase tracking-wider shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Computadora</span>
            </button>
            <button 
              onClick={() => onNavigate('stock')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition-all border border-slate-200 uppercase tracking-wider cursor-pointer"
            >
              <span>Asignar Consumible</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {restockSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>{restockSuccessMsg}</span>
            </div>
            <button onClick={() => setRestockSuccessMsg('')} className="text-[10px] text-blue-600 hover:underline uppercase font-bold cursor-pointer">Cerrar</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CORE BENTO METRICS GRID (Non-Financial, high-utility focus) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Activos (Blue Accent) */}
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-300 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between h-40 group relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Equipos de Cómputo</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-slate-900 font-mono block leading-none">{totalAssets}</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Activos Registrados</span>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-500">
            <span>{assignedAssets.length} Asignados</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{availableAssets.length} Disponibles</span>
          </div>
        </div>

        {/* KPI 2: Total Periféricos (Blue Accent) */}
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-300 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between h-40 group relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Periféricos e Impresoras</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Keyboard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-slate-900 font-mono block leading-none">{peripheralStats.totalPeripherals}</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Periféricos Totales</span>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-500">
            <span>{peripheralStats.monitores} Monitores</span>
            <span>•</span>
            <span>{peripheralStats.impresoras} Impresoras</span>
          </div>
        </div>

        {/* KPI 3: Cámaras de Seguridad & Webcams (Blue Accent) */}
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-300 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between h-40 group relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Vigilancia & Webcams</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-slate-900 font-mono block leading-none">{totalCamsCount}</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Cámaras Activas</span>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-500">
            <span>{peripheralStats.totalCameras} Webcams USB</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">CCTV Integrado</span>
          </div>
        </div>

        {/* KPI 4: Personal Colaborador (Blue Accent) */}
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-300 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between h-40 group relative overflow-hidden shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Colaboradores</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-slate-900 font-mono block leading-none">{users.length}</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Usuarios Activos</span>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-500">
            <span>Flota Asignada:</span>
            <span className="text-slate-700 font-mono font-bold">{((assignedAssets.length / (totalAssets || 1)) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* KPI 5: Alertas de Bodega (Red Alert Accent) */}
        <div className={`p-5 rounded-xl transition-all duration-300 flex flex-col justify-between h-40 group relative overflow-hidden border shadow-xs ${
          criticalStockCount > 0 
            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400' 
            : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-blue-300'
        }`}>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono uppercase">Alertas de Suministro</span>
            <div className={`p-2 rounded-lg border ${
              criticalStockCount > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className={`text-3xl font-black font-mono block leading-none ${criticalStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalStockCount}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${criticalStockCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
              Suministros Bajo Mínimo
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-500">
            {criticalStockCount > 0 ? (
              <span className="text-rose-600 font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" /> Acción Recomendada
              </span>
            ) : (
              <span className="text-blue-600 font-bold">Bodega al 100%</span>
            )}
            <span className="text-[9px] text-slate-400">Stock Crítico</span>
          </div>
        </div>

      </div>

      {/* 3. CORE INTERACTIVE SECTION: DEPARTMENT RESOURCE HUB & CHART ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET A: DEPARTMENT ASSETS HUB (Interactive Detail Panel) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 space-y-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                  <span>Distribución de Equipos por Área</span>
                </h2>
                <p className="text-xs text-slate-500">Selecciona un departamento para auditar sus dispositivos asignados.</p>
              </div>

              {/* Department Select Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {departments.slice(0, 4).map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setActiveDepartmentFilter(dept)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                      activeDepartmentFilter === dept 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {dept === 'All' ? 'Todos' : dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets List Inside Bento Box */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredAssetsByDept.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No hay activos registrados en este departamento.
                </div>
              ) : (
                filteredAssetsByDept.map((asset) => {
                  let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
                  if (asset.status === 'Available') statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (asset.status === 'Assigned') statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                  if (asset.status === 'In Repair') statusColor = "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <div 
                      key={asset.id} 
                      className="p-3 bg-slate-50/50 border border-slate-150 rounded-lg flex items-center justify-between gap-4 hover:border-slate-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-200 text-slate-600 rounded">
                          {getAssetIcon(asset.type)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-800 leading-none">{asset.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>S/N: {asset.serialNumber}</span>
                            <span>|</span>
                            <span>{asset.department}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border uppercase ${statusColor}`}>
                          {asset.status === 'Available' ? 'Disponible' : 
                           asset.status === 'Assigned' ? 'Asignado' : 
                           asset.status === 'In Repair' ? 'Reparación' : 'Retirado'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">
                          {asset.manufacturer}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Filtrados {filteredAssetsByDept.length} de {totalAssets} activos</span>
            <button 
              onClick={() => onNavigate('computadoras')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group uppercase tracking-wider cursor-pointer"
            >
              <span>Ver Listado de Computadoras</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* WIDGET B: IP PHONE DIRECTORY */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>Directorio de Teléfonos IP</span>
                </h2>
                <p className="text-xs text-slate-500">Extensiones SIP de comunicación interna y búnker.</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {ipPhonesList.map((tel) => (
                <div 
                  key={tel.id} 
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-lg flex items-center justify-between gap-3 hover:border-teal-300 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-teal-50 text-teal-700 rounded shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 leading-none truncate">{tel.name}</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono truncate">{tel.location} • {tel.ip}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded-md font-mono text-xs font-black">
                      {tel.load}
                    </span>
                    <span className="block text-[8px] text-emerald-600 font-bold mt-1 uppercase font-mono leading-none">
                      ● {tel.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">SIP Trunk Conmutador Activo</span>
            <button 
              onClick={() => onNavigate('telefonos')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <span>Gestionar Terminales</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. LOWER DUAL-ROW BENTO: CRITICAL STOCK ACTIONS & COMPACT AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET C: STOCK ALERTS & SIMULATED BODEGA ACTIONS */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Suministros Críticos</span>
                </h2>
                <p className="text-xs text-slate-500">Insumos bajo el límite óptimo en bodega.</p>
              </div>
              {criticalStockCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9px] font-black font-mono animate-pulse uppercase">
                  Reordenar
                </span>
              )}
            </div>

            <div className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
              {criticalStockCount === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <CheckCircle className="w-7 h-7 text-blue-500" />
                  <span className="font-bold uppercase text-[10px] text-slate-500">Bodega Abastecida</span>
                </div>
              ) : (
                lowStockConsumables.map((c) => (
                  <div 
                    key={c.id} 
                    className="p-3 bg-rose-50/30 border border-rose-100 hover:border-rose-200 rounded-lg flex items-start justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-rose-600 font-extrabold">Stock: {c.stock}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">Mín: {c.minStock}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedConsumableForRestock(c)}
                      className="px-2.5 py-1 bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white rounded text-[10px] font-black uppercase tracking-wider border border-rose-200 transition-all shrink-0 cursor-pointer"
                    >
                      Surtir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button 
              onClick={() => onNavigate('stock')}
              className="w-full inline-flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 group uppercase tracking-wider cursor-pointer"
            >
              <span>Ver Inventario de Bodega</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* WIDGET D: BITÁCORA DE CONTROL (Audit Logs With Interactive Filters) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-2 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Bitácora de Eventos IT</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Auditoría en tiempo real firmada de cambios de inventario.</p>
            </div>

            {/* Event Filter Badges */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['All', 'Create', 'Assign', 'Status'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-2 py-0.5 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                    logFilter === filter 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter === 'All' ? 'Todos' : filter === 'Create' ? 'Altas' : filter === 'Assign' ? 'Traspasos' : 'Taller'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-[11px] max-h-[220px] overflow-y-auto pr-1">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No se encontraron registros en esta categoría de filtro.
              </div>
            ) : (
              filteredActivities.map((act) => {
                let badgeStyle = "bg-slate-100 text-slate-600 border border-slate-200";
                if (act.type === 'Create') badgeStyle = "bg-blue-50 text-blue-600 border border-blue-100";
                if (act.type === 'Assign') badgeStyle = "bg-indigo-50 text-indigo-600 border border-indigo-100 font-black";
                if (act.type === 'Status') badgeStyle = "bg-amber-50 text-amber-600 border border-amber-100";

                return (
                  <div key={act.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${badgeStyle}`}>
                        {act.type === 'Create' ? 'Alta' : 
                         act.type === 'Assign' ? 'Asignado' : 
                         act.type === 'Status' ? 'Taller' : 'Modificación'}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{act.description}</p>
                        {act.details && <p className="text-slate-500 text-[10px] font-sans font-medium">{act.details}</p>}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-slate-600 font-bold block text-[10px]">{act.user}</span>
                      <span className="text-slate-400 text-[9px]">{act.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* POPUP MODAL: Interactive Restock Tool inside Bento Grid */}
      <AnimatePresence>
        {selectedConsumableForRestock && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl text-left"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Surtir Suministros IT</span>
                </span>
                <button 
                  onClick={() => setSelectedConsumableForRestock(null)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRestockSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Elemento en Bodega</span>
                  <p className="text-slate-900 font-black text-sm">{selectedConsumableForRestock.name}</p>
                  <p className="text-rose-600 font-mono text-[10px] font-bold">Stock Actual: {selectedConsumableForRestock.stock} unidades</p>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Cantidad a Adicionar *</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedConsumableForRestock(null)}
                    className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Confirmar Abasto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
