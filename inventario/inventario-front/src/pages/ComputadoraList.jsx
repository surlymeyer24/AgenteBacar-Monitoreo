import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchComputadoras, updateUbicacion, deleteComputadora } from '../api/computadoraApi';
import { useComputadorasList } from '../context/ComputadorasListContext';
import ComputadoraSubnav from '../components/ComputadoraSubnav';
import { UBICACIONES_COMPUTADORA, labelUbicacionEnum, coincideUbicacionFiltro } from '../constants/ubicaciones';
import { textoConexionAgente } from '../utils/estadoConexion';
import {
  nivelActividadSync,
  CICLO_SYNC_AGENTE_MINUTOS,
  MINUTOS_LABEL_UMBRAL_ACTIVO,
} from '../utils/syncActividad';

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
  const blob = [c.hostname, c.usuarioActual, c.responsableInventario, c.uuid, c.ubicacion, c.sistemaOperativo, c.estadoActual]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return blob.includes(n);
}

function esNotebookTipo(c) {
  return (c.tipoEquipo ?? '').toLowerCase().includes('notebook');
}

function coincideFiltroTipoEquipo(c, filtro) {
  if (!filtro) return true;
  const t = (c.tipoEquipo ?? '').trim();
  if (!t) return false;
  if (filtro === 'notebook') return esNotebookTipo(c);
  if (filtro === 'pc') return !esNotebookTipo(c);
  return true;
}

function coincideFiltroActividadSync(c, filtro) {
  if (!filtro) return true;
  const n = nivelActividadSync(c);
  if (filtro === 'activo') return n === 'activo';
  if (filtro === 'intermedio') return n === 'intermedio';
  if (filtro === 'sin_actividad') return n === 'sin_actividad' || n === 'sin_datos';
  return true;
}

function claseSyncDot(n) {
  if (n === 'activo') return 'sync-dot sync-dot--activo';
  if (n === 'intermedio') return 'sync-dot sync-dot--intermedio';
  if (n === 'sin_datos') return 'sync-dot sync-dot--sin-datos';
  return 'sync-dot sync-dot--critico';
}

function tituloSyncDot(n) {
  if (n === 'activo') {
    return `Sync reciente (ciclo agente ~${CICLO_SYNC_AGENTE_MINUTOS} min; menos de ~${MINUTOS_LABEL_UMBRAL_ACTIVO} min)`;
  }
  if (n === 'intermedio') {
    return `Última sync entre ~${MINUTOS_LABEL_UMBRAL_ACTIVO} minutos y 1 hora`;
  }
  if (n === 'sin_actividad') return 'Sin sync hace más de 1 hora';
  return 'Sin datos de última sincronización';
}

