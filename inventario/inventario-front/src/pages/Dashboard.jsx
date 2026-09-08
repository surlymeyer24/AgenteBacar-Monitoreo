import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useComputadorasRecientes, useCamarasRecientes } from '../hooks/useQueries';
import { nivelActividadSync, syncDotInlineStyle, tituloSyncDot } from '../utils/syncActividad';
import {
  Monitor, Camera, CheckCircle2, Smartphone, ArrowRight, Laptop, Package, Video, Tv,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ComputadorasEstadoModal from '../components/ComputadorasEstadoModal';
import { labelUbicacion } from '../constants/ubicaciones';
import { useCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';

const ACCENT = '#BA1814';
const SYNC_COLORS = {
  activas: '#36b37e',
  intermedio: '#f59e0b',
  inactivas: '#ef4444',
};

function badgeEstadoCamara(estado, items) {
  const raw = String(estado ?? '').trim();
  if (!raw) return { label: 'SIN ESTADO', className: 'bg-slate-100 text-slate-600' };
  const label = labelDeCatalogo(items, raw);
  const up = raw.toUpperCase();
  if (up === 'ACTIVA' || up === 'ASIGNADA' || up === 'ONLINE' || up === 'OPERATIVO') {
    return { label: up === 'ACTIVA' || up === 'ONLINE' ? 'ONLINE' : label.toUpperCase(), className: 'bg-emerald-100 text-emerald-800' };
  }
  if (up === 'EN_MANTENIMIENTO' || up === 'SIN_ASIGNAR') {
    return { label: label.toUpperCase(), className: 'bg-amber-100 text-amber-800' };
  }
  return { label: label.toUpperCase(), className: 'bg-rose-100 text-rose-800' };
}

function Dashboard() {
  const navigate = useNavigate();
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const [modalPcsOpen, setModalPcsOpen] = useState(false);

  const { data: stats, isLoading: cargando, error: statsError } = useDashboardStats();
  const { data: pcsRecientes = [] } = useComputadorasRecientes();
  const { data: camsPreview = [] } = useCamarasRecientes();

  const error = statsError ? 'No se pudo cargar el dashboard. Verificá que el servidor esté en ejecución.' : null;

  const s = stats ?? {};
  const totalPcAgente = Number(s.totalComputadoras ?? 0);
  const totalCamaras = Number(s.totalCamaras ?? 0);
  const totalNvrs = Number(s.totalNvrs ?? 0);
  const totalMonitores = Number(s.totalMonitores ?? 0);
  const totalTelefonos = Number(s.totalTelefonos ?? 0);
  const activas = Number(s.computadorasSyncMenos10Min ?? 0);
  const intermedio = Number(s.computadorasSyncEntre10MinY1h ?? 0);
  const inactivasRaw = Number(s.computadorasSinActividadMas1h ?? 0);
  const inactivas = Math.max(0, inactivasRaw || (totalPcAgente - activas - intermedio));

  const notebooks = Number(s.totalNotebooks ?? 0);
  const desktops = Number(s.totalDesktops ?? totalPcAgente);
  const totalStock = Number(s.stockPcsSinAsignar ?? 0);
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

  const porAreaData = useMemo(() => (
    Object.entries(s.porUbicacionComputadoras ?? {})
      .filter(([, n]) => Number(n) > 0)
      .map(([key, value]) => ({
        area: labelUbicacion(key, ubicCompItems),
        cantidad: Number(value) || 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
  ), [s.porUbicacionComputadoras, ubicCompItems]);

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
              {totalStock > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  <Package className="w-3 h-3" />{totalStock} en stock
                </span>
              )}
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

      {/* Tablas PCs + Cámaras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              Computadoras Detectadas Recientemente
            </h2>
            <button
              type="button"
              onClick={() => navigate('/computadoras')}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[280px] border border-slate-100 rounded-lg">
            <table className="w-full text-left text-[15px] whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5">Hostname</th>
                  <th className="px-3 py-2.5">Conexión</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Procesador</th>
                  <th className="px-3 py-2.5 text-right">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pcsRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-400">Sin datos</td>
                  </tr>
                ) : (
                  pcsRecientes.map((c) => {
                    const nivel = nivelActividadSync(c);
                    return (
                      <tr
                        key={c.uuid}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/computadoras/${c.uuid}`)}
                      >
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {c.hostname ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-block"
                            style={syncDotInlineStyle(nivel)}
                            title={tituloSyncDot(nivel)}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell max-w-[180px] truncate">
                          {c.procesadorNombre ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600">
                          {c.ubicacion ? labelUbicacion(c.ubicacion, ubicCompItems) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              Circuito de Cámaras
            </h2>
            <button
              type="button"
              onClick={() => navigate('/camaras')}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0"
            >
              Administrar circuito
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[280px] border border-slate-100 rounded-lg">
            <table className="w-full text-left text-[15px] whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5">Nombre Cámara</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Ubicación</th>
                  <th className="px-3 py-2.5 text-right">Canal Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {camsPreview.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-400">Sin datos</td>
                  </tr>
                ) : (
                  camsPreview.map((cam, i) => {
                    const badge = badgeEstadoCamara(cam.estado, estadoItems);
                    return (
                      <tr
                        key={cam.id ?? i}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() =>
                          navigate(
                            cam.nvrId
                              ? `/nvrs/${encodeURIComponent(cam.nvrId)}`
                              : `/camaras/${encodeURIComponent(cam.id ?? '')}`,
                          )
                        }
                      >
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {cam.nombre ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{cam.tipo ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600 hidden sm:table-cell">
                          {cam.ubicacion ? labelUbicacion(cam.ubicacion) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
