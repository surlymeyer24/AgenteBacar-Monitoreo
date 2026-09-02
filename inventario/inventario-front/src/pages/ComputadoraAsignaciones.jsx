import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  updateResponsableInventario,
  updateEstado,
} from '../api/computadoraApi';
import { useComputadorasList } from '../context/ComputadorasListContext';
import ComputadoraSubnav from '../components/ComputadoraSubnav';
import { UBICACIONES_COMPUTADORA, labelUbicacionEnum, coincideUbicacionFiltro } from '../constants/ubicaciones';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import WriteGate from '../components/WriteGate';
import { usePermisos } from '../hooks/usePermisos';

/** Orden de solapas: Asignadas → Baja → Sin asignar → Mantenimiento */
const SOLAPAS_ESTADO = [
  { key: 'ASIGNADA', label: 'Asignadas' },
  { key: 'BAJA', label: 'Baja' },
  { key: 'SIN_ASIGNAR', label: 'Sin asignar' },
  { key: 'EN_MANTENIMIENTO', label: 'Mantenimiento' },
];

/** Compara `estadoActual` del DTO (nombre legible o nombre de enum) con una solapa. */
function resolverSolapaParaEstado(estadoActual) {
  const raw = (estadoActual ?? '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const { key } of SOLAPAS_ESTADO) {
    const label = ESTADO_OPERATIVO_LABELS[key];
    if (
      raw === label
      || raw === key
      || lower === label.toLowerCase()
      || lower === key.toLowerCase()
    ) {
      return key;
    }
  }
  return null;
}

const ORDEN_OPTS = [
  { value: 'hostname-asc', label: 'Hostname A-Z' },
  { value: 'hostname-desc', label: 'Hostname Z-A' },
  { value: 'ubicacion-asc', label: 'Ubicación A-Z' },
];

function cmpHostname(a, b, desc) {
  const ha = (a.hostname || '').toLowerCase();
  const hb = (b.hostname || '').toLowerCase();
  const r = ha.localeCompare(hb, 'es');
  return desc ? -r : r;
}

function cmpUbicacion(a, b) {
  const ua = (a.ubicacion || '').toLowerCase();
  const ub = (b.ubicacion || '').toLowerCase();
  return ua.localeCompare(ub, 'es') || cmpHostname(a, b, false);
}

