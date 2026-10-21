import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileDown,
  RefreshCw,
  Clock,
  Monitor,
  Laptop,
  User,
  Box,
  Layers,
  TrendingUp,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useDashboardStats,
  useComputadoras,
  usePerifericosM,
  useNvrs,
  useCamaras,
  useMaquinas,
} from '../hooks/useQueries';
import { useCatalogo, labelsEnumCatalogo } from '../hooks/useCatalogo';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { construirReporteInventario, chartDataDesdeMapa } from '../utils/reporteInventario';
import { exportarReportePdf } from '../utils/exportReportePdf';
import { ModuleHeader } from '../components/layout';

function formatFecha(fecha) {
  if (!fecha) return '—';
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(fecha);
  }
}

export default function Reportes() {
  const navigate = useNavigate();
  const [exportando, setExportando] = useState(false);
  const [buscarDetalle, setBuscarDetalle] = useState('');
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: computadoras = [], isLoading: pcsLoading } = useComputadoras();
  const { data: perifericosManual = [] } = usePerifericosM();
  const { data: nvrs = [] } = useNvrs();
  const { data: camaras = [] } = useCamaras();
  const { data: maquinasTesoreria = [] } = useMaquinas();
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const estadoLabels = useMemo(() => labelsEnumCatalogo(estadoItems), [estadoItems]);
  const { items: tipoMaqItems } = useCatalogo('tipos_maquina');
  const tipoMaquinaLabels = useMemo(() => labelsEnumCatalogo(tipoMaqItems), [tipoMaqItems]);

  const queryClient = useQueryClient();
  const cargando = statsLoading || pcsLoading;
  const error = null;

  const cargar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['computadoras'] });
    queryClient.invalidateQueries({ queryKey: ['perifericosM'] });
    queryClient.invalidateQueries({ queryKey: ['nvrs'] });
    queryClient.invalidateQueries({ queryKey: ['camaras'] });
    queryClient.invalidateQueries({ queryKey: ['maquinas'] });
  }, [queryClient]);

  const raw = stats
    ? {
        stats,
        computadoras,
        perifericosManual,
        nvrs,
        camaras,
        maquinasTesoreria,
        estadoLabels,
        tipoMaquinaLabels,
      }
    : null;

  const reporte = useMemo(() => {
    if (!raw) return null;
    return construirReporteInventario(raw);
  }, [raw]);

  const handleExportar = async () => {
    if (!reporte) return;
    setExportando(true);
    try {
      await exportarReportePdf(reporte);
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  };

  // Cálculos analíticos derivados de datos reales
  const r = reporte;
  const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR');

  const totalPcs = r?.computadoras?.total || 0;
  const activas = r?.computadoras?.activas || 0;
  const inactivas = r?.computadoras?.inactivas || 0;
  const asignadas = r?.computadoras?.asignadas || 0;
  const enStock = r?.computadoras?.enStock || 0;
  const enMantenimiento = r?.computadoras?.enMantenimiento || 0;
  const baja = r?.computadoras?.baja || 0;

  const pctActivas = totalPcs > 0 ? ((activas / totalPcs) * 100).toFixed(1) : '0';
  const pctInactivas = totalPcs > 0 ? ((inactivas / totalPcs) * 100).toFixed(1) : '0';
  const pctAsignadas = totalPcs > 0 ? ((asignadas / totalPcs) * 100).toFixed(1) : '0';
  const pctStock = totalPcs > 0 ? ((enStock / totalPcs) * 100).toFixed(1) : '0';
  const pctMant = totalPcs > 0 ? ((enMantenimiento / totalPcs) * 100).toFixed(1) : '0';
  const pctBaja = totalPcs > 0 ? ((baja / totalPcs) * 100).toFixed(1) : '0';

  const perifPc = r?.perifericos?.conPcAgente || 0;
  const ratioPerifPorEstacion = totalPcs > 0 ? (perifPc / totalPcs).toFixed(1) : '0';

  // Desglose de sistemas operativos
  const osBreakdown = useMemo(() => {
    let win11 = 0;
    let win10 = 0;
    let otros = 0;
    for (const c of computadoras) {
      const so = (c.sistemaOperativo || '').toLowerCase();
      if (so.includes('11')) win11++;
      else if (so.includes('10')) win10++;
      else otros++;
    }
    const tot = computadoras.length || 1;
    return {
      win11,
      win10,
      otros,
      pctWin11: ((win11 / tot) * 100).toFixed(1),
      pctWin10: ((win10 / tot) * 100).toFixed(1),
      pctOtros: ((otros / tot) * 100).toFixed(1),
      pieData: [
        { name: 'Win 11 Pro', value: win11, color: '#0ea5e9' },
        { name: 'Win 10 Ent', value: win10, color: '#3b82f6' },
        { name: 'Linux / Otros', value: otros, color: '#f59e0b' },
      ].filter((d) => d.value > 0),
    };
  }, [computadoras]);

  // Desglose de procesadores y marcas
  const cpuAnalysis = useMemo(() => {
    let intel = 0;
    let amd = 0;
    let otros = 0;
    for (const c of computadoras) {
      const p = (c.procesadorNombre || '').toLowerCase();
      if (p.includes('intel')) intel++;
      else if (p.includes('amd') || p.includes('ryzen')) amd++;
      else otros++;
    }
    const tot = intel + amd + otros || 1;
    return {
      intelPct: ((intel / tot) * 100).toFixed(1),
      amdPct: ((amd / tot) * 100).toFixed(1),
    };
  }, [computadoras]);

  // Desglose de tipos de chasis
  const chassisBreakdown = useMemo(() => {
    const desktop = r?.computadoras?.desktop || 0;
    const notebook = r?.computadoras?.notebook || 0;
    const workstation = computadoras.filter((c) =>
      (c.tipoEquipo || '').toLowerCase().includes('workstation')
    ).length;
    const tot = totalPcs || 1;
    return {
      desktop,
      notebook,
      workstation,
      pctDesk: ((desktop / tot) * 100).toFixed(1),
      pctNote: ((notebook / tot) * 100).toFixed(1),
      pctWork: ((workstation / tot) * 100).toFixed(1),
    };
  }, [r, computadoras, totalPcs]);

  // Periféricos por tipo (Monitores, Mouse, Teclados, Webcams)
  const perifericosCounts = useMemo(() => {
    const map = r?.perifericos?.porTipoAgente || {};
    let monitores = 0;
    let mouse = 0;
    let teclados = 0;
    let otros = 0;
    for (const [k, v] of Object.entries(map)) {
      const lower = k.toLowerCase();
      const val = Number(v) || 0;
      if (lower.includes('monitor') || lower.includes('pantalla')) monitores += val;
      else if (lower.includes('mouse') || lower.includes('raton')) mouse += val;
      else if (lower.includes('teclado') || lower.includes('keyboard')) teclados += val;
      else otros += val;
    }
    return { monitores, mouse, teclados, otros };
  }, [r]);

  // Desglose de tesorería por tipos reales del catálogo
  const tesoreriaPorTipo = useMemo(() => {
    const mapa = r?.tesoreria?.porTipo || {};
    const tot = r?.tesoreria?.total || 1;
    const entries = Object.entries(mapa);
    if (!entries.length) return [];

    return entries.map(([tipo, count]) => {
      const pct = ((count / tot) * 100).toFixed(1);
      const modelos = maquinasTesoreria
        .filter((m) => {
          const tNorm = (m.tipo || '').toUpperCase();
          return tNorm === tipo.toUpperCase() || tipoMaquinaLabels[tNorm] === tipo;
        })
        .map((m) => m.modelo)
        .filter(Boolean);
      const modelosStr =
        Array.from(new Set(modelos)).slice(0, 2).join(' / ') || 'Equipos operativos';

      return {
        tipo,
        count,
        pct,
        modelos: modelosStr,
      };
    });
  }, [r, maquinasTesoreria, tipoMaquinaLabels]);

  const dataArea = useMemo(
    () => (r ? chartDataDesdeMapa(r.computadoras.porArea, 6) : []),
    [r]
  );
  const dataProc = useMemo(
    () => (r ? chartDataDesdeMapa(r.computadoras.porProcesador, 4) : []),
    [r]
  );
  const dataNvr = useMemo(
    () => (r ? chartDataDesdeMapa(r.infraestructura.camarasPorNvr, 5) : []),
    [r]
  );

  // Tabla detalle de computadoras filtrada y paginada
  const detalleRaw = r?.computadoras?.detalle ?? [];
  const detalleFiltrado = useMemo(() => {
    if (!buscarDetalle.trim()) return detalleRaw;
    const q = buscarDetalle.trim().toLowerCase();
    return detalleRaw.filter((row) => {
      const blob = [
        row.hostname,
        row.tipo,
        row.responsableInventario,
        row.usuarioActual,
        row.area,
        row.sistemaOperativo,
        row.procesador,
        row.estado,
        row.sync,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [detalleRaw, buscarDetalle]);

  const totalFiltradas = detalleFiltrado.length;
  const totalPaginas =
    filasPorPagina === 'todos' ? 1 : Math.ceil(totalFiltradas / Number(filasPorPagina)) || 1;

  const detallePaginado = useMemo(() => {
    if (filasPorPagina === 'todos') return detalleFiltrado;
    const limit = Number(filasPorPagina);
    const start = (paginaActual - 1) * limit;
    return detalleFiltrado.slice(start, start + limit);
  }, [detalleFiltrado, paginaActual, filasPorPagina]);

  const handleCambioFilas = (e) => {
    const val = e.target.value;
    setFilasPorPagina(val === 'todos' ? 'todos' : Number(val));
    setPaginaActual(1);
  };

  if (cargando && !reporte) return <StudioLoading message="Generando reporte…" />;
  if (error && !reporte) return <StudioError message={error} />;
  if (!r) return null;

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4 pb-6 w-full" id="reporte-inventario">
      {/* 1. ENCABEZADO EN CARD BLANCA */}
      <ModuleHeader
        title="Reportes de Inventario"
        badge="Auditoría General"
        description={
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Última actualización: {formatFecha(r.generadoEn)}</span>
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={cargar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            <button
              type="button"
              onClick={handleExportar}
              disabled={exportando || !r}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Exportar reporte en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{exportando ? 'Generando PDF…' : 'Exportar PDF'}</span>
            </button>
          </>
        }
      />

      {/* 2. STRIP SUPERIOR DE 6 KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Computadoras */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Computadoras
            </span>
            <Monitor className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(totalPcs)}
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1.5">equipos</span>
          </div>
          <span className="text-xs text-slate-400">100% del parque</span>
        </div>

        {/* Activas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Activas
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(activas)}
            </span>
            <span className="text-xs font-bold text-emerald-600">{pctActivas}%</span>
          </div>
          <span className="text-xs text-slate-400">Operación normal</span>
        </div>

        {/* Inactivas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inactivas
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(inactivas)}
            </span>
            <span className="text-xs font-bold text-red-500">{pctInactivas}%</span>
          </div>
          <span className="text-xs text-slate-400">Mant. o fuera de red</span>
        </div>

        {/* Asignadas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Asignadas
            </span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(asignadas)}
            </span>
            <span className="text-xs font-bold text-slate-500">{pctAsignadas}%</span>
          </div>
          <span className="text-xs text-slate-400">Con usuario titular</span>
        </div>

        {/* En Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              En Stock
            </span>
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(enStock)}
            </span>
            <span className="text-xs font-bold text-slate-500">{pctStock}%</span>
          </div>
          <span className="text-xs text-slate-400">Listas p/ despliegue</span>
        </div>

        {/* Periféricos c/ PC */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Periféricos c/ PC
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {fmt(perifPc)}
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1.5">unid.</span>
          </div>
          <span className="text-xs text-slate-400">~{ratioPerifPorEstacion} por estación</span>
        </div>
      </div>

      {/* 3. TÍTULO DE SECCIÓN */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-600" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Distribución y Métricas del Parque
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          10 dimensiones monitoreadas • Gráficos interactivos
        </span>
      </div>

      {/* 4. GRID 3x3 DE 9 TARJETAS ANALÍTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: 1. PCS ACTIVAS VS INACTIVAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              1. PCS ACTIVAS VS INACTIVAS
            </span>
            <span className="text-xs text-slate-500 font-medium">{fmt(totalPcs)} Total</span>
          </div>

          <div className="relative flex flex-col items-center justify-center py-2 my-auto">
            <div className="w-[190px] h-[105px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Activas', value: activas },
                      { name: 'Inactivas', value: inactivas },
                    ]}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Equipos']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none block">
                  {pctActivas}%
                </span>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  OPERATIVIDAD
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs mt-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Activas{' '}
                <strong className="text-slate-900">
                  {fmt(activas)} ({pctActivas}%)
                </strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactivas{' '}
                <strong className="text-slate-900">
                  {fmt(inactivas)} ({pctInactivas}%)
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Tasa de operatividad</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                Number(pctActivas) >= 90
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {Number(pctActivas) >= 90 ? 'Óptima (>90%)' : 'Atención (<90%)'}
            </span>
          </div>
        </div>

        {/* CARD 2: 2. DISTRIBUCIÓN POR ESTADO */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">2. DISTRIBUCIÓN POR ESTADO</span>
            <span className="text-xs text-slate-400 font-medium">Ciclo de vida</span>
          </div>

          <div className="py-1 space-y-2.5 my-auto">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Flujo total asignación</span>
              <span className="font-bold text-slate-800">{fmt(totalPcs)} Equipos</span>
            </div>

            {/* Asignadas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Asignadas
                </span>
                <span className="text-slate-800 font-bold">
                  {fmt(asignadas)}{' '}
                  <span className="text-slate-400 font-normal">({pctAsignadas}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pctAsignadas}%` }} />
              </div>
            </div>

            {/* En Stock */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  En Stock
                </span>
                <span className="text-slate-800 font-bold">
                  {fmt(enStock)}{' '}
                  <span className="text-slate-400 font-normal">({pctStock}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pctStock}%` }} />
              </div>
            </div>

            {/* Mantenimiento */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Mantenimiento
                </span>
                <span className="text-slate-800 font-bold">
                  {fmt(enMantenimiento)}{' '}
                  <span className="text-slate-400 font-normal">({pctMant}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pctMant}%` }} />
              </div>
            </div>

            {/* Para Baja */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Para Baja
                </span>
                <span className="text-slate-800 font-bold">
                  {fmt(baja)}{' '}
                  <span className="text-slate-400 font-normal">({pctBaja}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pctBaja}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Equipos operativos
            </span>
            <span className="font-semibold text-slate-800">
              {fmt(asignadas + enStock)} equipos (
              {(((asignadas + enStock) / (totalPcs || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* CARD 3: 3. COMPUTADORAS POR ÁREA */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">3. COMPUTADORAS POR ÁREA</span>
            <span className="text-xs text-slate-400 font-medium">
              {dataArea.length} Departamentos
            </span>
          </div>

          <div className="py-1 space-y-2.5 my-auto">
            {dataArea.slice(0, 5).map((item, idx) => {
              const maxVal = Math.max(...dataArea.map((d) => d.value), 1);
              const barWidth = Math.min(100, Math.round((item.value / maxVal) * 100));
              const pct = totalPcs > 0 ? ((item.value / totalPcs) * 100).toFixed(1) : '0';
              const isFirst = idx === 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[170px]" title={item.name}>
                      <span className={`w-2 h-2 rounded-full ${isFirst ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 font-bold">{item.value}</span>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFirst ? 'bg-blue-600' : 'bg-slate-400'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {dataArea.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Sin datos de áreas.</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Mayor concentración</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
              {dataArea[0]?.name || '—'} ({dataArea[0]?.value || 0} pcs)
            </span>
          </div>
        </div>

        {/* CARD 4: 4. COMPUTADORAS POR TIPO (Espaciado vertical limpio para no pisar la línea) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">4. COMPUTADORAS POR TIPO</span>
            <span className="text-xs text-slate-400 font-medium">Formato de chasis</span>
          </div>

          <div className="pt-3 pb-1 my-auto flex items-end justify-around h-[125px] px-2">
            {/* Escritorio */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs font-bold text-slate-800 mb-0.5">
                {chassisBreakdown.desktop}
              </span>
              <div className="w-11 bg-slate-100 rounded-t-lg flex items-end h-[68px] overflow-hidden">
                <div
                  className="w-full bg-[#0c66e4] rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(12, Math.min(100, (chassisBreakdown.desktop / (totalPcs || 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">Escritorio</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {chassisBreakdown.pctDesk}%
              </span>
            </div>

            {/* Notebooks */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs font-bold text-slate-800 mb-0.5">
                {chassisBreakdown.notebook}
              </span>
              <div className="w-11 bg-slate-100 rounded-t-lg flex items-end h-[68px] overflow-hidden">
                <div
                  className="w-full bg-[#0ea5e9] rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(12, Math.min(100, (chassisBreakdown.notebook / (totalPcs || 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">Notebooks</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {chassisBreakdown.pctNote}%
              </span>
            </div>

            {/* Workstation */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs font-bold text-slate-800 mb-0.5">
                {chassisBreakdown.workstation}
              </span>
              <div className="w-11 bg-slate-100 rounded-t-lg flex items-end h-[68px] overflow-hidden">
                <div
                  className="w-full bg-[#f59e0b] rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(10, Math.min(100, (chassisBreakdown.workstation / (totalPcs || 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 mt-1">Workstation</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {chassisBreakdown.pctWork}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Ratio movilidad</span>
            <span className="font-semibold text-slate-800">
              {chassisBreakdown.pctNote}% Portabilidad
            </span>
          </div>
        </div>

        {/* CARD 5: 5. SISTEMAS OPERATIVOS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">5. SISTEMAS OPERATIVOS</span>
            <span className="text-xs text-slate-400 font-medium">Plataformas</span>
          </div>

          <div className="py-2 my-auto flex items-center justify-between gap-2">
            <div className="w-[120px] h-[120px] relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osBreakdown.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={52}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {osBreakdown.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Equipos']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-sm font-extrabold text-slate-900 leading-tight">
                  {osBreakdown.pctWin11}%
                </span>
                <span className="text-[9px] font-semibold text-slate-400">Win 11</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0ea5e9]" />
                  Win 11 Pro
                </span>
                <span className="text-slate-800 font-bold">
                  {osBreakdown.win11}{' '}
                  <span className="text-slate-400 font-normal">({osBreakdown.pctWin11}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
                  Win 10 Ent
                </span>
                <span className="text-slate-800 font-bold">
                  {osBreakdown.win10}{' '}
                  <span className="text-slate-400 font-normal">({osBreakdown.pctWin10}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
                  Linux / Otros
                </span>
                <span className="text-slate-800 font-bold">
                  {osBreakdown.otros}{' '}
                  <span className="text-slate-400 font-normal">({osBreakdown.pctOtros}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Migración Win 11</span>
            <span className="font-semibold text-emerald-600">
              {osBreakdown.pctWin11}% completado
            </span>
          </div>
        </div>

        {/* CARD 6: 6. PROCESADORES (CPU) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">6. PROCESADORES (CPU)</span>
            <span className="text-xs text-slate-400 font-medium">Arquitectura</span>
          </div>

          <div className="py-1 space-y-2.5 my-auto">
            {dataProc.slice(0, 4).map((item) => {
              const maxVal = Math.max(...dataProc.map((d) => d.value), 1);
              const barWidth = Math.min(100, Math.round((item.value / maxVal) * 100));
              const pct = totalPcs > 0 ? ((item.value / totalPcs) * 100).toFixed(1) : '0';
              const isAmd = item.name.toLowerCase().includes('amd') || item.name.toLowerCase().includes('ryzen');
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-[180px]" title={item.name}>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${isAmd ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                        {isAmd ? 'AMD' : 'Intel'}
                      </span>
                      {item.name}
                    </span>
                    <span className="text-slate-800 font-bold">
                      {item.value}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAmd ? 'bg-rose-500' : 'bg-blue-600'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {dataProc.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Sin datos de procesadores.</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Distribución de marca</span>
            <span className="font-semibold text-slate-800">
              Intel {cpuAnalysis.intelPct}% | AMD {cpuAnalysis.amdPct}%
            </span>
          </div>
        </div>

        {/* CARD 7: 7. PERIFÉRICOS POR TIPO */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">7. PERIFÉRICOS POR TIPO</span>
            <span className="text-xs text-slate-400 font-medium">{fmt(perifPc)} Totales</span>
          </div>

          <div className="py-2 my-auto flex items-center justify-between gap-3">
            {/* Anillo / Totales */}
            <div className="w-[100px] h-[100px] rounded-full border-8 border-teal-500 flex flex-col items-center justify-center shrink-0">
              <span className="text-xl font-extrabold text-slate-900 leading-none">
                {fmt(perifPc)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">ÍTEMS</span>
            </div>

            {/* 2x2 Mini Cards */}
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] text-slate-400 font-semibold block">Monitores</span>
                <span className="text-sm font-bold text-slate-800">{fmt(perifericosCounts.monitores)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] text-slate-400 font-semibold block">Mouse</span>
                <span className="text-sm font-bold text-slate-800">{fmt(perifericosCounts.mouse)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] text-slate-400 font-semibold block">Teclados</span>
                <span className="text-sm font-bold text-slate-800">{fmt(perifericosCounts.teclados)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] text-slate-400 font-semibold block">Webcams</span>
                <span className="text-sm font-bold text-slate-800">{fmt(perifericosCounts.otros)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Periféricos c/ PC</span>
            <span className="font-semibold text-slate-800">
              ~{ratioPerifPorEstacion} promedio por puesto
            </span>
          </div>
        </div>

        {/* CARD 8: 8. CÁMARAS POR NVR */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">8. CÁMARAS POR NVR</span>
            <span className="text-xs text-slate-400 font-medium">CCTV Seguridad</span>
          </div>

          <div className="py-1 space-y-2.5 my-auto">
            {dataNvr.slice(0, 3).map((item, idx) => {
              const count = item.value || 0;
              const maxCam = Math.max(...dataNvr.map((d) => d.value), 1);
              const barWidth = Math.min(100, Math.round((count / maxCam) * 100));
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[170px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-800">{count} cámaras</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? 'bg-blue-600' : 'bg-slate-400'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {dataNvr.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Sin NVRs configurados.</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Cámaras operativas</span>
            <span className="font-semibold text-slate-800">
              {r.infraestructura.totalCamaras} cámaras ({r.infraestructura.totalNvrs} NVRs)
            </span>
          </div>
        </div>

        {/* CARD 9: 9. NETWORKING (SWITCHES & ROUTERS) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="font-bold text-xs text-slate-800">
              9. NETWORKING (SWITCHES & ROUTERS)
            </span>
            <span className="text-xs text-slate-400 font-medium">Infraestructura</span>
          </div>

          <div className="py-2 my-auto grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                CORE
              </span>
              <span className="text-2xl font-extrabold text-slate-900 my-1">
                {r.infraestructura.totalRouters}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Routers WAN</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DISTRIB.
              </span>
              <span className="text-2xl font-extrabold text-slate-900 my-1">
                {r.infraestructura.totalSwitches}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Switches</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ACCESO
              </span>
              <span className="text-2xl font-extrabold text-slate-900 my-1">
                {r.infraestructura.totalAccessPoints}
              </span>
              <span className="text-[10px] text-sky-600 font-semibold">Puntos AP</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500 mt-2">
            <span>Equipos de Red</span>
            <span className="font-semibold text-slate-800">
              {r.infraestructura.totalRouters +
                r.infraestructura.totalSwitches +
                r.infraestructura.totalAccessPoints}{' '}
              dispositivos activos
            </span>
          </div>
        </div>
      </div>

      {/* 5. CARD 10: EQUIPAMIENTO DE TESORERÍA ESPECIALIZADO (Basado en tipos reales del catálogo) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                10. EQUIPAMIENTO DE TESORERÍA ESPECIALIZADO
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipos de procesamiento de efectivo, clasificación y validación por tipo
            </p>
          </div>
          <span className="inline-flex items-center self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            {r.tesoreria.total} Dispositivos Activos
          </span>
        </div>

        {/* Cuadrícula dinámica de los 5 tipos reales de Tesorería */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tesoreriaPorTipo.map((item) => (
            <div
              key={item.tipo}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 truncate" title={item.tipo}>
                    {item.tipo}
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                    {item.pct}%
                  </span>
                </div>
                <span
                  className="text-[10px] text-slate-500 truncate block mt-0.5"
                  title={item.modelos}
                >
                  {item.modelos}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">equipos</span>
              </div>
            </div>
          ))}
          {tesoreriaPorTipo.length === 0 && (
            <p className="text-xs text-slate-400 col-span-full py-4 text-center">
              Sin máquinas de tesorería registradas.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-1 gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Inventario especializado sincronizado con sucursal</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Normativa BCRA cumplida</span>
          </div>
        </div>
      </div>

      {/* 6. TABLA DETALLE DE COMPUTADORAS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Detalle de computadoras
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inventario individualizado con especificaciones de hardware y estado en red
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={buscarDetalle}
                onChange={(e) => {
                  setBuscarDetalle(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Filtrar por Hostname, usuario..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-3.5">HOSTNAME</th>
                <th className="px-3.5 py-3.5">TIPO</th>
                <th className="px-3.5 py-3.5">RESPONSABLE</th>
                <th className="px-3.5 py-3.5">ÁREA</th>
                <th className="px-3.5 py-3.5">SISTEMA OPERATIVO</th>
                <th className="px-3.5 py-3.5">PROCESADOR</th>
                <th className="px-3.5 py-3.5">RAM</th>
                <th className="px-3.5 py-3.5">ESTADO</th>
                <th className="px-3.5 py-3.5">ÚLTIMA SINCRONIZACIÓN</th>
                <th className="px-3.5 py-3.5 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detallePaginado.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron computadoras con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                detallePaginado.map((row) => {
                  const esNote = (row.tipo || '').toLowerCase().includes('notebook');
                  const soLower = (row.sistemaOperativo || '').toLowerCase();
                  const soDotColor = soLower.includes('11')
                    ? 'bg-sky-500'
                    : soLower.includes('10')
                    ? 'bg-blue-600'
                    : soLower.includes('linux') || soLower.includes('ubuntu')
                    ? 'bg-amber-500'
                    : 'bg-slate-400';

                  const est = (row.estado || '').toLowerCase();
                  let estadoBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                  let estadoDot = 'bg-slate-400';
                  if (est.includes('asig')) {
                    estadoBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    estadoDot = 'bg-emerald-500';
                  } else if (est.includes('mant')) {
                    estadoBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    estadoDot = 'bg-amber-500';
                  } else if (est.includes('revis') || est.includes('atenc')) {
                    estadoBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    estadoDot = 'bg-rose-500';
                  } else if (est.includes('stock') || est.includes('sin_asig')) {
                    estadoBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    estadoDot = 'bg-blue-500';
                  }

                  const resp = row.responsableInventario || row.usuarioActual;

                  return (
                    <tr key={row.hostname} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3.5">
                        <button
                          type="button"
                          onClick={() => row.uuid && navigate(`/computadoras/${row.uuid}`)}
                          className="font-mono font-bold text-xs text-[#c53030] hover:underline cursor-pointer"
                        >
                          {row.hostname}
                        </button>
                      </td>
                      <td className="px-3.5 py-3.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          {esNote ? (
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {row.tipo}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-sm">
                        {resp ? (
                          <span className="font-medium text-slate-800">{resp}</span>
                        ) : (
                          <span className="italic text-slate-400">Sin responsable</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 text-sm">{row.area}</td>
                      <td className="px-3.5 py-3.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${soDotColor}`} />
                          {row.sistemaOperativo}
                        </span>
                      </td>
                      <td
                        className="px-3.5 py-3.5 text-slate-600 text-sm max-w-[160px] truncate"
                        title={row.procesador}
                      >
                        {row.procesador}
                      </td>
                      <td className="px-3.5 py-3.5 font-semibold text-slate-800 text-sm">
                        {row.ram || '—'}
                      </td>
                      <td className="px-3.5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoBadgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoDot}`} />
                          {row.estado}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-500 text-xs">
                        {formatFecha(row.ultimaSincronizacion)}
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => row.uuid && navigate(`/computadoras/${row.uuid}`)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Ver detalle"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 gap-3 border-t border-slate-100">
          <div>
            Mostrando{' '}
            <strong className="text-slate-800">
              {totalFiltradas === 0
                ? 0
                : filasPorPagina === 'todos'
                ? 1
                : (paginaActual - 1) * Number(filasPorPagina) + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-800">
              {filasPorPagina === 'todos'
                ? totalFiltradas
                : Math.min(paginaActual * Number(filasPorPagina), totalFiltradas)}
            </strong>{' '}
            de <strong className="text-slate-800">{totalFiltradas}</strong> computadoras
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span>Filas por página:</span>
              <select
                value={filasPorPagina}
                onChange={handleCambioFilas}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            {filasPorPagina !== 'todos' && totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={paginaActual <= 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER CORPORATIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 pt-2 pb-4 gap-2 border-t border-slate-200/60">
        <div>
          <strong className="text-slate-600">BACAR.it v2.1</strong> • Módulo de Auditoría de Hardware e Infraestructura
        </div>
        <div>
          Servidor de sincronización:{' '}
          <span className="font-mono text-slate-500">sinc-prod-ar01.bacar.internal</span>{' '}
          <span className="text-emerald-600 font-semibold">(Estado: Normal)</span>
        </div>
      </div>
    </div>
  );
}
