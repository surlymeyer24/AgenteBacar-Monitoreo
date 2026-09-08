import React, { useState, useEffect } from 'react';
import { 
  Network, Server, Video, HardDrive, Database, Zap, Smartphone,
  Activity, ArrowRight, ShieldCheck, AlertTriangle, RefreshCw, Layers,
  Lock, CheckCircle2, Wifi, Radio
} from 'lucide-react';
import { motion } from 'motion/react';

interface InfraDashboardProps {
  onNavigate: (view: string) => void;
  computersCount: number;
}

export default function InfraDashboard({ onNavigate, computersCount }: InfraDashboardProps) {
  const [latency, setLatency] = useState(12);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastChecked, setLastChecked] = useState('Hace 1 minuto');

  // Fluctuates latency slightly in the background for live feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, Math.min(45, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTestPing = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLatency(10 + Math.floor(Math.random() * 8));
      const now = new Date();
      setLastChecked(`Hace unos segundos (${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')})`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Infraestructura Crítica</h1>
          </div>
          <p className="text-slate-500 text-sm">Monitoreo central de enlaces WAN, conmutación central PoE, almacenamiento CCTV y servidores físicos del búnker principal.</p>
        </div>
        <div>
          <button 
            onClick={handleTestPing}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-750 text-white rounded-lg font-medium text-xs transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Verificando Ping...' : 'Probar Conectividad Core'}
          </button>
        </div>
      </div>

      {/* Network Metrics & SLA Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Latencia ICMP</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">{latency}</span>
            <span className="text-xs text-slate-400 font-bold">ms</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Gateway Core ISP-WAN1 • {lastChecked}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Pérdida Paquetes</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">0.00</span>
            <span className="text-xs text-slate-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ Enlace simétrico de Fibra estable</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Dispositivos Activos</span>
            <Server className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">24</span>
            <span className="text-xs text-slate-400 font-bold">/ 24</span>
          </div>
          <p className="text-[10px] text-indigo-600 mt-1 font-bold">✓ 100% de la infraestructura ONLINE</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Canales de Grabación</span>
            <Video className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">32</span>
            <span className="text-xs text-slate-400 font-bold">/ 32</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cámaras enlazadas en 3 grabadores NVR</p>
        </div>
      </div>

      {/* Bento Grid layout with clickable cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Routers de Borde */}
        <div 
          onClick={() => onNavigate('routers_switches')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-indigo-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Network className="w-12 h-12 text-indigo-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 w-fit rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Routers de Borde WAN</h3>
            <p className="text-xs text-slate-500">Administración de firewalls MikroTik, ruteadores Cisco ISR y redundancia móvil LTE del edificio central.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 pt-2 border-t border-slate-100">
            <span>2 Unidades Registradas</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Configurar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 2: Switches de Distribución */}
        <div 
          onClick={() => onNavigate('routers_switches')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-orange-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Server className="w-12 h-12 text-orange-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-orange-50 text-orange-600 w-fit rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Switches de Distribución PoE</h3>
            <p className="text-xs text-slate-500">Mapeo de switches Cisco Catalyst y Ubiquiti UniFi. Gestión de bocas PoE y troncales de fibra óptica de alta fidelidad.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-orange-600 pt-2 border-t border-slate-100">
            <span>3 Switches PoE Core</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Administrar bocas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 3: Access Points (Inalámbricos) */}
        <div 
          onClick={() => onNavigate('routers_switches')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-violet-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-violet-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Radio className="w-12 h-12 text-violet-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-violet-50 text-violet-600 w-fit rounded-lg">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Access Points (Wi-Fi APs)</h3>
            <p className="text-xs text-slate-500">Control de antenas inalámbricas UniFi Pro. Visualización de Uplink switch, velocidades de subida/bajada y dispositivos móviles conectados.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-violet-600 pt-2 border-t border-slate-100">
            <span>4 Antenas Wi-Fi Corporativas</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Ver mapa de antenas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 4: NVR Storage */}
        <div 
          onClick={() => onNavigate('nvr')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-emerald-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <HardDrive className="w-12 h-12 text-emerald-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 w-fit rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Grabadores de Video (NVRs)</h3>
            <p className="text-xs text-slate-500">Estado de discos RAID, retención de grabación en días y visualización de credenciales seguras de administración de CCTV.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-2 border-t border-slate-100">
            <span>3 Unidades NVR Online</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Credenciales y Canales</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 5: Cámaras IP */}
        <div 
          onClick={() => onNavigate('camaras')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-cyan-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-cyan-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Video className="w-12 h-12 text-cyan-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 w-fit rounded-lg">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cámaras IP y ONVIF CCTV</h3>
            <p className="text-xs text-slate-500">Monitoreo de feeds activos de video en áreas sensibles como Bóvedas de Valores, Salas de Recuento y portones externos.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 pt-2 border-t border-slate-100">
            <span>5 Cámaras IP Grabando</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Ver feeds de video</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 6: Servidores de Búnker */}
        <div 
          onClick={() => onNavigate('servers')}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-blue-50/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Database className="w-12 h-12 text-blue-400 opacity-20" />
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Servidores Core & Active Directory</h3>
            <p className="text-xs text-slate-500">Rendimiento, uso de procesador, memoria RAM y discos de bases de datos HPE ProLiant, Active Directory DNS, y backups Veeam.</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
            <span>4 Servidores Físicos</span>
            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
              <span>Telemetría y Hardware</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
