import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Laptop, Monitor, Search, Copy, Cpu, UserCheck } from 'lucide-react';
import AsignacionesBoard from '../components/AsignacionesBoard';
import { fetchComputadoras, updateUbicacion, deleteComputadora } from '../api/computadoraApi';
import { useComputadorasList } from '../context/ComputadorasListContext';
import { UBICACIONES_COMPUTADORA, labelUbicacionEnum, coincideUbicacionFiltro } from '../constants/ubicaciones';
import { textoConexionAgente } from '../utils/estadoConexion';
import {
  nivelActividadSync,
  MINUTOS_LABEL_UMBRAL_ACTIVO,
  tituloSyncDot,
} from '../utils/syncActividad';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioFilterBar,
  StudioDataTable,
  studioTableClass,
  studioThClass,
  studioTdClass,
  syncDotClass,
  estadoBadgeClass,
  osBadgeClass,
} from '../components/studio/StudioUi';
import TableFilters from '../components/TableFilters';
import WriteGate from '../components/WriteGate';
import { usePermisos } from '../hooks/usePermisos';

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
  const blob = [c.hostname, c.usuarioActual, c.responsableInventario, c.uuid, c.ubicacion, c.sistemaOperativo, c.estadoActual, anydeskIdDe(c)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return blob.includes(n);
}

