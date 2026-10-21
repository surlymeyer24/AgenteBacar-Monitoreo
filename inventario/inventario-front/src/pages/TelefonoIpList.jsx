import { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Search,
  Edit2,
  Trash2,
  Upload,
  Plus,
  X,
  ShieldCheck,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImportModal from '../components/ImportModal';
import { internosSchema } from '../lib/importSchemas/internosSchema';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { ModuleHeader } from '../components/layout';
import {
  fetchInternos,
  createInterno,
  updateInterno,
  deleteInterno,
  createBulkInternos,
} from '../api/internoIpApi';

const ITEMS_POR_PAGINA = 20;

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
];

function getAvatarInfo(nombre) {
  if (!nombre) return { initials: 'IP', colorClass: AVATAR_COLORS[0] };
  const clean = nombre.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  let initials = 'IP';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash << 5) - hash + nombre.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return { initials, colorClass: AVATAR_COLORS[colorIndex] };
}

export default function TelefonoIpList() {
  const [internos, setInternos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y orden
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [orden, setOrden] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [copiedIp, setCopiedIp] = useState(null);

  // Modales Alta / Edición
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formNumero, setFormNumero] = useState('');
  const [formAsignado, setFormAsignado] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formEstado, setFormEstado] = useState('ACTIVO');
  const [guardando, setGuardando] = useState(false);

  // Modal Importación
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  // Success Banner
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const loadInternos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await fetchInternos();
      setInternos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el listado de teléfonos IP');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadInternos();
  }, []);

  const showBanner = (msg) => {
    setBannerMessage(msg);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4000);
  };

  const resetForm = () => {
    setFormNumero('');
    setFormAsignado('');
    setFormIp('');
    setFormMac('');
    setFormMarca('');
    setFormEstado('ACTIVO');
    setEditingItem(null);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormNumero(item.numeroInterno || '');
    setFormAsignado(item.asignadoA || '');
    setFormIp(item.direccionIp || '');
    setFormMac(item.macAddress || '');
    setFormMarca(item.marcaModelo || '');
    setFormEstado(item.estadoActual || 'ACTIVO');
    setIsEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const dto = {
      numeroInterno: formNumero.trim(),
      asignadoA: formAsignado.trim(),
      direccionIp: formIp.trim(),
      macAddress: formMac.trim(),
      marcaModelo: formMarca.trim(),
      estadoActual: formEstado,
    };

    try {
      if (editingItem) {
        await updateInterno(editingItem.id, dto);
        showBanner(`Interno ${formNumero} actualizado correctamente.`);
        setIsEditModalOpen(false);
      } else {
        await createInterno(dto);
        showBanner(`Interno ${formNumero} registrado con éxito.`);
        setIsAddModalOpen(false);
      }
      loadInternos();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el interno');
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (id, numero) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el interno ${numero}?`)) {
      try {
        await deleteInterno(id);
        showBanner(`Interno ${numero} eliminado del inventario.`);
        loadInternos();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar el interno');
      }
    }
  };

  const handleCopyIp = (ip, e) => {
    e.stopPropagation();
    if (!ip) return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // --- EXCEL IMPORT LOGIC ---
  const handleImport = async (rows) => {
    setImportando(true);
    try {
      const dataToImport = rows
        .map((r) => ({
          numeroInterno: r.numeroInterno ? String(r.numeroInterno) : '',
          asignadoA: r.asignadoA ? String(r.asignadoA) : '',
          direccionIp: r.direccionIp ? String(r.direccionIp) : '',
          macAddress: r.macAddress ? String(r.macAddress) : '',
          marcaModelo: r.marcaModelo ? String(r.marcaModelo) : '',
          estadoActual: r.estadoActual ? String(r.estadoActual) : 'ACTIVO',
        }))
        .filter((x) => x.numeroInterno || x.asignadoA);

      await createBulkInternos(dataToImport);
      showBanner(`Se importaron ${dataToImport.length} internos correctamente.`);
      loadInternos();
    } catch (err) {
      console.error(err);
      alert('Error al importar el lote.');
    } finally {
      setImportando(false);
      setModalImportAbierto(false);
    }
  };

  // Filtrado y búsqueda
  const itemsFiltrados = useMemo(() => {
    let res = [...internos];

    if (filtroEstado) {
      res = res.filter((item) => (item.estadoActual || 'ACTIVO').toUpperCase() === filtroEstado.toUpperCase());
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      res = res.filter(
        (item) =>
          (item.numeroInterno || '').toLowerCase().includes(term) ||
          (item.asignadoA || '').toLowerCase().includes(term) ||
          (item.direccionIp || '').toLowerCase().includes(term) ||
          (item.marcaModelo || '').toLowerCase().includes(term) ||
          (item.macAddress || '').toLowerCase().includes(term)
      );
    }

    if (orden === 'num_asc') {
      res.sort((a, b) => (a.numeroInterno || '').localeCompare(b.numeroInterno || '', undefined, { numeric: true }));
    } else if (orden === 'num_desc') {
      res.sort((a, b) => (b.numeroInterno || '').localeCompare(a.numeroInterno || '', undefined, { numeric: true }));
    } else if (orden === 'nombre_asc') {
      res.sort((a, b) => (a.asignadoA || '').localeCompare(b.asignadoA || '', 'es'));
    }

    return res;
  }, [internos, filtroEstado, searchTerm, orden]);

  // Paginación
  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return itemsFiltrados.slice(start, start + ITEMS_POR_PAGINA);
  }, [itemsFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, searchTerm, orden]);

  // Selección múltiple
  const toggleSelect = (id) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    itemsPaginados.length > 0 && itemsPaginados.every((i) => seleccion.has(i.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSeleccion((prev) => {
        const next = new Set(prev);
        itemsPaginados.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSeleccion((prev) => {
        const next = new Set(prev);
        itemsPaginados.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  if (cargando && internos.length === 0) {
    return <StudioLoading message="Cargando teléfonos IP…" />;
  }

  if (error && internos.length === 0) {
    return <StudioError message={error} />;
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. ENCABEZADO ESTÁNDAR ── */}
      <ModuleHeader
        title="Teléfonos IP"
        badge={`${internos.length} internos en total`}
        description="Registro de internos, estado de comunicación y asignaciones activas."
        actions={
          <>
            <WriteGate>
              <button
                type="button"
                onClick={() => setModalImportAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar Excel/CSV</span>
              </button>
            </WriteGate>

            <WriteGate>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar interno</span>
              </button>
            </WriteGate>
          </>
        }
      />

      {/* Dynamic Success notifications */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -15 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -15 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 shadow-sm mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">Operación completada</h4>
                  <p className="text-[11px] font-medium mt-0.5">{bannerMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="p-1 px-2 hover:bg-emerald-100 rounded text-emerald-700 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. CARD PRINCIPAL CON FILTROS Y GRILLA DE CARDS (IGUAL A SERVIDORES) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Barra de herramientas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">ESTADO: Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="EN_MANTENIMIENTO">En mantenimiento</option>
            </select>

            {/* Orden */}
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">ORDEN: Sin ordenar</option>
              <option value="num_asc">Interno (menor a mayor)</option>
              <option value="num_desc">Interno (mayor a menor)</option>
              <option value="nombre_asc">Asignado a (A → Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por asignación, IP o interno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Seleccionar Todo */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              {allVisibleSelected ? (
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
          {itemsPaginados.map((item) => {
            const isSelected = seleccion.has(item.id);
            const est = (item.estadoActual || 'ACTIVO').toUpperCase();
            const badgeCls =
              est === 'ACTIVO'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : est === 'INACTIVO'
                ? 'bg-rose-50 text-rose-700 border-rose-100'
                : 'bg-amber-50 text-amber-700 border-amber-100';

            const { initials, colorClass } = getAvatarInfo(item.asignadoA);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top: Checkbox + Número de Interno + Acciones */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className="font-mono text-xs font-black border px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border-indigo-100">
                        Int: {item.numeroInterno || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <WriteGate>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          title="Editar interno"
                          className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </WriteGate>
                      <WriteGate>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.numeroInterno)}
                          title="Eliminar interno"
                          className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </WriteGate>
                    </div>
                  </div>

                  {/* Asignado A con Avatar */}
                  <div className="mt-3 flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${colorClass}`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-bold text-slate-900 text-sm truncate"
                        title={item.asignadoA || 'Sin asignar'}
                      >
                        {item.asignadoA || 'Sin asignar'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] font-bold text-blue-700 truncate">
                          {item.direccionIp || 'IP no registrada'}
                        </span>
                        {item.direccionIp && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyIp(item.direccionIp, e)}
                            title="Copiar IP"
                            className="p-0.5 hover:text-blue-800 text-slate-400"
                          >
                            {copiedIp === item.direccionIp ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Marca y MAC */}
                  <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                    <p className="truncate">
                      <strong className="text-slate-500">Modelo:</strong> {item.marcaModelo || '—'}
                    </p>
                    <p className="truncate font-mono">
                      <strong className="text-slate-500">MAC:</strong> {item.macAddress || '—'}
                    </p>
                  </div>
                </div>

                {/* Footer: Estado y Tipo */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${badgeCls}`}>
                    ● {est}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>SIP</span>
                  </div>
                </div>
              </div>
            );
          })}

          {itemsPaginados.length === 0 && (
            <div className="col-span-full bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic">
              No se encontraron teléfonos IP con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Página <strong className="text-slate-900">{paginaActual}</strong> de{' '}
              <strong className="text-slate-900">{totalPaginas}</strong> (
              {itemsFiltrados.length} internos)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && p - arr[idx - 1] > 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaginaActual(p)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs ${
                        p === paginaActual
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ALTA / EDICIÓN (SIN ROJO, FORMATO ORACIÓN) ── */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-bold text-sm text-slate-900">
                    {isEditModalOpen ? 'Editar teléfono IP' : 'Registrar nuevo interno'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Número de interno *</label>
                    <input
                      required
                      type="text"
                      value={formNumero}
                      onChange={(e) => setFormNumero(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                      placeholder="Ej. 2100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Asignado a *</label>
                    <input
                      required
                      type="text"
                      value={formAsignado}
                      onChange={(e) => setFormAsignado(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                      placeholder="Ej. Guardia Principal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Dirección IP</label>
                    <input
                      type="text"
                      value={formIp}
                      onChange={(e) => setFormIp(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                      placeholder="Ej. 192.168.1.150"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Dirección MAC</label>
                    <input
                      type="text"
                      value={formMac}
                      onChange={(e) => setFormMac(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                      placeholder="Ej. 00:15:65:..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Marca / Modelo</label>
                  <input
                    type="text"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                    placeholder="Ej. Grandstream GXP1625"
                  />
                </div>

                <div className="space-y-1">
                  <label>Estado</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="EN_MANTENIMIENTO">En mantenimiento</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    disabled={guardando}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-[#0c66e4] text-white rounded-lg hover:bg-[#0055cc] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {guardando ? 'Guardando…' : isEditModalOpen ? 'Guardar cambios' : 'Registrar interno'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL IMPORTACIÓN ── */}
      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={internosSchema}
        entityName="Internos"
        isImporting={importando}
        existingData={internos}
      />
    </div>
  );
}
