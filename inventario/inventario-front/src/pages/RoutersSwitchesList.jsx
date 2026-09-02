import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Upload, Plus, ChevronDown } from 'lucide-react';
import { fetchRouters, crearRouter } from '../api/routerApi';
import { fetchSwitches, crearSwitch } from '../api/switchApi';
import { fetchAccessPoints, crearAccessPoint } from '../api/accessPointApi';
import { cambiarTipoInfraestructura, fetchDuplicadosInfraestructura, limpiarDuplicadosInfraestructura } from '../api/infraestructuraApi';
import { API_ORIGIN } from '../api/config.js';
import { apiFetch } from '../api/http.js';
import { routersSchema } from '../lib/importSchemas/routersSchema';
import { switchesSchema } from '../lib/importSchemas/switchesSchema';
import ImportModal from '../components/ImportModal';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import TableFilters from '../components/TableFilters';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioFilterBar,
} from '../components/studio/StudioUi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';

const TIPO_OPTS = [
  { value: 'router', label: 'Router' },
  { value: 'switch', label: 'Switch' },
  { value: 'access-point', label: 'Punto de acceso (EAP)' },
];

const UBICACION_FIELD = {
  name: 'ubicacion',
  label: 'Ubicación',
  type: 'select',
  required: true,
  options: UBICACIONES_RED.map(u => ({ value: u, label: labelUbicacionEnum(u) })),
};

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
  const partes = String(texto).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  return partes.length ? partes : undefined;
}

/** Normaliza fechaAlta de la API (ISO string o [y,m,d]) a `yyyy-MM-dd`. */
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

