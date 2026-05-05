import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCamaras, asignarNvrCamara, deleteCamara, updateEstadoCamara } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import {
  UBICACIONES_CAMARA_SUGERIDAS,
  labelUbicacionEnum,
} from '../constants/ubicaciones';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';

function CamaraList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [catalogoCompleto, setCatalogoCompleto] = useState([]);
  const [nvrs, setNvrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroNvr, setFiltroNvr] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [nvrAsignar, setNvrAsignar] = useState('');
  const [aplicandoNvr, setAplicandoNvr] = useState(false);
  const [estadoBulk, setEstadoBulk] = useState('');
  const [motivoEstadoBulk, setMotivoEstadoBulk] = useState('');
  const [aplicandoEstado, setAplicandoEstado] = useState(false);
  const [msgBulk, setMsgBulk] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);
  const headerCbRef = useRef(null);

  const nvrNombre = useMemo(() => {
    const m = new Map();
    for (const n of nvrs) {
      if (n.id) m.set(n.id, n.nombre ?? n.id);
    }
    return m;
  }, [nvrs]);

  useEffect(() => {
    fetchNvrs()
      .then(setNvrs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    const params = {};
    if (filtroUbicacion) params.ubicacion = filtroUbicacion;
    if (filtroNvr) params.nvrId = filtroNvr;
    fetchCamaras(params)
      .then(data => {
        setLista(data);
        if (!filtroUbicacion && !filtroNvr) {
          setCatalogoCompleto(data);
        }
      })
      .catch(() => setError('No se pudo cargar el listado de cámaras'))
      .finally(() => setCargando(false));
  }, [filtroUbicacion, filtroNvr]);

  const opcionesUbicacion = useMemo(() => {
    const set = new Set(UBICACIONES_CAMARA_SUGERIDAS);
    for (const c of catalogoCompleto) {
      if (c.ubicacion) set.add(c.ubicacion);
    }
    return [...set].sort((a, b) => String(a).localeCompare(String(b), 'es'));
  }, [catalogoCompleto]);

  const camaras = useMemo(() => {
    if (!ordenNombre) return lista;
    const list = [...lista];
    list.sort((a, b) => {
      const na = (a.nombre ?? '').trim();
      const nb = (b.nombre ?? '').trim();
      let cmp = 0;
      if (!na && !nb) cmp = 0;
      else if (!na) cmp = 1;
      else if (!nb) cmp = -1;
      else cmp = na.localeCompare(nb, 'es', { sensitivity: 'base' });
      return ordenNombre === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [lista, ordenNombre]);

  const idsVisibles = useMemo(() => camaras.map(c => c.id).filter(Boolean), [camaras]);

  const seleccionadosEnVista = useMemo(
    () => idsVisibles.filter(id => seleccion.has(id)).length,
    [idsVisibles, seleccion],
  );

  const todasVisiblesSeleccionadas =
    idsVisibles.length > 0 && seleccionadosEnVista === idsVisibles.length;

  useEffect(() => {
    const el = headerCbRef.current;
    if (!el) return;
    el.indeterminate =
      seleccionadosEnVista > 0 && seleccionadosEnVista < idsVisibles.length;
  }, [seleccionadosEnVista, idsVisibles.length]);

  function toggleId(selId) {
    if (!selId) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (n.has(selId)) n.delete(selId);
      else n.add(selId);
      return n;
    });
    setMsgBulk(null);
  }

  function toggleSeleccionarVisibles() {
    if (idsVisibles.length === 0) return;
    setSeleccion(prev => {
      const n = new Set(prev);
      if (todasVisiblesSeleccionadas) {
        idsVisibles.forEach(id => n.delete(id));
      } else {
        idsVisibles.forEach(id => n.add(id));
      }
      return n;
    });
    setMsgBulk(null);
  }

  async function aplicarNvrMasivo() {
    if (!nvrAsignar || seleccion.size === 0) return;
    setAplicandoNvr(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await asignarNvrCamara(camId, nvrAsignar);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      setNvrAsignar('');
      if (fail > 0) {
        setMsgBulk({ tipo: 'err', texto: `NVR: actualizadas ${ok}, fallidas ${fail}.` });
      } else {
        setMsgBulk({ tipo: 'ok', texto: `NVR asignada en ${ok} cámara(s).` });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setAplicandoNvr(false);
    }
  }

  async function aplicarEstadoMasivo() {
    if (!estadoBulk || seleccion.size === 0) return;
    setAplicandoEstado(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    const motivo = motivoEstadoBulk.trim();
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await updateEstadoCamara(camId, estadoBulk, motivo);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      setEstadoBulk('');
      setMotivoEstadoBulk('');
      if (fail > 0) {
        setMsgBulk({ tipo: 'err', texto: `Estado: actualizadas ${ok}, fallidas ${fail}.` });
      } else {
        setMsgBulk({ tipo: 'ok', texto: `Estado aplicado en ${ok} cámara(s).` });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setAplicandoEstado(false);
    }
  }

  async function eliminarSeleccionMasiva() {
    if (seleccion.size === 0) return;
    const n = seleccion.size;
    if (
      !window.confirm(
        `¿Borrar ${n} cámara${n === 1 ? '' : 's'} seleccionada${n === 1 ? '' : 's'}? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setEliminandoMasivo(true);
    setMsgBulk(null);
    const ids = [...seleccion];
    let ok = 0;
    let fail = 0;
    try {
      for (const camId of ids) {
        try {
          const res = await deleteCamara(camId);
          if (res) ok += 1;
          else fail += 1;
        } catch {
          fail += 1;
        }
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(new Set());
      if (fail > 0) {
        setMsgBulk({
          tipo: 'err',
          texto: `Eliminadas ${ok}, fallidas ${fail}.`,
        });
      } else {
        setMsgBulk({
          tipo: 'ok',
          texto: `${ok} cámara${ok === 1 ? '' : 's'} eliminada${ok === 1 ? '' : 's'}.`,
        });
      }
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo refrescar el listado.' });
    } finally {
      setEliminandoMasivo(false);
    }
  }

  async function eliminarCamaraFila(e, cam) {
    e.stopPropagation();
    if (!cam?.id || eliminandoMasivo) return;
    const nombre = (cam.nombre && String(cam.nombre).trim()) ? cam.nombre : cam.id;
    if (
      !window.confirm(
        `¿Borrar la cámara "${nombre}" (${cam.id})? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setBorrandoId(cam.id);
    setMsgBulk(null);
    try {
      const ok = await deleteCamara(cam.id);
      if (!ok) {
        setMsgBulk({ tipo: 'err', texto: 'No se encontró la cámara (quizá ya fue borrada).' });
        return;
      }
      const params = {};
      if (filtroUbicacion) params.ubicacion = filtroUbicacion;
      if (filtroNvr) params.nvrId = filtroNvr;
      const fresh = await fetchCamaras(params);
      setLista(fresh);
      if (!filtroUbicacion && !filtroNvr) setCatalogoCompleto(fresh);
      setSeleccion(prev => {
        const n = new Set(prev);
        n.delete(cam.id);
        return n;
      });
      setMsgBulk({ tipo: 'ok', texto: 'Cámara eliminada.' });
    } catch {
      setMsgBulk({ tipo: 'err', texto: 'No se pudo eliminar la cámara.' });
    } finally {
      setBorrandoId(null);
    }
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  const totalInventario = catalogoCompleto.length;
  const visibles = camaras.length;
  const hayFiltros = !!(filtroUbicacion || filtroNvr);
  const subt = !hayFiltros
    ? `${visibles} cámara${visibles === 1 ? '' : 's'}`
    : `${visibles} de ${totalInventario} cámara${totalInventario === 1 ? '' : 's'}`;

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
          <h1 className="inventory-page-title" style={{ marginBottom: '0.2rem' }}>Cámaras</h1>
          <p className="inventory-page-sub" style={{ margin: 0 }}>{subt}</p>
        </div>
        <Link to="/camaras/nueva" className="btn btn-primary btn-sm">Nueva cámara</Link>
      </div>

      <div className="inventory-toolbar-card">
        <div className="inventory-toolbar-row">
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="filtro-ubicacion-cam">Ubicación</label>
            <select
              id="filtro-ubicacion-cam"
              className="inventory-select"
              value={filtroUbicacion}
              onChange={e => setFiltroUbicacion(e.target.value)}
            >
              <option value="">{`Todas (${totalInventario})`}</option>
              {opcionesUbicacion.map(u => (
                <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
              ))}
            </select>
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="filtro-nvr-cam">NVR</label>
            <select
              id="filtro-nvr-cam"
              className="inventory-select"
              value={filtroNvr}
              onChange={e => setFiltroNvr(e.target.value)}
            >
              <option value="">Todas</option>
              {nvrs.map(n => (
                <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
              ))}
            </select>
          </div>
          <div className="inventory-field inventory-field--sm">
            <label className="inventory-field__label" htmlFor="orden-nombre-cam">Orden por nombre</label>
            <select
              id="orden-nombre-cam"
              className="inventory-select"
              value={ordenNombre}
              onChange={e => setOrdenNombre(e.target.value)}
            >
              <option value="">Sin ordenar</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </div>

        {seleccion.size > 0 ? (
          <div className="inventory-bulk-wrapper">
            <div className="inventory-toolbar-row inventory-toolbar-row--bulk">
              <p className="inventory-bulk-hint">
                <strong>{seleccion.size}</strong> cámara{seleccion.size === 1 ? '' : 's'} seleccionada
                {seleccion.size === 1 ? '' : 's'}
              </p>
              <div className="inventory-field inventory-field--sm" style={{ minWidth: '14rem' }}>
                <label className="inventory-field__label" htmlFor="cam-nvr-asignar">Asignar NVR</label>
                <select
                  id="cam-nvr-asignar"
                  className="inventory-select"
                  value={nvrAsignar}
                  onChange={e => setNvrAsignar(e.target.value)}
                >
                  <option value="">Elegir NVR…</option>
                  {nvrs.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo || !nvrAsignar}
                onClick={aplicarNvrMasivo}
              >
                {aplicandoNvr ? 'Aplicando…' : 'Aplicar NVR'}
              </button>
              <div className="inventory-field inventory-field--sm" style={{ minWidth: '11rem' }}>
                <label className="inventory-field__label" htmlFor="cam-estado-bulk">Estado</label>
                <select
                  id="cam-estado-bulk"
                  className="inventory-select"
                  value={estadoBulk}
                  onChange={e => setEstadoBulk(e.target.value)}
                >
                  <option value="">Elegir…</option>
                  {ESTADOS_OPERATIVOS.map(e => (
                    <option key={e} value={e}>{ESTADO_OPERATIVO_LABELS[e] ?? e}</option>
                  ))}
                </select>
              </div>
              <div className="inventory-field" style={{ minWidth: '10rem', flex: '1 1 10rem' }}>
                <label className="inventory-field__label" htmlFor="cam-motivo-estado-bulk">Motivo (opcional)</label>
                <input
                  id="cam-motivo-estado-bulk"
                  type="text"
                  className="inventory-input"
                  value={motivoEstadoBulk}
                  onChange={e => setMotivoEstadoBulk(e.target.value)}
                  placeholder="Ej. inventario 2026"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo || !estadoBulk}
                onClick={aplicarEstadoMasivo}
              >
                {aplicandoEstado ? 'Aplicando…' : 'Aplicar estado'}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={aplicandoNvr || aplicandoEstado || eliminandoMasivo}
                onClick={eliminarSeleccionMasiva}
              >
                {eliminandoMasivo ? 'Eliminando…' : 'Eliminar seleccionadas'}
              </button>
            </div>
          </div>
        ) : null}

        {msgBulk ? (
          <p
            className={`inventory-toolbar-msg ${msgBulk.tipo === 'ok' ? 'inventory-toolbar-msg--ok' : 'inventory-toolbar-msg--err'}`}
            role="status"
          >
            {msgBulk.texto}
          </p>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="table-col-check" scope="col">
                <input
                  ref={headerCbRef}
                  type="checkbox"
                  className="table-checkbox"
                  checked={todasVisiblesSeleccionadas && idsVisibles.length > 0}
                  onChange={toggleSeleccionarVisibles}
                  title="Seleccionar cámaras visibles"
                  aria-label="Seleccionar todas las cámaras visibles"
                />
              </th>
              <th>Dispositivo</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>IP</th>
              <th>Puerto</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>NVR</th>
              <th>Estado</th>
              <th>Fecha alta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {camaras.length === 0 ? (
              <tr>
                <td colSpan={12} className="table-empty">
                  {catalogoCompleto.length === 0
                    ? 'Sin cámaras registradas'
                    : 'Ninguna cámara coincide con los filtros'}
                </td>
              </tr>
            ) : (
              camaras.map(cam => {
                const sel = cam.id && seleccion.has(cam.id);
                return (
                  <tr
                    key={cam.id}
                    className={sel ? 'is-selected' : undefined}
                    onClick={() => navigate(`/camaras/${cam.id}`)}
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
                        onChange={() => toggleId(cam.id)}
                        aria-label={`Seleccionar ${cam.nombre || cam.id}`}
                      />
                    </td>
                    <td className="uuid" title={cam.id}>{cam.id ?? '—'}</td>
                    <td>{cam.nombre}</td>
                    <td>{cam.marca ?? '—'}</td>
                    <td>{cam.direccionIp ?? '—'}</td>
                    <td>{cam.puerto != null ? cam.puerto : '—'}</td>
                    <td>{cam.tipo ?? '—'}</td>
                    <td>{cam.ubicacion ?? '—'}</td>
                    <td className="uuid" title={cam.nvrId ?? ''}>
                      {cam.nvrId ? (nvrNombre.get(cam.nvrId) ?? cam.nvrId) : '—'}
                    </td>
                    <td>{cam.estado ?? '—'}</td>
                    <td>{cam.fechaAlta ?? '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={borrandoId === cam.id || eliminandoMasivo}
                        onClick={e => eliminarCamaraFila(e, cam)}
                        title="Eliminar cámara"
                      >
                        {borrandoId === cam.id ? '…' : 'Borrar'}
                      </button>
                    </td>
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

export default CamaraList;
