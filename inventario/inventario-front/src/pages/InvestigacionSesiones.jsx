import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useComputadorasSesion } from '../hooks/useComputadorasSesion';
import { useSesionBloqueos } from '../hooks/useSesionBloqueos';
import { usePermisos } from '../hooks/usePermisos';
import { sincronizarHistorialBloqueosInicial } from '../api/sesionBloqueoApi';
import { useCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';
import { formatTimestamp } from '../lib/formatFirestore';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioFilterBar,
} from '../components/studio/StudioUi';
import { nivelActividadSync } from '../utils/syncActividad';

const PIE_COLORS = {
  activa: '#36b37e',
  bloqueada: '#ffab00',
  sin_usuario: '#6554c0',
  sin_datos: '#cbd5e1',
};

const LABEL_ESTADO = {
  activa: 'Activa',
  bloqueada: 'Bloqueada',
  sin_usuario: 'Sin usuario',
  sin_datos: 'Sin datos',
};

const LABEL_ESTADO_ANTERIOR = {
  activa: 'Activa',
  bloqueada: 'Bloqueada',
  sin_usuario: 'Sin usuario',
  sin_datos: 'Sin datos previos',
};

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

function SortHeader({ label, sortKey, current, direction, onSort }) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active ? (
        direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : null}
    </button>
  );
}

function formatHoras(h) {
  if (h == null || h === 0) return '—';
  return `${h.toFixed(1)}h`;
}

function estadoBadge(estado) {
  const cls = {
    activa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bloqueada: 'bg-amber-50 text-amber-700 border-amber-200',
    sin_usuario: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${cls[estado] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {LABEL_ESTADO[estado] ?? estado ?? 'Sin datos'}
    </span>
  );
}

function bloqueoBadge(min) {
  if (min == null) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-50 text-red-600 border border-red-200">
        Sin bloqueo
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
      {min} min
    </span>
  );
}

