import { useState, useEffect, useCallback, useMemo } from 'react';
import { Video, Camera, Router, EthernetPort, Banknote, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchCamaras } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { fetchMaquinas } from '../api/maquinaTesoreriaApi';
import { fetchServidores } from '../api/servidorApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioMetricCard,
} from '../components/studio/StudioUi';

function camarasPorNvrDesdeLista(camaras, nvrs) {
  const list = Array.isArray(camaras) ? camaras : [];
  const nvrList = Array.isArray(nvrs) ? nvrs : [];
  const countBy = new Map();
  for (const cam of list) {
    const raw = cam?.nvrId;
    const id = raw != null && String(raw).trim() ? String(raw).trim() : '';
    countBy.set(id, (countBy.get(id) ?? 0) + 1);
  }
  const idsCatalogo = new Set(nvrList.map(n => n.id).filter(Boolean));
  const rows = [];
  for (const nvr of nvrList) {
    const c = countBy.get(nvr.id) ?? 0;
    if (c > 0) rows.push({ label: nvr.nombre ?? nvr.id, count: c });
  }
  const sin = countBy.get('') ?? 0;
  if (sin > 0) rows.push({ label: 'Sin NVR', count: sin });
  for (const [id, c] of countBy) {
    if (!id || c === 0) continue;
    if (!idsCatalogo.has(id)) rows.push({ label: id, count: c });
  }
  rows.sort((a, b) => b.count - a.count);
  const out = {};
  for (const r of rows) out[r.label] = r.count;
  return out;
}

const BAR_COLORS = ['#0c66e4', '#6554c0', '#36b37e', '#ff5630', '#ffab00', '#00a3bf'];

function TarjetaBarras({ titulo, porClave }) {
  const conDatos = porClave ? Object.entries(porClave).filter(([, n]) => Number(n) > 0) : [];
  const max = Math.max(1, ...conDatos.map(([, n]) => Number(n) || 0));

  if (!conDatos.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-2">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        <p className="text-xs text-slate-500 m-0">Sin datos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Desglose distributivo del inventario.</p>
      </div>
      <div className="space-y-4">
        {conDatos.map(([label, raw], index) => {
          const n = Number(raw) || 0;
          const pct = (n / max) * 100;
          const colorClass = BAR_COLORS[index % BAR_COLORS.length];
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="font-semibold text-slate-900 font-mono">{n}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: colorClass }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfraestructuraDashboard() {
  const [stats, setStats] = useState(null);
  const [listaNvrs, setListaNvrs] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [totalMaquinas, setTotalMaquinas] = useState(0);
  const [totalServidores, setTotalServidores] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([
      fetchDashboardStats().catch(() => null),
      fetchNvrs().catch(() => []),
      fetchCamaras().catch(() => []),
      fetchMaquinas().catch(() => []),
      fetchServidores().catch(() => []),
    ])
      .then(([s, nvrs, cams, maqs, srvs]) => {
        setStats(s ?? null);
        setListaNvrs(Array.isArray(nvrs) ? nvrs : []);
        setCamaras(Array.isArray(cams) ? cams : []);
        setTotalMaquinas(Array.isArray(maqs) ? maqs.length : 0);
        setTotalServidores(Array.isArray(srvs) ? srvs.length : 0);
      })
      .catch(() => setError('No se pudo cargar el resumen de infraestructura.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const camarasPorNvr = useMemo(
    () => camarasPorNvrDesdeLista(camaras, listaNvrs),
    [camaras, listaNvrs],
  );

  if (cargando) return <StudioLoading message="Cargando infraestructura…" />;

  const s = stats ?? {};
  const totalNvrs = listaNvrs.length;
  const totalCamaras = camaras.length;
  const totalRouters = Number(s.totalRouters ?? 0);
  const totalSwitches = Number(s.totalSwitches ?? 0);
  const totalActivos = totalNvrs + totalCamaras + totalRouters + totalSwitches + totalMaquinas + totalServidores;
  const subt =
    totalActivos === 0
      ? 'Sin equipos registrados'
      : `${totalActivos} activo${totalActivos === 1 ? '' : 's'} en inventario`;

  return (
    <StudioPageShell
      title="Infraestructura: Red, Videovigilancia y Tesorería"
      subtitle={`${subt}. Videovigilancia (NVR y cámaras), red corporativa y equipos de tesorería.`}
    >
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StudioMetricCard
          title="NVR"
          value={totalNvrs}
          subtitle="unid."
          icon={Video}
          iconClass="bg-purple-50 text-purple-600"
          to="/nvrs"
        />
        <StudioMetricCard
          title="Cámaras"
          value={totalCamaras}
          subtitle="equipos"
          icon={Camera}
          iconClass="bg-red-50 text-red-600"
          to="/camaras"
        />
        <StudioMetricCard
          title="Routers"
          value={totalRouters}
          subtitle="unid."
          icon={Router}
          iconClass="bg-blue-50 text-blue-600"
          to="/routers"
        />
        <StudioMetricCard
          title="Switches"
          value={totalSwitches}
          subtitle="unid."
          icon={EthernetPort}
          iconClass="bg-emerald-50 text-emerald-600"
          to="/switches"
        />
        <StudioMetricCard
          title="Máq. tesorería"
          value={totalMaquinas}
          subtitle="unid."
          icon={Banknote}
          iconClass="bg-orange-50 text-orange-600"
          to="/maquinas-tesoreria"
        />
        <StudioMetricCard
          title="Servidores"
          value={totalServidores}
          subtitle="unid."
          icon={Server}
          iconClass="bg-slate-100 text-slate-600"
          to="/servidores"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TarjetaBarras titulo="Cámaras por NVR" porClave={camarasPorNvr} />
        <TarjetaBarras titulo="Routers por ubicación" porClave={s.porUbicacionRouters ?? {}} />
      </div>

      <TarjetaBarras titulo="Switches por ubicación" porClave={s.porUbicacionSwitches ?? {}} />
    </StudioPageShell>
  );
}

export default InfraestructuraDashboard;
