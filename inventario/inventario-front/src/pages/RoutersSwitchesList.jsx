import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Upload,
  Plus,
  ChevronDown,
  Router,
  EthernetPort,
  Wifi,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { fetchRouters, crearRouter, deleteRouter } from '../api/routerApi';
import { fetchSwitches, crearSwitch, deleteSwitch } from '../api/switchApi';
import { fetchAccessPoints, crearAccessPoint, deleteAccessPoint } from '../api/accessPointApi';
import {
  cambiarTipoInfraestructura,
  fetchDuplicadosInfraestructura,
  limpiarDuplicadosInfraestructura,
} from '../api/infraestructuraApi';
import { API_ORIGIN } from '../api/config.js';
import { apiFetch } from '../api/http.js';
import { routersSchema } from '../lib/importSchemas/routersSchema';
import { switchesSchema } from '../lib/importSchemas/switchesSchema';
import ImportModal from '../components/ImportModal';
import InfraestructuraModal from '../components/InfraestructuraModal';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { useCatalogo, opcionesEnumCatalogo } from '../hooks/useCatalogo';
import WriteGate from '../components/WriteGate';
import { ModuleHeader, TabsCard } from '../components/layout';

const ITEMS_POR_PAGINA = 20;

const TIPO_OPTS = [
  { value: 'router', label: 'Router' },
  { value: 'switch', label: 'Switch' },
  { value: 'access-point', label: 'Punto de acceso (EAP)' },
];

const FECHA_ALTA_FIELD = { name: 'fechaAlta', label: 'Fecha alta', type: 'date' };

const TIPO_EQUIPO_FIELD = {
  name: 'tipoComponente',
  label: 'Tipo de equipo',
  type: 'select',
  required: true,
  fullWidth: true,
  options: TIPO_OPTS,
};

function parseVlans(texto) {
  if (!texto || !String(texto).trim()) return undefined;
  const partes = String(texto).split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  return partes.length ? partes : undefined;
}

function toFechaAltaIso(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return '';
}

function emptyFormForType(type) {
  return {
    nombre: '',
    marca: '',
    modelo: '',
    ip: '',
    numeroSerie: '',
    ubicacion: '',
    fechaAlta: '',
    cantidadPuertosWan: 0,
    cantidadPuertosLan: 0,
    gateway: '',
    firmware: '',
    cantidadPuertos: 0,
    tipo: '',
    vlansTexto: '',
    mac: '',
    switchUplink: '',
    estado: 'OPERATIVO',
    tipoComponente: type,
  };
}

function tituloTipo(type) {
  if (type === 'router') return 'Router';
  if (type === 'switch') return 'Switch';
  return 'Punto de acceso';
}

function buildRouterBody(form) {
  const body = {
    nombre: form.nombre.trim(),
    marca: form.marca?.trim() || undefined,
    modelo: form.modelo?.trim() || undefined,
    ip: form.ip?.trim() || undefined,
    numeroSerie: form.numeroSerie?.trim() || undefined,
    firmware: form.firmware?.trim() || undefined,
    cantidadPuertosWan: Number(form.cantidadPuertosWan) || 0,
    cantidadPuertosLan: Number(form.cantidadPuertosLan) || 0,
    gateway: form.gateway?.trim() || undefined,
    ubicacion: form.ubicacion,
  };
  if (toFechaAltaIso(form.fechaAlta)) body.fechaAlta = toFechaAltaIso(form.fechaAlta);
  return body;
}

function buildSwitchBody(form) {
  const vlans = parseVlans(form.vlansTexto);
  const body = {
    nombre: form.nombre.trim(),
    marca: form.marca?.trim() || undefined,
    modelo: form.modelo?.trim() || undefined,
    ip: form.ip?.trim() || undefined,
    numeroSerie: form.numeroSerie?.trim() || undefined,
    cantidadPuertos: Number(form.cantidadPuertos) || 0,
    tipo: form.tipo?.trim() || undefined,
    ubicacion: form.ubicacion,
  };
  if (vlans) body.vlans = vlans;
  if (toFechaAltaIso(form.fechaAlta)) body.fechaAlta = toFechaAltaIso(form.fechaAlta);
  return body;
}

