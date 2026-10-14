import { Suspense, useState, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEventosHardware } from '../hooks/useQueries';
import TableFilters from '../components/TableFilters';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioFilterBar,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
  studioRowClass,
} from '../components/studio/StudioUi';
import { ShieldAlert, Monitor, HardDrive, Cpu, MemoryStick } from 'lucide-react';

const ESTADOS_SEGUIMIENTO = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'autorizado', label: 'Autorizado' },
  { value: 'no_autorizado', label: 'No autorizado' },
  { value: 'falso_positivo', label: 'Falso positivo' },
];

const TIPOS_COMPONENTE = [
  { value: '', label: 'Todos' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'ram', label: 'RAM' },
  { value: 'disco', label: 'Disco' },
  { value: 'procesador', label: 'Procesador' },
];

const TIPO_EVENTO_LABELS = {
  agregado: 'Agregado',
  removido: 'Removido',
  modificado: 'Modificado',
};

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_revision: 'bg-blue-100 text-blue-800 border-blue-200',
  autorizado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  no_autorizado: 'bg-red-100 text-red-800 border-red-200',
  falso_positivo: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TIPO_EVENTO_BADGE = {
  agregado: 'bg-green-50 text-green-700',
  removido: 'bg-red-50 text-red-700',
  modificado: 'bg-orange-50 text-orange-700',
};

function iconoComponente(tipo) {
  switch (tipo) {
    case 'monitor': return <Monitor className="w-4 h-4" />;
    case 'disco': return <HardDrive className="w-4 h-4" />;
    case 'procesador': return <Cpu className="w-4 h-4" />;
    case 'ram': return <MemoryStick className="w-4 h-4" />;
    default: return <ShieldAlert className="w-4 h-4" />;
  }
}

function fmtFecha(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtEstado(estado) {
  const found = ESTADOS_SEGUIMIENTO.find(e => e.value === estado);
  return found ? found.label : estado ?? '—';
}

function EventosHardwareOutlet() {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}

function EventosHardwareList() {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroComponente, setFiltroComponente] = useState('');
  const [buscar, setBuscar] = useState('');

  const queryParams = useMemo(() => {
    const p = {};
    if (filtroEstado) p.estado = filtroEstado;
    return p;
  }, [filtroEstado]);

  const { data: eventos = [], isLoading, error } = useEventosHardware(queryParams);

  const eventosFiltrados = useMemo(() => {
    let result = eventos;
    if (filtroComponente) {
      result = result.filter(ev => ev.tipoComponente === filtroComponente);
    }
    if (buscar.trim()) {
      const b = buscar.toLowerCase();
      result = result.filter(ev =>
        (ev.hostname || '').toLowerCase().includes(b) ||
        (ev.uuid || '').toLowerCase().includes(b) ||
        (ev.fingerprint || '').toLowerCase().includes(b)
      );
    }
    return result;
  }, [eventos, filtroComponente, buscar]);

  if (isLoading) return <><StudioLoading /><EventosHardwareOutlet /></>;
  if (error) return <><StudioError message="No se pudieron cargar los eventos de hardware" /><EventosHardwareOutlet /></>;

  return (
    <>
    <StudioPageShell
      title={`Auditoría de Hardware (${eventosFiltrados.length})`}
      subtitle="Cambios de hardware detectados por el agente en las PCs del parque."
      actions={null}
    >
      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search value={buscar} onChange={setBuscar} placeholder="Buscar PC, UUID..." />
        </TableFilters>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="font-bold text-slate-600 text-xs">Estado:</label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
          >
            {ESTADOS_SEGUIMIENTO.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <label className="font-bold text-slate-600 text-xs ml-2">Componente:</label>
          <select
            value={filtroComponente}
            onChange={e => setFiltroComponente(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0c66e4]"
          >
            {TIPOS_COMPONENTE.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </StudioFilterBar>

      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">
          No hay eventos {filtroEstado ? `con estado "${fmtEstado(filtroEstado)}"` : ''} para mostrar.
        </div>
      ) : (
        <div className="overflow-x-auto pt-2">
          <table className={studioTableClass()}>
            <thead className={studioTheadClass()}>
              <tr>
                <th className={studioThClass()}>PC</th>
                <th className={studioThClass()}>Componente</th>
                <th className={studioThClass()}>Evento</th>
                <th className={studioThClass()}>Fingerprint</th>
                <th className={studioThClass()}>Estado</th>
                <th className={studioThClass()}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {eventosFiltrados.map(ev => (
                <tr
                  key={ev.id}
                  className={studioRowClass(true)}
                  onClick={() => navigate(`/eventos-hardware/${encodeURIComponent(ev.id)}`)}
                >
                  <td className={studioTdClass()}>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{ev.hostname || '—'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.uuid}</span>
                    </div>
                  </td>
                  <td className={studioTdClass()}>
                    <div className="flex items-center gap-1.5">
                      {iconoComponente(ev.tipoComponente)}
                      <span className="font-semibold capitalize">{ev.tipoComponente}</span>
                    </div>
                  </td>
                  <td className={studioTdClass()}>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${TIPO_EVENTO_BADGE[ev.tipoEvento] ?? ''}`}>
                      {TIPO_EVENTO_LABELS[ev.tipoEvento] ?? ev.tipoEvento}
                    </span>
                  </td>
                  <td className={studioTdClass()}>
                    <span className="font-mono text-xs text-slate-500">{ev.fingerprint}</span>
                  </td>
                  <td className={studioTdClass()}>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${ESTADO_BADGE[ev.estadoSeguimiento] ?? ''}`}>
                      {fmtEstado(ev.estadoSeguimiento)}
                    </span>
                    {ev.leido === false && (
                      <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-blue-500" title="No leído" />
                    )}
                  </td>
                  <td className={studioTdClass()}>
                    <span className="text-xs text-slate-500">{fmtFecha(ev.timestamp)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StudioPageShell>
    <EventosHardwareOutlet />
    </>
  );
}

export default EventosHardwareList;
