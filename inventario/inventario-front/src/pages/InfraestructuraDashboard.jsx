import { useState, useEffect, useCallback, useMemo } from 'react';
import { Video, Camera, Router, EthernetPort, Banknote, Server, Smartphone, ArrowRight, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchCamaras } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { fetchMaquinas } from '../api/maquinaTesoreriaApi';
import { fetchServidores } from '../api/servidorApi';
import { fetchInternos } from '../api/internoIpApi';
import { useNavigate } from 'react-router-dom';
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
  const [internos, setInternos] = useState([]);
  const [totalMaquinas, setTotalMaquinas] = useState(0);
  const [totalServidores, setTotalServidores] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTelefono, setFiltroTelefono] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([
      fetchDashboardStats().catch(() => null),
      fetchNvrs().catch(() => []),
      fetchCamaras().catch(() => []),
      fetchMaquinas().catch(() => []),
      fetchServidores().catch(() => []),
      fetchInternos().catch(() => []),
    ])
      .then(([s, nvrs, cams, maqs, srvs, ints]) => {
        setStats(s ?? null);
        setListaNvrs(Array.isArray(nvrs) ? nvrs : []);
        setCamaras(Array.isArray(cams) ? cams : []);
        setTotalMaquinas(Array.isArray(maqs) ? maqs.length : 0);
        setTotalServidores(Array.isArray(srvs) ? srvs.length : 0);
        setInternos(Array.isArray(ints) ? ints : []);
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
  const totalTelefonos = internos.length;
  const totalRouters = Number(s.totalRouters ?? 0);
  const totalSwitches = Number(s.totalSwitches ?? 0);
  const totalActivos = totalNvrs + totalCamaras + totalRouters + totalSwitches + totalMaquinas + totalServidores + totalTelefonos;
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
        <StudioMetricCard
          title="Teléfonos IP"
          value={totalTelefonos}
          subtitle="unid."
          icon={Smartphone}
          iconClass="bg-indigo-50 text-indigo-600"
          to="/telefonos"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Directorio de Teléfonos IP</span>
            </h2>
            <p className="text-xs text-slate-500">Acceso a todos los internos del corporativo.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50"
                value={filtroTelefono}
                onChange={(e) => setFiltroTelefono(e.target.value)}
              />
            </div>
            <button 
              onClick={() => window.location.href = '/telefonos'}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Directorio Completo</span>
              <span className="sm:hidden">Todos</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="max-h-[250px] overflow-y-auto pr-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
          {internos.filter(tel => (tel.asignadoA || 'Sin Asignar').toLowerCase().includes(filtroTelefono.toLowerCase())).map((tel) => (
            <div 
              key={tel.id}
              onClick={() => window.location.href = '/telefonos'}
              className="p-3 flex items-center justify-between border border-transparent border-b-slate-100 last:border-b-transparent hover:bg-blue-50/30 hover:border-blue-100 rounded-lg cursor-pointer transition-all group"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">{tel.asignadoA || 'Sin Asignar'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${tel.estadoActual === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={tel.estadoActual}></span>
                </div>
                <span className="text-xs text-slate-500">{tel.direccionIp}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Int: {tel.numeroInterno}</span>
              </div>
            </div>
          ))}
          {internos.filter(tel => (tel.asignadoA || 'Sin Asignar').toLowerCase().includes(filtroTelefono.toLowerCase())).length === 0 && (
            <div className="w-full text-center text-slate-400 text-xs py-4">
              {internos.length === 0 ? 'No hay teléfonos registrados.' : 'No se encontraron resultados.'}
            </div>
          )}
        </div>
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
