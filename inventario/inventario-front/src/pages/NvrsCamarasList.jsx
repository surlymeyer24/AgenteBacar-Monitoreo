import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import {
  Camera,
  Video,
  HardDrive,
  Server,
  Cloud,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Filter,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchCamaras,
  createCamara,
  asignarNvrCamara,
  deleteCamara,
  updateEstadoCamara,
  actualizarCamara,
} from '../api/camaraApi';
import { fetchNvrs, crearNvr, actualizarNvr } from '../api/nvrApi';
import ImportModal from '../components/ImportModal';
import { camarasSchema } from '../lib/importSchemas/camarasSchema';
import { nvrsSchema } from '../lib/importSchemas/nvrsSchema';
import { useCatalogo, opcionesTextoLibre } from '../hooks/useCatalogo';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { ModuleHeader, KpiCard, KpiGrid } from '../components/layout';

const CAMARAS_POR_PAGINA = 20;

export default function NvrsCamarasList() {
  const navigate = useNavigate();
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: ubicCamItems } = useCatalogo('ubicaciones_camara');

  // Datos
  const [camaras, setCamaras] = useState([]);
  const [nvrs, setNvrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros de NVRs
  const [filtroNvrSector, setFiltroNvrSector] = useState('todos');

  // Filtros de Cámaras
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroNvrId, setFiltroNvrId] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [buscarCamara, setBuscarCamara] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  // Selección múltiple de cámaras
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [nvrAsignarLote, setNvrAsignarLote] = useState('');
  const [aplicandoLote, setAplicandoLote] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState(null);

  // Modales de Cámara
  const [modalCamaraOpen, setModalCamaraOpen] = useState(false);
  const [isEditCamara, setIsEditCamara] = useState(false);
  const [editingCamaraId, setEditingCamaraId] = useState(null);
  const [formCamara, setFormCamara] = useState({
    dispositivo: '',
    nombre: '',
    marca: '',
    descripcion: '',
    responsable: '',
    ubicacion: '',
    direccionIp: '',
    puerto: '',
    tipo: 'Domo',
    nvrId: '',
    estado: 'OPERATIVO',
  });
  const [modalCamaraError, setModalCamaraError] = useState('');

  // Modales de NVR
  const [modalNvrOpen, setModalNvrOpen] = useState(false);
  const [isEditNvr, setIsEditNvr] = useState(false);
  const [editingNvrId, setEditingNvrId] = useState(null);
  const [formNvr, setFormNvr] = useState({
    nombre: '',
    direccionIp: '',
    puerto: '8000',
    descripcion: '',
  });
  const [modalNvrError, setModalNvrError] = useState('');

  // Modal de importación
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [importSchemaActual, setImportSchemaActual] = useState('camaras');
  const [importando, setImportando] = useState(false);

  // Carga inicial de datos
  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [dataCamaras, dataNvrs] = await Promise.all([fetchCamaras(), fetchNvrs()]);
      setCamaras(Array.isArray(dataCamaras) ? dataCamaras : []);
      setNvrs(Array.isArray(dataNvrs) ? dataNvrs : []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos de videovigilancia.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Mapa de NVRs por ID
  const nvrMap = useMemo(() => {
    const map = new Map();
    for (const n of nvrs) {
      if (n.id) map.set(String(n.id).trim(), n);
    }
    return map;
  }, [nvrs]);

  // Conteos de cámaras por NVR
  const camarasPorNvrCount = useMemo(() => {
    const count = new Map();
    for (const c of camaras) {
      const id = String(c.nvrId || '').trim();
      if (id) count.set(id, (count.get(id) || 0) + 1);
    }
    return count;
  }, [camaras]);

  // Opciones únicas de ubicación para cámaras
  const opcionesUbicacion = useMemo(() => {
    const set = new Set(ubicCamItems.map((i) => i.label));
    for (const c of camaras) {
      if (c.ubicacion) set.add(c.ubicacion);
    }
    return [...set].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'es'));
  }, [camaras, ubicCamItems]);

  // Filtro de NVRs por píldoras rápidas
  const nvrsFiltrados = useMemo(() => {
    if (filtroNvrSector === 'todos') return nvrs;
    const q = filtroNvrSector.toLowerCase();
    return nvrs.filter(
      (n) =>
        (n.nombre || '').toLowerCase().includes(q) ||
        (n.descripcion || '').toLowerCase().includes(q),
    );
  }, [nvrs, filtroNvrSector]);

  // Conteos para píldoras rápidas de NVR
  const conteoTesoreriaNvrs = useMemo(
    () =>
      nvrs.filter(
        (n) =>
          (n.nombre || '').toLowerCase().includes('tesor') ||
          (n.descripcion || '').toLowerCase().includes('tesor'),
      ).length,
    [nvrs],
  );

  const conteoMonitoreoNvrs = useMemo(
    () =>
      nvrs.filter(
        (n) =>
          (n.nombre || '').toLowerCase().includes('monitoreo') ||
          (n.descripcion || '').toLowerCase().includes('monitoreo'),
      ).length,
    [nvrs],
  );

  // Filtrado de Cámaras
  const camarasFiltradas = useMemo(() => {
    let list = [...camaras];

    if (filtroUbicacion) {
      list = list.filter((c) => c.ubicacion === filtroUbicacion);
    }

    if (filtroNvrId) {
      list = list.filter((c) => String(c.nvrId || '').trim() === String(filtroNvrId).trim());
    }

    if (buscarCamara.trim()) {
      const q = buscarCamara.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.nombre || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q) ||
          (c.dispositivo || '').toLowerCase().includes(q) ||
          (c.direccionIp || '').toLowerCase().includes(q) ||
          (c.ubicacion || '').toLowerCase().includes(q),
      );
    }

    if (ordenNombre === 'asc') {
      list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    } else if (ordenNombre === 'desc') {
      list.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '', 'es'));
    }

    return list;
  }, [camaras, filtroUbicacion, filtroNvrId, buscarCamara, ordenNombre]);

  // Paginación
  const totalPaginas = Math.ceil(camarasFiltradas.length / CAMARAS_POR_PAGINA) || 1;
  const camarasPaginadas = useMemo(() => {
    const start = (paginaActual - 1) * CAMARAS_POR_PAGINA;
    return camarasFiltradas.slice(start, start + CAMARAS_POR_PAGINA);
  }, [camarasFiltradas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroUbicacion, filtroNvrId, buscarCamara, ordenNombre]);

  // Métricas superiores
  const camarasOnline = useMemo(() => {
    return camaras.filter(
      (c) =>
        (c.estado || 'OPERATIVO').toUpperCase() !== 'FUERA_DE_SERVICIO' &&
        (c.estado || 'OPERATIVO').toUpperCase() !== 'INACTIVO',
    ).length;
  }, [camaras]);

  // Acciones de Selección Múltiple
  const idsPagina = useMemo(() => camarasPaginadas.map((c) => c.id).filter(Boolean), [camarasPaginadas]);
  const todasPaginaSeleccionadas =
    idsPagina.length > 0 && idsPagina.every((id) => seleccion.has(id));

  const toggleSelectPagina = () => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (todasPaginaSeleccionadas) {
        idsPagina.forEach((id) => next.delete(id));
      } else {
        idsPagina.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectCamara = (id) => {
    if (!id) return;
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Asignar NVR en lote
  const handleAsignarNvrLote = async () => {
    if (seleccion.size === 0) return;
    setAplicandoLote(true);
    setMsgFeedback(null);
    try {
      for (const id of seleccion) {
        await asignarNvrCamara(id, nvrAsignarLote || null);
      }
      setMsgFeedback({
        tipo: 'exito',
        texto: `Se asignó la NVR a ${seleccion.size} cámaras correctamente.`,
      });
      setSeleccion(new Set());
      await cargarDatos();
    } catch {
      setMsgFeedback({ tipo: 'error', texto: 'Error al asignar NVR a las cámaras.' });
    } finally {
      setAplicandoLote(false);
    }
  };

  // Eliminar Cámara
  const handleDeleteCamara = async (cam) => {
    if (!cam?.id) return;
    const nom = cam.nombre || cam.id;
    if (window.confirm(`¿Eliminar la cámara "${nom}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteCamara(cam.id);
        setCamaras((prev) => prev.filter((c) => c.id !== cam.id));
        setSeleccion((prev) => {
          const n = new Set(prev);
          n.delete(cam.id);
          return n;
        });
      } catch {
        alert('No se pudo eliminar la cámara.');
      }
    }
  };

  // Abrir Modal Cámara
  const handleOpenAddCamara = () => {
    setIsEditCamara(false);
    setEditingCamaraId(null);
    setFormCamara({
      dispositivo: '',
      nombre: '',
      marca: '',
      descripcion: '',
      responsable: '',
      ubicacion: '',
      direccionIp: '',
      puerto: '',
      tipo: 'Domo',
      nvrId: filtroNvrId || '',
      estado: 'OPERATIVO',
    });
    setModalCamaraError('');
    setModalCamaraOpen(true);
  };

  const handleOpenEditCamara = (cam) => {
    setIsEditCamara(true);
    setEditingCamaraId(cam.id);
    setFormCamara({
      dispositivo: cam.id || cam.dispositivo || '',
      nombre: cam.nombre || '',
      marca: cam.marca || '',
      descripcion: cam.descripcion || '',
      responsable: cam.responsable || '',
      ubicacion: cam.ubicacion || '',
      direccionIp: cam.direccionIp || '',
      puerto: cam.puerto != null ? String(cam.puerto) : '',
      tipo: cam.tipo || 'Domo',
      nvrId: cam.nvrId || '',
      estado: cam.estado || 'OPERATIVO',
    });
    setModalCamaraError('');
    setModalCamaraOpen(true);
  };

  const handleSaveCamara = async (e) => {
    e.preventDefault();
    setModalCamaraError('');
    const puertoNum =
      formCamara.puerto && String(formCamara.puerto).trim() !== ''
        ? Number.parseInt(String(formCamara.puerto).trim(), 10)
        : undefined;

    try {
      const payload = {
        dispositivo: formCamara.dispositivo.trim(),
        nombre: formCamara.nombre.trim(),
        marca: formCamara.marca?.trim() || undefined,
        descripcion: formCamara.descripcion?.trim() || undefined,
        responsable: formCamara.responsable?.trim() || undefined,
        ubicacion: formCamara.ubicacion,
        direccionIp: formCamara.direccionIp?.trim() || undefined,
        tipo: formCamara.tipo?.trim() || undefined,
        nvrId: formCamara.nvrId?.trim() || undefined,
      };
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        payload.puerto = puertoNum;
      }

      if (isEditCamara) {
        await actualizarCamara(editingCamaraId, payload);
        if (formCamara.estado) {
          await updateEstadoCamara(editingCamaraId, formCamara.estado, 'Edición desde videovigilancia');
        }
      } else {
        await createCamara(payload);
      }
      setModalCamaraOpen(false);
      await cargarDatos();
    } catch (err) {
      setModalCamaraError(err.message || 'Error al guardar la cámara.');
    }
  };

  // Abrir Modal NVR
  const handleOpenAddNvr = () => {
    setIsEditNvr(false);
    setEditingNvrId(null);
    setFormNvr({
      nombre: '',
      direccionIp: '',
      puerto: '8000',
      descripcion: '',
    });
    setModalNvrError('');
    setModalNvrOpen(true);
  };

  const handleOpenEditNvr = (nvr) => {
    setIsEditNvr(true);
    setEditingNvrId(nvr.id);
    setFormNvr({
      nombre: nvr.nombre || '',
      direccionIp: nvr.direccionIp || '',
      puerto: nvr.puerto != null ? String(nvr.puerto) : '8000',
      descripcion: nvr.descripcion || '',
    });
    setModalNvrError('');
    setModalNvrOpen(true);
  };

  const handleSaveNvr = async (e) => {
    e.preventDefault();
    setModalNvrError('');
    const puertoNum =
      formNvr.puerto && String(formNvr.puerto).trim() !== ''
        ? Number.parseInt(String(formNvr.puerto).trim(), 10)
        : undefined;

    try {
      const payload = {
        nombre: formNvr.nombre.trim(),
        direccionIp: formNvr.direccionIp?.trim() || undefined,
        descripcion: formNvr.descripcion?.trim() || undefined,
      };
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        payload.puerto = puertoNum;
      }

      if (isEditNvr) {
        await actualizarNvr(editingNvrId, payload);
      } else {
        await crearNvr(payload);
      }
      setModalNvrOpen(false);
      await cargarDatos();
    } catch (err) {
      setModalNvrError(err.message || 'Error al guardar NVR.');
    }
  };

  if (cargando) return <StudioLoading message="Cargando videovigilancia y NVRs…" />;
  if (error && camaras.length === 0) return <StudioError message={error} />;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. ENCABEZADO ── */}
      <ModuleHeader
        title="NVR y cámaras de seguridad"
        badge={`${camaras.length} cámaras · ${nvrs.length} NVRs`}
        description="Grabadoras digitales (NVR) y cámaras conectadas al circuito cerrado local y canal corporativo."
        actions={
          <>
            <WriteGate>
              <button
                onClick={() => {
                  setImportSchemaActual('camaras');
                  setModalImportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar Excel/CSV</span>
              </button>
            </WriteGate>

            <WriteGate>
              <button
                onClick={handleOpenAddCamara}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Nueva cámara</span>
              </button>
            </WriteGate>

            <WriteGate>
              <button
                onClick={handleOpenAddNvr}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo NVR</span>
              </button>
            </WriteGate>
          </>
        }
      />

      {/* ── 2. KPIS DE VIDEOVIGILANCIA (4 CARDS) ── */}
      <KpiGrid cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="CCTV Terminales"
          value={camarasOnline}
          subtitle={`${camarasOnline} online de ${camaras.length} instaladas`}
          icon={<Camera className="w-4 h-4 text-rose-600" />}
        />
        <KpiCard
          title="Servidores NVR"
          value={nvrs.length}
          subtitle="Grabadoras digitales operativas"
          icon={<Server className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          title="Almacenamiento RAID"
          value="48 TB"
          subtitle="Capacidad de grabación continua"
          icon={<HardDrive className="w-4 h-4 text-slate-600" />}
        />
        <KpiCard
          title="Ciclo Retención"
          value="45 Días"
          subtitle="Reserva de video en codec H.265+"
          icon={<Cloud className="w-4 h-4 text-indigo-600" />}
        />
      </KpiGrid>

      {/* ── 3. SECCIÓN: GRABADORAS DIGITALES NVR ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Grabadoras Digitales NVR</h2>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {nvrs.length} Equipos Activos
                </span>
              </div>
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Filtro rápido:</span>
            <button
              onClick={() => setFiltroNvrSector('todos')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                filtroNvrSector === 'todos'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({nvrs.length})
            </button>
            <button
              onClick={() => setFiltroNvrSector('tesor')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                filtroNvrSector === 'tesor'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tesorería ({conteoTesoreriaNvrs})
            </button>
            <button
              onClick={() => setFiltroNvrSector('monitoreo')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                filtroNvrSector === 'monitoreo'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Monitoreo ({conteoMonitoreoNvrs})
            </button>
          </div>
        </div>

        {/* Tarjetas Horizontales de NVRs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-1">
          {nvrsFiltrados.map((nvr) => {
            const camarasAsignadas = camarasPorNvrCount.get(String(nvr.id).trim()) || 0;
            const maxCanales = nvr.nombre?.includes('64')
              ? 64
              : nvr.nombre?.includes('16')
              ? 16
              : 32;
            const isSelectedNvr = filtroNvrId === nvr.id;

            return (
              <div
                key={nvr.id}
                onClick={() => setFiltroNvrId(isSelectedNvr ? '' : nvr.id)}
                className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-2xs hover:shadow-md ${
                  isSelectedNvr
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top: ID Badge + Acciones */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase truncate">
                      {nvr.id?.slice(0, 8) || 'NVR'}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditNvr(nvr);
                        }}
                        title="Editar NVR"
                        className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Nombre y subtítulo */}
                  <div className="mt-2 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-xs truncate" title={nvr.nombre}>
                      {nvr.nombre || 'NVR Sin Nombre'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {nvr.direccionIp || 'Equipo Genérico'}
                    </p>
                  </div>

                  {/* Badge de canales */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50/70 border border-blue-100 text-blue-700 w-full justify-between">
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-500" />
                        <span>NVR</span>
                      </span>
                      <span className="font-mono text-emerald-600">
                        {camarasAsignadas}/{maxCanales} ch
                      </span>
                    </span>
                  </div>
                </div>

                {/* Footer de tarjeta NVR */}
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="truncate">Ubic: {nvr.descripcion || 'Central'}</span>
                  <span className="font-mono text-[9px] uppercase">ID: {nvr.id?.slice(0, 5)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. SECCIÓN: CÁMARAS (FILTROS, ACCIONES Y GRILLA) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Barra de filtros superior */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ubicación */}
            <div className="relative">
              <select
                value={filtroUbicacion}
                onChange={(e) => setFiltroUbicacion(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">UBICACIÓN: Todas ({camaras.length})</option>
                {opcionesUbicacion.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* NVR */}
            <div className="relative">
              <select
                value={filtroNvrId}
                onChange={(e) => setFiltroNvrId(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">NVR: Todas</option>
                {nvrs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre || n.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Orden */}
            <div className="relative">
              <select
                value={ordenNombre}
                onChange={(e) => setOrdenNombre(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">ORDEN: Sin ordenar</option>
                <option value="asc">Nombre (A → Z)</option>
                <option value="desc">Nombre (Z → A)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cámara por nombre, IP o ID..."
                value={buscarCamara}
                onChange={(e) => setBuscarCamara(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Seleccionar todo */}
            <button
              onClick={toggleSelectPagina}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              {todasPaginaSeleccionadas ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Sel. Todo</span>
            </button>

            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Total: <span className="text-slate-900 font-black">{camarasFiltradas.length}</span>
            </span>
          </div>
        </div>

        {/* Barra contextual de selección masiva */}
        <AnimatePresence>
          {seleccion.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4 text-xs font-medium text-blue-900 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>
                    <strong>{seleccion.size}</strong> cámaras seleccionadas
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={nvrAsignarLote}
                    onChange={(e) => setNvrAsignarLote(e.target.value)}
                    className="p-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="">Seleccionar NVR a asignar...</option>
                    {nvrs.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nombre || n.id}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAsignarNvrLote}
                    disabled={aplicandoLote}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs disabled:opacity-50"
                  >
                    {aplicandoLote ? 'Aplicando…' : 'Asignar NVR'}
                  </button>

                  <button
                    onClick={() => setSeleccion(new Set())}
                    className="px-2 py-1 hover:bg-blue-100 rounded text-blue-700 text-xs"
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Banner */}
        {msgFeedback && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
              msgFeedback.tipo === 'exito'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{msgFeedback.texto}</span>
            <button onClick={() => setMsgFeedback(null)} className="p-0.5 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grilla de Tarjetas de Cámaras (4 columnas x 5 filas = 20) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {camarasPaginadas.map((cam) => {
            const isSelected = seleccion.has(cam.id);
            const nvrPadre = cam.nvrId ? nvrMap.get(String(cam.nvrId).trim()) : null;

            return (
              <div
                key={cam.id}
                onClick={() => toggleSelectCamara(cam.id)}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Fila superior: Checkbox + ID Badge + Botones */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectCamara(cam.id);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded truncate">
                        {cam.dispositivo || cam.id?.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditCamara(cam);
                        }}
                        title="Editar cámara"
                        className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCamara(cam);
                        }}
                        title="Eliminar cámara"
                        className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nombre y descripción */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={cam.nombre}>
                      {cam.nombre || 'Cámara Sin Nombre'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {cam.descripcion || 'Privado'}
                    </p>
                  </div>

                  {/* Badge Cámara de Seg. */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 border border-blue-100 text-blue-700">
                      <Camera className="w-3 h-3 text-blue-600" />
                      <span>Cámara de Seg.</span>
                    </span>
                  </div>
                </div>

                {/* Footer de Tarjeta Cámara */}
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="truncate">
                    Ubicación: <strong>{cam.ubicacion || 'Central'}</strong>
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">
                    ID: {cam.id?.slice(0, 7)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {camarasPaginadas.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No se encontraron cámaras con los filtros seleccionados.
          </div>
        )}

        {/* ── 5. PAGINACIÓN INFERIOR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
          <span>
            Mostrando{' '}
            <strong>
              {camarasFiltradas.length > 0 ? (paginaActual - 1) * CAMARAS_POR_PAGINA + 1 : 0}
            </strong>{' '}
            a{' '}
            <strong>
              {Math.min(paginaActual * CAMARAS_POR_PAGINA, camarasFiltradas.length)}
            </strong>{' '}
            de <strong>{camarasFiltradas.length}</strong> cámaras conectadas
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
                        ? 'bg-[#b91c1c] text-white shadow-2xs'
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

      {/* ── MODAL ALTA / EDICIÓN CÁMARA ── */}
      <AnimatePresence>
        {modalCamaraOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border-t-[3px] border-t-red-600"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-red-600" />
                  <span className="font-extrabold text-sm text-slate-900 uppercase">
                    {isEditCamara ? 'Editar Cámara IP' : 'Registrar Nueva Cámara IP'}
                  </span>
                </div>
                <button
                  onClick={() => setModalCamaraOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCamara} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                {modalCamaraError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                    {modalCamaraError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>ID / Dispositivo *</label>
                    <input
                      required
                      type="text"
                      value={formCamara.dispositivo}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, dispositivo: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="Ej. CAM-001"
                      disabled={isEditCamara}
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Nombre *</label>
                    <input
                      required
                      type="text"
                      value={formCamara.nombre}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                      placeholder="Ej. Reja Bolsines"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Marca</label>
                    <input
                      type="text"
                      value={formCamara.marca}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, marca: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                      placeholder="Hikvision, Dahua..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Tipo</label>
                    <input
                      type="text"
                      value={formCamara.tipo}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, tipo: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                      placeholder="Domo, Bullet, PTZ..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Dirección IP</label>
                    <input
                      type="text"
                      value={formCamara.direccionIp}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, direccionIp: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="192.168.1.50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Puerto</label>
                    <input
                      type="number"
                      value={formCamara.puerto}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, puerto: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="554 o 8000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Ubicación</label>
                    <select
                      value={formCamara.ubicacion}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, ubicacion: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs font-semibold"
                    >
                      <option value="">Sin ubicación</option>
                      {opcionesUbicacion.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>NVR Asignada</label>
                    <select
                      value={formCamara.nvrId}
                      onChange={(e) =>
                        setFormCamara((prev) => ({ ...prev, nvrId: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs font-semibold"
                    >
                      <option value="">Sin NVR vinculada</option>
                      {nvrs.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nombre || n.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Descripción / Observaciones</label>
                  <textarea
                    rows={2}
                    value={formCamara.descripcion}
                    onChange={(e) =>
                      setFormCamara((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    placeholder="Detalles de instalación o cableado..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCamaraOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#b91c1c] text-white rounded-lg shadow-sm hover:bg-[#991b1b] font-bold"
                  >
                    {isEditCamara ? 'Guardar Cambios' : 'Registrar Cámara'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL ALTA / EDICIÓN NVR ── */}
      <AnimatePresence>
        {modalNvrOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl border-t-[3px] border-t-red-600"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-red-600" />
                  <span className="font-extrabold text-sm text-slate-900 uppercase">
                    {isEditNvr ? 'Editar Grabadora NVR' : 'Registrar Grabadora NVR'}
                  </span>
                </div>
                <button
                  onClick={() => setModalNvrOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNvr} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                {modalNvrError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                    {modalNvrError}
                  </div>
                )}

                <div className="space-y-1">
                  <label>Nombre de la NVR *</label>
                  <input
                    required
                    type="text"
                    value={formNvr.nombre}
                    onChange={(e) =>
                      setFormNvr((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                    placeholder="Ej. Monitoreo Nueva (NVR-02)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Dirección IP</label>
                    <input
                      type="text"
                      value={formNvr.direccionIp}
                      onChange={(e) =>
                        setFormNvr((prev) => ({ ...prev, direccionIp: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Puerto</label>
                    <input
                      type="number"
                      value={formNvr.puerto}
                      onChange={(e) =>
                        setFormNvr((prev) => ({ ...prev, puerto: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="8000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Ubicación / Sector / Canales</label>
                  <textarea
                    rows={2}
                    value={formNvr.descripcion}
                    onChange={(e) =>
                      setFormNvr((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    placeholder="Ej. Sala CCTV, 32 Canales PoE..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNvrOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#b91c1c] text-white rounded-lg shadow-sm hover:bg-[#991b1b] font-bold"
                  >
                    {isEditNvr ? 'Guardar Cambios' : 'Registrar NVR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL IMPORTACIÓN EXCEL ── */}
      <ImportModal
        isOpen={modalImportOpen}
        onClose={() => setModalImportOpen(false)}
        onImport={async (rows) => {
          setImportando(true);
          try {
            for (const r of rows) {
              await createCamara({
                dispositivo: String(r.dispositivo || r.id || '').trim(),
                nombre: String(r.nombre || '').trim(),
                marca: r.marca ? String(r.marca).trim() : undefined,
                ubicacion: r.ubicacion ? String(r.ubicacion).trim() : undefined,
                direccionIp: r.direccionIp ? String(r.direccionIp).trim() : undefined,
                nvrId: r.nvrId ? String(r.nvrId).trim() : undefined,
              });
            }
            await cargarDatos();
          } finally {
            setImportando(false);
            setModalImportOpen(false);
          }
        }}
        schema={importSchemaActual === 'camaras' ? camarasSchema : nvrsSchema}
        entityName={importSchemaActual === 'camaras' ? 'Cámaras' : 'NVRs'}
        isImporting={importando}
        existingData={camaras}
      />

      <Outlet />
    </div>
  );
}
