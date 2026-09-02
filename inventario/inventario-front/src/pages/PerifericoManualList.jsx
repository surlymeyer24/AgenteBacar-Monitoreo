import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { Package, CheckCircle, Monitor, Search, Filter, Plus, MapPin, X, Check, Edit2, Trash2, Laptop, UserCheck, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPerifericosM, actualizarPerifericoM, createPerifericoM, createComboPerifericoM, deletePerifericoM, asignarPerifericoM } from '../api/perifericoManualApi';
import { fetchComputadoras, updateEstado, createComputadora } from '../api/computadoraApi';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { labelTipoStock, normalizarTipoStock, opcionesTipoStock } from '../constants/tiposStock';
import { StudioLoading, StudioError, StudioFilterBar } from '../components/studio/StudioUi';
import TableFilters from '../components/TableFilters';

export default function PerifericoManualList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perifericos');

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [pcsStock, setPcsStock] = useState([]);
  const [cargandoPcs, setCargandoPcs] = useState(true);
  const [errorPcs, setErrorPcs] = useState(null);

  const [buscar, setBuscar] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('teclado');
  const [formFabricante, setFormFabricante] = useState('');
  const [formConexion, setFormConexion] = useState('');
  const [formUbicacion, setFormUbicacion] = useState('');
  const [formCantidad, setFormCantidad] = useState('1');

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    fetchPerifericosM()
      .then(data => { if (!cancel) setLista(data ?? []); })
      .catch(() => { if (!cancel) setError('No se pudo cargar el inventario de periféricos.'); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    let cancel = false;
    setCargandoPcs(true);
    fetchComputadoras()
      .then(data => {
        if (!cancel) {
          const sinAsignar = (data ?? []).filter(pc => pc.estadoActual === 'Sin Asignar');
          setPcsStock(sinAsignar);
        }
      })
      .catch(() => { if (!cancel) setErrorPcs('No se pudo cargar las computadoras en stock.'); })
      .finally(() => { if (!cancel) setCargandoPcs(false); });
    return () => { cancel = true; };
  }, []);

  const pcsNuevasStock = useMemo(() => {
    return lista.filter(c => normalizarTipoStock(c.tipo) === 'computadora');
  }, [lista]);

  const itemsFiltrados = useMemo(() => {
    return lista.filter(c => {
      if (normalizarTipoStock(c.tipo) === 'computadora') return false;
      const text = `${c.nombre || ''} ${c.fabricante || ''} ${c.id || ''} ${c.computadoraHostname || ''}`.toLowerCase();
      const matchesSearch = text.includes(buscar.toLowerCase());
      const matchesCategory = selectedCategory === 'All'
        || normalizarTipoStock(c.tipo) === normalizarTipoStock(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [lista, buscar, selectedCategory]);

  const handleUpdateStock = async (p, amount) => {
    const currentStock = p.cantidad ?? 1;
    const newStock = Math.max(0, currentStock + amount);
    if (newStock === currentStock) return;

    setLista(prev => prev.map(item => item.id === p.id ? { ...item, cantidad: newStock } : item));

    try {
      await actualizarPerifericoM(p.id, {
        tipo: p.tipo,
        cantidad: newStock,
        nombre: p.nombre,
        fabricante: p.fabricante,
        conexion: p.conexion,
        computadoraHostname: p.computadoraHostname,
        ubicacion: p.ubicacion,
        notas: p.notas
      });
    } catch (err) {
      console.error("Error actualizando stock:", err);
      setLista(prev => prev.map(item => item.id === p.id ? { ...item, cantidad: currentStock } : item));
      alert("Hubo un error al actualizar el stock de " + (p.nombre || p.id));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNombre('');
    setFormTipo('teclado');
    setFormFabricante('');
    setFormConexion('');
    setFormUbicacion('');
    setFormCantidad('1');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingItem(p);
    setFormNombre(p.nombre || '');
    setFormTipo(normalizarTipoStock(p.tipo) || 'teclado');
    setFormFabricante(p.fabricante || '');
    setFormConexion(p.conexion || '');
    setFormUbicacion(p.ubicacion || '');
    setFormCantidad((p.cantidad ?? 1).toString());
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setFormError('Por favor redacta el nombre del componente.');
      return;
    }

    const qty = parseInt(formCantidad, 10);
    if (isNaN(qty) || qty < 0) {
      setFormError('La cantidad debe ser un número válido.');
      return;
    }

    try {
      if (editingItem) {
        // Update
        const payload = {
          nombre: formNombre,
          tipo: normalizarTipoStock(formTipo),
          fabricante: formFabricante,
          conexion: formConexion,
          cantidad: qty,
          computadoraHostname: editingItem.computadoraHostname,
          ubicacion: formUbicacion,
          notas: editingItem.notas
        };
        await actualizarPerifericoM(editingItem.id, payload);
        
        // Optimistic UI update
        setLista(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...payload } : item));
      } else {
        // Create
        const payload = {
          nombre: formNombre,
          tipo: normalizarTipoStock(formTipo),
          fabricante: formFabricante,
          conexion: formConexion,
          ubicacion: formUbicacion,
          cantidad: qty
        };
        const created = await createPerifericoM(payload);
        setLista(prev => [...prev, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error guardando periférico:", err);
      setFormError(err.message || 'Error al guardar el componente.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este periférico? Esta acción no se puede deshacer.')) return;
    try {
      await deletePerifericoM(id);
      setLista(prev => prev.filter(item => item.id !== id));
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error eliminando periférico:", err);
      alert('Error al eliminar el periférico.');
    }
  };

  // --- Combo creation state ---
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [comboNombre, setComboNombre] = useState('');
  const [comboItems, setComboItems] = useState([
    { tipo: 'teclado', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
    { tipo: 'mouse', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
  ]);
  const [comboUbicacion, setComboUbicacion] = useState('');
  const [comboError, setComboError] = useState('');
  const [creandoCombo, setCreandoCombo] = useState(false);

  const handleOpenCombo = () => {
    setComboNombre('');
    setComboItems([
      { tipo: 'teclado', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
      { tipo: 'mouse', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
    ]);
    setComboUbicacion('');
    setComboError('');
    setIsComboOpen(true);
  };

  const handleComboItemChange = (idx, field, value) => {
    setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddComboItem = () => {
    setComboItems(prev => [...prev, { tipo: 'otro', nombre: '', fabricante: '', conexion: '', cantidad: '1' }]);
  };

  const handleRemoveComboItem = (idx) => {
    if (comboItems.length <= 2) return;
    setComboItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    if (!comboNombre.trim()) { setComboError('El nombre del combo es obligatorio.'); return; }
    const items = comboItems.map(it => ({
      tipo: normalizarTipoStock(it.tipo),
      nombre: it.nombre.trim() || undefined,
      fabricante: it.fabricante.trim() || undefined,
      conexion: it.conexion.trim() || undefined,
      cantidad: parseInt(it.cantidad, 10) || 1,
      ubicacion: comboUbicacion.trim() || undefined,
    }));
    if (items.some(it => !it.tipo)) { setComboError('Todos los items deben tener un tipo.'); return; }
    setCreandoCombo(true);
    setComboError('');
    try {
      const creados = await createComboPerifericoM({ comboNombre: comboNombre.trim(), items });
      setLista(prev => [...prev, ...creados]);
      setIsComboOpen(false);
    } catch (err) {
      setComboError(err.message || 'Error al crear el combo.');
    } finally {
      setCreandoCombo(false);
    }
  };

  // --- PC Stock: search, assign modal state ---
  const [buscarPc, setBuscarPc] = useState('');
  const [asignarPc, setAsignarPc] = useState(null);
  const [asignarA, setAsignarA] = useState('');
  const [asignarMotivo, setAsignarMotivo] = useState('');
  const [asignando, setAsignando] = useState(false);

  const [pcMenuOpen, setPcMenuOpen] = useState(false);
  const [nuevaPcOpen, setNuevaPcOpen] = useState(false);
  const [nuevaPcHostname, setNuevaPcHostname] = useState('');
  const [nuevaPcSo, setNuevaPcSo] = useState('');
  const [nuevaPcUbicacion, setNuevaPcUbicacion] = useState('');
  const [nuevaPcUbicacionStock, setNuevaPcUbicacionStock] = useState('');
  const [nuevaPcMotivo, setNuevaPcMotivo] = useState('');
  const [creandoPc, setCreandoPc] = useState(false);

  const [asignarDesdeListaOpen, setAsignarDesdeListaOpen] = useState(false);

  // --- Periférico: assign modal state ---
  const [asignarPeriferico, setAsignarPeriferico] = useState(null);
  const [hostnameAsignar, setHostnameAsignar] = useState('');
  const [motivoAsignarPerif, setMotivoAsignarPerif] = useState('');
  const [asignandoPerif, setAsignandoPerif] = useState(false);

  const todasPcsStock = useMemo(() => {
    const liberadas = pcsStock.map(pc => ({ ...pc, _origen: 'liberada' }));
    const nuevas = pcsNuevasStock.map(p => ({
      _origen: 'nueva',
      _perifericoId: p.id,
      hostname: p.nombre || '—',
      uuid: p.id,
      tipoEquipo: 'PC',
      sistemaOperativo: null,
      ubicacion: null,
      cantidad: p.cantidad ?? 1,
      fabricante: p.fabricante || null,
      estadoActual: p.estado || 'Sin Asignar',
      _ubicacionStock: p.ubicacion || null,
    }));
    return [...liberadas, ...nuevas];
  }, [pcsStock, pcsNuevasStock]);

  const pcsFiltradas = useMemo(() => {
    if (!buscarPc) return todasPcsStock;
    const q = buscarPc.toLowerCase();
    return todasPcsStock.filter(pc => {
      const text = `${pc.hostname || ''} ${pc.uuid || ''} ${pc.sistemaOperativo || ''} ${pc.tipoEquipo || ''} ${pc.ubicacion || ''} ${pc.fabricante || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [todasPcsStock, buscarPc]);

  const handleAsignar = async () => {
    if (!asignarA.trim()) return;
    setAsignando(true);
    try {
      await updateEstado(asignarPc.uuid, 'ASIGNADA', asignarMotivo.trim() || 'Asignación desde stock', { responsableInventario: asignarA.trim() });
      setPcsStock(prev => prev.filter(pc => pc.uuid !== asignarPc.uuid));
      setAsignarPc(null);
      setAsignarA('');
      setAsignarMotivo('');
    } catch (err) {
      console.error('Error asignando PC:', err);
      alert('Error al asignar la computadora.');
    } finally {
      setAsignando(false);
    }
  };

  const handleAsignarPeriferico = async () => {
    if (!hostnameAsignar.trim() || !asignarPeriferico) return;
    setAsignandoPerif(true);
    try {
      const result = await asignarPerifericoM(
        asignarPeriferico.id,
        hostnameAsignar.trim(),
        motivoAsignarPerif.trim() || 'Asignación desde stock'
      );
      if (!result) {
        alert('No se encontró el periférico.');
        return;
      }
      // Recargar lista: si cantidad > 1 el backend decrementa el lote y crea un registro nuevo
      const data = await fetchPerifericosM();
      setLista(data ?? []);
      setAsignarPeriferico(null);
      setHostnameAsignar('');
      setMotivoAsignarPerif('');
    } catch (err) {
      console.error('Error asignando periférico:', err);
      alert('Error al asignar el periférico.');
    } finally {
      setAsignandoPerif(false);
    }
  };

  const handleCrearPcStock = async () => {
    if (!nuevaPcHostname.trim()) return;
    setCreandoPc(true);
    try {
      const created = await createComputadora({
        hostname: nuevaPcHostname.trim(),
        sistemaOperativo: nuevaPcSo.trim() || undefined,
        ubicacion: nuevaPcUbicacion || undefined,
        motivo: nuevaPcMotivo.trim() || 'Alta de equipo al stock',
      });
      if (created && nuevaPcUbicacionStock.trim()) {
        await updateEstado(created.uuid, 'SIN_ASIGNAR', 'Ingreso a stock', { ubicacionStock: nuevaPcUbicacionStock.trim() });
        created.estadoActual = 'Sin Asignar';
        created.ubicacionStock = nuevaPcUbicacionStock.trim();
      }
      if (created && created.estadoActual === 'Sin Asignar') {
        setPcsStock(prev => [...prev, created]);
      }
      setNuevaPcOpen(false);
      setNuevaPcHostname('');
      setNuevaPcSo('');
      setNuevaPcUbicacion('');
      setNuevaPcUbicacionStock('');
      setNuevaPcMotivo('');
    } catch (err) {
      console.error('Error creando PC:', err);
      alert('Error al crear la computadora: ' + (err.message || ''));
    } finally {
      setCreandoPc(false);
    }
  };

  const getUbicacionStock = (pc) => pc.ubicacionStock?.trim() || null;

  if (activeTab === 'perifericos' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'perifericos' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'computadoras' && cargandoPcs) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'computadoras' && errorPcs) {
    return (
      <>
        <StudioError message={errorPcs} />
        <Outlet />
      </>
    );
  }

  // KPIs (excluye tipo "computadora" — esas van en la pestaña Computadoras)
  const listaPerif = lista.filter(p => normalizarTipoStock(p.tipo) !== 'computadora');
  const totalItemsCount = listaPerif.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAvailableCount = listaPerif.filter(p => p.estado === ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAssignedCount = listaPerif.filter(p => p.estado === ESTADO_OPERATIVO_LABELS.ASIGNADA).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'computadora': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'camara_ip': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'teclado': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'mouse': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'monitor': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'impresora': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getEstadoColor = (estado) => {
    if (estado === ESTADO_OPERATIVO_LABELS.ASIGNADA) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (estado === ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (estado === ESTADO_OPERATIVO_LABELS.EN_MANTENIMIENTO) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (estado === ESTADO_OPERATIVO_LABELS.BAJA) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  }

  const uniqueCategories = [...new Set(lista.map(p => normalizarTipoStock(p.tipo)).filter(t => t && t !== 'computadora'))];

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Inventario IT y Control de Suministros</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Registra los componentes de hardware adquiridos y gestiona de manera rápida cuántos están disponibles o ya asignados en resguardo.
          </p>
        </div>

        {activeTab === 'perifericos' && (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              onClick={handleOpenCombo}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              Combo
            </button>
          </div>
        )}

        {activeTab === 'computadoras' && (
          <div className="relative ml-auto sm:ml-0">
            <button
              onClick={() => setPcMenuOpen(prev => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Asignación
              <ChevronDown className={`w-4 h-4 transition-transform ${pcMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {pcMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPcMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <button
                    onClick={() => { setPcMenuOpen(false); setNuevaPcOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Laptop className="w-4 h-4 text-emerald-600" />
                    Agregar PC al stock
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => { setPcMenuOpen(false); setAsignarDesdeListaOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Asignar PC existente
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('perifericos')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'perifericos'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Periféricos
        </button>
        <button
          onClick={() => setActiveTab('computadoras')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'computadoras'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Computadoras
          {todasPcsStock.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">{todasPcsStock.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'perifericos' && (<>
      {/* Metrics Row (Simple, focuses only on count indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Total Adquirido</span>
            <span className="text-3xl font-black font-mono text-slate-900">{totalItemsCount} <span className="text-base font-normal text-slate-400">unidades</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Disponible (En Bodega)</span>
            <span className="text-3xl font-black font-mono text-emerald-600">
              {totalAvailableCount} <span className="text-base font-medium text-slate-400">({totalItemsCount ? Math.round((totalAvailableCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Asignado (En Uso)</span>
            <span className="text-3xl font-black font-mono text-indigo-600">
              {totalAssignedCount} <span className="text-base font-medium text-slate-400">({totalItemsCount ? Math.round((totalAssignedCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search 
            value={buscar} 
            onChange={setBuscar} 
            placeholder="Buscar por componente, ID o ubicación..." 
          />
          <TableFilters.Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            label="Filtro"
          >
            <option value="All">Todas las categorías</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{labelTipoStock(cat)}</option>
            ))}
          </TableFilters.Select>
        </TableFilters>
      </StudioFilterBar>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">COD / ID</th>
                <th className="py-4 px-5">Componente IT / Fabricante</th>
                <th className="py-4 px-5">Categoría</th>
                <th className="py-4 px-5">Ubicación / Estado</th>
                <th className="py-4 px-5 text-center">Nivel de Stock</th>
                <th className="py-4 px-5 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No se encontraron componentes en el inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/perifericos/stock/${encodeURIComponent(c.id)}`)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-blue-600 text-xs">
                        {c.id}
                      </span>
                    </td>
                    
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="space-y-1">
                        <p className="capitalize">{c.nombre ?? c.fabricante ?? '—'}</p>
                        {c.conexion && (
                          <p className="text-[11px] text-slate-400 font-normal">
                            Conexión: {c.conexion}
                          </p>
                        )}
                        {c.comboNombre && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            <Layers className="w-3 h-3" />
                            {c.comboNombre}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(c.tipo)}`}>
                        {labelTipoStock(c.tipo) || 'Sin tipo'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getEstadoColor(c.estado)}`}>
                          {c.estado || 'SIN ESTADO'}
                        </span>
                        {(c.computadoraHostname || c.ubicacion) && (
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={c.computadoraHostname || c.ubicacion}>
                              {c.computadoraHostname || c.ubicacion}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="font-bold font-mono text-slate-900 text-base">
                        {c.cantidad ?? 1}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm mr-2">
                          <button 
                            onClick={() => handleUpdateStock(c, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Restar 1 unidad"
                          >-</button>
                          <span className="text-slate-300 mx-0.5 text-xs">|</span>
                          <button 
                            onClick={() => handleUpdateStock(c, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Sumar 1 unidad"
                          >+</button>
                        </div>
                        <button
                          onClick={() => {
                            setAsignarPeriferico(c);
                            setHostnameAsignar('');
                            setMotivoAsignarPerif('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Asignar
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Editar suministro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>)}

      {activeTab === 'computadoras' && (
        <>
          {/* PC Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">PCs Disponibles</span>
                <span className="text-3xl font-black font-mono text-emerald-600">
                  {pcsStock.length + pcsNuevasStock.reduce((sum, p) => sum + (p.cantidad ?? 1), 0)}
                </span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Ubicaciones</span>
                <span className="text-3xl font-black font-mono text-slate-900">
                  {new Set([
                    ...pcsStock.map(pc => getUbicacionStock(pc)),
                    ...pcsNuevasStock.map(p => p.ubicacion),
                  ].filter(Boolean)).size}
                </span>
              </div>
            </div>
          </div>

          {/* PC Search */}
          <StudioFilterBar>
            <TableFilters>
              <TableFilters.Search
                value={buscarPc}
                onChange={setBuscarPc}
                placeholder="Buscar por hostname, UUID, SO..."
              />
            </TableFilters>
          </StudioFilterBar>

          {/* PC Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5">Equipo</th>
                    <th className="py-4 px-5">Origen</th>
                    <th className="py-4 px-5">Tipo / SO</th>
                    <th className="py-4 px-5">Ubicación de Stock</th>
                    <th className="py-4 px-5 text-center">Cant.</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {pcsFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                        No hay computadoras disponibles en stock.
                      </td>
                    </tr>
                  ) : (
                    pcsFiltradas.map(pc => (
                      <tr key={pc._origen === 'nueva' ? `pm-${pc._perifericoId}` : pc.uuid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          {pc._origen === 'liberada' ? (
                            <Link to={`/computadoras/${pc.uuid}`} className="font-mono font-bold text-blue-600 text-xs hover:underline hover:text-blue-800">
                              {pc.hostname || pc.uuid?.slice(0, 8)}
                            </Link>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900 text-xs">{pc.hostname}</span>
                              {pc.fabricante && <span className="text-[11px] text-slate-400 ml-1.5">{pc.fabricante}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {pc._origen === 'nueva' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              Nueva
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                              Liberada
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize bg-slate-50 text-slate-700 border-slate-100">
                            {pc._origen === 'liberada' ? (pc.tipoEquipo || 'PC') : 'PC'}
                          </span>
                          {pc._origen === 'liberada' && pc.sistemaOperativo && (
                            <span className="text-[11px] text-slate-400 ml-1.5">{pc.sistemaOperativo}</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {(() => {
                            const ubStock = pc._origen === 'nueva' ? pc._ubicacionStock : getUbicacionStock(pc);
                            return ubStock ? (
                              <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{ubStock}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-5 text-center">
                          {pc._origen === 'nueva' ? (
                            <span className="font-bold font-mono text-slate-900 text-base">{pc.cantidad ?? 1}</span>
                          ) : (
                            <span className="font-mono text-slate-400 text-sm">1</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {pc._origen === 'liberada' ? (
                            <button
                              onClick={() => { setAsignarPc(pc); setAsignarA(''); setAsignarMotivo(''); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Asignar
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm">
                              <button
                                onClick={() => handleUpdateStock(lista.find(p => p.id === pc._perifericoId), -1)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                                title="Restar 1 unidad"
                              >-</button>
                              <span className="text-slate-300 mx-0.5 text-xs">|</span>
                              <button
                                onClick={() => handleUpdateStock(lista.find(p => p.id === pc._perifericoId), 1)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                                title="Sumar 1 unidad"
                              >+</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* POPUP MODAL: Assign PC */}
      <AnimatePresence>
        {asignarPc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Asignar {asignarPc.hostname || asignarPc.uuid?.slice(0, 8)}
                </span>
                <button onClick={() => setAsignarPc(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-slate-700 block mb-1">Asignar a (responsable) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del responsable"
                    value={asignarA}
                    onChange={(e) => setAsignarA(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Nuevo ingreso, reemplazo..."
                    value={asignarMotivo}
                    onChange={(e) => setAsignarMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignarPc(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignar}
                    disabled={!asignarA.trim() || asignando}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {asignando ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Assign Periférico */}
      <AnimatePresence>
        {asignarPeriferico && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Asignar {asignarPeriferico.nombre || 'periférico'}
                </span>
                <button
                  onClick={() => setAsignarPeriferico(null)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-medium">
                  Asigna 1 unidad del stock a una persona. Si hay más de 1 en stock, se descuenta del lote automáticamente.
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">Persona *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={hostnameAsignar}
                    onChange={(e) => setHostnameAsignar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Reemplazo, alta de puesto..."
                    value={motivoAsignarPerif}
                    onChange={(e) => setMotivoAsignarPerif(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignarPeriferico(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignarPeriferico}
                    disabled={!hostnameAsignar.trim() || asignandoPerif}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {asignandoPerif ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Add new PC to stock */}
      <AnimatePresence>
        {nuevaPcOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                  Agregar Computadora al Stock
                </span>
                <button onClick={() => setNuevaPcOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-slate-700 block mb-1">Hostname *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PC-ADMIN-01"
                    value={nuevaPcHostname}
                    onChange={(e) => setNuevaPcHostname(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Sistema Operativo</label>
                    <input
                      type="text"
                      placeholder="Ej: Windows 11 Pro"
                      value={nuevaPcSo}
                      onChange={(e) => setNuevaPcSo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1">Ubicación (sede)</label>
                    <select
                      value={nuevaPcUbicacion}
                      onChange={(e) => setNuevaPcUbicacion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    >
                      <option value="">Sin definir</option>
                      <option value="ADMINISTRACION">Administración</option>
                      <option value="MONITOREO">Monitoreo</option>
                      <option value="TESORERIA">Tesorería</option>
                      <option value="CAPITAL_HUMANO">Capital Humano</option>
                      <option value="SISTEMAS">Sistemas</option>
                      <option value="SEGURIDAD_PRIVADA">Seguridad Privada</option>
                      <option value="OPERACIONES">Operaciones</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Ubicación de Stock</label>
                  <input
                    type="text"
                    placeholder="Ej: Depósito IT, Rack 3"
                    value={nuevaPcUbicacionStock}
                    onChange={(e) => setNuevaPcUbicacionStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Compra nueva, donación..."
                    value={nuevaPcMotivo}
                    onChange={(e) => setNuevaPcMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevaPcOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearPcStock}
                    disabled={!nuevaPcHostname.trim() || creandoPc}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {creandoPc ? 'Creando...' : 'Agregar al Stock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Assign from list */}
      <AnimatePresence>
        {asignarDesdeListaOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl max-h-[80vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Seleccionar PC para asignar
                </span>
                <button onClick={() => setAsignarDesdeListaOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Buscar por hostname..."
                  value={buscarPc}
                  onChange={(e) => setBuscarPc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {pcsFiltradas.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">No hay PCs disponibles.</div>
                ) : (
                  pcsFiltradas.map(pc => (
                    <button
                      key={pc.uuid}
                      onClick={() => {
                        setAsignarDesdeListaOpen(false);
                        setAsignarPc(pc);
                        setAsignarA('');
                        setAsignarMotivo('');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900">{pc.hostname || pc.uuid?.slice(0, 8)}</span>
                        <span className="text-xs text-slate-400 ml-2">{pc.sistemaOperativo || ''}</span>
                        {getUbicacionStock(pc) && (
                          <span className="text-xs text-slate-500 ml-2 flex items-center gap-1 inline-flex">
                            <MapPin className="w-3 h-3" />{getUbicacionStock(pc)}
                          </span>
                        )}
                      </div>
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Create Combo */}
      <AnimatePresence>
        {isComboOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-600" />
                  Registrar Combo / Set
                </span>
                <button onClick={() => setIsComboOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCombo} className="p-5 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
                {comboError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {comboError}
                  </div>
                )}

                <div>
                  <label className="text-slate-700 block mb-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Combo Logitech MK270"
                    value={comboNombre}
                    onChange={(e) => setComboNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Ubicación (compartida)</label>
                  <input
                    type="text"
                    placeholder="Ej. Depósito 1"
                    value={comboUbicacion}
                    onChange={(e) => setComboUbicacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700">Items del combo ({comboItems.length})</label>
                    <button
                      type="button"
                      onClick={handleAddComboItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Agregar item
                    </button>
                  </div>

                  {comboItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Item {idx + 1}</span>
                        {comboItems.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveComboItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Tipo *</label>
                          <select
                            required
                            value={item.tipo}
                            onChange={(e) => handleComboItemChange(idx, 'tipo', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          >
                            {opcionesTipoStock(item.tipo).map(t => (
                              <option key={t} value={t}>{labelTipoStock(t)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Nombre</label>
                          <input
                            type="text"
                            placeholder="Ej. K120"
                            value={item.nombre}
                            onChange={(e) => handleComboItemChange(idx, 'nombre', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Fabricante</label>
                          <input
                            type="text"
                            placeholder="Ej. Logitech"
                            value={item.fabricante}
                            onChange={(e) => handleComboItemChange(idx, 'fabricante', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => handleComboItemChange(idx, 'cantidad', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComboOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creandoCombo}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {creandoCombo ? 'Creando...' : 'Crear Combo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Register New Component or Edit Existing */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  {editingItem ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                  <span>{editingItem ? `Modificar Suministro [${editingItem.id}]` : 'Registrar Nueva Adquisición IT'}</span>
                </span>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="text-slate-700 block mb-1">Nombre Comercial de Hardware / Software *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Memoria RAM DDR5 32GB 4800MHz"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Categoría (Tipo)</label>
                    <select
                      required
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      {opcionesTipoStock(formTipo).map(t => (
                        <option key={t} value={t}>{labelTipoStock(t)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Fabricante (Marca)</label>
                    <input 
                      type="text"
                      placeholder="Ej. Logitech, Dell"
                      value={formFabricante}
                      onChange={(e) => setFormFabricante(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Conexión</label>
                    <input 
                      type="text"
                      placeholder="Ej. USB, Bluetooth"
                      value={formConexion}
                      onChange={(e) => setFormConexion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Ubicación</label>
                    <input 
                      type="text"
                      placeholder="Ej. Depósito 1"
                      value={formUbicacion}
                      onChange={(e) => setFormUbicacion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Cantidad Total Adquirida *</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={formCantidad}
                      onChange={(e) => setFormCantidad(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {editingItem && (
                      <button 
                        type="button"
                        onClick={() => handleDelete(editingItem.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Registro</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Outlet />
    </div>
  );
}