function coincideBusqueda(c, q) {
  if (!q || !q.trim()) return true;
  const n = q.trim().toLowerCase();
  const blob = [
    c.hostname,
    c.usuarioActual,
    c.responsableInventario,
    c.uuid,
    c.ubicacion,
    c.estadoActual,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return blob.includes(n);
}

function valorRiDraft(c, riDraft) {
  if (riDraft[c.uuid] !== undefined) return riDraft[c.uuid];
  return c.responsableInventario ?? '';
}

export default function ComputadoraAsignaciones() {
  const { puedeEscribir } = usePermisos();
  const { todas, setTodas, cargando, error } = useComputadorasList();
  const [buscar, setBuscar] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [orden, setOrden] = useState('hostname-asc');
  const [riDraft, setRiDraft] = useState({});
  const [savingRi, setSavingRi] = useState(null);
  const [msgRi, setMsgRi] = useState(null);
  const [estadoSel, setEstadoSel] = useState({});
  const [motivoEstado, setMotivoEstado] = useState({});
  const [ubicacionStockDraft, setUbicacionStockDraft] = useState({});
  const [asignarADraft, setAsignarADraft] = useState({});
  const [savingEst, setSavingEst] = useState(null);
  const [msgEst, setMsgEst] = useState(null);
  const [solapaEstado, setSolapaEstado] = useState('ASIGNADA');

  const antesFiltro = useMemo(
    () => todas.filter(c => coincideUbicacionFiltro(c.ubicacion, filtroUbicacion)).filter(c => coincideBusqueda(c, buscar)),
    [todas, filtroUbicacion, buscar],
  );

  const conteosPorSolapa = useMemo(() => {
    const acc = { ASIGNADA: 0, BAJA: 0, SIN_ASIGNAR: 0, EN_MANTENIMIENTO: 0, otros: 0 };
    for (const c of antesFiltro) {
      const k = resolverSolapaParaEstado(c.estadoActual);
      if (k && acc[k] !== undefined) acc[k] += 1;
      else acc.otros += 1;
    }
    return acc;
  }, [antesFiltro]);

  const porSolapa = useMemo(
    () => antesFiltro.filter(c => resolverSolapaParaEstado(c.estadoActual) === solapaEstado),
    [antesFiltro, solapaEstado],
  );

  const filas = useMemo(() => {
    const copy = [...porSolapa];
    if (orden === 'hostname-asc') copy.sort((a, b) => cmpHostname(a, b, false));
    else if (orden === 'hostname-desc') copy.sort((a, b) => cmpHostname(a, b, true));
    else if (orden === 'ubicacion-asc') copy.sort((a, b) => cmpUbicacion(a, b));
    return copy;
  }, [porSolapa, orden]);

  function setRi(uuid, texto) {
    setRiDraft(prev => ({ ...prev, [uuid]: texto }));
  }

  async function guardarResponsable(uuid) {
    const raw =
      riDraft[uuid] !== undefined
        ? riDraft[uuid]
        : (todas.find(x => x.uuid === uuid)?.responsableInventario ?? '');
    setSavingRi(uuid);
    setMsgRi(null);
    try {
      const dto = await updateResponsableInventario(uuid, raw.trim() || null);
      if (!dto) {
        setMsgRi('No se encontró la computadora.');
        return;
      }
      setTodas(prev => prev.map(p => (p.uuid === uuid ? { ...p, ...dto } : p)));
      setRiDraft(prev => {
        const n = { ...prev };
        delete n[uuid];
        return n;
      });
    } catch {
      setMsgRi('No se pudo guardar el responsable de inventario.');
    } finally {
      setSavingRi(null);
    }
  }

  async function guardarEstado(uuid) {
    const est = (estadoSel[uuid] ?? '').trim();
    const mot = (motivoEstado[uuid] ?? '').trim();
    if (!est) return;

    const extras = {};
    if (est === 'SIN_ASIGNAR') {
      const ubStock = (ubicacionStockDraft[uuid] ?? '').trim();
      if (!ubStock) {
        setMsgEst('La ubicación de stock es obligatoria para pasar a Sin Asignar.');
        return;
      }
      extras.ubicacionStock = ubStock;
    }
    if (est === 'ASIGNADA') {
      const asignar = (asignarADraft[uuid] ?? '').trim();
      if (!asignar) {
        setMsgEst('Debe indicar a quién se asigna el equipo.');
        return;
      }
      extras.responsableInventario = asignar;
    }

    setSavingEst(uuid);
    setMsgEst(null);
    try {
      const dto = await updateEstado(uuid, est, mot, extras);
      if (!dto) {
        setMsgEst('No se encontró la computadora.');
        return;
      }
      setTodas(prev => prev.map(p => (p.uuid === uuid ? { ...p, ...dto } : p)));
      setEstadoSel(prev => ({ ...prev, [uuid]: '' }));
      setMotivoEstado(prev => ({ ...prev, [uuid]: '' }));
      setUbicacionStockDraft(prev => ({ ...prev, [uuid]: '' }));
      setAsignarADraft(prev => ({ ...prev, [uuid]: '' }));
    } catch {
      setMsgEst('No se pudo cambiar el estado.');
    } finally {
      setSavingEst(null);
    }
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  const total = todas.length;
  const baseFiltro = antesFiltro.length;
  const visibles = filas.length;
  const labelSolapa = SOLAPAS_ESTADO.find(s => s.key === solapaEstado)?.label ?? '';
  const subtOtros =
    conteosPorSolapa.otros > 0
      ? ` · ${conteosPorSolapa.otros} con otro estado no listado arriba`
      : '';
  const subt =
    `${visibles} de ${baseFiltro} equipos · ${labelSolapa}${subtOtros}`;

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.35rem',
        }}
      >
        <div>
          <h1 className="inventory-page-title" style={{ marginBottom: '0.2rem' }}>
            Asignaciones
          </h1>
        </div>
        <WriteGate>
        <Link to="/computadoras/nueva" className="btn btn-primary btn-sm">
          Nueva computadora
        </Link>
        </WriteGate>
      </div>

      <div className="detail-tabs-block detail-tabs-block--unified">
        <ComputadoraSubnav variant="inBlock" />
        <p className="detail-tabs-block__meta">{subt}</p>
        <div
          className="detail-tabs detail-tabs--in-block detail-tabs--stacked"
          role="tablist"
          aria-label="Filtrar por estado operativo"
        >
          {SOLAPAS_ESTADO.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={solapaEstado === key}
              className={`detail-tab${solapaEstado === key ? ' detail-tab--active' : ''}`}
              onClick={() => setSolapaEstado(key)}
            >
              {label}
              {' '}
              <span className="detail-tab__count" style={{ fontWeight: 500 }}>
                ({conteosPorSolapa[key]})
              </span>
            </button>
          ))}
        </div>
        <div className="detail-tabs-block__toolbar">
        <div className="inventory-toolbar-row">
          <div className="inventory-field inventory-field--grow">
            <label className="inventory-field__label" htmlFor="asig-buscar">Buscar</label>
            <input
              id="asig-buscar"
              className="inventory-input"
              type="search"
              placeholder="Hostname, responsable, usuario agente, UUID…"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="asig-ubicacion">Ubicación</label>
            <select
              id="asig-ubicacion"
              className="inventory-select"
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
            >
              <option value="">{`Todas (${total})`}</option>
              {UBICACIONES_COMPUTADORA.map(u => (
                <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
              ))}
            </select>
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="asig-orden">Ordenar</label>
            <select
              id="asig-orden"
              className="inventory-select"
              value={orden}
              onChange={e => setOrden(e.target.value)}
            >
              {ORDEN_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {msgRi && (
          <p className="inventory-toolbar-msg inventory-toolbar-msg--err" role="status">{msgRi}</p>
        )}
        {msgEst && (
          <p className="inventory-toolbar-msg inventory-toolbar-msg--err" role="status">{msgEst}</p>
        )}
        </div>
      </div>

      <div className="table-wrap table-wrap--scroll">
        <table className="table" style={{ fontSize: '15px' }}>
          <thead>
            <tr>
              <th>Hostname</th>
              <th>UUID</th>
              <th title="Usuario reportado por el agente (sesión / sistema)">Usuario (agente)</th>
              <th title="Persona o referencia asignada en inventario">Asignado</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  {todas.length === 0
                    ? 'Sin registros'
                    : baseFiltro === 0
                      ? 'Ningún equipo coincide con la búsqueda o ubicación'
                      : `Ningún equipo en “${labelSolapa}” con los filtros actuales`}
                </td>
              </tr>
            ) : (
              filas.map(c => (
                <tr key={c.uuid}>
                  <td>
                    <Link to={`/computadoras/${c.uuid}`}>{c.hostname ?? '—'}</Link>
                  </td>
                  <td className="uuid">{c.uuid?.slice(0, 8)}</td>
                  <td>{c.usuarioActual ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', maxWidth: '22rem' }}>
                      <input
                        className="inventory-input"
                        style={{ minWidth: '10rem', flex: '1 1 10rem' }}
                        type="text"
                        value={valorRiDraft(c, riDraft)}
                        onChange={e => setRi(c.uuid, e.target.value)}
                        placeholder="Nombre o referencia"
                        aria-label={`Asignado para ${c.hostname ?? c.uuid}`}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={!puedeEscribir || savingRi === c.uuid}
                        onClick={() => guardarResponsable(c.uuid)}
                      >
                        {savingRi === c.uuid ? '…' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                  <td>{c.ubicacion ?? '—'}</td>
                  <td>{c.estadoActual ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '12rem' }}>
                      <select
                        className="inventory-select"
                        value={estadoSel[c.uuid] ?? ''}
                        onChange={e => setEstadoSel(prev => ({ ...prev, [c.uuid]: e.target.value }))}
                        aria-label={`Nuevo estado para ${c.hostname ?? c.uuid}`}
                      >
                        <option value="">Estado…</option>
                        {ESTADOS_OPERATIVOS.map(k => (
                          <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
                        ))}
                      </select>
                      {estadoSel[c.uuid] === 'SIN_ASIGNAR' && (
                        <input
                          className="inventory-input"
                          type="text"
                          placeholder="Ubicación de stock (ej: Depósito IT, Rack 3)"
                          value={ubicacionStockDraft[c.uuid] ?? ''}
                          onChange={e => setUbicacionStockDraft(prev => ({ ...prev, [c.uuid]: e.target.value }))}
                        />
                      )}
                      {estadoSel[c.uuid] === 'ASIGNADA' && (
                        <input
                          className="inventory-input"
                          type="text"
                          placeholder="Asignar a (nombre del responsable)"
                          value={asignarADraft[c.uuid] ?? ''}
                          onChange={e => setAsignarADraft(prev => ({ ...prev, [c.uuid]: e.target.value }))}
                        />
                      )}
                      <input
                        className="inventory-input"
                        type="text"
                        placeholder="Motivo (opcional)"
                        value={motivoEstado[c.uuid] ?? ''}
                        onChange={e => setMotivoEstado(prev => ({ ...prev, [c.uuid]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={
                          !puedeEscribir
                          || savingEst === c.uuid
                          || !(estadoSel[c.uuid] ?? '').trim()
                        }
                        onClick={() => guardarEstado(c.uuid)}
                      >
                        {savingEst === c.uuid ? 'Aplicando…' : 'Aplicar estado'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
