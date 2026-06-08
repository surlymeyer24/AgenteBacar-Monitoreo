import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { prefetchPerifericosAgenteListados } from '../api/perifericosAgenteApi';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchComputadoras } from '../api/computadoraApi';
import { fetchCamaras } from '../api/camaraApi';
import { textoConexionAgente } from '../utils/estadoConexion';
import {
  Monitor, Camera, Keyboard, HardDrive, Cpu, 
  CheckCircle2, AlertTriangle, ShieldAlert,
  ClipboardList, Users, Layers, Activity, Plus, Smartphone, ArrowRight, Search
} from 'lucide-react';
import { fetchInternos } from '../api/internoIpApi';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#36b37e', '#ff5630']; // Tailwind emerald and red equivalent

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [computadoras, setComputadoras] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [internos, setInternos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('type');
  const [filtroTelefono, setFiltroTelefono] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([
      fetchDashboardStats(),
      fetchComputadoras().catch(() => []),
      fetchCamaras().catch(() => []),
      fetchInternos().catch(() => []),
    ])
      .then(([statsData, pcs, cams, ints]) => {
        setStats(statsData);
        setComputadoras(pcs ?? []);
        setCamaras(cams ?? []);
        setInternos(ints ?? []);
      })
      .catch(() => setError('No se pudo cargar el dashboard. Verificá que el servidor esté en ejecución.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) prefetchPerifericosAgenteListados();
    };
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 5000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }
    const id = setTimeout(run, 3000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  if (cargando && !stats) return <div className="p-8 text-center text-slate-500">Cargando dashboard...</div>;
  if (error && !stats) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  const s = stats ?? {};
  const totalPc = Number(s.totalComputadoras ?? 0);
  const totalCamaras = Number(s.totalCamaras ?? 0);
  const totalPerifericos = Number(s.totalPerifericos ?? 0);
  const totalTelefonos = internos.length;
  const activas = Number(s.computadorasSyncMenos10Min ?? 0);
  const inactivas = totalPc - activas;

  const pieData = [
    { name: `Activas: ${activas}`, value: activas },
    { name: `Inactivas: ${inactivas}`, value: Math.max(inactivas, 0) },
  ];

  const porTipo = s.perifericosPorTipo ? Object.entries(s.perifericosPorTipo).filter(([, n]) => Number(n) > 0) : [];
  const maxPerif = Math.max(1, ...porTipo.map(([, n]) => Number(n) || 0));

  return (
    <div className="space-y-6">
      {/* Top Banner / Corporate Greeting */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Consola de Control de Inventario IT</h1>
          <p className="text-slate-500 text-sm">Estado de activos, stock de periféricos y asignaciones en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/computadoras/nueva')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Registrar Computadora
          </button>
        </div>
      </div>

      {error && stats && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Total Computadoras</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalPc}</span>
              <span className="text-xs text-slate-500">unid.</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Computadoras Activas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">{activas}</span>
              <span className="text-xs text-slate-500">online</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Cámaras Instaladas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalCamaras}</span>
              <span className="text-xs text-slate-500">equipos</span>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Periféricos Totales</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalPerifericos}</span>
              <span className="text-xs text-slate-500">detectados</span>
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <Keyboard className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Teléfonos IP</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalTelefonos}</span>
              <span className="text-xs text-slate-500">equipos</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick IP Telephony Directory row */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
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
              onClick={() => navigate('/telefonos')}
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
              onClick={() => navigate('/telefonos')}
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

      {/* Main Grid Content Area: Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Asset Breakdown Visualizer - Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-slate-900">Métricas de Periféricos</h2>
              <p className="text-xs text-slate-500">Análisis distributivo físico por tipo de periférico.</p>
            </div>
          </div>

          <div className="space-y-5 py-2">
            {porTipo.length === 0 ? (
              <p className="text-sm text-slate-500">Ningún periférico reportado en las PCs.</p>
            ) : (
              <div className="space-y-4.5">
                {porTipo.map(([label, raw], index) => {
                  const n = Number(raw) || 0;
                  const percentage = (n / maxPerif) * 100;
                  const colors = ['bg-[#0c66e4]', 'bg-[#00a3bf]', 'bg-[#6554c0]', 'bg-[#ff5630]', 'bg-[#36b37e]', 'bg-[#ffab00]'];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={label} className="group space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="text-slate-400 group-hover:text-amber-500 transition-colors">
                            <Cpu className="w-4 h-4" />
                          </span>
                          <span>{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900 font-mono">{n}</span>
                        </div>
                      </div>
                      
                      {/* Interactive Bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Center & Critical Alerts - Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col space-y-4">
          <div className="space-y-0.5 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Estado de Computadoras</h2>
            <p className="text-xs text-slate-500">Proporción de equipos activos en la red.</p>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Computadoras */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              Listado de Computadoras
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 text-slate-500 font-medium text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Especificaciones</th>
                  <th className="px-4 py-3 text-right">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computadoras.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin datos</td></tr>
                ) : (
                  computadoras.map((c) => {
                    const conexionAgente = textoConexionAgente(c);
                    const isActive = (conexionAgente || '').toLowerCase() === 'activo' || (conexionAgente || '').toLowerCase() === 'activa';
                    return (
                      <tr
                        key={c.uuid}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/computadoras/${c.uuid}`)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{c.hostname ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {conexionAgente}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{c.procesador?.nombre ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{c.ubicacion ?? '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Camaras */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              Cámaras Instaladas
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 text-slate-500 font-medium text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {camaras.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Sin datos</td></tr>
                ) : (
                  camaras.map((cam, i) => (
                    <tr
                      key={cam.id ?? i}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate(
                          cam.nvrId
                            ? `/nvrs/${encodeURIComponent(cam.nvrId)}`
                            : `/camaras/${encodeURIComponent(cam.id ?? '')}`,
                        )}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{cam.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{cam.tipo ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{cam.ubicacion ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
