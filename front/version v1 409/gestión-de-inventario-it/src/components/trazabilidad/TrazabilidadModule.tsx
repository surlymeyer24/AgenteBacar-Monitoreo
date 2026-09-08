import React, { useState, useEffect } from 'react';
import { 
  ComputadoraTrazable, 
  SugerenciaConciliacion, 
  PerifericoStockItem, 
  KpisTrazabilidad, 
  BaselineEsperado,
  DiscrepanciaResolucion,
  TipoEquipo,
  CondicionEquipo,
  CambioHardwareDetectado,
  TipoResolucionDiscrepancia
} from '../../types/trazabilidad';
import { 
  MOCK_COMPUTADORAS_TRAZABLES, 
  MOCK_SUGERENCIAS_CONCILIACION, 
  MOCK_PERIFERICOS_STOCK, 
  MOCK_KPIS_TRAZABILIDAD,
  MOCK_CAMBIOS_HARDWARE
} from '../../data/mockTrazabilidad';
import ConciliacionesBandeja from './ConciliacionesBandeja';
import ComputadoraTrazableDetail from './ComputadoraTrazableDetail';
import ComputadorasTrazabilidadList from './ComputadorasTrazabilidadList';
import PerifericosStockTrazabilidad from './PerifericosStockTrazabilidad';
import ArmarComputadoraModal from './ArmarComputadoraModal';
import VincularStockModal from './VincularStockModal';
import TrazabilidadHelpFlow from './TrazabilidadHelpFlow';
import TrazabilidadKpisMiniDashboard from './TrazabilidadKpisMiniDashboard';
import TrazabilidadHandoff from './TrazabilidadHandoff';
import { 
  Sparkles, 
  Layers, 
  Box, 
  BarChart3, 
  HelpCircle, 
  Code2, 
  Check, 
  X, 
  Radio, 
  Plus, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export type SubViewTrazabilidad = 
  | 'conciliaciones' 
  | 'computadoras' 
  | 'detalle_computadora' 
  | 'perifericos_stock' 
  | 'kpis' 
  | 'ayuda_flujo' 
  | 'handoff';

interface TrazabilidadModuleProps {
  initialSubView?: SubViewTrazabilidad;
  initialUuid?: string;
  onNavigateGlobal?: (view: string, id?: string) => void;
}

export default function TrazabilidadModule({
  initialSubView = 'conciliaciones',
  initialUuid,
  onNavigateGlobal
}: TrazabilidadModuleProps) {
  // Navigation State
  const [subView, setSubView] = useState<SubViewTrazabilidad>(initialSubView);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(initialUuid || null);

  // Core Datasets with local storage persistence for realism
  const [computadoras, setComputadoras] = useState<ComputadoraTrazable[]>(() => {
    const saved = localStorage.getItem('bacarsa_trazabilidad_computadoras');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_COMPUTADORAS_TRAZABLES;
  });

  const [sugerencias, setSugerencias] = useState<SugerenciaConciliacion[]>(() => {
    const saved = localStorage.getItem('bacarsa_trazabilidad_sugerencias');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_SUGERENCIAS_CONCILIACION;
  });

  const [perifericos, setPerifericos] = useState<PerifericoStockItem[]>(() => {
    const saved = localStorage.getItem('bacarsa_trazabilidad_perifericos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_PERIFERICOS_STOCK;
  });

  const [kpis, setKpis] = useState<KpisTrazabilidad>(() => {
    const saved = localStorage.getItem('bacarsa_trazabilidad_kpis');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOCK_KPIS_TRAZABILIDAD;
  });

  // Modal states
  const [showArmarModal, setShowArmarModal] = useState(false);
  const [armarTargetUuid, setArmarTargetUuid] = useState<string | undefined>(undefined);
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [vincularTargetComp, setVincularTargetComp] = useState<ComputadoraTrazable | null>(null);
  const [showAltaModal, setShowAltaModal] = useState(false);

  // New stock computer form states
  const [newHostname, setNewHostname] = useState('');
  const [newTipo, setNewTipo] = useState<TipoEquipo>('desktop');
  const [newCondicion, setNewCondicion] = useState<CondicionEquipo>('nueva');
  const [newUbicacion, setNewUbicacion] = useState('Depósito Central - Bahía 1');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bacarsa_trazabilidad_computadoras', JSON.stringify(computadoras));
  }, [computadoras]);

  useEffect(() => {
    localStorage.setItem('bacarsa_trazabilidad_sugerencias', JSON.stringify(sugerencias));
  }, [sugerencias]);

  useEffect(() => {
    localStorage.setItem('bacarsa_trazabilidad_perifericos', JSON.stringify(perifericos));
  }, [perifericos]);

  useEffect(() => {
    localStorage.setItem('bacarsa_trazabilidad_kpis', JSON.stringify(kpis));
  }, [kpis]);

  // Handle Match Confirm
  const handleConfirmarMatch = (sugId: string) => {
    const sug = sugerencias.find(s => s.id === sugId);
    if (!sug) return;

    // 1. Update Sugerencia
    setSugerencias(prev => prev.map(s => s.id === sugId ? { ...s, estado: 'CONFIRMADO' } : s));

    // 2. Update Computadora: mark as COINCIDE, integrate telemetry into hardware_real
    setComputadoras(prev => prev.map(c => {
      if (c.uuid === sug.lado_stock.uuid || c.hostname === sug.lado_stock.hostname) {
        return {
          ...c,
          estado_conciliacion: 'COINCIDE',
          hardware_real: {
            cpu: sug.lado_agente.cpu,
            ram_gb: sug.lado_agente.ram_gb,
            disco_resumen: sug.lado_agente.disco || 'SSD 512GB',
            monitores: sug.lado_agente.monitor ? [{
              nombre: sug.lado_agente.monitor,
              resolucion: '1920x1080',
              serial: sug.lado_agente.serial_monitor
            }] : [],
            anydesk_id: sug.lado_agente.anydesk_id,
            ip_publica: sug.lado_agente.ip,
            ultimo_reporte: new Date().toISOString()
          }
        };
      }
      return c;
    }));

    // 3. Update KPIs
    setKpis(prev => ({
      ...prev,
      sugerencias_pendientes: Math.max(0, prev.sugerencias_pendientes - 1),
      porcentaje_validadas: Math.min(100, Number((prev.porcentaje_validadas + 2.5).toFixed(1)))
    }));

    showToast(`Coincidencia confirmada: [${sug.lado_stock.hostname}] vinculada a [${sug.lado_agente.hostname}] (Estado: COINCIDE)`, 'success');
  };

  // Handle Match Reject
  const handleRechazarMatch = (sugId: string) => {
    const sug = sugerencias.find(s => s.id === sugId);
    setSugerencias(prev => prev.map(s => s.id === sugId ? { ...s, estado: 'RECHAZADO' } : s));
    setKpis(prev => ({
      ...prev,
      sugerencias_pendientes: Math.max(0, prev.sugerencias_pendientes - 1)
    }));
    showToast(`Coincidencia rechazada para ${sug?.lado_agente.hostname}. Pasa a detectada independiente.`, 'info');
  };

  // Handle Match Postpone
  const handlePostergarMatch = (sugId: string) => {
    showToast(`Sugerencia pospuesta para revisión posterior.`, 'info');
  };

  // Handle Armar Combo Confirm
  const handleConfirmarArmado = (data: {
    uuid: string;
    baseline: BaselineEsperado;
    comboResumen: string;
    perifericosIds: string[];
  }) => {
    // 1. Update Computadora
    setComputadoras(prev => prev.map(c => {
      if (c.uuid === data.uuid) {
        return {
          ...c,
          estado_conciliacion: 'BASELINE_LISTO',
          baseline_esperado: data.baseline,
          combo_resumen: data.comboResumen
        };
      }
      return c;
    }));

    // 2. Mark Peripherals as 'en_combo'
    setPerifericos(prev => prev.map(p => {
      if (data.perifericosIds.includes(p.id)) {
        return { ...p, estado: 'en_combo' };
      }
      return p;
    }));

    // 3. Update KPIs
    setKpis(prev => ({
      ...prev,
      stock_sin_agente: prev.stock_sin_agente + 1
    }));

    setShowArmarModal(false);
    showToast(`Combo armado exitosamente. Baseline fijado como inmutable.`, 'success');
  };

  // Handle Retroactive Link Confirm
  const handleConfirmarVinculacionRetro = (detectadaUuid: string, stockUuid: string) => {
    const stockComp = computadoras.find(c => c.uuid === stockUuid);
    const detectadaComp = computadoras.find(c => c.uuid === detectadaUuid);
    if (!stockComp || !detectadaComp) return;

    setComputadoras(prev => {
      // Remove the separate detected entry and merge into the stock entry
      const filteredList = prev.filter(c => c.uuid !== detectadaUuid);
      return filteredList.map(c => {
        if (c.uuid === stockUuid) {
          return {
            ...c,
            origen_alta: 'DETECTADA_VINCULADA_RETRO',
            estado_conciliacion: 'COINCIDE',
            hardware_real: detectadaComp.hardware_real,
            anydesk_id: detectadaComp.hardware_real?.anydesk_id
          };
        }
        return c;
      });
    });

    setShowVincularModal(false);
    showToast(`Vinculación retroactiva completada entre ${detectadaComp.hostname} y ${stockComp.hostname}.`, 'success');
  };

  // Handle Discrepancy Resolution
  const handleRegistrarResolucion = (uuid: string, resolucion: Omit<DiscrepanciaResolucion, 'id' | 'resuelto_at'>) => {
    const newRes: DiscrepanciaResolucion = {
      ...resolucion,
      id: `DISC-${Date.now().toString().slice(-4)}`,
      resuelto_at: new Date().toISOString()
    };

    setComputadoras(prev => prev.map(c => {
      if (c.uuid === uuid) {
        return {
          ...c,
          resoluciones_discrepancia: [newRes, ...(c.resoluciones_discrepancia || [])]
        };
      }
      return c;
    }));

    setKpis(prev => ({
      ...prev,
      discrepancias_abiertas: Math.max(0, prev.discrepancias_abiertas - 1)
    }));

    showToast(`Resolución técnica guardada: [${resolucion.tipo_resolucion.toUpperCase()}]`, 'success');
  };

  // Handle Alta Nueva PC en Stock
  const handleCrearNuevaPcStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

    const newPc: ComputadoraTrazable = {
      uuid: `bacar-pc-${Date.now().toString().slice(-4)}-uuid`,
      hostname: newHostname.toUpperCase().trim(),
      tipo_equipo: newTipo,
      condicion: newCondicion,
      origen_alta: 'STOCK',
      estado_conciliacion: 'SIN_BASELINE',
      fecha_alta_stock: new Date().toISOString(),
      ubicacion: newUbicacion,
      responsable: 'Stock Disponible'
    };

    setComputadoras(prev => [newPc, ...prev]);
    setNewHostname('');
    setShowAltaModal(false);
    showToast(`Nueva PC dada de alta en stock: [${newPc.hostname}] (Esperando armado de combo)`, 'success');
  };

  // Simulate new match suggestion
  const handleSimulateNewSuggestion = () => {
    const randomId = `SUG-${Math.floor(100 + Math.random() * 900)}`;
    const newSug: SugerenciaConciliacion = {
      id: randomId,
      score: 89,
      fecha_sugerencia: new Date().toISOString(),
      estado: 'PENDIENTE',
      nivel_confianza: 'alta',
      lado_agente: {
        hostname: `PC-CALLCENTER-${Math.floor(10 + Math.random() * 90)}`,
        cpu: 'Intel Core i5-12400 @ 2.50GHz',
        ram_gb: 15.8,
        disco: 'SSD NVMe 512GB Kingston',
        monitor: 'Dell U2419H',
        serial_monitor: 'GENERIC_PNP_MONITOR',
        anydesk_id: `${Math.floor(100000000 + Math.random() * 900000000)}`,
        ip: '190.210.65.45',
        version_agente: 'CyberWatch C# v2.4.1'
      },
      lado_stock: {
        id: `PC-STOCK-${Math.floor(100 + Math.random() * 900)}`,
        uuid: 'bacar-simulated-stock-uuid',
        hostname: `PC-STOCK-SIM-${Math.floor(10 + Math.random() * 90)}`,
        tipo: 'desktop',
        condicion: 'nueva',
        combo: 'Dell U2419H + Teclado USB Dell + Mouse Logitech',
        cpu_esperada: 'Intel Core i5-12400',
        ram_esperada_gb: 16,
        disco_esperado: 'SSD NVMe 512GB'
      },
      campos_coincidentes: [
        'CPU (Intel Core i5-12400)',
        'RAM (tolerancia OS: 15.8 GB vs 16 GB)',
        'Monitor por modelo (Dell U2419H)'
      ],
      campos_diferentes: [],
      nota_match: 'Match por marca/modelo (serial no disponible en agente)'
    };

    setSugerencias(prev => [newSug, ...prev]);
    setKpis(prev => ({
      ...prev,
      sugerencias_pendientes: prev.sugerencias_pendientes + 1
    }));

    showToast(`🔔 Nueva sugerencia de conciliación detectada: [${newSug.lado_agente.hostname}] (Score: 89%)`, 'info');
  };

  // Reset to default mock data if desired
  const handleResetData = () => {
    localStorage.removeItem('bacarsa_trazabilidad_computadoras');
    localStorage.removeItem('bacarsa_trazabilidad_sugerencias');
    localStorage.removeItem('bacarsa_trazabilidad_perifericos');
    localStorage.removeItem('bacarsa_trazabilidad_kpis');
    setComputadoras(MOCK_COMPUTADORAS_TRAZABLES);
    setSugerencias(MOCK_SUGERENCIAS_CONCILIACION);
    setPerifericos(MOCK_PERIFERICOS_STOCK);
    setKpis(MOCK_KPIS_TRAZABILIDAD);
    showToast('Datos de trazabilidad restablecidos al estado inicial.', 'info');
  };

  const selectedComputerObj = selectedUuid ? computadoras.find(c => c.uuid === selectedUuid) : null;
  const pendingSuggestionsCount = sugerencias.filter(s => s.estado === 'PENDIENTE').length;

  return (
    <div className="space-y-6">
      
      {/* Interactive Navigation Bar between the 7 Trazabilidad Screens */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* TAB 1: Conciliaciones (Fase 2 Priority) */}
          <button
            type="button"
            onClick={() => {
              setSubView('conciliaciones');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'conciliaciones'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conciliaciones</span>
            {pendingSuggestionsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                subView === 'conciliaciones' ? 'bg-white text-[#9c1313]' : 'bg-amber-100 text-amber-900'
              }`}>
                {pendingSuggestionsCount}
              </span>
            )}
          </button>

          {/* TAB 2: Computadoras (Fase 1a / 1b / 3) */}
          <button
            type="button"
            onClick={() => {
              setSubView('computadoras');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'computadoras'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Computadoras</span>
          </button>

          {/* TAB 3: Stock y Periféricos */}
          <button
            type="button"
            onClick={() => {
              setSubView('perifericos_stock');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'perifericos_stock'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Stock & Periféricos</span>
          </button>

          {/* TAB 4: KPIs Mini Dashboard (Fase 4) */}
          <button
            type="button"
            onClick={() => {
              setSubView('kpis');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'kpis'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>KPIs & Auditoría</span>
          </button>

          {/* TAB 5: Ayuda / Cómo Funciona Flow */}
          <button
            type="button"
            onClick={() => {
              setSubView('ayuda_flujo');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'ayuda_flujo'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ciclo de Vida (Ayuda)</span>
          </button>

          {/* TAB 6: Handoff para Desarrolladores */}
          <button
            type="button"
            onClick={() => {
              setSubView('handoff');
              setSelectedUuid(null);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'handoff'
                ? 'bg-[#9c1313] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Handoff Devs</span>
          </button>

        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            title="Restablecer datos demo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-xs max-w-md animate-in slide-in-from-bottom-5 ${
          toastMessage.type === 'success' 
            ? 'bg-slate-900 text-white border-emerald-500/50' 
            : 'bg-slate-900 text-white border-amber-500/50'
        }`}>
          <div className={`p-1 rounded-full ${
            toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN VIEW CONTENT SWITCHER */}
      
      {/* 1. Bandeja Conciliaciones (Fase 2) */}
      {subView === 'conciliaciones' && (
        <ConciliacionesBandeja
          sugerencias={sugerencias}
          computadoras={computadoras}
          onConfirmarMatch={handleConfirmarMatch}
          onRechazarMatch={handleRechazarMatch}
          onPostergarMatch={handlePostergarMatch}
          onSelectComputadora={(uuid) => {
            setSelectedUuid(uuid);
            setSubView('detalle_computadora');
          }}
          onOpenArmarModal={(uuid) => {
            setArmarTargetUuid(uuid);
            setShowArmarModal(true);
          }}
          onOpenVincularModal={(comp) => {
            setVincularTargetComp(comp);
            setShowVincularModal(true);
          }}
          onSimulateNewSuggestion={handleSimulateNewSuggestion}
        />
      )}

      {/* 2. Computadoras List (Fase 1a / 1b / 3) */}
      {subView === 'computadoras' && (
        <ComputadorasTrazabilidadList
          computadoras={computadoras}
          onSelectComputadora={(uuid) => {
            setSelectedUuid(uuid);
            setSubView('detalle_computadora');
          }}
          onOpenArmarModal={(uuid) => {
            setArmarTargetUuid(uuid);
            setShowArmarModal(true);
          }}
          onOpenVincularModal={(comp) => {
            setVincularTargetComp(comp);
            setShowVincularModal(true);
          }}
          onNuevaComputadoraStock={() => setShowAltaModal(true)}
        />
      )}

      {/* 3. Detalle Computadora (Screen 2) */}
      {subView === 'detalle_computadora' && selectedComputerObj && (
        <ComputadoraTrazableDetail
          computadora={selectedComputerObj}
          onBack={() => setSubView('computadoras')}
          onOpenArmarModal={(uuid) => {
            setArmarTargetUuid(uuid);
            setShowArmarModal(true);
          }}
          onOpenVincularModal={(comp) => {
            setVincularTargetComp(comp);
            setShowVincularModal(true);
          }}
          onRegistrarResolucion={handleRegistrarResolucion}
        />
      )}

      {/* 4. Stock y Periféricos (Screen 1) */}
      {subView === 'perifericos_stock' && (
        <PerifericosStockTrazabilidad
          perifericos={perifericos}
          computadoras={computadoras}
          onOpenArmarModal={(uuid) => {
            setArmarTargetUuid(uuid);
            setShowArmarModal(true);
          }}
          onSelectComputadora={(uuid) => {
            setSelectedUuid(uuid);
            setSubView('detalle_computadora');
          }}
        />
      )}

      {/* 5. KPIs & Auditoría (Fase 4) */}
      {subView === 'kpis' && (
        <TrazabilidadKpisMiniDashboard
          kpis={kpis}
          computadoras={computadoras}
        />
      )}

      {/* 6. Ayuda & Ciclo de Vida */}
      {subView === 'ayuda_flujo' && (
        <TrazabilidadHelpFlow />
      )}

      {/* 7. Handoff para Desarrolladores */}
      {subView === 'handoff' && (
        <TrazabilidadHandoff />
      )}

      {/* MODAL: Armar Computadora (Screen 3) */}
      {showArmarModal && (
        <ArmarComputadoraModal
          computadora={armarTargetUuid ? computadoras.find(c => c.uuid === armarTargetUuid) : undefined}
          computadorasDisponibles={computadoras.filter(c => c.origen_alta === 'STOCK' && c.estado_conciliacion === 'SIN_BASELINE')}
          perifericosStock={perifericos}
          onClose={() => {
            setShowArmarModal(false);
            setArmarTargetUuid(undefined);
          }}
          onConfirmarArmado={handleConfirmarArmado}
        />
      )}

      {/* MODAL: Vincular Máquina Detectada a Stock (Fase 3) */}
      {showVincularModal && vincularTargetComp && (
        <VincularStockModal
          computadoraDetectada={vincularTargetComp}
          computadorasStock={computadoras.filter(c => c.origen_alta === 'STOCK')}
          onClose={() => {
            setShowVincularModal(false);
            setVincularTargetComp(null);
          }}
          onConfirmarVinculacion={handleConfirmarVinculacionRetro}
        />
      )}

      {/* MODAL: Alta PC en Stock (Fase 1a) */}
      {showAltaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide">Alta de PC en Stock (Fase 1a)</h3>
              <button
                type="button"
                onClick={() => setShowAltaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevaPcStock} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hostname en Stock (ej: PC-STOCK-099)</label>
                <input
                  type="text"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  placeholder="PC-STOCK-..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tipo de Equipo</label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as TipoEquipo)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="notebook">Notebook</option>
                    <option value="mini_pc">Mini PC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Condición</label>
                  <select
                    value={newCondicion}
                    onChange={(e) => setNewCondicion(e.target.value as CondicionEquipo)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="nueva">Nueva</option>
                    <option value="usada">Usada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ubicación Inicial</label>
                <input
                  type="text"
                  value={newUbicacion}
                  onChange={(e) => setNewUbicacion(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAltaModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear en Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
