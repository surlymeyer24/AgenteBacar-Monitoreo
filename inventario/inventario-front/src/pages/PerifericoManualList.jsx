import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, Monitor, Search, Filter, Plus, MapPin, X, Check, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPerifericosM, actualizarPerifericoM, createPerifericoM, deletePerifericoM } from '../api/perifericoManualApi';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';

export default function PerifericoManualList() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('TECLADO');
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
    setFormTipo('TECLADO');
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
    setFormTipo(p.tipo || 'TECLADO');
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
          tipo: formTipo,
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
          tipo: formTipo,
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

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  // KPIs
  const totalItemsCount = lista.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAvailableCount = lista.filter(p => p.estado === ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAssignedCount = lista.filter(p => p.estado === ESTADO_OPERATIVO_LABELS.ASIGNADA).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);

  const filteredLista = lista.filter(c => {
    const text = `${c.nombre || ''} ${c.fabricante || ''} ${c.id || ''} ${c.computadoraHostname || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.tipo === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
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

  const uniqueCategories = [...new Set(lista.map(p => p.tipo).filter(Boolean))];

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Inventario IT y Control de Suministros</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Registra los componentes de hardware adquiridos y gestiona de manera rápida cuántos están disponibles o ya asignados en resguardo.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm ml-auto sm:ml-0 whitespace-nowrap"
        >
          <span>Nuevo +</span>
        </button>
      </div>

      {/* Metrics Row (Simple, focuses only on count indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider mb-1">Total Adquirido</span>
            <span className="text-2xl font-black font-mono text-slate-900">{totalItemsCount} <span className="text-sm font-normal text-slate-400">unidades</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider mb-1">Disponible (En Bodega)</span>
            <span className="text-2xl font-black font-mono text-emerald-600">
              {totalAvailableCount} <span className="text-sm font-medium text-slate-400">({totalItemsCount ? Math.round((totalAvailableCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider mb-1">Asignado (En Uso)</span>
            <span className="text-2xl font-black font-mono text-indigo-600">
              {totalAssignedCount} <span className="text-sm font-medium text-slate-400">({totalItemsCount ? Math.round((totalAssignedCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por componente, ID o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-semibold text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 self-start sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtro:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="All">Todas las categorías</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat} className="capitalize">{cat}</option>
            ))}
          </select>
        </div>
      </div>

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
              {filteredLista.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No se encontraron componentes en el inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLista.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <Link to={`/perifericos/stock/${c.id}`} className="font-mono font-bold text-blue-600 text-xs hover:underline hover:text-blue-800">
                        {c.id}
                      </Link>
                    </td>
                    
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="space-y-1">
                        <p className="capitalize">{c.nombre ?? c.fabricante ?? '—'}</p>
                        {c.conexion && (
                          <p className="text-[11px] text-slate-400 font-normal">
                            Conexión: {c.conexion}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(c.tipo)}`}>
                        {c.tipo || 'Sin tipo'}
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

                    <td className="py-4 px-5 text-right">
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
                    <input
                      type="text"
                      required
                      placeholder="Ej. TECLADO, MOUSE..."
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
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
    </div>
  );
}
