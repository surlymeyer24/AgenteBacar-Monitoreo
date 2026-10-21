import { useState, useMemo } from 'react';
import {
  Video,
  Camera,
  Router,
  EthernetPort,
  Banknote,
  Server,
  Smartphone,
  ArrowRight,
  Search,
  Wifi,
  Plus,
  Phone,
  Copy,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useDashboardStats,
  useCamaras,
  useNvrs,
  useMaquinas,
  useServidores,
  useInternos,
} from '../hooks/useQueries';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { contarMaquinasPorTipo } from '../utils/reporteInventario';
import { useCatalogo, labelsEnumCatalogo } from '../hooks/useCatalogo';
import { ModuleHeader } from '../components/layout';

const AVATAR_COLORS = [
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
];

function getAvatarInfo(nombre) {
  if (!nombre) return { initials: 'TEL', colorClass: AVATAR_COLORS[1] };
  const clean = nombre.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  let initials = 'TEL';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash << 5) - hash + nombre.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return { initials, colorClass: AVATAR_COLORS[colorIndex] };
}

function camarasPorNvrDesdeLista(camaras, nvrs) {
  const list = Array.isArray(camaras) ? camaras : [];
  const nvrList = Array.isArray(nvrs) ? nvrs : [];
  const countBy = new Map();
  for (const cam of list) {
    const raw = cam?.nvrId;
    const id = raw != null && String(raw).trim() ? String(raw).trim() : '';
    countBy.set(id, (countBy.get(id) ?? 0) + 1);
  }
  const idsCatalogo = new Set(nvrList.map((n) => n.id).filter(Boolean));
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

function InfraestructuraDashboard() {
  const [filtroTelefono, setFiltroTelefono] = useState('');
  const [copiadoId, setCopiadoId] = useState(null);
  const [menuNuevoAbierto, setMenuNuevoAbierto] = useState(false);
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: listaNvrs = [], isLoading: nvrsLoading, error: nvrsError } = useNvrs();
  const { data: camaras = [], isLoading: camarasLoading, error: camarasError } = useCamaras();
  const { data: maquinas = [] } = useMaquinas();
  const { items: tipoMaqItems } = useCatalogo('tipos_maquina');
  const tipoMaqLabels = useMemo(() => labelsEnumCatalogo(tipoMaqItems), [tipoMaqItems]);
  const { data: servidores = [] } = useServidores();
  const { data: internos = [] } = useInternos();

  const cargando = statsLoading || nvrsLoading || camarasLoading;
  const error = statsError?.message ?? nvrsError?.message ?? camarasError?.message ?? null;

  const camarasPorNvr = useMemo(
    () => camarasPorNvrDesdeLista(camaras, listaNvrs),
    [camaras, listaNvrs],
  );

  const maquinasPorTipo = useMemo(
    () => contarMaquinasPorTipo(maquinas, tipoMaqLabels),
    [maquinas, tipoMaqLabels],
  );

  const s = stats ?? {};
  const totalNvrs = listaNvrs.length;
  const totalCamaras = camaras.length;
  const totalTelefonos = internos.length;
  const totalRouters = Number(s.totalRouters ?? 0);
  const totalSwitches = Number(s.totalSwitches ?? 0);
  const totalAccessPoints = Number(s.totalAccessPoints ?? 0);
  const totalMaquinas = maquinas.length;
  const totalServidores = servidores.length;
  const totalActivos =
    totalNvrs +
    totalCamaras +
    totalRouters +
    totalSwitches +
    totalAccessPoints +
    totalMaquinas +
    totalServidores +
    totalTelefonos;

  const subt =
    totalActivos === 0
      ? '0 ACTIVOS EN INVENTARIO'
      : `${totalActivos} ACTIVOS EN INVENTARIO`;

  const copiarInterno = (e, num, id) => {
    e.stopPropagation();
    if (!num) return;
    navigator.clipboard.writeText(String(num));
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const internosFiltrados = useMemo(() => {
    const q = filtroTelefono.toLowerCase().trim();
    if (!q) return internos;
    return internos.filter(
      (tel) =>
        (tel.asignadoA || '').toLowerCase().includes(q) ||
        (tel.numeroInterno || '').toLowerCase().includes(q) ||
        (tel.direccionIp || '').toLowerCase().includes(q) ||
        (tel.marcaModelo || '').toLowerCase().includes(q),
    );
  }, [internos, filtroTelefono]);

  if (cargando) return <StudioLoading message="Cargando infraestructura…" />;
  if (error && !stats) return <StudioError message={error} />;

  const kpis = [
    {
      title: 'NVR',
      value: totalNvrs,
      unit: 'Unidades',
      icon: Video,
      color: 'text-indigo-600',
      to: '/nvrs',
    },
    {
      title: 'Cámaras',
      value: totalCamaras,
      unit: 'Terminales CCTV',
      icon: Camera,
      color: 'text-rose-600',
      to: '/camaras',
    },
    {
      title: 'Routers',
      value: totalRouters,
      unit: 'Equipos WAN',
      icon: Router,
      color: 'text-blue-600',
      to: '/routers-switches',
    },
    {
      title: 'Switches',
      value: totalSwitches,
      unit: 'Conmutación LAN',
      icon: EthernetPort,
      color: 'text-emerald-600',
      to: '/routers-switches',
    },
    {
      title: 'Access Points',
      value: totalAccessPoints,
      unit: 'Wi-Fi corporativo',
      icon: Wifi,
      color: 'text-cyan-600',
      to: '/access-points',
    },
    {
      title: 'Tesorería',
      value: totalMaquinas,
      unit: 'Procesamiento efvo.',
      icon: Banknote,
      color: 'text-amber-600',
      to: '/maquinas-tesoreria',
    },
    {
      title: 'Servidores',
      value: totalServidores,
      unit: 'Nodos físicos/VM',
      icon: Server,
      color: 'text-slate-600',
      to: '/servidores',
    },
    {
      title: 'Teléfonos IP',
      value: totalTelefonos,
      unit: 'Internos SIP',
      icon: Smartphone,
      color: 'text-violet-600',
      to: '/telefonos',
    },
  ];

  const camarasPorNvrEntries = Object.entries(camarasPorNvr);
  const maxCamarasNvr = Math.max(1, ...camarasPorNvrEntries.map(([, n]) => Number(n) || 0));

  const routersPorUbicacion = s.porUbicacionRouters ? Object.entries(s.porUbicacionRouters) : [];
  const switchesPorUbicacion = s.porUbicacionSwitches ? Object.entries(s.porUbicacionSwitches) : [];
  const maxSwitches = Math.max(1, ...switchesPorUbicacion.map(([, n]) => Number(n) || 0));

  return (
    <div className="space-y-6 pb-12">
      {/* ── ENCABEZADO ── */}
      <ModuleHeader
        title="Infraestructura"
        badge={`${totalActivos} activos en total`}
        description="Red corporativa, videovigilancia (NVR y cámaras), equipos de tesorería y telefonía IP."
        actions={
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuNuevoAbierto((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo dispositivo</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>

            <AnimatePresence>
              {menuNuevoAbierto && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuNuevoAbierto(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden text-xs font-semibold"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Registrar en inventario
                    </div>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/camaras/nueva');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-rose-600" />
                      <span>Nueva Cámara IP</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/nvrs/nueva');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-indigo-600" />
                      <span>Nuevo NVR</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/routers-switches');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <EthernetPort className="w-4 h-4 text-emerald-600" />
                      <span>Nuevo Router o Switch</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/telefonos');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-violet-600" />
                      <span>Nuevo Teléfono IP</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/servidores');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Server className="w-4 h-4 text-slate-600" />
                      <span>Nuevo Servidor</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuNuevoAbierto(false);
                        navigate('/maquinas-tesoreria');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Banknote className="w-4 h-4 text-amber-600" />
                      <span>Máquina de Tesorería</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        }
      />

      {/* ── FILA DE 8 KPIS HORIZONTALES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.title}
              to={kpi.to}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all no-underline text-inherit"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color} shrink-0`} />
              </div>

              <div className="my-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpi.value}
                </span>
              </div>

              <span className="text-xs text-slate-400 truncate">
                {kpi.unit}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── DIRECTORIO DE TELÉFONOS IP ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Directorio de Teléfonos IP</span>
              </h2>
              <p className="text-xs text-slate-500">
                Acceso directo a internos corporativos, puestos de guardia y centrales operativas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, sector o interno..."
                className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-slate-50 text-slate-900"
                value={filtroTelefono}
                onChange={(e) => setFiltroTelefono(e.target.value)}
              />
            </div>
            <Link
              to="/telefonos"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group whitespace-nowrap shrink-0"
            >
              <span>Directorio Completo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Tabla estructurada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Puesto / Denominación</th>
                <th className="py-2.5 px-3">Sector / Ubicación</th>
                <th className="py-2.5 px-3">Estado SIP</th>
                <th className="py-2.5 px-3">Dispositivo</th>
                <th className="py-2.5 px-3 text-center">Nº Interno</th>
                <th className="py-2.5 px-3 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {internosFiltrados.slice(0, 10).map((tel) => {
                const avatar = getAvatarInfo(tel.asignadoA);
                const isActivo = (tel.estadoActual || 'ACTIVO').toUpperCase() === 'ACTIVO';
                return (
                  <tr
                    key={tel.id}
                    onClick={() => navigate('/telefonos')}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Puesto / Denominación */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${avatar.colorClass}`}
                        >
                          {avatar.initials}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {tel.asignadoA || 'Sin Asignar'}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActivo ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Sector / Ubicación */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {tel.sector || tel.ubicacion || tel.direccionIp || 'Corporativo'}
                    </td>

                    {/* Estado SIP */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActivo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActivo ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {isActivo ? 'Registrado' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Dispositivo */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {tel.marcaModelo || 'Grandstream GXP1625'}
                    </td>

                    {/* Nº Interno */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Int: {tel.numeroInterno || '—'}
                      </span>
                    </td>

                    {/* Acción Rápida */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        {tel.numeroInterno && (
                          <a
                            href={`tel:${tel.numeroInterno}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Llamar"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => copiarInterno(e, tel.numeroInterno, tel.id)}
                          title="Copiar número"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          {copiadoId === tel.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {internosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    {internos.length === 0
                      ? 'No hay teléfonos registrados en el sistema.'
                      : 'No se encontraron teléfonos que coincidan con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DISTRIBUCIÓN INFERIOR: 2 COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Cámaras por NVR y Máquinas de Tesorería */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Cámaras por NVR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Cámaras por NVR</h2>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                  {totalCamaras} Cámaras Distribuidas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 mb-4">
                Desglose distributivo de canales activos sobre almacenamiento central de video.
              </p>

              <div className="space-y-3.5">
                {camarasPorNvrEntries.map(([label, countRaw], idx) => {
                  const count = Number(countRaw) || 0;
                  const pct = totalCamaras > 0 ? ((count / totalCamaras) * 100).toFixed(1) : 0;
                  const barPct = (count / maxCamarasNvr) * 100;
                  const color = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{pct}%</span>
                          <span className="font-mono font-bold text-slate-900">{count}</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
                {camarasPorNvrEntries.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4">
                    No hay cámaras asignadas a NVRs.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Capacidad de Almacenamiento: 48TB RAID-6</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                Retención: 45 Días OK
              </span>
            </div>
          </div>

          {/* Máquinas de Tesorería por Tipo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Máquinas de Tesorería por Tipo</h2>
              </div>
              <Link
                to="/maquinas-tesoreria"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {Object.entries(maquinasPorTipo).map(([tipo, cant]) => (
                <div
                  key={tipo}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wide">
                    <Banknote className="w-3.5 h-3.5 text-amber-600" />
                    <span>{tipo}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    {cant} unid.
                  </span>
                </div>
              ))}
              {Object.keys(maquinasPorTipo).length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">
                  No hay máquinas registradas por tipo.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Routers y Switches por Ubicación */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Routers por Ubicación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Router className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Routers por Ubicación</h2>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                {totalRouters} Unidades
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Desglose distributivo del equipamiento de enrutamiento y borde.
            </p>

            <div className="space-y-3">
              {routersPorUbicacion.map(([ubicacion, cantRaw]) => {
                const cant = Number(cantRaw) || 0;
                return (
                  <div
                    key={ubicacion}
                    className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{ubicacion}</span>
                      </div>
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {cant}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(100, cant * 50)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {routersPorUbicacion.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">
                  No hay routers registrados por ubicación.
                </p>
              )}
            </div>
          </div>

          {/* Switches por Ubicación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <EthernetPort className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Switches por Ubicación</h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                  {totalSwitches} Unidades
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 mb-4">
                Topología de conmutación de red y provisión PoE+.
              </p>

              <div className="space-y-3.5">
                {switchesPorUbicacion.map(([ubicacion, cantRaw], idx) => {
                  const cant = Number(cantRaw) || 0;
                  const barPct = (cant / maxSwitches) * 100;
                  const color = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div key={ubicacion} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{ubicacion}</span>
                        <span className="font-mono font-bold text-slate-900">{cant} unid.</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
                {switchesPorUbicacion.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">
                    No hay switches registrados por ubicación.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Puertos PoE Utilizados: 184 / 240</span>
              <span className="font-semibold text-slate-700">Carga Energética: 1.8 kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfraestructuraDashboard;
