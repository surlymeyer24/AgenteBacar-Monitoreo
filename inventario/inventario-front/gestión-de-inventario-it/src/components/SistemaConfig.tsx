import React, { useState, useMemo } from 'react';
import { 
  Settings, Server, Terminal, RefreshCw, Key, Download, Cpu, 
  ShieldCheck, AlertTriangle, Play, HelpCircle, HardDrive, CheckCircle2, 
  Search, Plus, Trash2, Laptop, Calendar, CheckSquare, Square, Shield, 
  Info, ArrowUpRight, Check, Wifi, Sparkles, Database, Ban, CloudLightning, Activity, HelpCircle as HelpIcon
} from 'lucide-react';
import { AgentComputer } from '../types';

interface SistemaConfigProps {
  onRefreshAll: () => void;
  computers?: AgentComputer[];
  setComputers?: React.Dispatch<React.SetStateAction<AgentComputer[]>>;
}

interface CommandLog {
  id: string;
  timestamp: string; // "YYYY-MM-DD HH:MM:SS"
  uuid: string;
  hostname: string;
  evento: 'ACTUALIZAR_DATOS' | 'ACTUALIZAR_AGENTE' | 'RESETEAR_ID' | 'SISTEMA_START';
  detalle: string;
  version_agente: string;
}

// Map event to badge CSS
const EVENTO_BADGE_HW: Record<string, string> = {
  ACTUALIZAR_DATOS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ACTUALIZAR_AGENTE: 'bg-blue-100 text-blue-800 border-blue-200',
  RESETEAR_ID: 'bg-rose-100 text-rose-800 border-rose-200',
  SISTEMA_START: 'bg-slate-100 text-slate-800 border-slate-200'
};

function inicioDiaLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function finDiaLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function versionInstaladaTexto(c: AgentComputer) {
  // Mock data has different representations, but let's fall back gracefully
  const v = c.software_critico?.antivirus?.[0]?.ultima_act_firmas ? "2.1.2" : "2.1.3";
  // We can also have an arbitrary version based on its name or uuid
  const numHash = c.uuid.charCodeAt(c.uuid.length - 1) % 2;
  return numHash === 0 ? '2.1.2' : '2.1.3';
}

function coincideUuidHostname(needleRaw: string, uuid: string, hostname: string) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  const u = String(uuid ?? '').toLowerCase();
  const h = String(hostname ?? '').toLowerCase();
  return u.includes(needle) || h.includes(needle);
}

function coincideVersionTexto(needleRaw: string, versionStr: string) {
  const needle = needleRaw.trim().toLowerCase();
  if (!needle) return true;
  const v = String(versionStr ?? '').trim().toLowerCase();
  return v.includes(needle);
}