function ComputadoraList() {
  const { todas, setTodas, cargando, error } = useComputadorasList();
  const [buscar, setBuscar] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoEquipo, setFiltroTipoEquipo] = useState('');
  const [filtroConexion, setFiltroConexion] = useState('');
  const [orden, setOrden] = useState('hostname-asc');
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [ubicacionDestino, setUbicacionDestino] = useState('');
  const [aplicandoMasivo, setAplicandoMasivo] = useState(false);
  const [borrandoMasivo, setBorrandoMasivo] = useState(false);
  const [msgMasivo, setMsgMasivo] = useState(null);
  const headerCbRef = useRef(null);
  const navigate = useNavigate();

  const antesFiltroTipo = useMemo(() => {
    let list = todas.filter(c => coincideUbicacionFiltro(c.ubicacion, filtroUbicacion));
    list = list.filter(c => coincideBusqueda(c, buscar));
    return list;
  }, [todas, filtroUbicacion, buscar]);

  const conteosTipo = useMemo(() => {
    let nb = 0;
    let pc = 0;
    for (const c of antesFiltroTipo) {
      const t = (c.tipoEquipo ?? '').trim();
      if (!t) continue;
      if (esNotebookTipo(c)) nb += 1;
      else pc += 1;
    }
    return { notebook: nb, pc };
  }, [antesFiltroTipo]);

  const antesFiltroConexion = useMemo(
    () => antesFiltroTipo.filter(c => coincideFiltroTipoEquipo(c, filtroTipoEquipo)),
    [antesFiltroTipo, filtroTipoEquipo],
  );

  const computadoras = useMemo(() => {
    let list = antesFiltroConexion.filter(c => coincideFiltroActividadSync(c, filtroConexion));
    const copy = [...list];
    if (orden === 'hostname-asc') copy.sort((a, b) => cmpHostname(a, b, false));
    else if (orden === 'hostname-desc') copy.sort((a, b) => cmpHostname(a, b, true));
    else if (orden === 'ubicacion-asc') copy.sort((a, b) => cmpUbicacion(a, b));
    return copy;
  }, [antesFiltroConexion, filtroConexion, orden]);

  const uuidsVisibles = useMemo(
    () => computadoras.map(c => c.uuid).filter(Boolean),
    [computadoras],
  );

  const seleccionadosEnVista = useMemo(
    () => uuidsVisibles.filter(id => seleccion.has(id)).length,
    [uuidsVisibles, seleccion],
  );

  const todasVisiblesSeleccionadas =
    uuidsVisibles.length > 0 && seleccionadosEnVista === uuidsVisibles.length;

  useEffect(() => {
    const el = headerCbRef.current;
    if (!el) return;
    el.indeterminate =
      seleccionadosEnVista > 0 && seleccionadosEnVista < uuidsVisibles.length;
  }, [seleccionadosEnVista, uuidsVisibles.length]);

  function toggleUuid(uuid) {
    if (!uuid) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (n.has(uuid)) n.delete(uuid);
      else n.add(uuid);
      return n;
    });
    setMsgMasivo(null);
  }

  function toggleSeleccionarVisibles() {
    if (uuidsVisibles.length === 0) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (todasVisiblesSeleccionadas) {
        uuidsVisibles.forEach(id => n.delete(id));
      } else {
        uuidsVisibles.forEach(id => n.add(id));
      }
      return n;
    });
    setMsgMasivo(null);
  }

  async function aplicarUbicacionMasiva() {
    if (!ubicacionDestino || seleccion.size === 0) return;
    setAplicandoMasivo(true);
    setMsgMasivo(null);
    const ids = [...seleccion];
    let ok = 0;
    let fail = 0;
    try {
      for (const uuid of ids) {
        try {
          const res = await updateUbicacion(uuid, ubicacionDestino);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const fresh = await fetchComputadoras();
      setTodas(fresh);
      setSeleccion(new Set());
      setUbicacionDestino('');
      if (fail > 0) {
        setMsgMasivo({ tipo: 'err', texto: `Actualizadas: ${ok}. Fallidas: ${fail}.` });
      } else {
        setMsgMasivo({ tipo: 'ok', texto: `Ubicación actualizada en ${ok} equipo(s).` });
      }
    } catch {
      setMsgMasivo({ tipo: 'err', texto: 'No se pudo refrescar el listado tras el cambio.' });
    } finally {
      setAplicandoMasivo(false);
    }
  }

  async function eliminarSeleccionadas() {
    const ids = [...seleccion].filter(Boolean);
    if (ids.length === 0) return;
    const n = ids.length;
    const msgConfirm =
      n === 1
        ? '¿Seguro que querés eliminar este equipo? Esta acción no se puede deshacer.'
        : `¿Seguro que querés eliminar ${n} equipos? Esta acción no se puede deshacer.`;
    if (!window.confirm(msgConfirm)) return;

    setBorrandoMasivo(true);
    setMsgMasivo(null);
    let ok = 0;
    let fail = 0;
    try {
      for (const uuid of ids) {
        try {
          const res = await deleteComputadora(uuid);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const fresh = await fetchComputadoras();
      setTodas(fresh);
      setSeleccion(new Set());
      if (fail > 0) {
        setMsgMasivo({ tipo: 'err', texto: `Eliminadas: ${ok}. Fallidas: ${fail}.` });
      } else {
        setMsgMasivo({ tipo: 'ok', texto: `Se eliminaron ${ok} equipo${ok === 1 ? '' : 's'}.` });
      }
    } catch {
      setMsgMasivo({ tipo: 'err', texto: 'No se pudo refrescar el listado tras eliminar.' });
    } finally {
      setBorrandoMasivo(false);
    }
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  const total = todas.length;
  const visibles = computadoras.length;
  const subt =
    visibles === total
      ? `${total} equipos`
      : `${visibles} de ${total} equipos`;

  return (
    <div className="page page--computadora-list">
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
          <h1 className="inventory-page-title" style={{ marginBottom: '0.2rem' }}>Inventario</h1>
        </div>
        <Link to="/computadoras/nueva" className="btn btn-primary btn-sm">Nueva computadora</Link>
      </div>

      <div className="detail-tabs-block detail-tabs-block--unified">
        <ComputadoraSubnav variant="inBlock" />
        <p className="detail-tabs-block__meta">{subt}</p>
        <div className="detail-tabs-block__toolbar">
        <div className="inventory-toolbar-row">
          <div className="inventory-field inventory-field--grow">
            <label className="inventory-field__label" htmlFor="inv-buscar">Buscar</label>
            <input
              id="inv-buscar"
              className="inventory-input"
              type="search"
              placeholder="Hostname, usuario, asignado, UUID…"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="inv-ubicacion">Ubicación</label>
            <select
              id="inv-ubicacion"
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
            <label className="inventory-field__label" htmlFor="inv-tipo-equipo">Tipo</label>
            <select
              id="inv-tipo-equipo"
              className="inventory-select"
              value={filtroTipoEquipo}
              onChange={e => setFiltroTipoEquipo(e.target.value)}
            >
              <option value="">{`Todos (${antesFiltroTipo.length})`}</option>
              <option value="notebook">{`Notebook (${conteosTipo.notebook})`}</option>
              <option value="pc">{`PC (${conteosTipo.pc})`}</option>
            </select>
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="inv-actividad-sync">Actividad (sync)</label>
            <select
              id="inv-actividad-sync"
              className="inventory-select"
              value={filtroConexion}
              onChange={e => setFiltroConexion(e.target.value)}
            >
              <option value="">{`Todos (${antesFiltroConexion.length})`}</option>
              <option value="activo">{`Sync reciente (menos de ~${MINUTOS_LABEL_UMBRAL_ACTIVO} min)`}</option>
              <option value="intermedio">{`Sync entre ~${MINUTOS_LABEL_UMBRAL_ACTIVO} min y 1 h`}</option>
              <option value="sin_actividad">Sin actividad (más de 1 h o sin fecha)</option>
            </select>
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="inv-orden">Ordenar</label>
            <select
              id="inv-orden"
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

        {seleccion.size > 0 ? (
          <div className="inventory-toolbar-row inventory-toolbar-row--bulk">
            <p className="inventory-bulk-hint">
              <strong>{seleccion.size}</strong> equipo{seleccion.size === 1 ? '' : 's'} seleccionado{seleccion.size === 1 ? '' : 's'}
            </p>
            <div className="inventory-field inventory-field--sm" style={{ minWidth: '11rem' }}>
              <label className="inventory-field__label" htmlFor="inv-ubicacion-masiva">Nueva ubicación</label>
              <select
                id="inv-ubicacion-masiva"
                className="inventory-select"
                value={ubicacionDestino}
                onChange={e => setUbicacionDestino(e.target.value)}
              >
                <option value="">Elegir…</option>
                {UBICACIONES_COMPUTADORA.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={borrandoMasivo || aplicandoMasivo || !ubicacionDestino}
              onClick={aplicarUbicacionMasiva}
            >
              {aplicandoMasivo ? 'Aplicando…' : 'Cambiar ubicación'}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={borrandoMasivo || aplicandoMasivo}
              onClick={eliminarSeleccionadas}
            >
              {borrandoMasivo ? 'Eliminando…' : 'Eliminar seleccionadas'}
            </button>
          </div>
        ) : null}

        {msgMasivo ? (
          <p
            className={`inventory-toolbar-msg ${msgMasivo.tipo === 'ok' ? 'inventory-toolbar-msg--ok' : 'inventory-toolbar-msg--err'}`}
            role="status"
          >
            {msgMasivo.texto}
          </p>
        ) : null}
        </div>
      </div>

      <div className="table-wrap table-wrap--scroll">
        <table className="table">
          <thead>
            <tr>
              <th className="table-col-check" scope="col">
                <input
                  ref={headerCbRef}
                  type="checkbox"
                  className="table-checkbox"
                  checked={todasVisiblesSeleccionadas && uuidsVisibles.length > 0}
                  onChange={toggleSeleccionarVisibles}
                  title="Seleccionar equipos visibles"
                  aria-label="Seleccionar todos los equipos visibles"
                />
              </th>
              <th className="table-col-sync" scope="col" title="Estado según última sync del agente">Sync</th>
              <th title="Tipo de equipo">Tipo</th>
              <th>UUID</th>
              <th>Hostname</th>
              <th>Usuario</th>
              <th title="Asignado en inventario, no confundir con usuario del agente">Asignado</th>
              <th>Ubicación</th>
              <th>SO</th>
              <th>Conexión</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {computadoras.length === 0 ? (
              <tr>
                <td colSpan={11} className="table-empty">
                  {todas.length === 0
                    ? 'Sin registros'
                    : 'Ningún equipo coincide con los filtros'}
                </td>
              </tr>
            ) : (
              computadoras.map(c => {
                const sel = c.uuid && seleccion.has(c.uuid);
                const nivel = nivelActividadSync(c);
                return (
                  <tr
                    key={c.uuid}
                    className={sel ? 'is-selected' : undefined}
                    onClick={() => navigate(`/computadoras/${c.uuid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td
                      className="table-col-check"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={!!sel}
                        onChange={() => toggleUuid(c.uuid)}
                        aria-label={`Seleccionar ${c.hostname || c.uuid}`}
                      />
                    </td>
                    <td
                      className="table-col-sync"
                      onClick={e => e.stopPropagation()}
                    >
                      <span
                        className={claseSyncDot(nivel)}
                        title={tituloSyncDot(nivel)}
                        role="img"
                        aria-label={tituloSyncDot(nivel)}
                      />
                    </td>
                    <td title={c.tipoEquipo ?? '—'}>
                      {c.tipoEquipo?.toLowerCase().includes('notebook') ? '💻' : c.tipoEquipo ? '🖥️' : '—'}
                    </td>
                    <td className="uuid">{c.uuid?.slice(0, 8)}</td>
                    <td>{c.hostname}</td>
                    <td>{c.usuarioActual}</td>
                    <td>{c.responsableInventario ?? '—'}</td>
                    <td>{c.ubicacion}</td>
                    <td>{c.sistemaOperativo}</td>
                    <td>{textoConexionAgente(c)}</td>
                    <td>{c.estadoActual ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComputadoraList;