async function eliminarPorTipo(type, id) {
  const enc = encodeURIComponent(id);
  const base =
    type === 'router' ? `${API_ORIGIN}/api/routers`
      : type === 'switch' ? `${API_ORIGIN}/api/switches`
        : `${API_ORIGIN}/api/access-points`;
  const res = await apiFetch(`${base}/${enc}/eliminar`, { method: 'POST' });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

function claveNombreIp(item) {
  const nombre = (item.nombre || '').trim().toLowerCase();
  if (!nombre) return '';
  const ip = (item.ip || '').trim().toLowerCase();
  return `${nombre}|${ip}`;
}

function claveDuplicadoEquipo(item) {
  const nombre = (item.nombre || '').trim().toLowerCase();
  if (!nombre) return '';
  const ip = (item.ip || '').trim().toLowerCase();
  return ip ? `nip|${nombre}|${ip}` : `nom|${nombre}`;
}

function claveDuplicadoAp(item) {
  return claveDuplicadoEquipo(item);
}

function puntajeConservarRouter(r, switchIds, apIds) {
  let score = 0;
  if (switchIds.has(r.id)) score += 100;
  if (apIds.has(r.id)) score += 80;
  if (r.numeroSerie?.trim()) score += 10;
  if (r.modelo?.trim()) score += 5;
  if (r.ip?.trim()) score += 3;
  if (r.gateway?.trim()) score += 2;
  return score;
}

function puntajeConservarAp(ap, switchIds, routerIds) {
  let score = 0;
  if (switchIds.has(ap.id)) score += 100;
  if (routerIds.has(ap.id)) score += 50;
  if (ap.mac?.trim()) score += 10;
  if (ap.modelo?.trim()) score += 5;
  if (ap.ip?.trim()) score += 3;
  return score;
}

function dedupePorClave(items, claveFn, puntajeFn, extraArgs = []) {
  const grupos = new Map();
  for (const item of items) {
    const clave = claveFn(item);
    if (!clave) continue;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(item);
  }

  const conservados = new Set();
  for (const grupo of grupos.values()) {
    if (grupo.length === 1) {
      conservados.add(grupo[0].id);
      continue;
    }
    const mejor = [...grupo].sort((a, b) => {
      const diff = puntajeFn(b, ...extraArgs) - puntajeFn(a, ...extraArgs);
      return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
    })[0];
    conservados.add(mejor.id);
  }

  const sinClave = items.filter(item => !claveFn(item));
  const conClave = items.filter(item => claveFn(item) && conservados.has(item.id));
  return [...sinClave, ...conClave];
}

function dedupeAccessPoints(arrAps, switchIds, routerIds) {
  return dedupePorClave(arrAps, claveDuplicadoAp, puntajeConservarAp, [switchIds, routerIds]);
}

function dedupeRouters(arrRouters, switchIds, apIds) {
  return dedupePorClave(arrRouters, claveDuplicadoEquipo, puntajeConservarRouter, [switchIds, apIds]);
}

/** Oculta en pantalla equipos duplicados entre colecciones y dentro de cada tipo. */
function fusionarListadoSinDuplicados(arrRouters, arrSwitches, arrAps) {
  const switchIds = new Set(arrSwitches.map(s => s.id));
  const apIds = new Set(arrAps.map(ap => ap.id));

  const apsUnicos = dedupeAccessPoints(arrAps, switchIds, new Set(arrRouters.map(r => r.id)));
  const apsUnicosIds = new Set(apsUnicos.map(ap => ap.id));
  const apClaves = new Set(apsUnicos.map(claveNombreIp).filter(Boolean));

  const switchesFiltrados = arrSwitches.filter(sw => {
    if (apsUnicosIds.has(sw.id)) return false;
    const clave = claveNombreIp(sw);
    return !clave || !apClaves.has(clave);
  });
  const switchIdsFiltrados = new Set(switchesFiltrados.map(s => s.id));
  const switchClaves = new Set(switchesFiltrados.map(claveNombreIp).filter(Boolean));

  const routersUnicos = dedupeRouters(arrRouters, switchIdsFiltrados, apsUnicosIds);
  const routersFiltrados = routersUnicos.filter(r => {
    if (apsUnicosIds.has(r.id) || switchIdsFiltrados.has(r.id)) return false;
    const clave = claveNombreIp(r);
    if (clave && (apClaves.has(clave) || switchClaves.has(clave))) return false;
    return true;
  });

  return [...routersFiltrados, ...switchesFiltrados, ...apsUnicos];
}

export default function RoutersSwitchesList({ defaultTab = 'all' }) {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [subFilter, setSubFilter] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
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
      .then(items => setDuplicadosCount(Array.isArray(items) ? items.length : 0))
      .catch(() => setDuplicadosCount(0));
  }

  function cargarLista() {
    setCargando(true);
    setError(null);
    Promise.all([fetchRouters(), fetchSwitches(), fetchAccessPoints()])
      .then(([routersData, switchesData, apsData]) => {
        const arrRouters = routersData.map(r => ({ ...r, tipoComponente: 'router' }));
        const arrSwitches = switchesData.map(s => ({ ...s, tipoComponente: 'switch' }));
        const arrAps = apsData.map(ap => ({ ...ap, tipoComponente: 'access-point' }));
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

  const datasetFull = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return lista;
    return lista.filter(d =>
      [d.nombre, d.ubicacion, d.ip, d.modelo, d.mac, d.switchUplink]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [lista, searchTerm]);

  const dataset = useMemo(() => {
    if (subFilter === 'all') return datasetFull;
    return datasetFull.filter(item => item.tipoComponente === subFilter);
  }, [datasetFull, subFilter]);

  const routersCount = datasetFull.filter(x => x.tipoComponente === 'router').length;
  const switchesCount = datasetFull.filter(x => x.tipoComponente === 'switch').length;
  const apsCount = datasetFull.filter(x => x.tipoComponente === 'access-point').length;

  const effectiveType = isEditModal
    ? (modalForm.tipoComponente || modalType)
    : modalType;

  const abrirModalNuevo = type => {
    setIsNewMenuOpen(false);
    setModalType(type);
    setIsEditModal(false);
    setEditingId(null);
    setOriginalTipoComponente(null);
    setModalForm(emptyFormForType(type));
    setModalError('');
    setModalAbierto(true);
  };

  const handleOpenEditModal = item => {
    const tipo = item.tipoComponente;
    setModalType(tipo);
    setOriginalTipoComponente(tipo);
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({
      ...emptyFormForType(tipo),
      ...item,
      tipoComponente: tipo,
      vlansTexto: Array.isArray(item.vlans) ? item.vlans.join(', ') : (item.vlansTexto ?? ''),
      fechaAlta: toFechaAltaIso(item.fechaAlta),
    });
    setModalError('');
    setModalAbierto(true);
  };

  const handleDeleteItem = async item => {
    if (!window.confirm(`¿Eliminar permanentemente "${item.nombre || item.id}"?`)) return;
    try {
      await eliminarPorTipo(item.tipoComponente, item.id);
      cargarLista();
    } catch {
      window.alert('No se pudo eliminar el equipo');
    }
  };

  const handleItemClick = item => {
    if (item.tipoComponente === 'router') {
      navigate(`/routers/${encodeURIComponent(item.id)}`);
    } else if (item.tipoComponente === 'switch') {
      navigate(`/switches/${encodeURIComponent(item.id)}`);
    } else {
      navigate(`/access-points/${encodeURIComponent(item.id)}`);
    }
  };

  const onChangeCampo = e => {
    const { name, value } = e.target;
    setModalForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'tipoComponente' && isEditModal) {
        setModalType(value);
      }
      return next;
    });
  };

  const enviarCreacion = async e => {
    e.preventDefault();
    const tipoDestino = isEditModal ? modalForm.tipoComponente : modalType;
    if (!modalForm.nombre?.trim() || !modalForm.ubicacion) {
      setModalError('Nombre y ubicación son obligatorios');
      return;
    }

    setGuardando(true);
    setModalError('');

    try {
      if (isEditModal) {
        const payload = buildCambiarTipoPayload(
          originalTipoComponente,
          tipoDestino,
          editingId,
          modalForm,
        );
        await cambiarTipoInfraestructura(payload);
      } else {
        await crearPorTipo(tipoDestino, modalForm);
      }
      setModalAbierto(false);
      cargarLista();
    } catch (err) {
      setModalError(err?.message || (isEditModal ? 'No se pudo guardar los cambios' : 'No se pudo crear el equipo'));
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenImport = type => {
    setImportType(type);
    setIsNewMenuOpen(false);
    setModalImportAbierto(true);
  };

  const handleImport = async () => {
    alert(`Importación iniciada para ${importType}s`);
    setModalImportAbierto(false);
  };

  const handleLimpiarDuplicados = async () => {
    if (duplicadosCount === 0) {
      window.alert('No se detectaron duplicados en la base de datos.');
      return;
    }
    const ok = window.confirm(
      `Se eliminarán ${duplicadosCount} registro(s) duplicado(s) en Firestore ` +
      '(se conserva un solo registro por nombre/IP en routers, switches y APs). ¿Continuar?',
    );
    if (!ok) return;
    setLimpiandoDuplicados(true);
    try {
      const result = await limpiarDuplicadosInfraestructura();
      const n = result?.eliminados ?? 0;
      window.alert(n > 0 ? `Listo: se eliminaron ${n} duplicado(s).` : 'No había duplicados para eliminar.');
      cargarLista();
    } catch {
      window.alert('No se pudo limpiar duplicados. ¿Reiniciaste el backend?');
    } finally {
      setLimpiandoDuplicados(false);
    }
  };

  if (cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }

  const commonFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
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
    ...commonFields.filter(f => f.name !== 'numeroSerie'),
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
    effectiveType === 'router' ? routerFields
      : effectiveType === 'switch' ? switchFields
        : apFields;

  const tituloPagina =
    defaultTab === 'router' ? `Infraestructura: Routers (${routersCount})`
      : defaultTab === 'switch' ? `Infraestructura: Switches (${switchesCount})`
        : defaultTab === 'access-point' ? `Infraestructura: Access Points (${apsCount})`
          : `Infraestructura: Routers, Switches y Access Points (${datasetFull.length})`;

  const subtituloPagina =
    defaultTab === 'router' ? 'Equipos de enrutamiento registrados en la red corporativa.'
      : defaultTab === 'switch' ? 'Equipos de conmutación registrados en la red corporativa.'
        : defaultTab === 'access-point' ? 'Puntos de acceso WiFi registrados en la red corporativa.'
          : 'Hardware de enrutamiento, conmutación y WiFi en la red.';

  return (
    <>
    <StudioPageShell
      title={tituloPagina}
      subtitle={subtituloPagina}
      actions={
        <>
          {duplicadosCount > 0 ? (
            <StudioSecondaryButton
              requiresWrite
              onClick={handleLimpiarDuplicados}
              disabled={limpiandoDuplicados}
            >
              {limpiandoDuplicados ? 'Limpiando…' : `Limpiar duplicados (${duplicadosCount})`}
            </StudioSecondaryButton>
          ) : null}

          <div className="relative">
            <StudioPrimaryButton
              requiresWrite
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Equipo</span>
              <ChevronDown className="w-4 h-4" />
            </StudioPrimaryButton>

            {isNewMenuOpen ? (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-100 z-50 overflow-hidden">
                <div className="py-1">
                  <button type="button" onClick={() => abrirModalNuevo('router')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Nuevo Router
                  </button>
                  <button type="button" onClick={() => abrirModalNuevo('switch')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Nuevo Switch
                  </button>
                  <button type="button" onClick={() => abrirModalNuevo('access-point')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Nuevo Punto de acceso
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button type="button" onClick={() => handleOpenImport('router')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" /> Importar Routers
                  </button>
                  <button type="button" onClick={() => handleOpenImport('switch')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" /> Importar Switches
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      }
    >
      <div id="infra-network-subtoggles" className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
        {[
          { id: 'all', label: `Todos (${datasetFull.length})` },
          { id: 'router', label: `Routers (${routersCount})` },
          { id: 'switch', label: `Switches (${switchesCount})` },
          { id: 'access-point', label: `Puntos de acceso (${apsCount})` },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              subFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre, IP, MAC, ubicación…"
          />
        </TableFilters>
        <div className="text-slate-500 text-sm font-semibold whitespace-nowrap self-center">
          Visibles: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </StudioFilterBar>

      <div className="pt-2">
        <InfraestructuraGrid
          items={dataset}
          type="routers_switches"
          onEditItem={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
          onItemClick={handleItemClick}
        />
      </div>

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
    </StudioPageShell>
    <Outlet />
    </>
  );
}