function fmtAnydeskId(id) {
  if (!id) return '—';
  return String(id).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** ID AnyDesk desde API (camelCase o snake_case del agente). */
function anydeskIdDe(c) {
  const raw = c?.anydeskId ?? c?.anydesk_id ?? c?.anydesk ?? null;
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  return s || null;
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

function ComputadoraList() {
  const { todas, setTodas, cargando, error } = useComputadorasList();
  const { puedeEscribir } = usePermisos();
  const [viewPerspective, setViewPerspective] = useState('inventario');
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
  const [copiedAnydesk, setCopiedAnydesk] = useState(null);
  const headerCbRef = useRef(null);
  const navigate = useNavigate();

  function copiarAnydesk(id, e) {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(String(id).replace(/\s/g, ''));
    setCopiedAnydesk(id);
    setTimeout(() => setCopiedAnydesk(null), 1500);
  }

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

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  const total = todas.length;
  const visibles = computadoras.length;
  const subt =
    visibles === total
      ? `${total} equipos`
      : `${visibles} de ${total} equipos`;

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4">
      <StudioPageShell
        title="Inventario de Computadoras"
        subtitle={`${subt}.`}
        actions={
          <StudioPrimaryButton to="/computadoras/nueva" requiresWrite>Nueva computadora</StudioPrimaryButton>
        }
      />

      {/* MAIN CATEGORY TABS */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100/60 px-4 pt-2.5 rounded-t-xl gap-2 text-slate-700 shrink-0">
        <div className="flex items-end gap-1">
          {/* Inventario Tab */}
          <button
            id="tab-inventario-btn"
            onClick={() => setViewPerspective('inventario')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all relative rounded-t-lg border-t border-l border-r cursor-pointer ${
              viewPerspective === 'inventario'
                ? 'bg-white border-slate-200 text-slate-900 border-b-transparent translate-y-[1px] z-10 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventario Técnico</span>
            {viewPerspective === 'inventario' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c66e4] rounded-t-full" />
            )}
          </button>

          {/* Asignación Tab */}
          <button
            id="tab-asignacion-btn"
            onClick={() => setViewPerspective('asignacion')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all relative rounded-t-lg border-t border-l border-r cursor-pointer ${
              viewPerspective === 'asignacion'
                ? 'bg-white border-slate-200 text-slate-900 border-b-transparent translate-y-[1px] z-10 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Asignaciones / Estado IT</span>
            {viewPerspective === 'asignacion' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c66e4] rounded-t-full" />
            )}
          </button>
        </div>
      </div>



      {viewPerspective === 'inventario' && (
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          <StudioFilterBar>
            <TableFilters>
              <TableFilters.Search
                id="inv-buscar"
                value={buscar}
                onChange={setBuscar}
                placeholder="Hostname, AnyDesk ID, usuario, UUID…"
              />
              <TableFilters.Select
                id="inv-ubicacion"
                label="Ubicación"
                value={filtroUbicacion}
                onChange={setFiltroUbicacion}
              >
                <option value="">{`Todas (${total})`}</option>
                {UBICACIONES_COMPUTADORA.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </TableFilters.Select>
              <TableFilters.Select
                id="inv-tipo-equipo"
                label="Tipo"
                value={filtroTipoEquipo}
                onChange={setFiltroTipoEquipo}
              >
                <option value="">{`Todos (${antesFiltroTipo.length})`}</option>
                <option value="notebook">{`Notebook (${conteosTipo.notebook})`}</option>
                <option value="pc">{`PC (${conteosTipo.pc})`}</option>
              </TableFilters.Select>
              <TableFilters.Select
                id="inv-actividad-sync"
                label="Sync"
                value={filtroConexion}
                onChange={setFiltroConexion}
              >
                <option value="">{`Todos (${antesFiltroConexion.length})`}</option>
                <option value="activo">{`Reciente (< ~${MINUTOS_LABEL_UMBRAL_ACTIVO} min)`}</option>
                <option value="intermedio">Entre ~12 min y 1 h</option>
                <option value="sin_actividad">Sin actividad (+1 h)</option>
              </TableFilters.Select>
              <TableFilters.Select
                id="inv-orden"
                label="Ordenar"
                value={orden}
                onChange={setOrden}
              >
                {ORDEN_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </TableFilters.Select>
            </TableFilters>
          </StudioFilterBar>

      <WriteGate>
      {seleccion.size > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-end gap-3">
          <p className="text-xs font-semibold text-slate-600 m-0">
            <strong>{seleccion.size}</strong> equipo{seleccion.size === 1 ? '' : 's'} seleccionado{seleccion.size === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="inv-ubicacion-masiva" className="font-semibold text-slate-600">Nueva ubicación:</label>
            <select
              id="inv-ubicacion-masiva"
              value={ubicacionDestino}
              onChange={e => setUbicacionDestino(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
            >
              <option value="">Elegir…</option>
              {UBICACIONES_COMPUTADORA.map(u => (
                <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
            disabled={borrandoMasivo || aplicandoMasivo || !ubicacionDestino}
            onClick={aplicarUbicacionMasiva}
          >
            {aplicandoMasivo ? 'Aplicando…' : 'Cambiar ubicación'}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
            disabled={borrandoMasivo || aplicandoMasivo}
            onClick={eliminarSeleccionadas}
          >
            {borrandoMasivo ? 'Eliminando…' : 'Eliminar seleccionadas'}
          </button>
        </div>
      ) : null}
      </WriteGate>

      {msgMasivo ? (
        <p
          className={`text-xs font-semibold px-4 py-2 rounded-lg border ${
            msgMasivo.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
          role="status"
        >
          {msgMasivo.texto}
        </p>
      ) : null}

      <StudioDataTable className="flex-1 min-h-0">
        <table className={`${studioTableClass()} text-sm relative`}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-widest">
              {puedeEscribir ? (
              <th className={`${studioThClass()} text-center w-10`} scope="col">
                <input
                  ref={headerCbRef}
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={todasVisiblesSeleccionadas && uuidsVisibles.length > 0}
                  onChange={toggleSeleccionarVisibles}
                  title="Seleccionar equipos visibles"
                  aria-label="Seleccionar todos los equipos visibles"
                />
              </th>
              ) : null}
              <th className={`${studioThClass()} text-center`}>Sync</th>
              <th className={studioThClass()}>Hostname</th>
              <th className={studioThClass()}>AnyDesk ID</th>
              <th className={studioThClass()}>Sistema operativo</th>
              <th className={studioThClass()}>Ubicación</th>
              <th className={studioThClass()}>Conexión</th>
              <th className={studioThClass()}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {computadoras.length === 0 ? (
              <tr>
                <td colSpan={8} className={`${studioTdClass()} text-center text-slate-400 py-10`}>
                  {todas.length === 0
                    ? 'Sin registros'
                    : 'Ningún equipo coincide con los filtros'}
                </td>
              </tr>
            ) : (
              computadoras.map(c => {
                const sel = c.uuid && seleccion.has(c.uuid);
                const nivel = nivelActividadSync(c);
                const conexion = textoConexionAgente(c);
                const activo = (conexion || '').toLowerCase() === 'activo' || (conexion || '').toLowerCase() === 'activa';
                const anydesk = anydeskIdDe(c);
                const esNotebook = (c.tipoEquipo ?? '').toLowerCase().includes('notebook');
                return (
                  <tr
                    key={c.uuid}
                    className={`hover:bg-slate-50/75 cursor-pointer transition-colors group ${sel ? 'bg-blue-50/40' : ''}`}
                    onClick={() => navigate(`/computadoras/${c.uuid}`)}
                  >
                    {puedeEscribir ? (
                    <td className={`${studioTdClass()} text-center`} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={!!sel}
                        onChange={() => toggleUuid(c.uuid)}
                        aria-label={`Seleccionar ${c.hostname || c.uuid}`}
                      />
                    </td>
                    ) : null}
                    <td className={`${studioTdClass()} text-center`}>
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${syncDotClass(nivel)} ${nivel === 'activo' ? 'animate-pulse' : ''}`}
                        title={tituloSyncDot(nivel)}
                        role="img"
                        aria-label={tituloSyncDot(nivel)}
                      />
                    </td>
                    <td className={`${studioTdClass()} font-bold text-slate-900`}>
                      <div className="flex items-center gap-1.5">
                        {esNotebook ? <Laptop className="w-4 h-4 text-slate-400 shrink-0" /> : <Monitor className="w-4 h-4 text-slate-400 shrink-0" />}
                        <div className="leading-tight">
                          <span className="text-sm">{c.hostname ?? '—'}</span>
                          <span className="text-xs text-slate-400 font-normal block font-mono">
                            {(c.uuid ?? '').slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={studioTdClass()} onClick={e => e.stopPropagation()}>
                      {anydesk ? (
                        <button
                          type="button"
                          onClick={e => copiarAnydesk(anydesk, e)}
                          className="font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 text-sm"
                          title="Copiar ID de AnyDesk"
                        >
                          <span>{fmtAnydeskId(anydesk)}</span>
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {copiedAnydesk === anydesk && (
                            <span className="text-[10px] bg-blue-600 text-white px-1 rounded">Listo</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={studioTdClass()}>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${osBadgeClass(c.sistemaOperativo)}`}>
                        {c.sistemaOperativo ?? '—'}
                      </span>
                    </td>
                    <td className={studioTdClass()}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.ubicacion ? labelUbicacionEnum(c.ubicacion) : '—'}
                      </span>
                    </td>
                    <td className={studioTdClass()}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {conexion}
                      </span>
                    </td>
                    <td className={studioTdClass()}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${estadoBadgeClass(c.estadoActual)}`}>
                        {c.estadoActual ?? '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </StudioDataTable>
        </div>
      )}

      {viewPerspective === 'asignacion' && (
        <AsignacionesBoard 
          computadoras={computadoras} 
          onUpdateComputer={async () => {
            const fresh = await fetchComputadoras();
            setTodas(fresh);
          }} 
        />
      )}

      <Outlet />
    </div>
  );
}

export default ComputadoraList;
