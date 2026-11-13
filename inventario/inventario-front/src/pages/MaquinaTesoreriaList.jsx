import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Banknote,
  Coins,
  PackageCheck,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Upload,
  Plus,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { fetchMaquinas, crearMaquina, actualizarMaquina, cambiarEstadoMaquina, eliminarMaquina } from '../api/maquinaTesoreriaApi';
import ImportModal from '../components/ImportModal';
import { maquinasTesoreriaSchema } from '../lib/importSchemas/maquinasTesoreriaSchema';
import { useCatalogo, opcionesEnumCatalogo, labelsEnumCatalogo } from '../hooks/useCatalogo';
import { contarMaquinasPorTipo } from '../utils/reporteInventario';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { ModuleHeader, TabsCard, KpiGrid } from '../components/layout';

const ITEMS_POR_PAGINA = 20;

const emptyForm = {
  tipo: '',
  modelo: '',
  nroSerie: '',
  vida: '',
  estado: 'ASIGNADA',
  motivo: '',
};

export default function MaquinaTesoreriaList() {
  const navigate = useNavigate();
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: tipoItems } = useCatalogo('tipos_maquina');
  const tipoMaqLabels = useMemo(() => labelsEnumCatalogo(tipoItems), [tipoItems]);

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y orden
  const [buscar, setBuscar] = useState('');
  const [subFilter, setSubFilter] = useState('all'); // 'all' o label de tipo
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ordenNombre, setOrdenNombre] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [seleccion, setSeleccion] = useState(() => new Set());

  // Modal Alta / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState(emptyForm);
  const [modalError, setModalError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal Importación
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchMaquinas()
      .then((data) => setLista(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudo cargar el listado de máquinas de tesorería.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  // Conteo por tipo para KPIs y Solapas
  const maquinasPorTipo = useMemo(
    () => contarMaquinasPorTipo(lista, tipoMaqLabels),
    [lista, tipoMaqLabels]
  );

  // Mapeo seguro de tipo a label
  function getTipoLabel(tipoKey) {
    if (!tipoKey) return 'Sin clasificar';
    const norm = String(tipoKey).toLowerCase();
    return tipoMaqLabels[norm] || tipoMaqLabels[tipoKey] || tipoKey;
  }

  // Filtrado y búsqueda
  const itemsFiltrados = useMemo(() => {
    let res = [...lista];

    // Solapa de tipo
    if (subFilter !== 'all') {
      res = res.filter((m) => getTipoLabel(m.tipo) === subFilter);
    }

    // Filtro estado
    if (filtroEstado) {
      res = res.filter((m) => {
        const est = (m.estadoActual || m.estado || '').toUpperCase();
        return est === filtroEstado.toUpperCase();
      });
    }

    // Búsqueda
    if (buscar.trim()) {
      const b = buscar.toLowerCase().trim();
      res = res.filter(
        (m) =>
          (m.nombre || '').toLowerCase().includes(b) ||
          (m.modelo || '').toLowerCase().includes(b) ||
          (m.nroSerie || '').toLowerCase().includes(b) ||
          (m.vida || '').toLowerCase().includes(b) ||
          getTipoLabel(m.tipo).toLowerCase().includes(b)
      );
    }

    // Orden
    if (ordenNombre === 'asc') {
      res.sort((a, b) => (a.modelo || a.nombre || '').localeCompare(b.modelo || b.nombre || '', 'es'));
    } else if (ordenNombre === 'desc') {
      res.sort((a, b) => (b.modelo || b.nombre || '').localeCompare(a.modelo || a.nombre || '', 'es'));
    } else if (ordenNombre === 'serie') {
      res.sort((a, b) => (a.nroSerie || '').localeCompare(b.nroSerie || '', 'es'));
    }

    return res;
  }, [lista, subFilter, filtroEstado, buscar, ordenNombre, tipoMaqLabels]);

  // Paginación
  const totalPaginas = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return itemsFiltrados.slice(start, start + ITEMS_POR_PAGINA);
  }, [itemsFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [subFilter, filtroEstado, buscar, ordenNombre]);

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

  // Modales Alta / Edición
  const handleOpenAddModal = () => {
    setIsEditModal(false);
    setEditingId(null);
    setModalForm({ ...emptyForm });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({
      tipo: item.tipo || '',
      modelo: item.modelo || '',
      nroSerie: item.nroSerie || '',
      vida: item.vida || '',
      estado: item.estadoActual || item.estado || 'ASIGNADA',
      motivo: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`¿Desea dar de baja o quitar la máquina ${item.id}?`)) {
      try {
        await eliminarMaquina(item.id);
        setLista((prev) => prev.filter((i) => i.id !== item.id));
      } catch (err) {
        alert('Error al eliminar máquina: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!modalForm.tipo || !modalForm.modelo.trim() || !modalForm.nroSerie.trim()) {
      setModalError('Tipo, modelo y número de serie son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      if (isEditModal) {
        const payload = {
          tipo: modalForm.tipo,
          modelo: modalForm.modelo.trim(),
          nroSerie: modalForm.nroSerie.trim(),
          vida: modalForm.vida?.trim() || undefined,
        };
        await actualizarMaquina(editingId, payload);

        const originalItem = lista.find((m) => m.id === editingId);
        if (originalItem && modalForm.estado && modalForm.estado !== originalItem.estado) {
          await cambiarEstadoMaquina(editingId, {
            estado: modalForm.estado,
            motivo: modalForm.motivo?.trim() || 'Edición manual desde listado',
          });
        }
      } else {
        const payload = {
          tipo: modalForm.tipo,
          modelo: modalForm.modelo.trim(),
          nroSerie: modalForm.nroSerie.trim(),
          vida: modalForm.vida?.trim() || undefined,
          estado: modalForm.estado || 'ASIGNADA',
          motivo: modalForm.motivo?.trim() || undefined,
        };
        await crearMaquina(payload);
      }
      setIsModalOpen(false);
      cargarLista();
    } catch (err) {
      setModalError(err.message || 'Error al guardar la máquina');
    } finally {
      setGuardando(false);
    }
  };

  // Importación Excel/CSV
  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.tipo || !row.tipo.trim()) continue;

      let tipoRaw = row.tipo
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (tipoRaw.includes('BOLSILLO')) tipoRaw = 'BOLSILLOS';
      else if (tipoRaw.includes('RECONTADORA') || tipoRaw.includes('CONTADORA')) tipoRaw = 'RECONTADORA';
      else if (tipoRaw.includes('VALIDADORA')) tipoRaw = 'VALIDADORA';
      else if (tipoRaw.includes('ENVASADORA')) tipoRaw = 'ENVASADORA';
      else if (tipoRaw.includes('FAJADORA')) tipoRaw = 'FAJADORA';

      try {
        let estadoParseado = row.estado?.trim().toUpperCase() || 'ACTIVA';
        if (estadoParseado === 'SI' || estadoParseado === 'SÍ' || estadoParseado === 'ACTIVA') {
          estadoParseado = 'ACTIVA';
        } else if (estadoParseado === 'NO' || estadoParseado === 'INACTIVA') {
          estadoParseado = 'INACTIVA';
        }

        const payload = {
          tipo: tipoRaw,
          modelo: row.modelo ? String(row.modelo).trim() : 'S/D',
          nroSerie: row.nroSerie ? String(row.nroSerie).trim() : 'S/N',
          vida: row.vida ? String(row.vida).trim() : undefined,
          estado: estadoParseado,
        };
        await crearMaquina(payload);
      } catch (err) {
        console.error('Error importando máquina:', row, err);
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    cargarLista();
    if (errores > 0) alert(`Importación finalizada con ${errores} errores.`);
    else alert('Importación completada con éxito.');
  }

  if (cargando && lista.length === 0) {
    return <StudioLoading message="Cargando máquinas de tesorería…" />;
  }

  if (error && lista.length === 0) {
    return <StudioError message={error} />;
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ── 1. ENCABEZADO ESTÁNDAR ── */}
      <ModuleHeader
        title="Máquinas de tesorería"
        badge={`${lista.length} máquinas en total`}
        description="Equipos de validación, conteo, envasado y procesamiento de efectivo registrados en el inventario."
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
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva máquina</span>
              </button>
            </WriteGate>
          </>
        }
      />

      {/* ── 2. KPIS POR TIPO DE MÁQUINA ── */}
      {Object.keys(maquinasPorTipo).length > 0 && (
        <KpiGrid cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(maquinasPorTipo).map(([tipo, cant]) => {
            const isSelected = subFilter === tipo;
            return (
              <div
                key={tipo}
                onClick={() => setSubFilter(isSelected ? 'all' : tipo)}
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-red-600 ring-2 ring-red-500/20 bg-red-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {tipo}
                  </span>
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
                <div className="my-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {cant}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Unidades
                </span>
              </div>
            );
          })}
        </KpiGrid>
      )}

      {/* ── 3. CARD PRINCIPAL CON SOLAPAS, FILTROS Y GRILLA DE CARDS ── */}
      <TabsCard
        tabs={[
          { key: 'all', label: 'Todas', count: lista.length },
          ...Object.entries(maquinasPorTipo).map(([tipo, cant]) => ({
            key: tipo,
            label: tipo,
            count: cant,
          })),
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
              placeholder="Buscar por modelo, serie, vida..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 !w-[18%] max-w-[20%] min-w-[140px] truncate cursor-pointer"
          >
            <option value="">ESTADO: Todos</option>
            {opcionesEnumCatalogo(estadoItems).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
            <option value="asc">Modelo / Nombre (A → Z)</option>
            <option value="desc">Modelo / Nombre (Z → A)</option>
            <option value="serie">Nº de serie</option>
          </select>

          {/* Seleccionar Todo */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {allVisibleSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Sel. Todo</span>
          </button>

          <span className="text-xs font-bold text-slate-600 whitespace-nowrap shrink-0">
            Total: <span className="text-slate-900 font-black">{itemsFiltrados.length}</span>
          </span>
        </div>

        {/* Grilla de Tarjetas (4 columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {itemsPaginados.map((item) => {
            const isSelected = seleccion.has(item.id);
            const tipoLabel = getTipoLabel(item.tipo);
            const est = (item.estadoActual || item.estado || 'ACTIVA').toUpperCase();
            const badgeCls =
              est === 'ACTIVA' || est === 'ASIGNADA' || est === 'OPERATIVO'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : est === 'INACTIVA' || est === 'BAJA'
                ? 'bg-rose-50 text-rose-700 border-rose-100'
                : 'bg-amber-50 text-amber-700 border-amber-100';

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/maquinas-tesoreria/${encodeURIComponent(item.id)}`)}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top: Checkbox + Tipo + Acciones */}
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
                      <span className="font-mono text-[11px] font-black border px-2 py-0.5 rounded uppercase truncate bg-amber-50 text-amber-800 border-amber-200">
                        {tipoLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <WriteGate>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          title="Editar máquina"
                          className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </WriteGate>
                      <WriteGate>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item);
                          }}
                          title="Eliminar máquina"
                          className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </WriteGate>
                    </div>
                  </div>

                  {/* Nombre / Modelo y Número de Serie */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={item.modelo || item.nombre}>
                      {item.modelo || item.nombre || 'Máquina de Tesorería'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate font-mono">
                      S/N: {item.nroSerie || 'Sin número de serie'}
                    </p>
                  </div>

                  {/* Badge de Categoría con ícono */}
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                      <Banknote className="w-3.5 h-3.5 text-amber-600" />
                      <span>{tipoLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Footer: Vida Útil y Estado */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-slate-400 block truncate">Vida útil / Obs:</span>
                    <span className="font-semibold text-slate-700 truncate block" title={item.vida || '-'}>
                      {item.vida || 'No especificada'}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${badgeCls}`}>
                    ● {est}
                  </span>
                </div>
              </div>
            );
          })}

          {itemsPaginados.length === 0 && (
            <div className="col-span-full bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic">
              No se encontraron máquinas de tesorería con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Página <strong className="text-slate-900">{paginaActual}</strong> de{' '}
              <strong className="text-slate-900">{totalPaginas}</strong> (
              {itemsFiltrados.length} equipos)
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
      </TabsCard>

      {/* ── MODAL ALTA / EDICIÓN (SIN ROJO, FORMATO ORACIÓN) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="font-bold text-sm text-slate-900">
                    {isEditModal ? 'Editar máquina de tesorería' : 'Nueva máquina de tesorería'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs font-semibold">
                    {modalError}
                  </div>
                )}

                <div className="space-y-1">
                  <label>Tipo de máquina *</label>
                  <select
                    required
                    value={modalForm.tipo}
                    onChange={(e) => setModalForm({ ...modalForm, tipo: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Seleccionar tipo…</option>
                    {opcionesEnumCatalogo(tipoItems).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Modelo *</label>
                    <input
                      required
                      type="text"
                      value={modalForm.modelo}
                      onChange={(e) => setModalForm({ ...modalForm, modelo: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                      placeholder="Ej. Kisan Newton"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Nº de Serie *</label>
                    <input
                      required
                      type="text"
                      value={modalForm.nroSerie}
                      onChange={(e) => setModalForm({ ...modalForm, nroSerie: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 font-mono"
                      placeholder="Ej. KSN-4928"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label>Vida útil / Observaciones</label>
                  <input
                    type="text"
                    value={modalForm.vida}
                    onChange={(e) => setModalForm({ ...modalForm, vida: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                    placeholder="Ej. 64662642 o PARA REPUESTO"
                  />
                </div>

                {isEditModal ? (
                  <div className="space-y-1">
                    <label>Estado operativo</label>
                    <select
                      value={modalForm.estado}
                      onChange={(e) => setModalForm({ ...modalForm, estado: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                    >
                      {opcionesEnumCatalogo(estadoItems).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label>Estado inicial</label>
                      <select
                        value={modalForm.estado}
                        onChange={(e) => setModalForm({ ...modalForm, estado: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                      >
                        {opcionesEnumCatalogo(estadoItems).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>Motivo</label>
                      <input
                        type="text"
                        value={modalForm.motivo}
                        onChange={(e) => setModalForm({ ...modalForm, motivo: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    {guardando ? 'Guardando…' : isEditModal ? 'Guardar cambios' : 'Crear máquina'}
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
        schema={maquinasTesoreriaSchema}
        entityName="Máquinas de Tesorería"
        isImporting={importando}
        existingData={lista}
      />

      <Outlet />
    </div>
  );
}