export default function InvestigacionSesiones() {
  const { computadoras, loading, error } = useComputadorasSesion();
  const { bloqueos, loading: loadingBloqueos, error: errorBloqueos, refresh: refreshBloqueos } = useSesionBloqueos();
  const { esAdministrador } = usePermisos();
  const { items: ubicItems } = useCatalogo('ubicaciones_computadora');
  const [syncMsg, setSyncMsg] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBloqueo, setFiltroBloqueo] = useState('');
  const [busquedaBloqueos, setBusquedaBloqueos] = useState('');
  const [sortKey, setSortKey] = useState('hostname');
  const [sortDir, setSortDir] = useState('asc');

  const conSesion = useMemo(
    () => computadoras.filter(c => {
      const nivel = nivelActividadSync(c);
      return nivel === 'activo' || nivel === 'intermedio' || c.sesion_estado != null;
    }),
    [computadoras],
  );

  const stats = useMemo(() => {
    const total = conSesion.length;
    const porEstado = { activa: 0, bloqueada: 0, sin_usuario: 0, sin_datos: 0 };
    let conBloqueo = 0;
    let sinBloqueo = 0;
    let sumaHorasActiva = 0;
    let sumaHorasBloqueada = 0;
    let sumaHorasSinUsuario = 0;
    let maxContinuaGlobal = 0;
    let pcConResumen = 0;

    for (const c of conSesion) {
      const est = c.sesion_estado ?? 'sin_datos';
      porEstado[est] = (porEstado[est] ?? 0) + 1;

      if (c.sesion_bloqueo_auto_min != null) conBloqueo++;
      else sinBloqueo++;

      const r = c.sesion_resumen_hoy;
      if (r) {
        pcConResumen++;
        sumaHorasActiva += r.horas_activa;
        sumaHorasBloqueada += r.horas_bloqueada;
        sumaHorasSinUsuario += r.horas_sin_usuario;
        if (r.max_horas_activa_continua > maxContinuaGlobal) {
          maxContinuaGlobal = r.max_horas_activa_continua;
        }
      }
    }

    return {
      total,
      porEstado,
      conBloqueo,
      sinBloqueo,
      promedioActiva: pcConResumen ? sumaHorasActiva / pcConResumen : 0,
      promedioBloqueada: pcConResumen ? sumaHorasBloqueada / pcConResumen : 0,
      promedioSinUsuario: pcConResumen ? sumaHorasSinUsuario / pcConResumen : 0,
      maxContinuaGlobal,
      pcConResumen,
    };
  }, [conSesion]);

  const pieData = useMemo(
    () =>
      Object.entries(stats.porEstado)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: LABEL_ESTADO[k] ?? k, value: v, key: k })),
    [stats.porEstado],
  );

  const bloqueoData = useMemo(
    () => [
      { name: 'Con bloqueo auto', value: stats.conBloqueo },
      { name: 'Sin bloqueo auto', value: stats.sinBloqueo },
    ].filter(d => d.value > 0),
    [stats.conBloqueo, stats.sinBloqueo],
  );

  const promedioBarData = useMemo(
    () => [
      { name: 'Activa', horas: +stats.promedioActiva.toFixed(1) },
      { name: 'Bloqueada', horas: +stats.promedioBloqueada.toFixed(1) },
      { name: 'Sin usuario', horas: +stats.promedioSinUsuario.toFixed(1) },
    ],
    [stats.promedioActiva, stats.promedioBloqueada, stats.promedioSinUsuario],
  );

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const lista = useMemo(() => {
    let list = [...conSesion];

    if (busqueda) {
      const q = busqueda.toLowerCase();
      list = list.filter(c =>
        (c.hostname ?? '').toLowerCase().includes(q) ||
        (c.ubicacion ?? '').toLowerCase().includes(q),
      );
    }
    if (filtroEstado) {
      list = list.filter(c => (c.sesion_estado ?? 'sin_datos') === filtroEstado);
    }
    if (filtroBloqueo === 'con') {
      list = list.filter(c => c.sesion_bloqueo_auto_min != null);
    } else if (filtroBloqueo === 'sin') {
      list = list.filter(c => c.sesion_bloqueo_auto_min == null);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'hostname':
          va = (a.hostname ?? '').toLowerCase();
          vb = (b.hostname ?? '').toLowerCase();
          return va < vb ? -dir : va > vb ? dir : 0;
        case 'estado':
          va = a.sesion_estado ?? '';
          vb = b.sesion_estado ?? '';
          return va < vb ? -dir : va > vb ? dir : 0;
        case 'bloqueo':
          va = a.sesion_bloqueo_auto_min ?? 9999;
          vb = b.sesion_bloqueo_auto_min ?? 9999;
          return (va - vb) * dir;
        case 'horas_activa':
          va = a.sesion_resumen_hoy?.horas_activa ?? 0;
          vb = b.sesion_resumen_hoy?.horas_activa ?? 0;
          return (va - vb) * dir;
        case 'max_continua':
          va = a.sesion_resumen_hoy?.max_horas_activa_continua ?? 0;
          vb = b.sesion_resumen_hoy?.max_horas_activa_continua ?? 0;
          return (va - vb) * dir;
        default:
          return 0;
      }
    });

    return list;
  }, [conSesion, busqueda, filtroEstado, filtroBloqueo, sortKey, sortDir]);

  const bloqueosFiltrados = useMemo(() => {
    if (!busquedaBloqueos) return bloqueos;
    const q = busquedaBloqueos.toLowerCase();
    return bloqueos.filter(b =>
      (b.hostname ?? '').toLowerCase().includes(q) ||
      (b.computadora_id ?? '').toLowerCase().includes(q) ||
      (b.ubicacion ?? '').toLowerCase().includes(q),
    );
  }, [bloqueos, busquedaBloqueos]);

  const sincronizarHistorial = useCallback(async () => {
    setSyncMsg(null);
    setSyncing(true);
    try {
      const res = await sincronizarHistorialBloqueosInicial();
      refreshBloqueos();
      setSyncMsg(`Listo: ${res.registrados ?? 0} bloqueo(s) registrado(s).`);
    } catch (err) {
      setSyncMsg(err.message || 'No se pudo sincronizar el historial');
    } finally {
      setSyncing(false);
    }
  }, [refreshBloqueos]);

  const bloqueosHoy = useMemo(() => {
    const hoy = new Date().toLocaleDateString('es-AR');
    return bloqueos.filter(b => {
      if (!b.bloqueado_en?.seconds) return false;
      const d = new Date(b.bloqueado_en.seconds * 1000);
      return d.toLocaleDateString('es-AR') === hoy;
    }).length;
  }, [bloqueos]);

  if (loading) return <StudioLoading message="Cargando datos de sesión…" />;
  if (error) return <StudioError message={error} />;

  return (
    <div className="space-y-6">
      <StudioPageShell
        title="Investigación"
        subtitle="Datos de sesión Windows — recolección activa para decidir estrategia de monitoreo de monitores"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="PCs reportando" value={stats.total} />
        <KpiCard
          label="Bloqueos hoy"
          value={bloqueosHoy}
          color={bloqueosHoy > 0 ? 'text-violet-600' : 'text-slate-900'}
          sub={`${bloqueos.length} en historial`}
        />
        <KpiCard
          label="Sin bloqueo auto"
          value={stats.sinBloqueo}
          color={stats.sinBloqueo > 0 ? 'text-red-600' : 'text-emerald-600'}
          sub={stats.total ? `${((stats.sinBloqueo / stats.total) * 100).toFixed(0)}% del parque` : null}
        />
        <KpiCard
          label="Prom. activa hoy"
          value={formatHoras(stats.promedioActiva)}
          sub={`${stats.pcConResumen} PCs con resumen`}
        />
        <KpiCard
          label="Max continua"
          value={formatHoras(stats.maxContinuaGlobal)}
          color={stats.maxContinuaGlobal > 8 ? 'text-amber-600' : 'text-slate-900'}
          sub="Mayor racha activa sin bloqueo"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard titulo="Estado actual de sesión" subtitulo="Distribución en tiempo real">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map(d => (
                    <Cell key={d.key} fill={PIE_COLORS[d.key] ?? '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos aún.</p>
          )}
        </ChartCard>

        <ChartCard titulo="Bloqueo automático" subtitulo="PCs con/sin política de bloqueo">
          {bloqueoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bloqueoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  <Cell fill="#36b37e" />
                  <Cell fill="#ff5630" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Sin datos aún.</p>
          )}
        </ChartCard>

        <ChartCard titulo="Promedio horas hoy" subtitulo="Distribución media del tiempo de sesión">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={promedioBarData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={v => `${v}h`} />
              <Bar dataKey="horas" fill="#0c66e4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filtros */}
      <StudioFilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar hostname o ubicación…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="bloqueada">Bloqueada</option>
          <option value="sin_usuario">Sin usuario</option>
          <option value="sin_datos">Sin datos</option>
        </select>
        <select
          value={filtroBloqueo}
          onChange={e => setFiltroBloqueo(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Bloqueo: todos</option>
          <option value="con">Con bloqueo auto</option>
          <option value="sin">Sin bloqueo auto</option>
        </select>
      </StudioFilterBar>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">
                  <SortHeader label="Hostname" sortKey="hostname" current={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">
                  <SortHeader label="Estado" sortKey="estado" current={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="py-3 px-4">
                  <SortHeader label="Bloqueo auto" sortKey="bloqueo" current={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="py-3 px-4">
                  <SortHeader label="Activa hoy" sortKey="horas_activa" current={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="py-3 px-4">Bloqueada hoy</th>
                <th className="py-3 px-4">Sin usuario</th>
                <th className="py-3 px-4">
                  <SortHeader label="Max continua" sortKey="max_continua" current={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="py-3 px-4">Transiciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No hay PCs con datos de sesión{busqueda || filtroEstado || filtroBloqueo ? ' para estos filtros' : ''}.
                  </td>
                </tr>
              ) : (
                lista.map(c => {
                  const r = c.sesion_resumen_hoy;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">{c.hostname ?? c.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {c.ubicacion ? labelDeCatalogo(ubicItems, c.ubicacion) : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{estadoBadge(c.sesion_estado)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{bloqueoBadge(c.sesion_bloqueo_auto_min)}</td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">{formatHoras(r?.horas_activa)}</td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">{formatHoras(r?.horas_bloqueada)}</td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">{formatHoras(r?.horas_sin_usuario)}</td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-medium">
                        {r?.max_horas_activa_continua > 0 ? (
                          <span className={r.max_horas_activa_continua > 4 ? 'text-amber-600' : ''}>
                            {formatHoras(r.max_horas_activa_continua)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">{r?.transiciones ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {lista.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {lista.length} {lista.length === 1 ? 'equipo' : 'equipos'}
            {r_fecha(lista) ? ` — resumen del ${r_fecha(lista)}` : ''}
          </div>
        )}
      </div>

      {/* Historial de bloqueos */}
      <ChartCard
        titulo="Historial de bloqueos"
        subtitulo="Cada vez que una PC pasa a sesión bloqueada se registra fecha y hora (detección automática del backend)"
        className="!p-0 overflow-hidden"
      >
        <div className="px-5 pt-0 pb-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por hostname o ubicación…"
              value={busquedaBloqueos}
              onChange={e => setBusquedaBloqueos(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          {esAdministrador && bloqueos.length === 0 && !loadingBloqueos && !errorBloqueos ? (
            <button
              type="button"
              onClick={sincronizarHistorial}
              disabled={syncing}
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
            >
              {syncing ? 'Sincronizando…' : 'Importar bloqueos actuales'}
            </button>
          ) : null}
        </div>
        {syncMsg ? <p className="px-5 pb-2 text-sm text-slate-600 m-0">{syncMsg}</p> : null}
        {errorBloqueos ? (
          <p className="px-5 pb-5 text-sm text-red-600">{errorBloqueos}</p>
        ) : loadingBloqueos ? (
          <p className="px-5 pb-8 text-sm text-slate-400 text-center">Cargando historial…</p>
        ) : (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left border-collapse text-sm text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha y hora</th>
                  <th className="py-3 px-4">Hostname</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Estado anterior</th>
                  <th className="py-3 px-4">Bloqueo auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bloqueosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      {bloqueos.length === 0
                        ? 'Sin eventos aún. El backend registra cada transición a "bloqueada". Si el historial arrancó vacío, usá "Importar bloqueos actuales" (admin).'
                        : 'Sin resultados para este filtro.'}
                    </td>
                  </tr>
                ) : (
                  bloqueosFiltrados.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-medium text-slate-900">
                        {formatTimestamp(b.bloqueado_en)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">{b.hostname ?? b.computadora_id ?? '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {b.ubicacion ? labelDeCatalogo(ubicItems, b.ubicacion) : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {LABEL_ESTADO_ANTERIOR[b.estado_anterior] ?? b.estado_anterior ?? '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{bloqueoBadge(b.sesion_bloqueo_auto_min)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {bloqueosFiltrados.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {bloqueosFiltrados.length} {bloqueosFiltrados.length === 1 ? 'evento' : 'eventos'}
            {busquedaBloqueos ? ` (de ${bloqueos.length} total)` : ''}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function r_fecha(lista) {
  for (const c of lista) {
    if (c.sesion_resumen_hoy?.fecha) return c.sesion_resumen_hoy.fecha;
  }
  return null;
}
