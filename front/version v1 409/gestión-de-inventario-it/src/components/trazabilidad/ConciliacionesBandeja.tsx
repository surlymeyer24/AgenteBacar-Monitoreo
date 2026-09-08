import React, { useState } from 'react';
import { 
  SugerenciaConciliacion, 
  ComputadoraTrazable,
  CambioHardwareDetectado,
  TipoResolucionDiscrepancia
} from '../../types/trazabilidad';
import { MOCK_CAMBIOS_HARDWARE } from '../../data/mockTrazabilidad';
import { 
  BadgeScore, 
  BadgeOrigen, 
  BadgeConciliacion, 
  BadgeTipoEquipo, 
  BadgeCondicion 
} from './TrazabilidadBadges';
import MatchConfirmacionModal from './MatchConfirmacionModal';
import DictaminarCambioModal from './DictaminarCambioModal';
import { 
  Check, 
  X, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  Radio, 
  Box, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Plus,
  Link2,
  Calendar,
  Layers,
  Cpu,
  Server,
  Monitor,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  SlidersHorizontal
} from 'lucide-react';

interface ConciliacionesBandejaProps {
  sugerencias: SugerenciaConciliacion[];
  computadoras: ComputadoraTrazable[];
  cambiosHardware?: CambioHardwareDetectado[];
  onResolverCambio?: (
    cambioId: string, 
    tipoResolucion: TipoResolucionDiscrepancia, 
    notaIt: string, 
    ticket?: string
  ) => void;
  onConfirmarMatch: (sugId: string) => void;
  onRechazarMatch: (sugId: string) => void;
  onPostergarMatch: (sugId: string) => void;
  onSelectComputadora: (uuid: string) => void;
  onOpenArmarModal?: (uuid?: string) => void;
  onOpenVincularModal?: (comp: ComputadoraTrazable) => void;
  onSimulateNewSuggestion?: () => void;
}

