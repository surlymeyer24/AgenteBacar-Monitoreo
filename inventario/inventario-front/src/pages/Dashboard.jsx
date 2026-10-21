import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useComputadoras } from '../hooks/useQueries';
import {
  Monitor,
  Camera,
  CheckCircle2,
  Phone,
  Laptop,
  Video,
  Tv,
  RotateCw,
  Clock,
  ArrowRight,
  Cpu,
  SlidersHorizontal,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ComputadorasEstadoModal from '../components/ComputadorasEstadoModal';
import { labelUbicacion } from '../constants/ubicaciones';
import { useCatalogo } from '../hooks/useCatalogo';
import { chartDataDesdeMapa, esNotebook } from '../utils/reporteInventario';
import { filtrarPcsInventarioOperativo } from '../utils/pipelinePcHelpers';
import { nivelActividadSync } from '../utils/syncActividad';
import { ModuleHeader } from '../components/layout';

const ACCENT = '#BA1814';
const SYNC_COLORS = {
  activas: '#10b981',
  intermedio: '#f59e0b',
  inactivas: '#ef4444',
};

const WIN_COLORS = {
  'Windows 11': '#0c66e4',
  'Windows 10': '#6554c0',
  Otros: '#94a3b8',
};

function clasificarWindows(so) {
  const s = (so ?? '').toLowerCase();
  if (s.includes('11')) return 'Windows 11';
  if (s.includes('10')) return 'Windows 10';
  return 'Otros';
}

function Dashboard() {
  const navigate = useNavigate();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const [modalPcsOpen, setModalPcsOpen] = useState(false);

  const {
    data: stats,
    isLoading: cargando,
    error: statsError,
    refetch: refetchStats,
    isFetching: fetchingStats,
  } = useDashboardStats();

  const {
    data: computadoras = [],
    refetch: refetchComputadoras,
    isFetching: fetchingPcs,
  } = useComputadoras();

  const handleRefresh = () => {
    refetchStats();
    refetchComputadoras();
  };

  const isRefreshing = fetchingStats || fetchingPcs;

  const pcsOperativas = useMemo(
    () => filtrarPcsInventarioOperativo(computadoras),
    [computadoras],
  );

  const metricasOperativas = useMemo(() => {
    if (!pcsOperativas.length) return null;
    let activas = 0;
    let intermedio = 0;
    let inactivas = 0;
    for (const c of pcsOperativas) {
      const n = nivelActividadSync(c);
      if (n === 'activo') activas += 1;
      else if (n === 'intermedio') intermedio += 1;
      else inactivas += 1;
    }
    const notebooks = pcsOperativas.filter(esNotebook).length;
    return {
      total: pcsOperativas.length,
      activas,
      intermedio,
      inactivas,
      notebooks,
      desktops: pcsOperativas.length - notebooks,
    };
  }, [pcsOperativas]);

  const error = statsError
    ? 'No se pudo cargar el dashboard. Verificá que el servidor esté en ejecución.'
    : null;

  const s = stats ?? {};
  const totalPcAgente = metricasOperativas?.total ?? Number(s.totalComputadoras ?? 0);
  const totalCamaras = Number(s.totalCamaras ?? 0);
  const totalNvrs = Number(s.totalNvrs ?? 0);
  const totalMonitores = Number(s.totalMonitores ?? 0);
  const totalTelefonos = Number(s.totalTelefonos ?? 0);
  const activas = metricasOperativas?.activas ?? Number(s.computadorasSyncMenos10Min ?? 0);
  const intermedio = metricasOperativas?.intermedio ?? Number(s.computadorasSyncEntre10MinY1h ?? 0);
  const inactivasRaw = metricasOperativas?.inactivas ?? Number(s.computadorasSinActividadMas1h ?? 0);
  const inactivas = Math.max(0, inactivasRaw || (totalPcAgente - activas - intermedio));

  const notebooks = metricasOperativas?.notebooks ?? Number(s.totalNotebooks ?? 0);
  const desktops = metricasOperativas?.desktops ?? Number(s.totalDesktops ?? totalPcAgente);
  const totalPc = totalPcAgente;
  const saludRed = totalPc ? Math.round((activas / totalPc) * 100) : 0;

  const pieData = useMemo(() => {
    const rows = [
      { key: 'activas', name: 'Activas / Online', value: activas, color: SYNC_COLORS.activas },
      { key: 'intermedio', name: 'Intermedio / Alerta', value: intermedio, color: SYNC_COLORS.intermedio },
      { key: 'inactivas', name: 'Inactivas / Offline', value: inactivas, color: SYNC_COLORS.inactivas },
    ].filter((r) => r.value > 0);
    if (rows.length === 0 && totalPc === 0) {
      return [{ key: 'empty', name: 'Sin datos', value: 1, color: '#e2e8f0' }];
    }
    return rows.length
      ? rows
      : [
          {
            key: 'inactivas',
            name: 'Inactivas / Offline',
            value: Math.max(totalPc, 1),
            color: SYNC_COLORS.inactivas,
          },
        ];
  }, [activas, intermedio, inactivas, totalPc]);

  const porAreaData = useMemo(() => {
    const map = {};
    if (pcsOperativas.length) {
      for (const pc of pcsOperativas) {
        if (!pc.ubicacion) continue;
        map[pc.ubicacion] = (map[pc.ubicacion] ?? 0) + 1;
      }
    } else {
      Object.assign(map, s.porUbicacionComputadoras ?? {});
    }
    return Object.entries(map)
      .filter(([, n]) => Number(n) > 0)
      .map(([key, value]) => ({
        area: labelUbicacion(key, ubicCompItems),
        cantidad: Number(value) || 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [pcsOperativas, s.porUbicacionComputadoras, ubicCompItems]);

  const windowsData = useMemo(() => {
    const counts = { 'Windows 11': 0, 'Windows 10': 0, Otros: 0 };
    for (const pc of pcsOperativas) {
      counts[clasificarWindows(pc.sistemaOperativo)] += 1;
    }
    return ['Windows 11', 'Windows 10', 'Otros'].map((name) => ({
      name,
      cantidad: counts[name],
      fill: WIN_COLORS[name],
    }));
  }, [pcsOperativas]);

  const procesadorData = useMemo(() => {
    const map = {};
    for (const pc of pcsOperativas) {
      const raw = pc.procesadorNombre;
      const key = raw != null && String(raw).trim() ? String(raw).trim() : 'Sin dato';
      map[key] = (map[key] ?? 0) + 1;
    }
    return chartDataDesdeMapa(map, 6).map((row) => ({
      procesador: row.name.length > 38 ? `${row.name.slice(0, 36)}…` : row.name,
      procesadorFull: row.name,
      cantidad: row.value,
    }));
  }, [pcsOperativas]);

  const fechaActualizada = useMemo(() => {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  }, [isRefreshing]);

  const w11Count = windowsData.find((w) => w.name === 'Windows 11')?.cantidad ?? 0;
  const porActualizarW11 = Math.max(0, totalPc - w11Count);

  const predominanciaCpu = useMemo(() => {
    const intel = procesadorData
      .filter((p) => p.procesadorFull.toLowerCase().includes('intel'))
      .reduce((acc, curr) => acc + curr.cantidad, 0);
    const amd = procesadorData
      .filter((p) => p.procesadorFull.toLowerCase().includes('amd'))
      .reduce((acc, curr) => acc + curr.cantidad, 0);
    if (intel > amd) return 'Intel';
    if (amd > intel) return 'AMD';
    return 'Mixta';
  }, [procesadorData]);

  if (cargando && !stats) {
    return <div className="p-8 text-center text-slate-500">Cargando dashboard...</div>;
  }
  if (error && !stats) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* Cabecera Principal */}
      <ModuleHeader
        title="Consola de Control de Inventario IT"
        badge={
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            BACAR.it Core
          </span>
        }
        description="Estado de activos y asignaciones en tiempo real."
        actions={
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Última actualización: {fechaActualizada}</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </>
        }
      />

      {error && stats && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Equipamiento Asignado */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Equipamiento Asignado
              </span>
              <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0 border border-red-100">
                <Monitor className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {totalPc}
            </span>
          </div>

          <div className="min-h-[44px] flex flex-col justify-end pt-1">
            <p className="text-xs font-medium text-slate-500 truncate">
              {desktops} PC · {notebooks} Noteb...
            </p>
            <button
              type="button"
              onClick={() => setModalPcsOpen(true)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 pt-1 group cursor-pointer"
            >
              Explorar detalle
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* 2. Equipos Activos */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Equipos Activos
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {activas}
            </span>
          </div>

          <div className="min-h-[44px] flex flex-col justify-end pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Online en los últim...</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              {totalPc ? Math.round((activas / totalPc) * 100) : 0}% del parque total
            </p>
          </div>
        </div>

        {/* 3. NVR (Solo número) */}
        <div
          onClick={() => navigate('/nvrs')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-purple-200 transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600">
                NVR
              </span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0 border border-purple-100">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {totalNvrs}
            </span>
          </div>
          <div className="min-h-[44px]" />
        </div>

        {/* 4. Cámaras Seguridad (Solo número) */}
        <div
          onClick={() => navigate('/camaras')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-sky-200 transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-sky-600">
                Cámaras Seguridad
              </span>
              <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg shrink-0 border border-sky-100">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {totalCamaras}
            </span>
          </div>
          <div className="min-h-[44px]" />
        </div>

        {/* 5. Monitores (Solo número) */}
        <div
          onClick={() => navigate('/perifericos/monitores')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600">
                Monitores
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                <Tv className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {totalMonitores}
            </span>
          </div>
          <div className="min-h-[44px]" />
        </div>

        {/* 6. Teléfonos IP (Solo número) */}
        <div
          onClick={() => navigate('/telefonos')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-violet-200 transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-violet-600">
                Teléfonos IP
              </span>
              <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg shrink-0 border border-violet-100">
                <Phone className="w-4 h-4" />
              </div>
            </div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums block">
              {totalTelefonos}
            </span>
          </div>
          <div className="min-h-[44px]" />
        </div>
      </div>

      {/* Fila Media: Distribución por área + Estado de sincronización */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Distribución de equipos por área */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Distribución de equipos por área
            </h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
              {porAreaData.length} Sectores
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Total asignado: {totalPc} unidades operativas
          </p>

          {porAreaData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">
              Sin datos de ubicación registrados.
            </p>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {porAreaData.slice(0, 8).map((item) => {
                const pct = totalPc ? Math.round((item.cantidad / totalPc) * 1000) / 10 : 0;
                return (
                  <div key={item.area} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{item.area}</span>
                      <span className="font-bold text-slate-800">
                        {item.cantidad}{' '}
                        <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: ACCENT,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Estado de sincronización */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Estado de sincronización
              </h2>
              <button
                type="button"
                onClick={handleRefresh}
                title="Actualizar estado"
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Auditoría del agente en {totalPc} terminales
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
              {/* Gráfico Donut con label central */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={64}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-lg font-extrabold text-slate-900 leading-tight">
                    {saludRed}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Salud de Red
                  </span>
                </div>
              </div>

              {/* Leyenda de 3 estados */}
              <div className="flex-1 w-full space-y-2 text-xs">
                {/* Activas */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100/70 flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">Activas / Online</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Agente reportando &lt; 5m</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{activas}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{saludRed}%</p>
                  </div>
                </div>

                {/* Intermedio */}
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100/70 flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">Intermedio / Alerta</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Sin sync &gt; 24h</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{intermedio}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {totalPc ? Math.round((intermedio / totalPc) * 100) : 0}%
                    </p>
                  </div>
                </div>

                {/* Inactivas */}
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100/70 flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">Inactivas / Offline</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Inaccesible &gt; 7 días</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{inactivas}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {totalPc ? Math.round((inactivas / totalPc) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Frecuencia de polling: 120s</span>
            <button
              type="button"
              onClick={() => navigate('/system')}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Configurar agente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Sistemas operativos + Procesadores más utilizados (2 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sistemas operativos */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Sistemas operativos
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                {totalPc} Total
              </span>
            </div>

            <div className="space-y-3.5 my-2">
              {windowsData.map((item) => {
                const pct = totalPc ? Math.round((item.cantidad / totalPc) * 1000) / 10 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="font-semibold text-slate-700">
                          {item.name === 'Otros' ? 'Otros (Linux / Server)' : `${item.name} Pro / Ent`}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {item.cantidad}{' '}
                        <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Meta migración W11: 95% Q4</span>
            <span className="font-semibold text-amber-600">
              {porActualizarW11} por actualizar
            </span>
          </div>
        </div>

        {/* Procesadores más utilizados */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Procesadores más utilizados
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                x86_64
              </span>
            </div>

            {procesadorData.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">
                Sin datos de procesador registrados.
              </p>
            ) : (
              <div className="space-y-2.5 my-1">
                {procesadorData.map((item, index) => (
                  <div
                    key={item.procesadorFull}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100/60 last:border-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] bg-slate-100 text-slate-600 shrink-0">
                        {index + 1}
                      </span>
                      <span
                        className="font-medium text-slate-700 truncate"
                        title={item.procesadorFull}
                      >
                        {item.procesadorFull}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 shrink-0 tabular-nums">
                      {item.cantidad} u.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-xs text-slate-500">
            <span>Arquitectura predominante: {predominanciaCpu}</span>
          </div>
        </div>
      </div>

      <ComputadorasEstadoModal
        isOpen={modalPcsOpen}
        onClose={() => setModalPcsOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
