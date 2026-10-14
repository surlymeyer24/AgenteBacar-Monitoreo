import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useComputadoras } from '../hooks/useQueries';
import {
  Monitor, Camera, CheckCircle2, Smartphone, Laptop, Video, Tv,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ComputadorasEstadoModal from '../components/ComputadorasEstadoModal';
import { labelUbicacion } from '../constants/ubicaciones';
import { useCatalogo } from '../hooks/useCatalogo';
import { chartDataDesdeMapa, esNotebook } from '../utils/reporteInventario';
import { filtrarPcsInventarioOperativo } from '../utils/pipelinePcHelpers';
import { nivelActividadSync } from '../utils/syncActividad';

const ACCENT = '#BA1814';
const SYNC_COLORS = {
  activas: '#36b37e',
  intermedio: '#f59e0b',
  inactivas: '#ef4444',
};

const WIN_COLORS = { 'Windows 11': '#0c66e4', 'Windows 10': '#6554c0', Otros: '#94a3b8' };

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

  const { data: stats, isLoading: cargando, error: statsError } = useDashboardStats();
  const { data: computadoras = [] } = useComputadoras();

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

  const error = statsError ? 'No se pudo cargar el dashboard. Verificá que el servidor esté en ejecución.' : null;

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

  const pieData = useMemo(() => {
    const rows = [
      { key: 'activas', name: 'Activas / Online', value: activas, color: SYNC_COLORS.activas },
      { key: 'intermedio', name: 'Intermedio / Alerta', value: intermedio, color: SYNC_COLORS.intermedio },
      { key: 'inactivas', name: 'Inactivas / Offline', value: inactivas, color: SYNC_COLORS.inactivas },
    ].filter((r) => r.value > 0);
    if (rows.length === 0 && totalPc === 0) {
      return [{ key: 'empty', name: 'Sin datos', value: 1, color: '#e2e8f0' }];
    }
    return rows.length ? rows : [
      { key: 'inactivas', name: 'Inactivas / Offline', value: Math.max(totalPc, 1), color: SYNC_COLORS.inactivas },
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
    return ['Windows 11', 'Windows 10', 'Otros']
      .map((name) => ({ name, cantidad: counts[name], fill: WIN_COLORS[name] }))
      .filter((row) => row.cantidad > 0);
  }, [pcsOperativas]);

  const procesadorData = useMemo(() => {
    const map = {};
    for (const pc of pcsOperativas) {
      const raw = pc.procesadorNombre;
      const key = raw != null && String(raw).trim() ? String(raw).trim() : 'Sin dato';
      map[key] = (map[key] ?? 0) + 1;
    }
    return chartDataDesdeMapa(map, 8).map((row) => ({
      procesador: row.name.length > 42 ? `${row.name.slice(0, 40)}…` : row.name,
      procesadorFull: row.name,
      cantidad: row.value,
    }));
  }, [pcsOperativas]);

  if (cargando && !stats) {
    return <div className="p-8 text-center text-slate-500">Cargando dashboard...</div>;
  }
  if (error && !stats) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs border-t-[3px] border-t-accent p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <span className="w-1.5 self-stretch min-h-[2.75rem] rounded-full bg-accent shrink-0" aria-hidden />
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase leading-tight">
                Consola de Control de Inventario IT
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wide leading-relaxed">
                Estado de activos y asignaciones en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && stats && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setModalPcsOpen(true)}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2 text-left hover:border-accent/30 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block group-hover:text-accent">
              Equipamiento Asignado
            </span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{totalPc}</span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Monitor className="w-3 h-3" />{desktops} PC
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Laptop className="w-3 h-3" />{notebooks} Notebook
              </span>
            </div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
        </button>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block">Equipos Activos</span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{activas}</span>
            <span className="text-sm text-slate-400 block">Online últimos minutos</span>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/nvrs')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2 text-left hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block group-hover:text-purple-600">
              NVR
            </span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{totalNvrs}</span>
            <span className="text-sm text-slate-400 block">Grabadores de video</span>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
            <Video className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/camaras')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2 text-left hover:border-teal-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block group-hover:text-teal-600">
              Cámaras de Seguridad
            </span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{totalCamaras}</span>
          </div>
          <div className="p-2 bg-teal-50 rounded-lg text-teal-600 shrink-0">
            <Camera className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/perifericos/monitores')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2 text-left hover:border-sky-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block group-hover:text-sky-600">
              Monitores
            </span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{totalMonitores}</span>
            <span className="text-sm text-slate-400 block">Detectados por agente</span>
          </div>
          <div className="p-2 bg-sky-50 rounded-lg text-sky-600 shrink-0">
            <Tv className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/telefonos')}
          className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-start justify-between gap-2 text-left hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide block group-hover:text-violet-600">
              Teléfonos IP
            </span>
            <span className="text-5xl font-extrabold text-slate-900 tabular-nums">{totalTelefonos}</span>
          </div>
          <div className="p-2 bg-violet-50 rounded-lg text-violet-600 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Distribución + Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Distribución de Equipos por Área
          </h2>
          {porAreaData.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Sin datos de ubicación.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, porAreaData.length * 40)}>
              <BarChart data={porAreaData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="area" width={120} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(186, 24, 20, 0.04)' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="cantidad" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-2">
            Estado de Sincronización
          </h2>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 min-h-[220px]">
            <div className="w-full sm:w-[55%] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full sm:flex-1 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SYNC_COLORS.activas }} />
                <div>
                  <p className="font-semibold text-slate-800">Activas / Online</p>
                  <p className="text-slate-500 tabular-nums">{activas} · {totalPc ? Math.round((activas / totalPc) * 100) : 0}%</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SYNC_COLORS.intermedio }} />
                <div>
                  <p className="font-semibold text-slate-800">Intermedio / Alerta</p>
                  <p className="text-slate-500 tabular-nums">{intermedio} · {totalPc ? Math.round((intermedio / totalPc) * 100) : 0}%</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SYNC_COLORS.inactivas }} />
                <div>
                  <p className="font-semibold text-slate-800">Inactivas / Offline</p>
                  <p className="text-slate-500 tabular-nums">{inactivas} · {totalPc ? Math.round((inactivas / totalPc) * 100) : 0}%</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Windows + Procesadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4 min-h-[420px] flex flex-col">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Windows 11 vs Windows 10
          </h2>
          {windowsData.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center flex-1 flex items-center justify-center">Sin datos de sistema operativo.</p>
          ) : (
            <div className="flex-1 h-[360px]">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={windowsData} margin={{ left: 8, right: 20, top: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(186, 24, 20, 0.04)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    formatter={(value) => [value, 'Equipos']}
                  />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} barSize={64}>
                    {windowsData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4 min-h-[420px] flex flex-col">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              Procesadores
            </h2>
            <p className="text-xs text-slate-500 mt-1">Top 8 modelos detectados por el agente</p>
          </div>
          {procesadorData.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center flex-1 flex items-center justify-center">Sin datos de procesador.</p>
          ) : (
            <div className="flex-1 h-[360px]">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={procesadorData} layout="vertical" margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 13, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="procesador"
                    width={160}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(186, 24, 20, 0.04)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.procesadorFull ?? ''}
                    formatter={(value) => [value, 'Equipos']}
                  />
                  <Bar dataKey="cantidad" fill="#ff5630" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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