export default function ConciliacionesBandeja({
  sugerencias,
  computadoras,
  cambiosHardware = MOCK_CAMBIOS_HARDWARE,
  onResolverCambio,
  onConfirmarMatch,
  onRechazarMatch,
  onPostergarMatch,
  onSelectComputadora,
  onOpenArmarModal,
  onOpenVincularModal,
  onSimulateNewSuggestion
}: ConciliacionesBandejaProps) {
  // Navigation Tabs: Cambios de hardware primero para responder a la necesidad de máxima claridad
  const [activeTab, setActiveTab] = useState<'cambios_hardware' | 'sugerencias' | 'stock_sin_agente' | 'detectadas_sin_validar'>('cambios_hardware');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [cambioEstadoFilter, setCambioEstadoFilter] = useState<'todos' | 'pendiente' | 'autorizado' | 'no_autorizado'>('todos');
  const [cambioComponenteFilter, setCambioComponenteFilter] = useState<'todos' | 'ram' | 'monitor' | 'cpu' | 'disco'>('todos');
  const [confianzaFilter, setConfianzaFilter] = useState<'todos' | 'alta' | 'revision'>('todos');
  
  // Modals state
  const [selectedSugerencia, setSelectedSugerencia] = useState<SugerenciaConciliacion | null>(null);
  const [dictaminarTarget, setDictaminarTarget] = useState<{ cambio: CambioHardwareDetectado; tipo: TipoResolucionDiscrepancia } | null>(null);
  
  // Guide Banner state
  const [showGuide, setShowGuide] = useState(true);

  // Local fallback state if onResolverCambio not provided
  const [localCambios, setLocalCambios] = useState<CambioHardwareDetectado[]>(cambiosHardware);

  const handleResolverCambioInternal = (
    cambioId: string, 
    tipoResolucion: TipoResolucionDiscrepancia, 
    notaIt: string, 
    ticket?: string
  ) => {
    if (onResolverCambio) {
      onResolverCambio(cambioId, tipoResolucion, notaIt, ticket);
    }
    // Update local state too
    setLocalCambios(prev => prev.map(c => {
      if (c.id === cambioId) {
        return {
          ...c,
          estado_seguimiento: tipoResolucion,
          nota_it: ticket ? `[Ticket: ${ticket}] ${notaIt}` : notaIt,
          revisado_por: 'mfernandez@bacarsa.com.ar',
          revisado_en: new Date().toISOString()
        };
      }
      return c;
    }));
    setDictaminarTarget(null);
  };

  // Filter Cambios de Hardware
  const currentCambiosList = onResolverCambio ? cambiosHardware : localCambios;
  const cambiosPendientesCount = currentCambiosList.filter(c => c.estado_seguimiento === 'pendiente').length;

  const filteredCambios = currentCambiosList.filter(c => {
    const matchesSearch = 
      c.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.responsable && c.responsable.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.sector && c.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.explicacion_cambio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.valor_detectado.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (cambioEstadoFilter !== 'todos' && c.estado_seguimiento !== cambioEstadoFilter) {
      return false;
    }

    if (cambioComponenteFilter !== 'todos' && c.tipo_componente !== cambioComponenteFilter) {
      return false;
    }

    return true;
  });

  // Filter Sugerencias de Match
  const sugerenciasPendientes = sugerencias.filter(s => s.estado === 'PENDIENTE');
  const filteredSugerencias = sugerenciasPendientes.filter(sug => {
    const matchesSearch = 
      sug.lado_agente.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sug.lado_stock.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sug.lado_agente.cpu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sug.lado_stock.combo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (confianzaFilter === 'alta') return sug.score >= 70;
    if (confianzaFilter === 'revision') return sug.score < 70;
    return true;
  });

  // Equipos en Stock sin agente
  const stockSinAgente = computadoras.filter(c => 
    c.origen_alta === 'STOCK' && 
    (c.estado_conciliacion === 'BASELINE_LISTO' || c.estado_conciliacion === 'SIN_BASELINE')
  );

  // Equipos Detectados por Agente sin validar / sin stock asignado
  const detectadasSinValidar = computadoras.filter(c => 
    c.origen_alta === 'DETECTADA_POR_AGENTE' && 
    c.estado_conciliacion !== 'COINCIDE'
  );

  const getComponentIcon = (tipo: string) => {
    switch (tipo) {
      case 'ram': return <Server className="w-4 h-4 text-purple-600" />;
      case 'cpu': return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-amber-600" />;
      case 'disco': return <HardDrive className="w-4 h-4 text-emerald-600" />;
      default: return <Server className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#9c1313]"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#9c1313]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
                Bandeja de Conciliaciones & Auditoría de Hardware
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Detección de variaciones físicas y emparejamiento entre lo declarado en inventario y la telemetría en vivo del agente CyberWatch C#.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowGuide(prev => !prev)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{showGuide ? 'Ocultar guía' : '¿Cómo funciona?'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {onSimulateNewSuggestion && (
              <button
                type="button"
                onClick={onSimulateNewSuggestion}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#9c1313] border border-red-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Simula un nuevo reporte de hardware detectado por CyberWatch"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simular telemetría</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Pedagogical Banner: Explaining Reconciliations & Hardware Changes clearly */}
        {showGuide && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Guía Rápida para el Técnico de Soporte IT:
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Concept 1: Hardware Changes */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                    1. CAMBIOS DETECTADOS
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Modificaciones en PCs Activas
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Si a una máquina ya asignada le agregan memoria RAM, le desconectan un monitor o le cambian el disco, CyberWatch reporta una <strong>discrepancia</strong> para que decidas si fue un upgrade autorizado o un incidente.
                </p>
              </div>

              {/* Concept 2: Matches */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                    2. VINCULACIÓN (MATCH)
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Nuevas PCs Encendidas
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Cuando una PC nueva se enciende en una oficina, el sistema coteja sus componentes contra los combos armados en stock y te propone la vinculación automática con un % de certeza.
                </p>
              </div>

              {/* Concept 3: Tolerances */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                    3. TOLERANCIAS NORMALES
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">
                  ¿Por qué 15.8 GB no es un cambio?
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Windows y la placa de video integrada siempre reservan unos megabytes de RAM. El sistema lo reconoce como <strong>Coincidente</strong> automáticamente sin generar falsas alarmas.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Navigation Subtabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-b border-slate-200">
          
          {/* TAB 1: Cambios de Hardware Detectados (Principal foco) */}
          <button
            type="button"
            onClick={() => setActiveTab('cambios_hardware')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'cambios_hardware'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Cambios de Hardware Detectados</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              cambiosPendientesCount > 0 
                ? 'bg-rose-100 text-rose-800 font-mono' 
                : 'bg-slate-100 text-slate-600 font-mono'
            }`}>
              {cambiosPendientesCount} pendientes
            </span>
          </button>

          {/* TAB 2: Sugerencias de Match */}
          <button
            type="button"
            onClick={() => setActiveTab('sugerencias')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'sugerencias'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Sugerencias de Match (Nuevas PCs)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              sugerenciasPendientes.length > 0 
                ? 'bg-amber-100 text-amber-800 font-mono' 
                : 'bg-slate-100 text-slate-600 font-mono'
            }`}>
              {sugerenciasPendientes.length}
            </span>
          </button>

          {/* TAB 3: Stock sin agente */}
          <button
            type="button"
            onClick={() => setActiveTab('stock_sin_agente')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'stock_sin_agente'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="w-4 h-4 text-emerald-600" />
            <span>Stock a la espera de agente</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
              {stockSinAgente.length}
            </span>
          </button>

          {/* TAB 4: Detectadas sin validar */}
          <button
            type="button"
            onClick={() => setActiveTab('detectadas_sin_validar')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'detectadas_sin_validar'
                ? 'text-[#9c1313] border-b-2 border-[#9c1313]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-blue-500" />
            <span>Detectadas sin inventario</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
              {detectadasSinValidar.length}
            </span>
          </button>

        </div>
      </div>

      {/* VIEW 1: CAMBIOS DE HARDWARE DETECTADOS */}
      {activeTab === 'cambios_hardware' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search & Component/Status Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por hostname, responsable, sector o componente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c1313]/20 focus:border-[#9c1313]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Component Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-400 text-[11px] font-semibold">Componente:</span>
                <select
                  value={cambioComponenteFilter}
                  onChange={(e) => setCambioComponenteFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los componentes</option>
                  <option value="ram">Memoria RAM</option>
                  <option value="monitor">Monitores</option>
                  <option value="cpu">Procesador CPU</option>
                  <option value="disco">Discos / Almacenamiento</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-400 text-[11px] font-semibold">Dictamen:</span>
                <select
                  value={cambioEstadoFilter}
                  onChange={(e) => setCambioEstadoFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Solo Pendientes</option>
                  <option value="autorizado">Upgrades Autorizados</option>
                  <option value="no_autorizado">No Autorizados / Incidentes</option>
                </select>
              </div>

            </div>
          </div>

          {/* Cards List: Cambios de Hardware */}
          {filteredCambios.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  No hay cambios de hardware pendientes con este criterio
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todas las PCs activas reportan hardware idéntico al baseline declarado o las variaciones ya fueron autorizadas por IT.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCambios.map((cambio) => {
                const isPendiente = cambio.estado_seguimiento === 'pendiente';
                const isAutorizado = cambio.estado_seguimiento === 'autorizado';
                const isNoAutorizado = cambio.estado_seguimiento === 'no_autorizado';

                return (
                  <div
                    key={cambio.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-2xs space-y-4 ${
                      isPendiente 
                        ? 'border-amber-300 ring-1 ring-amber-200/50 hover:border-amber-400' 
                        : isAutorizado
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-rose-200 bg-rose-50/10'
                    }`}
                  >
                    {/* Top Row: Hostname, Sector, Badge & Timestamp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {cambio.hostname}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">REF: {cambio.id}</span>
                        </div>

                        {cambio.sector && (
                          <span className="text-xs text-slate-600 font-medium">
                            {cambio.sector} {cambio.responsable && `• ${cambio.responsable}`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPendiente && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[10.5px] font-black border border-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Requiere Dictamen IT
                          </span>
                        )}
                        {isAutorizado && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10.5px] font-black border border-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Upgrade Autorizado
                          </span>
                        )}
                        {isNoAutorizado && (
                          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-[10.5px] font-black border border-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            No Autorizado / Incidente
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cambio.timestamp).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* MAIN VISUAL DIFF: Declarado en Depósito vs Detectado en Vivo por CyberWatch */}
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            {getComponentIcon(cambio.tipo_componente)}
                          </div>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            {cambio.tipo_componente === 'ram' ? 'Memoria RAM del Sistema' :
                             cambio.tipo_componente === 'cpu' ? 'Microprocesador CPU' :
                             cambio.tipo_componente === 'monitor' ? 'Monitor de Video' : 'Disco / Almacenamiento'}
                          </span>
                        </div>

                        {/* Event type badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cambio.tipo_evento === 'agregado' 
                            ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                            : cambio.tipo_evento === 'removido'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {cambio.tipo_evento === 'agregado' ? '➕ Componente Agregado' :
                           cambio.tipo_evento === 'removido' ? '❌ Desconectado / Removido' : '⚠️ Componente Modificado'}
                        </span>
                      </div>

                      {/* Visual Side-by-Side Diff Box */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        
                        {/* LADO STOCK (Antes / Entregado) */}
                        <div className="md:col-span-5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Box className="w-3 h-3 text-slate-400" />
                              Declarado en Entrega (Stock Baseline)
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 font-mono">
                            {cambio.valor_esperado}
                          </p>
                        </div>

                        {/* Arrow separator with transition badge */}
                        <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                            <span className="hidden md:inline">Variación</span>
                            <ArrowRight className="w-4 h-4 text-[#9c1313]" />
                          </div>
                        </div>

                        {/* LADO AGENTE (Ahora / En vivo) */}
                        <div className="md:col-span-5 bg-white p-3.5 rounded-lg border border-blue-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                              <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                              Detectado Ahora por CyberWatch C#
                            </span>
                          </div>
                          <p className="text-xs font-bold text-blue-950 font-mono">
                            {cambio.valor_detectado}
                          </p>
                        </div>

                      </div>

                      {/* Plain-Spanish Explanation of the change */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">Diagnóstico de la variación:</span>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed">
                            {cambio.explicacion_cambio}
                          </p>
                        </div>
                      </div>

                      {/* If already resolved, show IT technician notes */}
                      {cambio.nota_it && (
                        <div className="bg-slate-100/80 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-bold text-slate-800 uppercase flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-500" />
                              Dictamen Registrado por {cambio.revisado_por || 'Soporte IT'}:
                            </span>
                            {cambio.revisado_en && (
                              <span className="text-slate-500 font-mono">
                                {new Date(cambio.revisado_en).toLocaleDateString('es-AR')}
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-slate-800 italic font-mono bg-white p-2 rounded border border-slate-200">
                            "{cambio.nota_it}"
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      
                      <button
                        type="button"
                        onClick={() => onSelectComputadora(cambio.uuid)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver ficha completa de la computadora</span>
                      </button>

                      {isPendiente ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDictaminarTarget({ cambio, tipo: 'falso_positivo' })}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Falso Positivo
                          </button>

                          <button
                            type="button"
                            onClick={() => setDictaminarTarget({ cambio, tipo: 'no_autorizado' })}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Reportar Incidente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDictaminarTarget({ cambio, tipo: 'autorizado' })}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar como Upgrade (Ticket IT)</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDictaminarTarget({ cambio, tipo: cambio.estado_seguimiento as TipoResolucionDiscrepancia })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Modificar Dictamen
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: SUGERENCIAS DE MATCH (VINCULACIÓN INICIAL) */}
      {activeTab === 'sugerencias' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por hostname, procesador CPU o combo declarado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c1313]/20 focus:border-[#9c1313]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Nivel de Confianza:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setConfianzaFilter('todos')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    confianzaFilter === 'todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({sugerenciasPendientes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConfianzaFilter('alta')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    confianzaFilter === 'alta' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Alta (Score ≥ 70)
                </button>
                <button
                  type="button"
                  onClick={() => setConfianzaFilter('revision')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    confianzaFilter === 'revision' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Revisión Manual (&lt; 70)
                </button>
              </div>
            </div>
          </div>

          {/* Cards List: Sugerencias de Match */}
          {filteredSugerencias.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  No hay sugerencias de match pendientes
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos los reportes entrantes del agente C# han sido procesados o vinculados con los activos de depósito.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSugerencias.map((sug) => {
                // Determine component comparisons for visual matrix
                const ramDiff = Math.abs(sug.lado_agente.ram_gb - (sug.lado_stock.ram_esperada_gb || 16));
                const isRamWithinOsTolerance = ramDiff <= 1.0;

                return (
                  <div
                    key={sug.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Card Header: Score, ID, Relative time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <BadgeScore score={sug.score} />
                        <span className="text-[11px] font-mono text-slate-400 font-bold">ID: {sug.id}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(sug.fecha_sugerencia).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          ¿Vincular máquina detectada con activo de stock?
                        </span>
                      </div>
                    </div>

                    {/* Visual Comparison Matrix (Semáforo de Componentes) */}
                    <div className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden text-xs">
                      
                      {/* Hostnames row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-3 bg-slate-100/80 border-b border-slate-200">
                        <div className="flex items-center justify-between pr-2">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                            <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                            Terminal en Red (CyberWatch C#)
                          </span>
                          <span className="font-mono font-black text-xs text-blue-950">
                            {sug.lado_agente.hostname}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pl-2 pt-2 md:pt-0">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                            <Box className="w-3 h-3 text-emerald-600" />
                            Activo Físico en Stock (Depósito)
                          </span>
                          <span className="font-mono font-black text-xs text-slate-900">
                            {sug.lado_stock.hostname}
                          </span>
                        </div>
                      </div>

                      {/* Component Rows */}
                      <div className="divide-y divide-slate-200/80 p-3 space-y-2.5">
                        
                        {/* 1. CPU */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11.5px] pt-1">
                          <div className="md:col-span-3 font-bold text-slate-700 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-blue-600" />
                            <span>Microprocesador CPU:</span>
                          </div>
                          <div className="md:col-span-4 font-mono text-slate-800">
                            {sug.lado_agente.cpu}
                          </div>
                          <div className="md:col-span-3 font-mono text-slate-600">
                            {sug.lado_stock.cpu_esperada || 'Intel Core i5-12400'}
                          </div>
                          <div className="md:col-span-2 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <Check className="w-3 h-3" /> Coincide
                            </span>
                          </div>
                        </div>

                        {/* 2. RAM */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11.5px] pt-2">
                          <div className="md:col-span-3 font-bold text-slate-700 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-purple-600" />
                            <span>Memoria RAM:</span>
                          </div>
                          <div className="md:col-span-4 font-mono text-slate-800">
                            {sug.lado_agente.ram_gb} GB útiles
                          </div>
                          <div className="md:col-span-3 font-mono text-slate-600">
                            {sug.lado_stock.ram_esperada_gb || 16} GB nominales
                          </div>
                          <div className="md:col-span-2 text-right">
                            {isRamWithinOsTolerance ? (
                              <span 
                                title="Tolerancia normal de 200-400MB por GPU integrada y reserva de Windows"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]"
                              >
                                <Check className="w-3 h-3" /> Tolerancia OS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> Difiere
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. Monitor */}
                        {sug.lado_agente.monitor && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11.5px] pt-2">
                            <div className="md:col-span-3 font-bold text-slate-700 flex items-center gap-1.5">
                              <Monitor className="w-3.5 h-3.5 text-amber-600" />
                              <span>Monitor Asignado:</span>
                            </div>
                            <div className="md:col-span-4 font-mono text-slate-800">
                              {sug.lado_agente.monitor}
                            </div>
                            <div className="md:col-span-3 font-mono text-slate-600">
                              {sug.lado_stock.combo.split(',')[0]}
                            </div>
                            <div className="md:col-span-2 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                                Match modelo
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. Disco */}
                        {sug.lado_agente.disco && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11.5px] pt-2">
                            <div className="md:col-span-3 font-bold text-slate-700 flex items-center gap-1.5">
                              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Almacenamiento:</span>
                            </div>
                            <div className="md:col-span-4 font-mono text-slate-800">
                              {sug.lado_agente.disco}
                            </div>
                            <div className="md:col-span-3 font-mono text-slate-600">
                              {sug.lado_stock.disco_esperado || 'SSD 512GB'}
                            </div>
                            <div className="md:col-span-2 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                <Check className="w-3 h-3" /> Coincide
                              </span>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* Explanatory note */}
                    {sug.nota_match && (
                      <div className="text-[11.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Criterio de sugerencia:</strong> {sug.nota_match}</span>
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSugerencia(sug)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cotejo ampliado y datos de red</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPostergarMatch(sug.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Postergar
                        </button>

                        <button
                          type="button"
                          onClick={() => onRechazarMatch(sug.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Rechazar
                        </button>

                        <button
                          type="button"
                          onClick={() => onConfirmarMatch(sug.id)}
                          className="px-4 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Match y Vincular</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* VIEW 3: STOCK SIN AGENTE */}
      {activeTab === 'stock_sin_agente' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                Equipos armados en depósito a la espera de primer reporte ({stockSinAgente.length})
              </span>
              <p className="text-[11.5px] leading-relaxed">
                Estas terminales tienen su combo preparado en depósito con número de serie y baseline declarado. Cuando el usuario las encienda y el agente CyberWatch transmita su primer heartbeat, aparecerán automáticamente en las sugerencias de match.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockSinAgente.map((comp) => (
              <div
                key={comp.uuid}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{comp.hostname}</span>
                    <BadgeTipoEquipo tipo={comp.tipo_equipo} />
                  </div>
                  <BadgeConciliacion estado={comp.estado_conciliacion} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong className="text-slate-900">Ubicación:</strong> {comp.ubicacion || 'Depósito Central'}</div>
                  <div><strong className="text-slate-900">Responsable / Sector:</strong> {comp.sector || comp.responsable || 'En preparación'}</div>
                  {comp.combo_resumen && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Combo armado:</span>
                      <span className="font-medium text-slate-800">{comp.combo_resumen}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectComputadora(comp.uuid)}
                    className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver ficha técnica</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {comp.estado_conciliacion === 'SIN_BASELINE' && onOpenArmarModal && (
                    <button
                      type="button"
                      onClick={() => onOpenArmarModal(comp.uuid)}
                      className="px-3 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Armar combo</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: DETECTADAS SIN VALIDAR */}
      {activeTab === 'detectadas_sin_validar' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Radio className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold block">
                Máquinas transmitiendo por agente sin activo en stock asignado ({detectadasSinValidar.length})
              </span>
              <p className="text-[11.5px] leading-relaxed">
                Terminales que tienen CyberWatch instalado y activo pero no corresponden a ningún combo registrado en el inventario. Podés vincularlas manualmente a un equipo existente o registrarlas como nuevo activo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectadasSinValidar.map((comp) => (
              <div
                key={comp.uuid}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-950">{comp.hostname}</span>
                    <BadgeOrigen origen={comp.origen_alta} />
                  </div>
                  <BadgeConciliacion estado={comp.estado_conciliacion} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong className="text-slate-900">Ubicación / Red:</strong> {comp.ubicacion || 'Sede Remota'}</div>
                  {comp.hardware_real && (
                    <div className="space-y-0.5 pt-1 text-[11.5px]">
                      <div><strong>CPU:</strong> {comp.hardware_real.cpu}</div>
                      <div><strong>RAM:</strong> {comp.hardware_real.ram_gb} GB</div>
                      <div><strong>Disco:</strong> {comp.hardware_real.disco_resumen}</div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectComputadora(comp.uuid)}
                    className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver ficha técnica</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {onOpenVincularModal && (
                    <button
                      type="button"
                      onClick={() => onOpenVincularModal(comp)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Vincular a stock</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail & Confirmation Modal for Selected Sugerencia */}
      {selectedSugerencia && (
        <MatchConfirmacionModal
          sugerencia={selectedSugerencia}
          onClose={() => setSelectedSugerencia(null)}
          onConfirmarMatch={(id) => {
            onConfirmarMatch(id);
            setSelectedSugerencia(null);
          }}
          onRechazarMatch={(id) => {
            onRechazarMatch(id);
            setSelectedSugerencia(null);
          }}
          onPostergarMatch={(id) => {
            onPostergarMatch(id);
            setSelectedSugerencia(null);
          }}
        />
      )}

      {/* Modal for Hardware Change Resolution */}
      {dictaminarTarget && (
        <DictaminarCambioModal
          cambio={dictaminarTarget.cambio}
          tipoInicial={dictaminarTarget.tipo}
          onClose={() => setDictaminarTarget(null)}
          onConfirmar={handleResolverCambioInternal}
        />
      )}

    </div>
  );
}