function buildAccessPointBody(form) {
  return {
    nombre: form.nombre.trim(),
    marca: form.marca?.trim() || undefined,
    modelo: form.modelo?.trim() || undefined,
    ip: form.ip?.trim() || undefined,
    mac: form.mac?.trim() || undefined,
    switchUplink: form.switchUplink?.trim() || undefined,
    ubicacion: form.ubicacion,
    estado: form.estado?.trim() || 'OPERATIVO',
  };
}

function buildBody(type, form) {
  if (type === 'router') return buildRouterBody(form);
  if (type === 'switch') return buildSwitchBody(form);
  return buildAccessPointBody(form);
}

async function crearPorTipo(type, form) {
  const body = buildBody(type, form);
  if (type === 'router') return crearRouter(body);
  if (type === 'switch') return crearSwitch(body);
  return crearAccessPoint(body);
}

function buildCambiarTipoPayload(tipoOrigen, tipoDestino, id, form) {
  const payload = { tipoOrigen, tipoDestino, id };
  const body = buildBody(tipoDestino, form);
  if (tipoDestino === 'router') payload.router = body;
  else if (tipoDestino === 'switch') payload.switch = body;
  else payload.accessPoint = body;
  return payload;
}

function normIp(ip) {
  return String(ip ?? '').trim().toLowerCase();
}

function normNombre(n) {
  return String(n ?? '').trim().toLowerCase();
}

function claveNombreIp(item) {
  const n = normNombre(item.nombre);
  const ip = normIp(item.ip);
  if (n && ip) return `${n}|${ip}`;
  return '';
}

function dedupeRouters(arrRouters, switchIds, apIds) {
  const vistos = new Set();
  const res = [];
  for (const r of arrRouters) {
    if (switchIds.has(r.id) || apIds.has(r.id)) continue;
    const clave = claveNombreIp(r);
    if (clave) {
      if (vistos.has(clave)) continue;
      vistos.add(clave);
    }
    res.push(r);
  }
  return res;
}

function fusionarListadoSinDuplicados(arrRouters, arrSwitches, arrAps) {
  const apsUnicos = [];
  const vistosAp = new Set();
  for (const ap of arrAps) {
    const clave = claveNombreIp(ap);
    if (clave) {
      if (vistosAp.has(clave)) continue;
      vistosAp.add(clave);
    }
    apsUnicos.push(ap);
  }
  const apsUnicosIds = new Set(apsUnicos.map((ap) => ap.id));
  const apClaves = new Set(apsUnicos.map(claveNombreIp).filter(Boolean));

  const switchesFiltrados = arrSwitches.filter((sw) => {
    if (apsUnicosIds.has(sw.id)) return false;
    const clave = claveNombreIp(sw);
    return !clave || !apClaves.has(clave);
  });
  const switchIdsFiltrados = new Set(switchesFiltrados.map((s) => s.id));
  const switchClaves = new Set(switchesFiltrados.map(claveNombreIp).filter(Boolean));

  const routersUnicos = dedupeRouters(arrRouters, switchIdsFiltrados, apsUnicosIds);
  const routersFiltrados = routersUnicos.filter((r) => {
    if (apsUnicosIds.has(r.id) || switchIdsFiltrados.has(r.id)) return false;
    const clave = claveNombreIp(r);
    if (clave && (apClaves.has(clave) || switchClaves.has(clave))) return false;
    return true;
  });

  return [...routersFiltrados, ...switchesFiltrados, ...apsUnicos];
}

