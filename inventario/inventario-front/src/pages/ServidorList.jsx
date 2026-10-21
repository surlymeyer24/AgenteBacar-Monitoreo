import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Server,
  Upload,
  Plus,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { fetchServidores, crearServidor, actualizarServidor } from '../api/servidorApi';
import ImportModal from '../components/ImportModal';
import { servidoresSchema } from '../lib/importSchemas/servidoresSchema';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { ModuleHeader } from '../components/layout';

const ITEMS_POR_PAGINA = 20;

export default function ServidorList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [seleccion, setSeleccion] = useState(() => new Set());

  // Modal Alta / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    nombre: '',
    hostname: '',
    ip: '',
    sistemaOperativo: '',
    ubicacion: '',
    descripcion: '',
    estado: 'activo',
  });
  const [modalError, setModalError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal Importación
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchServidores()
      .then((data) => setLista(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudo cargar el listado de servidores.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  const ubicacionesUnicas = useMemo(() => {
    const set = new Set();
    lista.forEach((s) => {
      if (s.ubicacion) set.add(s.ubicacion);
    });
    return Array.from(set).sort();
  }, [lista]);

  const itemsFiltrados = useMemo(() => {
    let res = [...lista];

    if (filtroUbicacion) {
      res = res.filter((s) => s.ubicacion === filtroUbicacion);
    }

    if (filtroEstado) {
      res = res.filter((s) => (s.estado || 'activo').toLowerCase() === filtroEstado.toLowerCase());
    }

    if (buscar.trim()) {
      const b = buscar.toLowerCase().trim();
      res = res.filter(
        (s) =>
          (s.nombre || '').toLowerCase().includes(b) ||
          (s.hostname || '').toLowerCase().includes(b) ||
          (s.ip || '').toLowerCase().includes(b) ||
          (s.sistemaOperativo || '').toLowerCase().includes(b) ||
          (s.ubicacion || '').toLowerCase().includes(b),
      );
    }

    if (ordenNombre === 'asc') {
      res.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    } else if (ordenNombre === 'desc') {
      res.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '', 'es'));
    }

    return res;
  }, [lista, filtroUbicacion, filtroEstado, buscar, ordenNombre]);

  // Paginación
  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return itemsFiltrados.slice(start, start + ITEMS_POR_PAGINA);
  }, [itemsFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [buscar, filtroUbicacion, filtroEstado, ordenNombre]);

  // Selección
  const idsPagina = useMemo(() => itemsPaginados.map((s) => s.id).filter(Boolean), [itemsPaginados]);
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

  // Handlers Modal
  const handleOpenAddModal = () => {
    setIsEditModal(false);
    setEditingId(null);
    setModalForm({
      nombre: '',
      hostname: '',
      ip: '',
      sistemaOperativo: '',
      ubicacion: '',
      descripcion: '',
      estado: 'activo',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({
      nombre: item.nombre || '',
      hostname: item.hostname || '',
      ip: item.ip || '',
      sistemaOperativo: item.sistemaOperativo || '',
      ubicacion: item.ubicacion || '',
      descripcion: item.descripcion || '',
      estado: item.estado || 'activo',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`¿Desea eliminar el servidor ${item.nombre || item.id}?`)) {
      setLista((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.nombre.trim()) {
      setModalError('El nombre del servidor es obligatorio.');
      return;
    }
    setGuardando(true);
    setModalError('');
    try {
      const payload = {
        nombre: modalForm.nombre.trim(),
        hostname: modalForm.hostname?.trim() || undefined,
        ip: modalForm.ip?.trim() || undefined,
        sistemaOperativo: modalForm.sistemaOperativo?.trim() || undefined,
        ubicacion: modalForm.ubicacion?.trim() || undefined,
        descripcion: modalForm.descripcion?.trim() || undefined,
        estado: modalForm.estado || 'activo',
      };
      if (isEditModal) {
        await actualizarServidor(editingId, payload);
      } else {
        await crearServidor(payload);
      }
      setIsModalOpen(false);
      cargarLista();
    } catch (err) {
      setModalError(err.message || 'Error al guardar el servidor');
    } finally {
      setGuardando(false);
    }
  };

  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.nombre || !String(row.nombre).trim()) continue;
      try {
        await crearServidor({
          nombre: String(row.nombre).trim(),
          hostname: row.hostname ? String(row.hostname).trim() : undefined,
          ip: row.ip ? String(row.ip).trim() : undefined,
          sistemaOperativo: row.sistemaOperativo ? String(row.sistemaOperativo).trim() : undefined,
          ubicacion: row.ubicacion ? String(row.ubicacion).trim() : undefined,
          descripcion: row.descripcion ? String(row.descripcion).trim() : undefined,
          estado: row.estado ? String(row.estado).trim() : 'activo',
        });
      } catch (err) {
        console.error('Error importando servidor:', row, err);
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    cargarLista();
    if (errores > 0) alert(`Importación finalizada con ${errores} errores.`);
  }

  if (cargando && lista.length === 0) return <StudioLoading message="Cargando servidores…" />;
  if (error && lista.length === 0) return <StudioError message={error} />;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. ENCABEZADO ESTÁNDAR ── */}
      <ModuleHeader
        title="Servidores"
        badge={`${lista.length} servidores en total`}
        description="Infraestructura de servidores físicos, virtuales e hipervisores."
        actions={
          <>
            <WriteGate>
              <button
                onClick={() => setModalImportAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar Excel/CSV</span>
              </button>
            </WriteGate>

            <WriteGate>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo servidor</span>
              </button>
            </WriteGate>
          </>
        }
      />

      {/* ── 2. CARD PRINCIPAL CON FILTROS Y GRILLA ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Barra de herramientas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ubicación */}
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">UBICACIÓN: Todas ({lista.length})</option>
              {ubicacionesUnicas.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">ESTADO: Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>

            {/* Orden */}
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

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, hostname, IP..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Seleccionar todo */}
            <button
              type="button"
              onClick={toggleSelectPagina}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              {todosSeleccionados ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Sel. Todo</span>
            </button>

            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Total: <span className="text-slate-900 font-black">{itemsFiltrados.length}</span>
            </span>
          </div>
        </div>

        {/* Grilla de Tarjetas (4 columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itemsPaginados.map((srv) => {
            const isSelected = seleccion.has(srv.id);

            return (
              <div
                key={srv.id}
                onClick={() => navigate(`/servidores/${srv.id}`)}
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
                          toggleSelect(srv.id);
                        }}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className="font-mono text-[11px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase truncate">
                        {srv.hostname || srv.id?.slice(0, 8) || 'HOST'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(srv);
                        }}
                        title="Editar servidor"
                        className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(srv);
                        }}
                        title="Eliminar servidor"
                        className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nombre y detalle */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={srv.nombre}>
                      {srv.nombre || 'Servidor Sin Nombre'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate font-mono">
                      {srv.ip || srv.sistemaOperativo || 'IP no asignada'}
                    </p>
                  </div>

                  {/* Badge Servidor */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Server className="w-3 h-3 text-slate-600" />
                      <span>{srv.sistemaOperativo || 'Servidor Host'}</span>
                    </span>
                  </div>
                </div>

                {/* Footer Tarjeta */}
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="truncate">
                    Ubicación: <strong>{srv.ubicacion || 'Datacenter'}</strong>
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 uppercase">
                    ID: {srv.id?.slice(0, 7)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {itemsPaginados.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No se encontraron servidores con los filtros seleccionados.
          </div>
        )}

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
          <span>
            Mostrando{' '}
            <strong>
              {itemsFiltrados.length > 0 ? (paginaActual - 1) * ITEMS_POR_PAGINA + 1 : 0}
            </strong>{' '}
            a{' '}
            <strong>
              {Math.min(paginaActual * ITEMS_POR_PAGINA, itemsFiltrados.length)}
            </strong>{' '}
            de <strong>{itemsFiltrados.length}</strong> servidores
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

      {/* Modal Alta / Edición Servidor */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-slate-700" />
                  <span className="font-extrabold text-sm text-slate-900 uppercase">
                    {isEditModal ? 'Editar Servidor' : 'Registrar Servidor'}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                    {modalError}
                  </div>
                )}

                <div className="space-y-1">
                  <label>Nombre *</label>
                  <input
                    required
                    type="text"
                    value={modalForm.nombre}
                    onChange={(e) => setModalForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                    placeholder="Ej. Servidor Base de Datos"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Hostname</label>
                    <input
                      type="text"
                      value={modalForm.hostname}
                      onChange={(e) => setModalForm((p) => ({ ...p, hostname: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="srv-db-01"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Dirección IP</label>
                    <input
                      type="text"
                      value={modalForm.ip}
                      onChange={(e) => setModalForm((p) => ({ ...p, ip: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                      placeholder="192.168.1.10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Sistema Operativo / Hipervisor</label>
                    <input
                      type="text"
                      value={modalForm.sistemaOperativo}
                      onChange={(e) => setModalForm((p) => ({ ...p, sistemaOperativo: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                      placeholder="Ubuntu, Windows Server, Proxmox..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Ubicación</label>
                    <input
                      type="text"
                      value={modalForm.ubicacion}
                      onChange={(e) => setModalForm((p) => ({ ...p, ubicacion: e.target.value }))}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                      placeholder="Datacenter Rack 1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Descripción / Servicios</label>
                  <textarea
                    rows={2}
                    value={modalForm.descripcion}
                    onChange={(e) => setModalForm((p) => ({ ...p, descripcion: e.target.value }))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs"
                    placeholder="Postgres, Active Directory, Nginx..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-[#0c66e4] text-white rounded-lg shadow-sm hover:bg-[#0055cc] font-bold disabled:opacity-50"
                  >
                    {guardando ? 'Guardando…' : isEditModal ? 'Guardar Cambios' : 'Registrar Servidor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Importar */}
      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={servidoresSchema}
        entityName="Servidores"
        isImporting={importando}
      />

      <Outlet />
    </div>
  );
}
