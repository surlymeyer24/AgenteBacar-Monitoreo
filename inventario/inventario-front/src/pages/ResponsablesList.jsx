import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Search, Monitor, RefreshCw } from 'lucide-react';
import { useResponsables } from '../hooks/useQueries';
import { reconstruirResponsables } from '../api/responsableApi';
import { StudioPageShell, StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-AR');
}

export default function ResponsablesList() {
  const { data: responsables = [], isLoading, error, refetch } = useResponsables();
  const [buscar, setBuscar] = useState('');
  const [reconstruyendo, setReconstruyendo] = useState(false);
  const [msg, setMsg] = useState(null);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return responsables;
    return responsables.filter(r =>
      (r.nombre ?? '').toLowerCase().includes(q) || (r.id ?? '').toLowerCase().includes(q),
    );
  }, [responsables, buscar]);

  async function handleReconstruir() {
    if (!window.confirm('¿Reconstruir el índice de responsables desde todas las computadoras?')) return;
    setReconstruyendo(true);
    setMsg(null);
    try {
      await reconstruirResponsables();
      await refetch();
      setMsg({ tipo: 'ok', texto: 'Índice reconstruido correctamente.' });
    } catch {
      setMsg({ tipo: 'err', texto: 'No se pudo reconstruir el índice.' });
    } finally {
      setReconstruyendo(false);
    }
  }

  if (isLoading) return <StudioLoading message="Cargando responsables…" />;
  if (error) return <StudioError message="No se pudo cargar la lista de responsables." />;

  return (
    <StudioPageShell
      title="Responsables de equipamiento"
      subtitle={`${filtrados.length} persona(s) con equipos asignados en inventario.`}
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
            />
          </div>
          <WriteGate>
            <button
              type="button"
              onClick={handleReconstruir}
              disabled={reconstruyendo}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reconstruyendo ? 'animate-spin' : ''}`} />
              Reconstruir índice
            </button>
          </WriteGate>
        </div>
        {msg && (
          <p className={`text-sm font-medium ${msg.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
            {msg.texto}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3 text-center">Equipos</th>
              <th className="px-4 py-3 hidden md:table-cell">Última asignación</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  {responsables.length === 0
                    ? 'Aún no hay asignaciones registradas. Al guardar "Asignado a" en una PC se indexará acá.'
                    : 'Ningún responsable coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              filtrados.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                      <UserRound className="w-4 h-4 text-violet-600 shrink-0" />
                      {r.nombre ?? r.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 font-bold text-xs">
                      {r.cantidadEquipos ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                    {fmtFecha(r.actualizadoAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/responsables/${encodeURIComponent(r.id)}`}
                      className="text-sm font-bold text-accent hover:text-accent-hover"
                    >
                      Ver equipos
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StudioPageShell>
  );
}