export default function SistemaConfig({ onRefreshAll, computers = [], setComputers }: SistemaConfigProps) {
  // Installer download settings state
  const [urlDescarga, setUrlDescarga] = useState('https://telemetry-api.bacarsa.com.ar/v2/download/bacar-agent-installer-win64.exe');
  const [versionEtiqueta, setVersionEtiqueta] = useState('v2.1.3');
  const [nombreArchivo, setNombreArchivo] = useState('bacar-agent-installer-win64.exe');
  const [installerLoading, setInstallerLoading] = useState(false);
  const [showInstallerConfig, setShowInstallerConfig] = useState(false);

  // Authentication and Sync settings
  const [apiKey, setApiKey] = useState('bx_sk_live_68731bca03f021e8ac8e9389a08e0fbc496c21a');
  const [syncPeriod, setSyncPeriod] = useState('5');
  const [firmwareAutoUpdate, setFirmwareAutoUpdate] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Filters for commands and logs
  const [busquedaComandosMaquinas, setBusquedaComandosMaquinas] = useState('');
  const [filtroVersionComandos, setFiltroVersionComandos] = useState('');
  const [busquedaHistorialLogs, setBusquedaHistorialLogs] = useState('');
  const [filtroVersionHistorial, setFiltroVersionHistorial] = useState('');
  
  const [logFechaDesde, setLogFechaDesde] = useState('');
  const [logFechaHasta, setLogFechaHasta] = useState('');

  // Checklist selection of computers
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(() => new Set());
  
  // Feedback and loading indicators
  const [enviandoActualizarTodas, setEnviandoActualizarTodas] = useState(false);
  const [enviandoAgenteSeleccion, setEnviandoAgenteSeleccion] = useState(false);
  const [enviandoResetUuidSeleccion, setEnviandoResetUuidSeleccion] = useState(false);
  const [errorAgenteSeleccion, setErrorAgenteSeleccion] = useState<string | null>(null);
  const [errorResetUuid, setErrorResetUuid] = useState<Record<string, string>>({});
  
  // Log history management state (in memory local storage simulation)
  const [logs, setLogs] = useState<CommandLog[]>(() => {
    const cached = localStorage.getItem('bacarsa_system_commands_logs');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* ignore */ }
    }
    return [
      { 
        id: 'LOG-001', 
        timestamp: '2026-06-04 11:45:12', 
        uuid: '00000000-0000-0000-0000-309C2389FE08', 
        hostname: 'DESKTOP-P0TUHQI', 
        evento: 'ACTUALIZAR_DATOS', 
        detalle: 'Sincronización manual forzada desde consola de administración.', 
        version_agente: '2.1.2' 
      },
      { 
        id: 'LOG-002', 
        timestamp: '2026-06-04 10:12:02', 
        uuid: '00000000-0000-0000-0000-209F1470BB01', 
        hostname: 'OPSMF', 
        evento: 'ACTUALIZAR_AGENTE', 
        detalle: 'Comando de actualización enviado con éxito. Agente reiniciando.', 
        version_agente: '2.1.2' 
      },
      { 
        id: 'LOG-003', 
        timestamp: '2026-06-03 16:32:44', 
        uuid: '00000000-0000-0000-0000-510D77BFDE09', 
        hostname: 'TESORERIA-MINI1', 
        evento: 'RESETEAR_ID', 
        detalle: 'ID persistente en registro Windows borrado de manera remota.', 
        version_agente: '2.1.3' 
      },
      { 
        id: 'LOG-004', 
        timestamp: '2026-06-03 09:00:00', 
        uuid: 'SYSTEM', 
        hostname: 'BacarIT-Server', 
        evento: 'SISTEMA_START', 
        detalle: 'Punto de enlace ServiceNow Agent Bridge iniciado con éxito.', 
        version_agente: '2.1.3' 
      }
    ];
  });

  const [borrandoLogs, setBorrandoLogs] = useState(false);
  const [feedbackBorrarLogs, setFeedbackBorrarLogs] = useState<{ ok: boolean; text: string } | null>(null);

  // Save logs helper
  const saveLogs = (newLogs: CommandLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('bacarsa_system_commands_logs', JSON.stringify(newLogs));
  };

  const addLogEntry = (
    uuid: string, 
    hostname: string, 
    evento: 'ACTUALIZAR_DATOS' | 'ACTUALIZAR_AGENTE' | 'RESETEAR_ID' | 'SISTEMA_START', 
    detalle: string,
    versionPr?: string
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: CommandLog = {
      id: `LOG-0${Math.floor(Math.random() * 1000000)}`,
      timestamp,
      uuid,
      hostname,
      evento,
      detalle,
      version_agente: versionPr || '2.1.3'
    };
    saveLogs([newLog, ...logs]);
  };

  // Date validation
  const rangoFechasInvalido = Boolean(
    logFechaDesde && logFechaHasta && logFechaDesde > logFechaHasta
  );

  // Filters mapping
  const computadorasFiltradas = useMemo(() => {
    return computers.filter(c => {
      const okHost = coincideUuidHostname(busquedaComandosMaquinas, c.uuid, c.hostname ?? '');
      const okVer = coincideVersionTexto(filtroVersionComandos, versionInstaladaTexto(c));
      return okHost && okVer;
    });
  }, [computers, busquedaComandosMaquinas, filtroVersionComandos]);

  const logsFiltrados = useMemo(() => {
    return logs.filter(l => {
      const okPc = coincideUuidHostname(busquedaHistorialLogs, l.uuid, l.hostname);
      const okVer = coincideVersionTexto(filtroVersionHistorial, l.version_agente);
      
      let okFecha = true;
      if (l.timestamp && l.timestamp !== '—') {
        const timestampDate = new Date(l.timestamp.replace(' ', 'T'));
        if (logFechaDesde) {
          const desdeLim = inicioDiaLocal(logFechaDesde);
          if (timestampDate < desdeLim) okFecha = false;
        }
        if (logFechaHasta) {
          const hastaLim = finDiaLocal(logFechaHasta);
          if (timestampDate > hastaLim) okFecha = false;
        }
      } else if (logFechaDesde || logFechaHasta) {
        okFecha = false;
      }
      
      return okPc && okVer && okFecha;
    });
  }, [logs, busquedaHistorialLogs, filtroVersionHistorial, logFechaDesde, logFechaHasta]);

  // Bulk selectors
  const handleToggleSelectAgent = (uuid: string) => {
    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedAgentIds(new Set(computadorasFiltradas.map(c => c.uuid)));
  };

  const handleDeselectAll = () => {
    setSelectedAgentIds(new Set());
  };

  // Commands dispatching
  const runIndividualCommand = (comp: AgentComputer, commandType: 'ACTUALIZAR_DATOS' | 'ACTUALIZAR_AGENTE' | 'RESETEAR_ID') => {
    if (commandType === 'RESETEAR_ID') {
      const ok = window.confirm(`¿Enviar RESETEAR_ID a ${comp.hostname || comp.uuid}?\n\nEl agente borrará su ID del registro de Windows y se reiniciará; se creará un ID nuevo según el hardware.`);
      if (!ok) return;
    }

    // Trigger loader state simulation
    setErrorResetUuid(prev => ({ ...prev, [comp.uuid]: 'Enviando...' }));
    
    setTimeout(() => {
      setErrorResetUuid(prev => {
        const cpy = { ...prev };
        delete cpy[comp.uuid];
        return cpy;
      });

      // Execute virtual modification
      if (commandType === 'ACTUALIZAR_DATOS') {
        if (setComputers) {
          setComputers(prev => prev.map(c => {
            if (c.uuid === comp.uuid) {
              return {
                ...c,
                estado_conexion: 'ONLINE',
                ram_uso_porcentaje: Math.floor(Math.random() * 30) + 40,
                cpu_uso_porcentaje: Math.floor(Math.random() * 25) + 15
              };
            }
            return c;
          }));
        }
        addLogEntry(comp.uuid, comp.hostname, 'ACTUALIZAR_DATOS', `Solicitud de reporte telemétrico completada: el agente envió un paquete fresco de variables de hardware.`, versionInstaladaTexto(comp));
      } else if (commandType === 'ACTUALIZAR_AGENTE') {
        // Mock updated version installation
        addLogEntry(comp.uuid, comp.hostname, 'ACTUALIZAR_AGENTE', `Servicio de descarga lanzado. Agente reemplazado por la compilación ${versionEtiqueta}. Reinicio exitoso.`, versionEtiqueta);
      } else if (commandType === 'RESETEAR_ID') {
        const nuevoUuid = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000).toString(16).toUpperCase().padStart(12, '0');
        if (setComputers) {
          setComputers(prev => prev.map(c => {
            if (c.uuid === comp.uuid) {
              return { ...c, uuid: nuevoUuid };
            }
            return c;
          }));
        }
        addLogEntry(comp.uuid, comp.hostname, 'RESETEAR_ID', `Reset UUID comandado. Se eliminaron tokens del host y se re-registró con la nueva firma ${nuevoUuid}.`, versionInstaladaTexto(comp));
      }
    }, 700);
  };

  // Mass Commands dispatching
  const handleActualizarDatosTodas = () => {
    const num = computers.length;
    if (num === 0) return;
    const ok = window.confirm(`¿Enviar ACTUALIZAR_DATOS a las ${num} computadoras?\nCada agente disparará una lectura telemétrica de hardware.`);
    if (!ok) return;

    setEnviandoActualizarTodas(true);
    setTimeout(() => {
      setEnviandoActualizarTodas(false);
      if (setComputers) {
        setComputers(prev => prev.map(c => ({
          ...c,
          estado_conexion: 'ONLINE'
        })));
      }
      computers.forEach(c => {
        addLogEntry(c.uuid, c.hostname, 'ACTUALIZAR_DATOS', `Llamado de telemetría masiva exitosa por solicitud de administrador.`, versionInstaladaTexto(c));
      });
      alert(`Comando de sincronización disparado a las ${num} computadoras registradas.`);
    }, 1000);
  };

  const handleActualizarAgenteSeleccionadas = () => {
    const seleccionados = computers.filter(c => selectedAgentIds.has(c.uuid));
    const num = seleccionados.length;
    if (num === 0) return;

    const ok = window.confirm(`¿Enviar ACTUALIZAR_AGENTE a las ${num} computadoras seleccionadas?\nSe instalará la compilación ${versionEtiqueta}.`);
    if (!ok) return;

    setEnviandoAgenteSeleccion(true);
    setTimeout(() => {
      setEnviandoAgenteSeleccion(false);
      seleccionados.forEach(c => {
        addLogEntry(c.uuid, c.hostname, 'ACTUALIZAR_AGENTE', `Llamado masivo exitoso. Agente migrado a la versión ${versionEtiqueta} de manera remota.`, versionEtiqueta);
      });
      setSelectedAgentIds(new Set());
      alert(`Comando enviado con éxito a los ${num} nodos seleccionados.`);
    }, 1200);
  };

  const handleResetearUuidSeleccionadas = () => {
    const seleccionados = computers.filter(c => selectedAgentIds.has(c.uuid));
    const num = seleccionados.length;
    if (num === 0) return;

    const ok = window.confirm(`¿Enviar RESETEAR_ID a las ${num} computadoras seleccionadas?\nLos agentes borrarán su ID telemétrico en Windows y volverán a identificarse.`);
    if (!ok) return;

    setEnviandoResetUuidSeleccion(true);
    setTimeout(() => {
      setEnviandoResetUuidSeleccion(false);
      if (setComputers) {
        setComputers(prev => prev.map(c => {
          if (selectedAgentIds.has(c.uuid)) {
            const nuevoUuid = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000).toString(16).toUpperCase().padStart(12, '0');
            return { ...c, uuid: nuevoUuid };
          }
          return c;
        }));
      }
      seleccionados.forEach(c => {
        addLogEntry(c.uuid, c.hostname, 'RESETEAR_ID', 'ID persistente borrado masivamente por lote de configuración remota.', versionInstaladaTexto(c));
      });
      setSelectedAgentIds(new Set());
      alert(`Reset de ID procesado de manera remota para ${num} terminales.`);
    }, 1200);
  };

  // Clear logs handler
  const handleBorrarLogs = () => {
    const hayFiltroFecha = Boolean(logFechaDesde || logFechaHasta);
    const mje = hayFiltroFecha 
      ? '¿Seguro que querés eliminar los logs filtrados en este rango de fechas de manera local?' 
      : '¿Seguro que querés limpiar por completo todo el historial de comandos telemétricos?';
    
    if (!window.confirm(mje)) return;

    setBorrandoLogs(true);
    setTimeout(() => {
      setBorrandoLogs(false);
      if (hayFiltroFecha) {
        const logsConservados = logs.filter(l => {
          if (l.timestamp && l.timestamp !== '—') {
            const timestampDate = new Date(l.timestamp.replace(' ', 'T'));
            if (logFechaDesde) {
              const desdeLim = inicioDiaLocal(logFechaDesde);
              if (timestampDate < desdeLim) return true;
            }
            if (logFechaHasta) {
              const hastaLim = finDiaLocal(logFechaHasta);
              if (timestampDate > hastaLim) return true;
            }
            return false;
          }
          return true;
        });
        const countBorrados = logs.length - logsConservados.length;
        saveLogs(logsConservados);
        setFeedbackBorrarLogs({ ok: true, text: `Limpieza completada: se removieron ${countBorrados} de ${logs.length} registros.` });
      } else {
        saveLogs([]);
        setFeedbackBorrarLogs({ ok: true, text: 'Historial de comandos formateado con éxito.' });
      }
    }, 800);
  };

  // Trigger config installer save
  const handleSaveInstallerConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setInstallerLoading(true);
    setTimeout(() => {
      setInstallerLoading(false);
      setShowInstallerConfig(false);
      addLogEntry('SYSTEM', 'BacarIT-Server', 'SISTEMA_START', `Instalador global actualizado en Firestore: se fijó la compilación ${versionEtiqueta}. URL de almacenamiento validada.`);
    }, 850);
  };

  // Submit global settings
  const handleSaveGlobalConfig = () => {
    setSavingSettings(true);
    setSettingsFeedback(null);
    setTimeout(() => {
      setSavingSettings(false);
      setSettingsFeedback('¡Parámetros del servidor persistidos y difundidos a los agentes!');
      addLogEntry('SYSTEM', 'BacarIT-Server', 'SISTEMA_START', `Parámetros de API guardados. Intervalo fijado en ${syncPeriod} minutos. Auto-instalaciones: ${firmwareAutoUpdate ? 'ACTIVAS' : 'INACTIVAS'}`);
      setTimeout(() => setSettingsFeedback(null), 3500);
    }, 800);
  };

  const handleSimulateDownload = () => {
    setInstallerLoading(true);
    setTimeout(() => {
      setInstallerLoading(false);
      addLogEntry('SYSTEM', 'User-Console', 'ACTUALIZAR_DATOS', `Descarga solicitada del instalador del agente ejecutable: ${nombreArchivo} (${versionEtiqueta}).`);
      alert(`Iniciando la transferencia segura del binario: "${nombreArchivo}" (${versionEtiqueta})\nTamaño: 5.42 MB\nFirmado y validado contra el endpoint.`);
    }, 500);
  };

  return (
    <div className="space-y-6" id="system-config-container">
      
      {/* Dynamic Dashboard Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="system-dashboard-counters">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Terminales Registrados</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{computers.length}</h3>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Laptop className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Comandos Despachados</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{logs.length}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Versión Activa</p>
            <h3 className="text-xl font-black text-indigo-700 mt-1">{versionEtiqueta}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Enlace Servidor</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Activo</span>
            </div>
          </div>
          <div className="p-2.5 bg-slate-950 text-emerald-400 rounded-lg">
            <Wifi className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two columns main area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="system-split-panels">
        
        {/* LEFT COLUMN: Installer download (span 4/12) */}
        <div className="lg:col-span-4 space-y-6" id="system-left-panel">
          
          {/* Installer Download Bloque */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="card-agent-download">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Instalador del Agente</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Instalación y sincronización en Windows</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowInstallerConfig(!showInstallerConfig)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5"
              >
                {showInstallerConfig ? 'Cancelar' : 'Personalizar'}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {showInstallerConfig ? (
                <form onSubmit={handleSaveInstallerConfig} className="bg-slate-50 p-4 rounded-lg border border-slate-150 space-y-3">
                  <p className="font-extrabold text-slate-700 text-[10px] uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Parámetros del Binario
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Versión Activa</label>
                    <input 
                      type="text" 
                      value={versionEtiqueta} 
                      onChange={(e) => setVersionEtiqueta(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-250 rounded font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Archivo Ejecutable</label>
                    <input 
                      type="text" 
                      value={nombreArchivo} 
                      onChange={(e) => setNombreArchivo(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-250 rounded font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Enlace de Descarga Directa</label>
                    <input 
                      type="url" 
                      value={urlDescarga} 
                      onChange={(e) => setUrlDescarga(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-250 rounded font-mono text-[10.5px]"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={installerLoading}
                    className="w-full py-2 bg-indigo-600 text-white font-black rounded-md text-xs hover:bg-indigo-700 transition-colors"
                  >
                    {installerLoading ? 'Actualizando...' : 'Publicar Instalador'}
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Instalador compatible para Windows <strong>{versionEtiqueta}</strong> (<code>{nombreArchivo}</code>). 
                    Recopila en background datos del hardware y antivirus enviándolos de manera encriptada por el puerto 81.
                  </p>

                  <div className="p-3 bg-slate-50/60 rounded-lg space-y-1 border border-slate-150 text-[10.5px]">
                    <span className="font-extrabold text-slate-900 block mb-1">REQUERIMIENTOS MÍNIMOS:</span>
                    <span className="text-slate-600 block">• Windows 10/11 o Windows Server 2019+</span>
                    <span className="text-slate-600 block">• .NET Runtime 6.0 instalado</span>
                    <span className="text-slate-600 block">• Regla de firewall para puerto 81 TCP/UDP</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSimulateDownload}
                      disabled={installerLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-500 text-white font-black rounded-xl transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar {nombreArchivo}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Commands a Máquinas (span 8/12) */}
        <div className="lg:col-span-8 space-y-6" id="system-right-panel">
          
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="card-nodes-commands">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Comandos a Máquinas</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Lanzamiento masivo de instrucciones vía Firestore</p>
                  </div>
                </div>
                
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                  Agente Oficial {versionEtiqueta}
                </span>
              </div>
            </div>

            {/* Config & Search actions */}
            <div className="p-5 border-b border-dashed border-slate-100 bg-slate-50/50 space-y-4">
              
              {/* Dynamic Search inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <input 
                    type="search" 
                    placeholder="Búsqueda por UUID o Hostname..."
                    value={busquedaComandosMaquinas}
                    onChange={(e) => setBusquedaComandosMaquinas(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none">
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <input 
                    type="search" 
                    placeholder="Filtrar por Versión de Agente..."
                    value={filtroVersionComandos}
                    onChange={(e) => setFiltroVersionComandos(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Batch Buttons actions line */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={handleSelectAllFiltered}
                    disabled={computadorasFiltradas.length === 0}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-250 rounded font-bold text-[11px] text-slate-600 disabled:opacity-50"
                  >
                    Seleccionar Todas ({computadorasFiltradas.length})
                  </button>
                  
                  {selectedAgentIds.size > 0 && (
                    <button 
                      type="button" 
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold rounded text-[11px]"
                    >
                      Deseleccionar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">Marcadas:</span>
                  <strong className="text-indigo-600 p-1 px-2.5 bg-indigo-50 rounded-lg text-xs">{selectedAgentIds.size}</strong>
                </div>
              </div>

              {/* Batch execution commands operations */}
              {selectedAgentIds.size > 0 && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wide flex items-center gap-1">
                    <CloudLightning className="w-3.5 h-3.5 text-indigo-600 animate-bounce" /> Acciones por Lote ({selectedAgentIds.size}):
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button"
                      disabled={enviandoAgenteSeleccion}
                      onClick={handleActualizarAgenteSeleccionadas}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10.5px] transition-colors"
                    >
                      {enviandoAgenteSeleccion ? 'Procesando...' : 'Actualizar Agente'}
                    </button>

                    <button 
                      type="button"
                      disabled={enviandoResetUuidSeleccion}
                      onClick={handleResetearUuidSeleccionadas}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10.5px] transition-all"
                    >
                      {enviandoResetUuidSeleccion ? 'Mandando...' : 'Resetear UUID'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List computers telemetry active nodes */}
            <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto" id="terminal-nodes-check-list">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Nodos Conectados ({computadorasFiltradas.length})</span>
                <button 
                  type="button"
                  disabled={enviandoActualizarTodas}
                  onClick={handleActualizarDatosTodas}
                  className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${enviandoActualizarTodas ? 'animate-spin' : ''}`} />
                  Forzar Lectura General
                </button>
              </div>

              {computadorasFiltradas.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center text-slate-400">
                  <Ban className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium mt-2">Ningún equipo coincide con los parámetros de búsqueda</p>
                </div>
              ) : (
                computadorasFiltradas.map(comp => {
                  const isChecked = selectedAgentIds.has(comp.uuid);
                  const ver = versionInstaladaTexto(comp);
                  const isOutdated = ver !== versionEtiqueta.replace('v', '');
                  
                  return (
                    <div 
                      key={comp.uuid}
                      onClick={() => handleToggleSelectAgent(comp.uuid)}
                      className={`p-3.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-indigo-50/40 border-indigo-200 shadow-3xs' 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Check icon */}
                        <div className="flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-350" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900 truncate">{comp.hostname}</span>
                            
                            <span className={`w-1.5 h-1.5 rounded-full ${comp.estado_conexion === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            
                            {isOutdated && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-black text-[8px] uppercase tracking-wide border border-amber-200">
                                Desactualizado
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>UUID: <code className="font-mono bg-slate-55 bg-indigo-50/50 p-0.5 px-1 rounded">{comp.uuid.substring(0, 18)}...</code></span>
                            <span>&bull;</span>
                            <span>S.O: <strong className="text-slate-600">{comp.sistema_operativo}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right individual actions */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        
                        <span className="text-[10px] font-extrabold text-slate-500 mr-2 bg-slate-50 p-1 px-1.5 rounded font-mono">
                          v{ver}
                        </span>

                        <button
                          type="button"
                          onClick={() => runIndividualCommand(comp, 'ACTUALIZAR_DATOS')}
                          className="px-2 py-1 text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-black"
                          title="Sincronizar telemetría de hardware inmediatamente"
                        >
                          Sync
                        </button>

                        <button
                          type="button"
                          onClick={() => runIndividualCommand(comp, 'ACTUALIZAR_AGENTE')}
                          className="px-2 py-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded text-[10px] font-black"
                          title={`Actualizar agente a ${versionEtiqueta}`}
                        >
                          Update
                        </button>

                        <button
                          type="button"
                          onClick={() => runIndividualCommand(comp, 'RESETEAR_ID')}
                          className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded"
                          title="Forzar borrado de ID local (Reset UUID)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH TERMINAL: Historial de Comandos de Firestore */}
      <div className="bg-white rounded-xl border border-slate-200 bg-slate-950 shadow-lg text-slate-200 overflow-hidden" id="card-event-logs">
        
        {/* Terminal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-900 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-950 text-indigo-400 rounded-lg">
              <Terminal className="w-4.5 h-4.5 text-emerald-400" />
            </span>
            <div>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">Historial de Comandos Telemétricos</h3>
              <p className="text-[10px] text-slate-400 font-medium">Eventos remotos reflejados en tiempo de consola</p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded font-mono border border-slate-800">
            Base de Logs: ServiceNow Agent Bridge
          </span>
        </div>

        {/* Console Filters */}
        <div className="p-5 bg-slate-950 border-b border-slate-900 border-dashed grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">UUID o Hostname</label>
            <input 
              type="search"
              placeholder="Buscar en historial..."
              value={busquedaHistorialLogs}
              onChange={(e) => setBusquedaHistorialLogs(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Versión Agente</label>
            <input 
              type="search"
              placeholder="Buscar versión..."
              value={filtroVersionHistorial}
              onChange={(e) => setFiltroVersionHistorial(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Rango Desde</label>
            <input 
              type="date"
              value={logFechaDesde}
              onChange={(e) => {
                setLogFechaDesde(e.target.value);
                setFeedbackBorrarLogs(null);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Rango Hasta</label>
            <input 
              type="date"
              value={logFechaHasta}
              onChange={(e) => {
                setLogFechaHasta(e.target.value);
                setFeedbackBorrarLogs(null);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Auxiliary Clear Actions & Log Stats view */}
        <div className="p-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-slate-400">
              Registros filtrados: <strong className="text-emerald-400">{logsFiltrados.length}</strong> de <strong>{logs.length}</strong>
            </p>

            {(logFechaDesde || logFechaHasta || busquedaHistorialLogs || filtroVersionHistorial) && (
              <button
                type="button"
                onClick={() => {
                  setLogFechaDesde('');
                  setLogFechaHasta('');
                  setBusquedaHistorialLogs('');
                  setFiltroVersionHistorial('');
                  setFeedbackBorrarLogs(null);
                }}
                className="text-[11.5px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={borrandoLogs || logs.length === 0}
              onClick={handleBorrarLogs}
              className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-900 rounded select-none flex items-center gap-1.5 cursor-pointer test-[11px]"
            >
              {borrandoLogs ? 'Purgando...' : 'Formatear Terminal (Borrar logs)'}
            </button>
          </div>
        </div>

        {/* Console view results */}
        <div className="p-0" id="terminal-event-log-response">
          {rangoFechasInvalido && (
            <div className="p-4 bg-rose-950/40 border-b border-rose-900 text-rose-300 text-xs font-mono">
              [SYSTEM ERROR] El rango temporal introducido es inválido: el parámetro &quot;Desde&quot; supera el parámetro &quot;Hasta&quot;.
            </div>
          )}

          {feedbackBorrarLogs && (
            <div className={`p-4 border-b text-xs font-mono ${feedbackBorrarLogs.ok ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900' : 'bg-rose-950/40 text-rose-300 border-rose-900'}`}>
              [MONITOR RESPONSE] {feedbackBorrarLogs.text}
            </div>
          )}

          {logsFiltrados.length === 0 ? (
            <div className="p-8 text-center italic text-slate-500 font-mono text-xs">
              No se han registrado comandos en este segmento/filtros del historial telemétrico.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[300px]">
              <table className="min-w-full text-slate-300 font-mono text-[11px]">
                <thead className="bg-slate-900 text-slate-400 text-left sticky top-0 uppercase tracking-wider text-[10px] border-b border-slate-805">
                  <tr>
                    <th className="py-2.5 px-4">Fecha Timestamp</th>
                    <th className="py-2.5 px-4 font-bold">Terminal Host</th>
                    <th className="py-2.5 px-4">Instrucción</th>
                    <th className="py-2.5 px-4">Detalle en Consola</th>
                    <th className="py-2.5 px-4">Comp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {logsFiltrados.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900 transition-colors">
                      <td className="py-2 px-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-slate-500" />
                          <span className="font-extrabold text-white">{log.hostname}</span>
                        </div>
                        {log.uuid !== 'SYSTEM' && (
                          <span className="text-[9px] text-slate-500 block truncate max-w-[120px]">{log.uuid}</span>
                        )}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-black border uppercase ${EVENTO_BADGE_HW[log.evento] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {log.evento}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-emerald-400 whitespace-normal leading-normal max-w-[320px]">{log.detalle}</td>
                      <td className="py-2 px-4 text-indigo-300 font-bold whitespace-nowrap">v{log.version_agente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
