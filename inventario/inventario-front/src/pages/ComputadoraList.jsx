import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Laptop,
  Monitor,
  Search,
  Copy,
  Cpu,
  Edit2,
  Eye,
  Download,
  PlusCircle,
  Trash2,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
} from 'lucide-react';
import { fetchComputadoras, updateUbicacion, deleteComputadora } from '../api/computadoraApi';
import { useComputadorasList } from '../context/ComputadorasListContext';
import { coincideUbicacionFiltro } from '../constants/ubicaciones';
import { useCatalogo, opcionesEnumCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';
import { textoConexionAgente } from '../utils/estadoConexion';
import {
  nivelActividadSync,
  MINUTOS_LABEL_UMBRAL_ACTIVO,
  tituloSyncDot,
} from '../utils/syncActividad';
import {
  StudioLoading,
  StudioError,
  syncDotClass,
} from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { usePermisos } from '../hooks/usePermisos';
import { ModuleHeader, FilterBar } from '../components/layout';

const ORDEN_OPTS = [
  { value: 'reciente', label: 'Ordenar por: Recientes' },
  { value: 'hostname-asc', label: 'Ordenar por: Hostname A-Z' },
  { value: 'hostname-desc', label: 'Ordenar por: Hostname Z-A' },
  { value: 'ubicacion-asc', label: 'Ordenar por: Ubicación A-Z' },
];

function cmpReciente(a, b) {
  const ta = a.ultimaSincronizacion ? new Date(a.ultimaSincronizacion).getTime() : 0;
  const tb = b.ultimaSincronizacion ? new Date(b.ultimaSincronizacion).getTime() : 0;
  return tb - ta;
}

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

function estadoEfectivo(c) {
  const raw = String(c?.estadoActual || '').trim().toLowerCase();
  if (raw.includes('baja') || raw.includes('mantenimiento')) {
    return c.estadoActual;
  }
  const tieneResp = Boolean(c?.responsableInventario && !['SYSTEM', 'LOCAL SERVICE', 'NETWORK SERVICE'].includes(String(c.responsableInventario).trim().toUpperCase()));
  const esArea = c?.asignacionTipo === 'AREA' || (Boolean(c?.ubicacion) && !['DEPOSITO', 'STOCK'].includes(String(c.ubicacion).trim().toUpperCase()) && !c?.enDeposito);
  if (tieneResp || esArea) {
    return 'Asignada';
  }
  return c?.estadoActual || 'Sin Asignar';
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
    c.sistemaOperativo,
    estadoEfectivo(c),
    anydeskIdDe(c),
  ]
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

function codigoTipoNormalizado(val) {
  return String(val ?? '').trim().toLowerCase();
}

function coincideFiltroTipoEquipo(c, filtroCodigo) {
  if (!filtroCodigo) return true;
  const t = codigoTipoNormalizado(c.tipoEquipo);
  if (!t) return false;
  return t === codigoTipoNormalizado(filtroCodigo);
}

function coincideFiltroActividadSync(c, filtro) {
  if (!filtro) return true;
  const n = nivelActividadSync(c);
  if (filtro === 'activo') return n === 'activo';
  if (filtro === 'intermedio') return n === 'intermedio';
  if (filtro === 'sin_actividad') return n === 'sin_actividad' || n === 'sin_datos';
  return true;
}

function renderEstadoPill(estado) {
  const raw = String(estado || '').trim().toLowerCase();
  let dotColor = 'bg-slate-400';
  let badgeCls = 'bg-slate-50 text-slate-600 border-slate-200';
  let label = estado || 'Sin estado';

  if (raw.includes('asignad')) {
    dotColor = 'bg-[#0c66e4]';
    badgeCls = 'bg-blue-50 text-[#0c66e4] border-blue-200';
    label = 'Asignada';
  } else if (raw.includes('mantenimiento')) {
    dotColor = 'bg-amber-500';
    badgeCls = 'bg-amber-50 text-amber-800 border-amber-200';
    label = 'En mantenimiento';
  } else if (raw.includes('stock')) {
    dotColor = 'bg-purple-500';
    badgeCls = 'bg-purple-50 text-purple-700 border-purple-200';
    label = 'En stock';
  } else if (raw.includes('revis') || raw.includes('armi') || raw.includes('agente')) {
    dotColor = 'bg-slate-500';
    badgeCls = 'bg-slate-100 text-slate-700 border-slate-200';
    label = 'En revisión';
  } else if (raw.includes('baja')) {
    dotColor = 'bg-slate-600';
    badgeCls = 'bg-slate-200 text-slate-800 border-slate-300';
    label = 'Baja';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

function renderOrigenBadge(origen) {
  const orig = String(origen || '').toUpperCase();
  if (orig === 'DETECTADA_POR_AGENTE' || orig.includes('AGENTE')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        Agente v2
      </span>
    );
  }
  if (orig === 'STOCK') {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Stock
      </span>
    );
  }
  if (orig === 'LEGACY') {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Legacy
      </span>
    );
  }
  if (orig.includes('RETRO')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
        Vinc. retro
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
      {origen || '—'}
    </span>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function ComputadoraList() {
  const { todas, setTodas, cargando, error, openEditPc } = useComputadorasList();
  const { puedeEscribir } = usePermisos();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');

  const [buscar, setBuscar] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoEquipo, setFiltroTipoEquipo] = useState('');
  const [filtroPreparacion, setFiltroPreparacion] = useState('');
  const [filtroConexion, setFiltroConexion] = useState('');
  const [incluirLegacy, setIncluirLegacy] = useState(false);
  const [orden, setOrden] = useState('reciente');
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [ubicacionDestino, setUbicacionDestino] = useState('');
  const [aplicandoMasivo, setAplicandoMasivo] = useState(false);
  const [borrandoMasivo, setBorrandoMasivo] = useState(false);
  const [msgMasivo, setMsgMasivo] = useState(null);
  const [copiedAnydesk, setCopiedAnydesk] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState('todos');

  const headerCbRef = useRef(null);
  const navigate = useNavigate();

  function copiarAnydesk(id, e) {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(String(id).replace(/\s/g, ''));
    setCopiedAnydesk(id);
    setTimeout(() => setCopiedAnydesk(null), 1500);
  }

  // Colección computadoras operativas con agente (excluyendo equipos en depósito o dados de baja)
  const pcsColeccion = useMemo(() => {
    return (todas || []).filter(
      c => Boolean(c?.uuid || c?.hostname) &&
        Boolean(c?.tieneAgente) &&
        !c?.enDeposito &&
        c?.estadoActual !== 'Baja'
    );
  }, [todas]);

  const antesFiltroTipo = useMemo(() => {
    let list = pcsColeccion.filter(c => coincideUbicacionFiltro(c.ubicacion, filtroUbicacion));
    list = list.filter(c => coincideBusqueda(c, buscar));
    if (!incluirLegacy) list = list.filter(c => c.origenAlta !== 'LEGACY');
    return list;
  }, [pcsColeccion, filtroUbicacion, buscar, incluirLegacy]);

  const antesFiltroPrepacion = useMemo(() => {
    let list = antesFiltroTipo.filter(c => coincideFiltroTipoEquipo(c, filtroTipoEquipo));
    if (filtroPreparacion) {
      list = list.filter(c => (c.estadoPreparacion ?? c.estadoConciliacion) === filtroPreparacion);
    }
    return list;
  }, [antesFiltroTipo, filtroTipoEquipo, filtroPreparacion]);

  const computadoras = useMemo(() => {
    let list = antesFiltroPrepacion.filter(c => coincideFiltroActividadSync(c, filtroConexion));
    const copy = [...list];
    if (orden === 'reciente') copy.sort(cmpReciente);
    else if (orden === 'hostname-asc') copy.sort((a, b) => cmpHostname(a, b, false));
    else if (orden === 'hostname-desc') copy.sort((a, b) => cmpHostname(a, b, true));
    else if (orden === 'ubicacion-asc') copy.sort((a, b) => cmpUbicacion(a, b));
    return copy;
  }, [antesFiltroPrepacion, filtroConexion, orden]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [buscar, filtroUbicacion, filtroTipoEquipo, filtroPreparacion, filtroConexion, incluirLegacy, orden, porPagina]);

  // Paginación
  const totalItems = computadoras.length;
  const esTodos = porPagina === 'todos';
  const limitePorPagina = esTodos ? Math.max(1, totalItems) : Number(porPagina);
  const totalPaginas = esTodos ? 1 : Math.max(1, Math.ceil(totalItems / limitePorPagina));
  const inicioIdx = esTodos ? 0 : (paginaActual - 1) * limitePorPagina;
  const finIdx = esTodos ? totalItems : Math.min(inicioIdx + limitePorPagina, totalItems);
  const computadorasPaginadas = useMemo(
    () => (esTodos ? computadoras : computadoras.slice(inicioIdx, finIdx)),
    [computadoras, esTodos, inicioIdx, finIdx]
  );

  const uuidsVisibles = useMemo(
    () => computadorasPaginadas.map(c => c.uuid).filter(Boolean),
    [computadorasPaginadas]
  );

  const seleccionadosEnVista = useMemo(
    () => uuidsVisibles.filter(id => seleccion.has(id)).length,
    [uuidsVisibles, seleccion]
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

  function exportarCsv() {
    if (!computadoras || computadoras.length === 0) return;
    const headers = [
      'Hostname',
      'UUID',
      'Tipo',
      'Responsable',
      'Ubicación',
      'AnyDesk ID',
      'Sistema Operativo',
      'Estado',
      'Origen',
      'Conexión',
    ];
    const rows = computadoras.map(c => [
      `"${(c.hostname || '').replace(/"/g, '""')}"`,
      `"${(c.uuid || '').replace(/"/g, '""')}"`,
      `"${(labelDeCatalogo(tiposEquipoItems, c.tipoEquipo) || c.tipoEquipo || '').replace(/"/g, '""')}"`,
      `"${(c.responsableInventario || c.usuarioActual || ((c.asignacionTipo === 'AREA' || (!c.responsableInventario && c.ubicacion && c.ubicacion !== 'DEPOSITO')) ? ('Área ' + (labelDeCatalogo(ubicCompItems, c.ubicacion) || c.ubicacion)) : '')).replace(/"/g, '""')}"`,
      `"${(labelDeCatalogo(ubicCompItems, c.ubicacion) || c.ubicacion || '').replace(/"/g, '""')}"`,
      `"${(anydeskIdDe(c) || '').replace(/"/g, '""')}"`,
      `"${(c.sistemaOperativo || '').replace(/"/g, '""')}"`,
      `"${(estadoEfectivo(c) || '').replace(/"/g, '""')}"`,
      `"${(c.origenAlta || '').replace(/"/g, '""')}"`,
      `"${(textoConexionAgente(c) || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `inventario_computadoras_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Contador de filtros aplicados
  const filtrosActivosCount = useMemo(() => {
    let count = 0;
    if (buscar.trim()) count += 1;
    if (filtroUbicacion) count += 1;
    if (filtroTipoEquipo) count += 1;
    if (filtroPreparacion) count += 1;
    if (filtroConexion) count += 1;
    if (incluirLegacy) count += 1;
    return count;
  }, [buscar, filtroUbicacion, filtroTipoEquipo, filtroPreparacion, filtroConexion, incluirLegacy]);

  function limpiarFiltros() {
    setBuscar('');
    setFiltroUbicacion('');
    setFiltroTipoEquipo('');
    setFiltroPreparacion('');
    setFiltroConexion('');
    setIncluirLegacy(false);
    setOrden('reciente');
  }

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4">
      {/* HEADER PRINCIPAL EN CARD */}
      <ModuleHeader
        title="Computadoras"
        badge={`${pcsColeccion.length} equipos`}
        description="Inventario operativo de equipos detectados y registrados en la red corporativa BACAR."
        actions={
          <>
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
              title="Exportar listado a CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar</span>
            </button>
            <WriteGate>
              <button
                type="button"
                onClick={() => navigate('/computadoras/nueva')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar computadora</span>
              </button>
            </WriteGate>
          </>
        }
      />

      <div className="flex flex-col flex-1 min-h-0 space-y-3">
          {/* TOOLBAR DE FILTROS */}
          <FilterBar
            card
            activeCount={filtrosActivosCount}
            onReset={limpiarFiltros}
            extraFooterLeft={
              <label
                htmlFor="inv-incluir-legacy"
                className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none"
              >
                <input
                  id="inv-incluir-legacy"
                  type="checkbox"
                  checked={incluirLegacy}
                  onChange={e => setIncluirLegacy(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <span>Incluir equipos legacy (Win 7 / No agente)</span>
              </label>
            }
          >
            <FilterBar.Search
              id="inv-buscar-pcs"
              value={buscar}
              onChange={val => setBuscar(val)}
              placeholder="Buscar computadora..."
              widthClass="w-[28%] min-w-[200px] flex-1"
            />

            <FilterBar.Select
              value={filtroUbicacion}
              onChange={val => setFiltroUbicacion(val)}
              widthClass="!w-[14%] max-w-[15%] min-w-[115px]"
            >
              <option value="">Ubicación: Todas</option>
              {opcionesEnumCatalogo(ubicCompItems).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FilterBar.Select>

            <FilterBar.Select
              value={filtroTipoEquipo}
              onChange={val => setFiltroTipoEquipo(val)}
              widthClass="!w-[13%] max-w-[14%] min-w-[110px]"
            >
              <option value="">Tipo: Todos</option>
              {tiposEquipoItems.map(item => (
                <option key={item.codigo} value={item.codigo}>{item.label}</option>
              ))}
            </FilterBar.Select>

            <FilterBar.Select
              value={filtroPreparacion}
              onChange={val => setFiltroPreparacion(val)}
              widthClass="!w-[14%] max-w-[15%] min-w-[115px]"
            >
              <option value="">Preparación: Todas</option>
              <option value="SIN_ARMAR">Sin armar</option>
              <option value="ARMADO">Combo armado</option>
              <option value="NO_APLICA">No aplica</option>
            </FilterBar.Select>

            <FilterBar.Select
              value={filtroConexion}
              onChange={val => setFiltroConexion(val)}
              widthClass="!w-[14%] max-w-[15%] min-w-[115px]"
            >
              <option value="">Actividad: Todas</option>
              <option value="activo">{`Reciente (< ~${MINUTOS_LABEL_UMBRAL_ACTIVO}m)`}</option>
              <option value="intermedio">Entre ~12m y 1h</option>
              <option value="sin_actividad">Sin actividad (+1h)</option>
            </FilterBar.Select>

            <FilterBar.Select
              value={orden}
              onChange={val => setOrden(val)}
              widthClass="!w-[14%] max-w-[15%] min-w-[120px]"
            >
              {ORDEN_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FilterBar.Select>
          </FilterBar>

          {/* BARRA DE ACCIONES MASIVAS */}
          <WriteGate>
            {seleccion.size > 0 && (
              <div className="bg-[#ebf3ff] border border-[#d0e2ff] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {seleccion.size}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    equipo{seleccion.size === 1 ? '' : 's'} seleccionado{seleccion.size === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id="inv-ubicacion-masiva"
                    value={ubicacionDestino}
                    onChange={e => setUbicacionDestino(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 !w-auto"
                  >
                    <option value="">Cambiar ubicación masiva...</option>
                    {opcionesEnumCatalogo(ubicCompItems).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                    disabled={borrandoMasivo || aplicandoMasivo || !ubicacionDestino}
                    onClick={aplicarUbicacionMasiva}
                  >
                    {aplicandoMasivo ? 'Aplicando…' : 'Aplicar'}
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    disabled={borrandoMasivo || aplicandoMasivo}
                    onClick={eliminarSeleccionadas}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{borrandoMasivo ? 'Eliminando…' : 'Eliminar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeleccion(new Set())}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Cancelar selección
                  </button>
                </div>
              </div>
            )}
          </WriteGate>

          {msgMasivo && (
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
          )}

          {/* TABLA PRINCIPAL */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {puedeEscribir && (
                      <th className="px-3.5 py-3.5 text-center w-10">
                        <input
                          ref={headerCbRef}
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          checked={todasVisiblesSeleccionadas && uuidsVisibles.length > 0}
                          onChange={toggleSeleccionarVisibles}
                          title="Seleccionar equipos visibles en esta página"
                          aria-label="Seleccionar todos los equipos visibles"
                        />
                      </th>
                    )}
                    <th className="px-2.5 py-3.5 text-center w-12">ACT.</th>
                    <th className="px-3.5 py-3.5">HOSTNAME</th>
                    <th className="px-3.5 py-3.5">TIPO</th>
                    <th className="px-3.5 py-3.5">RESPONSABLE</th>
                    <th className="px-3.5 py-3.5">UBICACIÓN</th>
                    <th className="px-3.5 py-3.5">ANYDESK</th>
                    <th className="px-3.5 py-3.5">SISTEMA OPERATIVO</th>
                    <th className="px-3.5 py-3.5">ESTADO</th>
                    <th className="px-3.5 py-3.5 text-right w-20">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computadorasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={puedeEscribir ? 10 : 9} className="text-center text-slate-400 py-12 text-sm">
                        {pcsColeccion.length === 0
                          ? 'Sin computadoras registradas'
                          : 'Ningún equipo coincide con los filtros aplicados'}
                      </td>
                    </tr>
                  ) : (
                    computadorasPaginadas.map(c => {
                      const sel = c.uuid && seleccion.has(c.uuid);
                      const nivel = nivelActividadSync(c);
                      const anydesk = anydeskIdDe(c);
                      const tNormalizado = codigoTipoNormalizado(c.tipoEquipo);
                      const esNotebook = tNormalizado === 'notebook';
                      const esWorkstation = tNormalizado === 'workstation' || tNormalizado.includes('server');
                      const esAreaAsignada = c.asignacionTipo === 'AREA' || (!c.responsableInventario && c.ubicacion && c.ubicacion !== 'DEPOSITO' && c.ubicacion !== 'STOCK');
                      const labelArea = c.ubicacion ? (labelDeCatalogo(ubicCompItems, c.ubicacion) || c.ubicacion) : null;
                      const responsable = c.responsableInventario || c.usuarioActual;
                      const so = c.sistemaOperativo || '—';
                      const esLinux = so.toLowerCase().includes('ubuntu') || so.toLowerCase().includes('linux');

                      return (
                        <tr
                          key={c.uuid}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            sel ? 'bg-[#f0f6ff]' : ''
                          }`}
                          onClick={() => navigate(`/computadoras/${c.uuid}`)}
                        >
                          {puedeEscribir && (
                            <td className="px-3.5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                                checked={!!sel}
                                onChange={() => toggleUuid(c.uuid)}
                                aria-label={`Seleccionar ${c.hostname || c.uuid}`}
                              />
                            </td>
                          )}
                          <td className="px-2.5 py-3.5 text-center">
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block ${syncDotClass(nivel)} ${
                                nivel === 'activo' ? 'animate-pulse' : ''
                              }`}
                              title={tituloSyncDot(nivel)}
                              role="img"
                              aria-label={tituloSyncDot(nivel)}
                            />
                          </td>
                          <td className="px-3.5 py-3.5 font-bold text-slate-900 text-sm">
                            {c.hostname ?? '—'}
                          </td>
                          <td className="px-3.5 py-3.5 text-slate-700 text-sm">
                            <div className="flex items-center gap-2">
                              {esNotebook ? (
                                <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : esWorkstation ? (
                                <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>{c.tipoEquipo ? labelDeCatalogo(tiposEquipoItems, c.tipoEquipo) : 'PC'}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-sm">
                            {responsable ? (
                              <span className="text-slate-800 font-medium">{responsable}</span>
                            ) : esAreaAsignada && labelArea ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                                Área {labelArea}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-normal">Sin responsable</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-slate-700 text-sm">
                            {c.ubicacion ? labelDeCatalogo(ubicCompItems, c.ubicacion) : '—'}
                          </td>
                          <td className="px-3.5 py-3.5" onClick={e => e.stopPropagation()}>
                            {anydesk ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-slate-800">
                                  {fmtAnydeskId(anydesk)}
                                </span>
                                <button
                                  type="button"
                                  onClick={e => copiarAnydesk(anydesk, e)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Copiar ID de AnyDesk"
                                >
                                  {copiedAnydesk === anydesk ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Sin dato</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5 text-sm">
                            <div className="flex items-center gap-2 text-slate-800">
                              {esLinux ? (
                                <Cpu className="w-4 h-4 text-orange-500 shrink-0" />
                              ) : (
                                <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
                              )}
                              <span className="font-medium">{so}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            {renderEstadoPill(estadoEfectivo(c))}
                          </td>
                          <td className="px-3.5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/computadoras/${c.uuid}`)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Ver detalle de la computadora"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </button>
                              {puedeEscribir && (
                                <button
                                  type="button"
                                  onClick={() => openEditPc?.(c)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Editar computadora"
                                >
                                  <Edit2 className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PIE DE TABLA / PAGINACIÓN */}
            <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span>
                  Mostrando{' '}
                  <strong className="text-slate-800 font-semibold">
                    {totalItems === 0 ? 0 : inicioIdx + 1}-{finIdx}
                  </strong>{' '}
                  de <strong className="text-slate-800 font-semibold">{totalItems}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 whitespace-nowrap">Por página:</span>
                  <select
                    value={porPagina}
                    onChange={e => {
                      const v = e.target.value;
                      setPorPagina(v === 'todos' ? 'todos' : Number(v));
                    }}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 !w-auto cursor-pointer"
                  >
                    <option value="todos">Todos</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Botones de navegación de página */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual <= 1 || esTodos}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers(paginaActual, totalPaginas).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }
                    const num = Number(item);
                    const isActive = num === paginaActual;
                    return (
                      <button
                        key={`page-${num}`}
                        type="button"
                        onClick={() => setPaginaActual(num)}
                        disabled={esTodos}
                        className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0c66e4] text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual >= totalPaginas || esTodos}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      <Outlet />
    </div>
  );
}