export default function RoutersSwitchesList({ defaultTab = 'all' }) {
  const navigate = useNavigate();
  const { items: ubicRedItems } = useCatalogo('ubicaciones_red');
  const UBICACION_FIELD = useMemo(
    () => ({
      name: 'ubicacion',
      label: 'Ubicación',
      type: 'select',
      required: true,
      options: opcionesEnumCatalogo(ubicRedItems),
    }),
    [ubicRedItems],
  );

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [subFilter, setSubFilter] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [seleccion, setSeleccion] = useState(() => new Set());

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalTipoComponente, setOriginalTipoComponente] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importType, setImportType] = useState('router');
  const [duplicadosCount, setDuplicadosCount] = useState(0);
  const [limpiandoDuplicados, setLimpiandoDuplicados] = useState(false);

  function cargarDuplicados() {
    fetchDuplicadosInfraestructura()
      .then((items) => setDuplicadosCount(Array.isArray(items) ? items.length : 0))
      .catch(() => setDuplicadosCount(0));
  }

  function cargarLista() {
    setCargando(true);
    setError(null);
    Promise.all([fetchRouters(), fetchSwitches(), fetchAccessPoints()])
      .then(([routersData, switchesData, apsData]) => {
        const arrRouters = routersData.map((r) => ({ ...r, tipoComponente: 'router' }));
        const arrSwitches = switchesData.map((s) => ({ ...s, tipoComponente: 'switch' }));
        const arrAps = apsData.map((ap) => ({ ...ap, tipoComponente: 'access-point' }));
        setLista(fusionarListadoSinDuplicados(arrRouters, arrSwitches, arrAps));
        cargarDuplicados();
      })
      .catch(() => setError('No se pudo cargar el listado de equipos de red'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  useEffect(() => {
    setSubFilter(defaultTab);
  }, [defaultTab]);

  const ubicacionesUnicas = useMemo(() => {
    const set = new Set();
    lista.forEach((d) => {
      if (d.ubicacion) set.add(d.ubicacion);
    });
    return Array.from(set).sort();
  }, [lista]);

  const datasetFull = useMemo(() => {
    let res = [...lista];

    if (filtroUbicacion) {
      res = res.filter((d) => d.ubicacion === filtroUbicacion);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      res = res.filter((d) =>
        [d.nombre, d.ubicacion, d.ip, d.modelo, d.mac, d.switchUplink, d.numeroSerie]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }

    if (ordenNombre === 'asc') {
      res.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    } else if (ordenNombre === 'desc') {
      res.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '', 'es'));
    }

    return res;
  }, [lista, filtroUbicacion, searchTerm, ordenNombre]);

  const dataset = useMemo(() => {
    if (subFilter === 'all') return datasetFull;
    return datasetFull.filter((item) => item.tipoComponente === subFilter);
  }, [datasetFull, subFilter]);

  const routersCount = lista.filter((x) => x.tipoComponente === 'router').length;
  const switchesCount = lista.filter((x) => x.tipoComponente === 'switch').length;
  const apsCount = lista.filter((x) => x.tipoComponente === 'access-point').length;

  // Paginación
  const totalPaginas = Math.ceil(dataset.length / ITEMS_POR_PAGINA) || 1;
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return dataset.slice(start, start + ITEMS_POR_PAGINA);
  }, [dataset, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [subFilter, filtroUbicacion, searchTerm, ordenNombre]);

  // Selección múltiple
  const idsPagina = useMemo(() => itemsPaginados.map((i) => i.id).filter(Boolean), [itemsPaginados]);
  const todosSeleccionados = idsPagina.length > 0 && idsPagina.every((id) => seleccion.has(id));

  const toggleSelectPagina = () => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (todosSeleccionados) {
        idsPagina.forEach((id) => next.delete(id));
      } else {
        idsPagina.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id) => {
    if (!id) return;
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const effectiveType = isEditModal
    ? modalForm.tipoComponente || modalType
    : modalType;

  function abrirModalNuevo(type) {
    setModalType(type);
    setIsEditModal(false);
    setEditingId(null);
    setOriginalTipoComponente(null);
    setModalForm(emptyFormForType(type));
    setModalError('');
    setIsNewMenuOpen(false);
    setModalAbierto(true);
  }

  function handleOpenEditModal(item) {
    const type = item.tipoComponente || 'router';
    setModalType(type);
    setIsEditModal(true);
    setEditingId(item.id);
    setOriginalTipoComponente(type);
    setModalForm({
      tipoComponente: type,
      nombre: item.nombre || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      ip: item.ip || '',
      numeroSerie: item.numeroSerie || '',
      ubicacion: item.ubicacion || '',
      fechaAlta: toFechaAltaIso(item.fechaAlta),
      firmware: item.firmware || '',
      cantidadPuertosWan: item.cantidadPuertosWan || 0,
      cantidadPuertosLan: item.cantidadPuertosLan || 0,
      gateway: item.gateway || '',
      cantidadPuertos: item.cantidadPuertos || 0,
      tipo: item.tipo || '',
      vlansTexto: Array.isArray(item.vlans) ? item.vlans.join(', ') : '',
      mac: item.mac || '',
      switchUplink: item.switchUplink || '',
      estado: item.estado || 'OPERATIVO',
    });
    setModalError('');
    setModalAbierto(true);
  }

  async function handleDeleteItem(item) {
    const type = item.tipoComponente || 'router';
    const label = tituloTipo(type);
    if (!window.confirm(`¿Estás seguro de que deseas eliminar este ${label} (${item.nombre})?`)) {
      return;
    }
    try {
      if (type === 'router') await deleteRouter(item.id);
      else if (type === 'switch') await deleteSwitch(item.id);
      else await deleteAccessPoint(item.id);
      cargarLista();
    } catch {
      alert(`Error al eliminar el ${label}.`);
    }
  }

  function handleItemClick(item) {
    if (item.tipoComponente === 'router') navigate(`/routers/${item.id}`);
    else if (item.tipoComponente === 'switch') navigate(`/switches/${item.id}`);
    else if (item.tipoComponente === 'access-point') navigate(`/access-points/${item.id}`);
  }

  function onChangeCampo(name, value) {
    setModalForm((prev) => ({ ...prev, [name]: value }));
  }

  async function enviarCreacion(e) {
    e.preventDefault();
    if (!modalForm.nombre?.trim()) {
      setModalError('El nombre es obligatorio.');
      return;
    }
    setGuardando(true);
    setModalError('');
    try {
      if (isEditModal) {
        const destino = modalForm.tipoComponente || modalType;
        if (originalTipoComponente && destino !== originalTipoComponente) {
          const payload = buildCambiarTipoPayload(originalTipoComponente, destino, editingId, modalForm);
          await cambiarTipoInfraestructura(payload);
        } else {
          const base = `${API_ORIGIN}/api/${destino === 'access-point' ? 'access-points' : `${destino}s`}`;
          const body = buildBody(destino, modalForm);
          const res = await apiFetch(`${base}/${encodeURIComponent(editingId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
      } else {
        await crearPorTipo(effectiveType, modalForm);
      }
      setModalAbierto(false);
      cargarLista();
    } catch (err) {
      setModalError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  function handleOpenImport(type) {
    setImportType(type);
    setIsNewMenuOpen(false);
    setModalImportAbierto(true);
  }

  async function handleImport(filas) {
    for (const f of filas) {
      await crearPorTipo(importType, f);
    }
    setModalImportAbierto(false);
    cargarLista();
  }

  async function handleLimpiarDuplicados() {
    if (duplicadosCount === 0) return;
    if (!window.confirm(`Se eliminarán ${duplicadosCount} registros duplicados de infraestructura. ¿Continuar?`)) {
      return;
    }
    setLimpiandoDuplicados(true);
    try {
      const res = await limpiarDuplicadosInfraestructura();
      alert(`Limpieza completada: ${res.eliminados ?? 0} duplicados eliminados.`);
      cargarLista();
    } catch {
      alert('Error al limpiar duplicados.');
    } finally {
      setLimpiandoDuplicados(false);
    }
  }

  const commonFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'Dirección IP', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
  ];

  const routerFields = [
    ...(isEditModal ? [TIPO_EQUIPO_FIELD] : []),
    ...commonFields,
    { name: 'firmware', label: 'Firmware', type: 'text' },
    { name: 'cantidadPuertosWan', label: 'Puertos WAN', type: 'number' },
    { name: 'cantidadPuertosLan', label: 'Puertos LAN', type: 'number' },
    { name: 'gateway', label: 'Gateway', type: 'text' },
    UBICACION_FIELD,
    FECHA_ALTA_FIELD,
  ];

  const switchFields = [
    ...(isEditModal ? [TIPO_EQUIPO_FIELD] : []),
    ...commonFields,
    { name: 'cantidadPuertos', label: 'Cantidad de puertos', type: 'number' },
    { name: 'tipo', label: 'Tipo switch (Ej. MANAGED)', type: 'text' },
    { name: 'vlansTexto', label: 'VLANs (separadas por coma)', type: 'textarea', fullWidth: true },
    UBICACION_FIELD,
    FECHA_ALTA_FIELD,
  ];

  const apFields = [
    ...(isEditModal ? [TIPO_EQUIPO_FIELD] : []),
    ...commonFields.filter((f) => f.name !== 'numeroSerie'),
    { name: 'mac', label: 'MAC', type: 'text' },
    { name: 'switchUplink', label: 'Switch uplink', type: 'text' },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'OPERATIVO', label: 'Operativo' },
        { value: 'BAJA', label: 'Baja' },
      ],
    },
    UBICACION_FIELD,
  ];

  const modalFields =
    effectiveType === 'router'
      ? routerFields
      : effectiveType === 'switch'
      ? switchFields
      : apFields;

  if (cargando && lista.length === 0) return <StudioLoading message="Cargando routers, switches y access points…" />;
  if (error && lista.length === 0) return <StudioError message={error} />;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. ENCABEZADO ESTÁNDAR ── */}
      <ModuleHeader
        title="Routers, switches y access points"
        badge={`${routersCount} routers · ${switchesCount} switches · ${apsCount} APs`}
        description="Equipamiento de borde, conmutación LAN y puntos de acceso inalámbricos corporativos."
        actions={
          <>
            {duplicadosCount > 0 && (
              <WriteGate>
                <button
                  type="button"
                  onClick={handleLimpiarDuplicados}
                  disabled={limpiandoDuplicados}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
                >
                  {limpiandoDuplicados ? 'Limpiando…' : `Limpiar duplicados (${duplicadosCount})`}
                </button>
              </WriteGate>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar equipo</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </button>

            {isNewMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNewMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 overflow-hidden text-xs font-semibold">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Nuevo equipo
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirModalNuevo('router')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Router className="w-4 h-4 text-blue-600" /> Nuevo Router
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModalNuevo('switch')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <EthernetPort className="w-4 h-4 text-emerald-600" /> Nuevo Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModalNuevo('access-point')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Wifi className="w-4 h-4 text-cyan-600" /> Nuevo Access Point
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => handleOpenImport('router')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-500 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Importar Routers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenImport('switch')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-500 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Importar Switches
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      }
    />

      {/* ── 2. FILA DE 3 KPIS DE RED ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Router KPI */}
        <div
          onClick={() => setSubFilter(subFilter === 'router' ? 'all' : 'router')}
          className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            subFilter === 'router'
              ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Routers
            </span>
            <Router className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {routersCount}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Equipos de borde y Core WAN
          </span>
        </div>

        {/* Switch KPI */}
        <div
          onClick={() => setSubFilter(subFilter === 'switch' ? 'all' : 'switch')}
          className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            subFilter === 'switch'
              ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Switches
            </span>
            <EthernetPort className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {switchesCount}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Conmutadores L2 / L3 GbE
          </span>
        </div>

        {/* Access Point KPI */}
        <div
          onClick={() => setSubFilter(subFilter === 'access-point' ? 'all' : 'access-point')}
          className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            subFilter === 'access-point'
              ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Access Points
            </span>
            <Wifi className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {apsCount}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Puntos de acceso Wi-Fi corporativos
          </span>
        </div>
      </div>

      {/* ── 3. CARD PRINCIPAL CON SOLAPAS Y GRILLA ── */}
      <TabsCard
        tabs={[
          { key: 'all', label: 'Todos', count: datasetFull.length },
          { key: 'router', label: 'Routers', count: routersCount },
          { key: 'switch', label: 'Switches', count: switchesCount },
          { key: 'access-point', label: 'Access Points', count: apsCount },
        ]}
        activeTab={subFilter}
        onChange={setSubFilter}
      >
        <div className="p-5 space-y-4">

        {/* Barra de filtros */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 border-b border-slate-100 scrollbar-none">
          {/* Buscador */}
          <div className="relative w-[40%] min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, IP, MAC o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Ubicación */}
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 !w-[18%] max-w-[20%] min-w-[140px] truncate cursor-pointer"
          >
            <option value="">UBICACIÓN: Todas ({datasetFull.length})</option>
            {ubicacionesUnicas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Orden */}
          <select
            value={ordenNombre}
            onChange={(e) => setOrdenNombre(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 !w-[18%] max-w-[20%] min-w-[140px] truncate cursor-pointer"
          >
            <option value="">ORDEN: Sin ordenar</option>
            <option value="asc">Nombre (A → Z)</option>
            <option value="desc">Nombre (Z → A)</option>
          </select>

          {/* Seleccionar todo */}
          <button
            type="button"
            onClick={toggleSelectPagina}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {todosSeleccionados ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
              <span>Sel. Todo</span>
            </button>

            <span className="text-xs font-bold text-slate-600 whitespace-nowrap shrink-0">
              Total: <span className="text-slate-900 font-black">{dataset.length}</span>
            </span>
        </div>

        {/* Grilla de Tarjetas (4 columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itemsPaginados.map((item) => {
            const isSelected = seleccion.has(item.id);
            const isRouter = item.tipoComponente === 'router';
            const isSwitch = item.tipoComponente === 'switch';
            const Icon = isRouter ? Router : isSwitch ? EthernetPort : Wifi;
            const badgeCls = isRouter
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : isSwitch
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-cyan-50 text-cyan-700 border-cyan-100';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top: Checkbox + ID + Acciones */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`font-mono text-[11px] font-black border px-2 py-0.5 rounded uppercase truncate ${badgeCls}`}>
                        {item.id?.slice(0, 8) || 'RED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(item);
                        }}
                        title="Editar equipo"
                        className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                        title="Eliminar equipo"
                        className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nombre y modelo/ip */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={item.nombre}>
                      {item.nombre || 'Equipo de red'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate font-mono">
                      {item.ip || item.modelo || 'IP no asignada'}
                    </p>
                  </div>

                  {/* Badge Categoría */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badgeCls}`}>
                      <Icon className="w-3 h-3" />
                      <span>{tituloTipo(item.tipoComponente)}</span>
                    </span>
                  </div>
                </div>

                {/* Footer Tarjeta */}
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="truncate">
                    Ubicación: <strong>{item.ubicacion || 'Central'}</strong>
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">
                    ID: {item.id?.slice(0, 7)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {itemsPaginados.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No se encontraron equipos de red con los filtros seleccionados.
          </div>
        )}

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
          <span>
            Mostrando{' '}
            <strong>
              {dataset.length > 0 ? (paginaActual - 1) * ITEMS_POR_PAGINA + 1 : 0}
            </strong>{' '}
            a{' '}
            <strong>
              {Math.min(paginaActual * ITEMS_POR_PAGINA, dataset.length)}
            </strong>{' '}
            de <strong>{dataset.length}</strong> equipos
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(
                (num) =>
                  num === 1 ||
                  num === totalPaginas ||
                  Math.abs(num - paginaActual) <= 1,
              )
              .map((num, idx, arr) => (
                <div key={num} className="flex items-center">
                  {idx > 0 && num - arr[idx - 1] > 1 && (
                    <span className="px-1 text-slate-400">…</span>
                  )}
                  <button
                    onClick={() => setPaginaActual(num)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      paginaActual === num
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                </div>
              ))}

            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </TabsCard>

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={importType === 'router' ? routersSchema : switchesSchema}
        entityName={importType === 'router' ? 'Routers' : 'Switches'}
        isImporting={false}
      />

      <InfraestructuraModal
        isOpen={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={enviarCreacion}
        isEdit={isEditModal}
        title={tituloTipo(effectiveType)}
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={modalFields}
      />

      <Outlet />
    </div>
  );
}
