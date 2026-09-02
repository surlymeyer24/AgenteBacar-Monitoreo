import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileDown, RefreshCw } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useDashboardStats, useComputadoras, usePerifericosM, useNvrs, useCamaras, useMaquinas } from '../hooks/useQueries';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
} from '../components/studio/StudioUi';
import { construirReporteInventario, chartDataDesdeMapa } from '../utils/reporteInventario';
import { exportarReportePdf } from '../utils/exportReportePdf';

const PIE_COLORS = ['#36b37e', '#ff5630', '#6554c0', '#ffab00'];
const BAR_COLOR = '#0c66e4';
const BAR_COLOR_ALT = '#6554c0';

function KpiCard({ label, value, color = 'text-slate-900', sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-1">
      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-4xl font-bold leading-none ${color}`}>{value}</span>
      {sub ? <span className="text-sm text-slate-400">{sub}</span> : null}
    </div>
  );
}

function ChartCard({ titulo, subtitulo, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 ${className}`}>
      <div className="border-b border-slate-100 pb-2">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        {subtitulo ? <p className="text-sm text-slate-500 m-0 mt-0.5">{subtitulo}</p> : null}
      </div>
      {children}
    </div>
  );
}

function BarChartSimple({ data, color = BAR_COLOR, layout = 'vertical' }) {
  if (!data.length) {
    return <p className="text-xs text-slate-500 m-0 py-8 text-center">Sin datos.</p>;
  }
  const isHorizontal = layout === 'horizontal';
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 32)}>
      <BarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 8, left: isHorizontal ? 80 : 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={76} />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={data.length > 4 ? -25 : 0} textAnchor={data.length > 4 ? 'end' : 'middle'} height={data.length > 4 ? 50 : 30} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </>
        )}
        <Tooltip formatter={v => [v, 'Cantidad']} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Reportes() {
  const [exportando, setExportando] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: computadoras = [], isLoading: pcsLoading } = useComputadoras();
  const { data: perifericosManual = [] } = usePerifericosM();
  const { data: nvrs = [] } = useNvrs();
  const { data: camaras = [] } = useCamaras();
  const { data: maquinasTesoreria = [] } = useMaquinas();

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

  const raw = stats ? { stats, computadoras, perifericosManual, nvrs, camaras, maquinasTesoreria } : null;

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

  if (cargando && !reporte) return <StudioLoading message="Generando reporte…" />;
  if (error && !reporte) return <StudioError message={error} />;

  const r = reporte;
  const fmt = (n) => Number(n ?? 0).toLocaleString('es-AR');

  const pieActivas = [
    { name: 'Activas', value: r.computadoras.activas },
    { name: 'Inactivas', value: r.computadoras.inactivas },
  ].filter(d => d.value > 0);

  const pieEstados = [
    { name: 'Asignadas', value: r.computadoras.asignadas },
    { name: 'En stock', value: r.computadoras.enStock },
    { name: 'Mantenimiento', value: r.computadoras.enMantenimiento },
    { name: 'Baja', value: r.computadoras.baja },
  ].filter(d => d.value > 0);

  const dataArea = chartDataDesdeMapa(r.computadoras.porArea, 10);
  const dataTipo = chartDataDesdeMapa(r.computadoras.porTipoEquipo);
  const dataArq = chartDataDesdeMapa(r.computadoras.porArquitectura, 8);
  const dataProc = chartDataDesdeMapa(r.computadoras.porProcesador, 8);
  const dataPerif = chartDataDesdeMapa(r.perifericos.porTipoAgente, 10);
  const dataNvr = chartDataDesdeMapa(r.infraestructura.camarasPorNvr, 8);
  const dataRoutersSwitches = chartDataDesdeMapa(r.infraestructura.routersSwitchesPorTipo, 4);
  const dataMaquinasTes = chartDataDesdeMapa(r.tesoreria.porTipo, 10);

  const detalle = r.computadoras.detalle ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" id="reporte-inventario">
      <StudioPageShell
        title="Reportes de Inventario"
        subtitle={
          r
            ? `Última actualización: ${r.generadoEn.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}`
            : undefined
        }
        actions={
          <>
            <button
              type="button"
              onClick={cargar}
              disabled={cargando}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg font-medium text-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleExportar}
              disabled={exportando || !r}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              {exportando ? 'Generando PDF…' : 'Exportar PDF'}
            </button>
          </>
        }
      />

      {error && r && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          {error} — Se muestran los datos parciales disponibles.
        </div>
      )}

      {r && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              label="Total Computadoras"
              value={fmt(r.computadoras.total)}
              sub={`${fmt(r.computadoras.registradas)} agente + ${fmt(r.computadoras.stockManualComputadorasTotal)} stock`}
            />
            <KpiCard label="Activas" value={fmt(r.computadoras.activas)} color="text-emerald-600" sub="sync reciente" />
            <KpiCard label="Inactivas" value={fmt(r.computadoras.inactivas)} color="text-red-500" sub="sin sync reciente" />
            <KpiCard label="Asignadas" value={fmt(r.computadoras.asignadas)} color="text-blue-600" />
            <KpiCard label="En stock" value={fmt(r.computadoras.enStock)} color="text-violet-600" sub={`${fmt(r.computadoras.enStockRegistradas)} PC + ${fmt(r.computadoras.stockManualComputadoras)} manual`} />
            <KpiCard label="Periféricos c/PC" value={fmt(r.perifericos.conPcAgente)} color="text-cyan-600" />
          </div>

          {/* Fila 1: donuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard titulo="PCs activas / inactivas" subtitulo="Según última sincronización del agente (solo registradas)">
              {pieActivas.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieActivas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieActivas.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => [v, 'Equipos']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center m-0">Sin datos de sync.</p>
              )}
            </ChartCard>

            <ChartCard titulo="Computadoras por estado" subtitulo="Incluye stock manual tipo computadora">
              {pieEstados.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieEstados} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieEstados.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => [v, 'Equipos']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center m-0">Sin datos.</p>
              )}
            </ChartCard>
          </div>

          {/* Fila 2: área + tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard titulo="PCs por área" subtitulo="Distribución por ubicación">
              <BarChartSimple data={dataArea} color={BAR_COLOR} layout="horizontal" />
            </ChartCard>
            <ChartCard titulo="Notebooks vs PC escritorio">
              <BarChartSimple data={dataTipo} color={BAR_COLOR_ALT} layout="vertical" />
            </ChartCard>
          </div>

          {/* Fila 3: arquitectura + procesador */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard titulo="Por arquitectura">
              <BarChartSimple data={dataArq} color="#36b37e" layout="horizontal" />
            </ChartCard>
            <ChartCard titulo="Por procesador" subtitulo="Top 8 modelos">
              <BarChartSimple data={dataProc} color="#ff5630" layout="horizontal" />
            </ChartCard>
          </div>

          {/* Fila 4: periféricos + infra */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard titulo="Periféricos con PC — por tipo" subtitulo="Detectados por agente">
              <BarChartSimple data={dataPerif} color="#00a3bf" layout="horizontal" />
            </ChartCard>
            <ChartCard titulo="Cámaras por NVR">
              <BarChartSimple data={dataNvr} color="#6554c0" layout="horizontal" />
            </ChartCard>
          </div>

          {/* Fila 5: routers+switches + tesorería + perif stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
              titulo="Routers y Switches"
              subtitulo={`${fmt(r.infraestructura.totalRouters + r.infraestructura.totalSwitches)} equipos en total`}
            >
              <BarChartSimple data={dataRoutersSwitches} color={BAR_COLOR} layout="vertical" />
            </ChartCard>
            <ChartCard
              titulo="Máquinas de tesorería por tipo"
              subtitulo={`${fmt(r.tesoreria.total)} equipos en inventario`}
            >
              <BarChartSimple data={dataMaquinasTes} color="#ffab00" layout="vertical" />
            </ChartCard>
            <ChartCard titulo="Periféricos en stock manual" subtitulo={`${fmt(r.perifericos.stockManual)} disponibles · ${fmt(r.perifericos.asignadosManual)} asignados`}>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase block">En stock</span>
                  <span className="text-2xl font-bold text-emerald-800">{fmt(r.perifericos.stockManual)}</span>
                </div>
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-center">
                  <span className="text-[10px] font-semibold text-indigo-700 uppercase block">Asignados</span>
                  <span className="text-2xl font-bold text-indigo-800">{fmt(r.perifericos.asignadosManual)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 m-0 pt-2">
                Excluye ítems categoría computadora. Estados: «{ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR}» / «{ESTADO_OPERATIVO_LABELS.ASIGNADA}».
              </p>
            </ChartCard>
          </div>

          {/* Tabla detalle */}
          <ChartCard
            titulo="Detalle de computadoras"
            subtitulo={`Mostrando ${detalle.length} equipos registrados por agente`}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wide">
                    <th className="py-2 px-3 font-semibold">Hostname</th>
                    <th className="py-2 px-3 font-semibold">Tipo</th>
                    <th className="py-2 px-3 font-semibold">Estado</th>
                    <th className="py-2 px-3 font-semibold">Sync</th>
                    <th className="py-2 px-3 font-semibold">Área</th>
                    <th className="py-2 px-3 font-semibold">Procesador</th>
                    <th className="py-2 px-3 font-semibold">Arquitectura</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">Sin computadoras registradas.</td>
                    </tr>
                  ) : (
                    detalle.slice(0, 50).map(row => (
                      <tr key={row.hostname} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{row.hostname}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.tipo}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.estado}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.sync === 'Activa'
                              ? 'bg-emerald-50 text-emerald-700'
                              : row.sync === 'Inactiva'
                                ? 'bg-red-50 text-red-600'
                                : row.sync === 'Intermedio'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-500'
                          }`}>
                            {row.sync}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{row.area}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate" title={row.procesador}>{row.procesador}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.arquitectura}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {detalle.length > 50 && (
                <p className="text-[10px] text-slate-400 text-center py-2 m-0">
                  Mostrando 50 de {detalle.length} — exportá el PDF para el listado completo.
                </p>
              )}
            </div>
          </ChartCard>

          <p className="text-[10px] text-slate-400 text-center pb-2">
            IT-BACAR · REPORTE DE INVENTARIO
          </p>
        </>
      )}
    </div>
  );
}
