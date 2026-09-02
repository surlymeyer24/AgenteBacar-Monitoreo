import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Keyboard, Printer, Monitor, Mouse, Webcam, Volume2, Mic, PackageOpen, Puzzle, Tv2, Smartphone,
} from 'lucide-react';
import { useDashboardStats, usePerifericosM, useTelevisores, useCelulares, useMonitoresAgente } from '../hooks/useQueries';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioMetricCard,
} from '../components/studio/StudioUi';

const BAR_COLORS = ['#0c66e4', '#6554c0', '#36b37e', '#ff5630', '#ffab00', '#00a3bf', '#8777d9'];

const LINKS = [
  { key: 'Impresoras', path: '/perifericos/impresoras', icon: Printer, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'Monitores', path: '/perifericos/monitores', icon: Monitor, color: 'bg-blue-50 text-blue-600' },
  { key: 'Teclados', path: '/perifericos/teclados', icon: Keyboard, color: 'bg-orange-50 text-orange-600' },
  { key: 'Mouse', path: '/perifericos/mouse', icon: Mouse, color: 'bg-indigo-50 text-indigo-600' },
  { key: 'Webcams', path: '/perifericos/webcams', icon: Webcam, color: 'bg-rose-50 text-rose-600' },
  { key: 'Parlantes', path: '/perifericos/parlantes', icon: Volume2, color: 'bg-purple-50 text-purple-600' },
  { key: 'Micrófonos', path: '/perifericos/microfonos', icon: Mic, color: 'bg-teal-50 text-teal-600' },
  { key: 'Televisores', path: '/perifericos/televisores', icon: Tv2, color: 'bg-violet-50 text-violet-600' },
  { key: 'Celulares', path: '/perifericos/celulares', icon: Smartphone, color: 'bg-sky-50 text-sky-600' },
];

function PerifericosDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: stockManual = [] } = usePerifericosM();
  const { data: televisores = [] } = useTelevisores();
  const { data: celularesList = [] } = useCelulares();
  const { data: monitores = [] } = useMonitoresAgente();

  const cargando = statsLoading;
  const error = null;
  const televisoresCount = televisores.length;
  const celularesCount = celularesList.length;

  const porTipo = useMemo(() => {
    const raw = stats?.perifericosPorTipo ?? {};
    return Object.entries(raw).filter(([, n]) => Number(n) > 0);
  }, [stats]);

  const monitoresPorPulgada = useMemo(() => {
    const agrupado = {};
    for (const m of monitores) {
      const p = Number(m.pulgadas);
      const key = Number.isFinite(p) && p > 0 ? `${Math.round(p)}"` : 'Sin dato';
      agrupado[key] = (agrupado[key] || 0) + 1;
    }
    return Object.entries(agrupado).sort((a, b) => {
      if (a[0] === 'Sin dato') return 1;
      if (b[0] === 'Sin dato') return -1;
      return parseInt(a[0]) - parseInt(b[0]);
    });
  }, [monitores]);

  const maxMonPulgada = Math.max(1, ...monitoresPorPulgada.map(([, n]) => n));

  const maxPerif = Math.max(1, ...porTipo.map(([, n]) => Number(n) || 0));
  const totalAgente = Number(stats?.totalPerifericos ?? 0);
  const totalManual = stockManual.length;

  if (cargando) return <StudioLoading message="Cargando periféricos…" />;
  if (error && !stats) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title="Dashboard de Periféricos"
      subtitle={`${totalAgente} detectados por agente · ${totalManual} en stock manual · ${televisoresCount} televisores · ${celularesCount} celulares.`}
    >
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium mb-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <StudioMetricCard
          title="Total agente"
          value={totalAgente}
          subtitle="detectados"
          icon={Puzzle}
          iconClass="bg-orange-50 text-orange-600"
          to="/perifericos"
        />
        <StudioMetricCard
          title="Stock manual"
          value={totalManual}
          subtitle="unidades"
          icon={PackageOpen}
          iconClass="bg-slate-100 text-slate-600"
          to="/perifericos/stock"
        />
        {LINKS.slice(0, 2).map(link => {
          const count = link.key === 'Televisores'
            ? televisoresCount
            : link.key === 'Celulares'
              ? celularesCount
              : Number(stats?.perifericosPorTipo?.[link.key] ?? 0);
          return (
            <StudioMetricCard
              key={link.key}
              title={link.key}
              value={count}
              subtitle="unid."
              icon={link.icon}
              iconClass={link.color}
              to={link.path}
            />
          );
        })}
      </div>

      {monitoresPorPulgada.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 mb-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Monitores por tamaño</h2>
            <p className="text-sm text-slate-500 mt-0.5">Cantidad de monitores agrupados por pulgadas ({monitores.length} total).</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {monitoresPorPulgada.map(([label, count]) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <Monitor className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-bold text-slate-900">{count}</span>
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxMonPulgada) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Por tipo (agente)</h2>
            <p className="text-sm text-slate-500 mt-0.5">Desglose de periféricos reportados en PCs.</p>
          </div>
          {porTipo.length === 0 ? (
            <p className="text-base text-slate-500">Sin periféricos reportados.</p>
          ) : (
            <div className="space-y-4">
              {porTipo.map(([label, raw], index) => {
                const n = Number(raw) || 0;
                const pct = (n / maxPerif) * 100;
                const link = LINKS.find(l => l.key === label);
                return (
                  <div
                    key={label}
                    className="space-y-1 cursor-pointer group"
                    onClick={() => link && navigate(link.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && link && navigate(link.path)}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 group-hover:text-blue-600">{label}</span>
                      <span className="font-semibold text-slate-900 font-mono">{n}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Accesos rápidos</h2>
            <p className="text-sm text-slate-500 mt-0.5">Listados detallados por categoría.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map(link => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left"
              >
                <span className={`p-1.5 rounded-lg ${link.color}`}>
                  <link.icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-800">{link.key}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/perifericos/stock')}
              className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-left col-span-2"
            >
              <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                <PackageOpen className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-slate-800">Stock manual ({totalManual})</span>
            </button>
          </div>
        </div>
      </div>
    </StudioPageShell>
  );
}

export default PerifericosDashboard;
