import React, { useState } from 'react';
import { 
  Settings, Server, Terminal, RefreshCw, Key, Download, Cpu, 
  ShieldCheck, AlertTriangle, Play, HelpCircle, HardDrive, CheckCircle2 
} from 'lucide-react';

interface SistemaConfigProps {
  onRefreshAll: () => void;
}

export default function SistemaConfig({ onRefreshAll }: SistemaConfigProps) {
  const [apiKey, setApiKey] = useState('bx_sk_live_68731bca03f021e8ac8e9389a08e0fbc496c21a');
  const [syncPeriod, setSyncPeriod] = useState('5');
  const [firmwareAutoUpdate, setFirmwareAutoUpdate] = useState(true);
  const [agentLogs, setAgentLogs] = useState<string[]>([
    '2026-06-02 15:00:01 UTC - BacarAgent-Manager started on port 81',
    '2026-06-02 15:01:21 UTC - Received sync package from OPSMF (UUID: 150F3) - Status: 200 OK',
    '2026-06-02 15:02:44 UTC - Received sync package from DESKTOP-P0TUHQI (UUID: FE08) - Status: 200 OK',
    '2026-06-02 15:04:12 UTC - Recibida señal de sincronización para 11 nodos activos',
    '2026-06-02 15:05:00 UTC - EventLogger salvado en BD Firestore'
  ]);
  const [logsRefreshing, setLogsRefreshing] = useState(false);

  const handleTriggerCleanLogs = () => {
    setLogsRefreshing(true);
    setTimeout(() => {
      setAgentLogs(prev => [
        `2026-06-02 ${new Date().toISOString().substring(11, 19)} UTC - Forzado refresco de agentes`,
        ...prev
      ]);
      setLogsRefreshing(false);
      onRefreshAll();
    }, 850);
  };

  const handleDownloadAgent = () => {
    alert('Iniciando descarga: "bacar-agent-installer-win64.exe" v2.1.3 (5.4 MB)');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-slate-900 rounded-lg text-white">
            <Settings className="w-5 h-5 text-indigo-400" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Configuración del Sistema</h1>
            <p className="text-xs text-slate-500 mt-0.5">Gestión de la API de telemetría, asignación de llaves, descarga del Agente Bacar y visor de registros generales.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API / Base Configurations Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Server className="w-4.5 h-4.5 text-blue-600" />
            Parámetros del Servidor y Base de Datos
          </h3>

          <div className="space-y-4 text-xs">
            {/* Host info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Endpoint de Telemetría (API Base)</label>
                <input 
                  type="text" 
                  value="https://telemetry-api.bacarsa.com.ar/v2/nodes" 
                  disabled 
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Buzón de Sincronización en Nube</label>
                <input 
                  type="text" 
                  value="firestore://bacar-it-inventory/computadoras" 
                  disabled 
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono"
                />
              </div>
            </div>

            {/* Secret API key */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Token Secreto de Validación (API Key Autenticator)</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 font-mono focus:border-blue-600 focus:outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
              </div>
            </div>

            {/* Interval configurations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Intervalo de Sync de Agente (Minutos)</label>
                <select 
                  value={syncPeriod} 
                  onChange={(e) => setSyncPeriod(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-800 bg-white font-medium focus:border-blue-600 focus:outline-none"
                >
                  <option value="1">Cada minuto (Alta Carga)</option>
                  <option value="5">Cada 5 minutos (Recomendado)</option>
                  <option value="15">Cada 15 minutos</option>
                  <option value="60">Cada hora</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input 
                  type="checkbox" 
                  id="auto-up" 
                  checked={firmwareAutoUpdate} 
                  onChange={(e) => setFirmwareAutoUpdate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-200 rounded cursor-pointer"
                />
                <label htmlFor="auto-up" className="font-bold text-slate-700 cursor-pointer">Actualizar Agente Automáticamente</label>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => alert('Parámetros guardados y difundidos a los 11 agentes activos')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-3xs transition-colors"
              >
                Guardar Configuración General
              </button>
            </div>

          </div>
        </div>

        {/* Installer download card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Download className="w-4.5 h-4.5 text-blue-600" />
              Agente de Instalación
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El instalador es un ejecutable ligero que recopila datos de CPU, memoria, discos, periféricos y antivirus locales para subirlos de manera segura a este panel.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg text-[11px] space-y-1 border border-slate-100 leading-tight">
              <p className="font-bold text-slate-800">Requerimientos Técnicos:</p>
              <p className="text-slate-600">• Windows 10, Windows 11 o Server 2019+</p>
              <p className="text-slate-600">• .NET Core RunTime 6.0 o superior</p>
              <p className="text-slate-600">• Acceso por puerto saliente UDP/TCP 81</p>
            </div>
          </div>

          <button 
            onClick={handleDownloadAgent}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded shadow-3xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Instalador (.EXE)
          </button>
        </div>

      </div>

      {/* Sync Terminal System Logs logs */}
      <div className="bg-slate-950 text-slate-300 rounded-xl p-5 border border-slate-900 font-mono text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <span className="text-slate-400 font-bold flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-emerald-500" />
            Terminal de Sincronización de Consola (ServiceNow Agent Bridge)
          </span>

          <button
            onClick={handleTriggerCleanLogs}
            disabled={logsRefreshing}
            className="p-1 px-3 hover:bg-slate-900 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${logsRefreshing ? 'animate-spin' : ''}`} />
            Forzar Reinicio Logs
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {agentLogs.map((log, idx) => (
            <p key={idx} className="text-[11px] leading-tight text-emerald-400">
              <span className="text-slate-500 select-none">{`>`}</span> {log}
            </p>
          ))}
        </div>
      </div>

    </div>
  );
}
