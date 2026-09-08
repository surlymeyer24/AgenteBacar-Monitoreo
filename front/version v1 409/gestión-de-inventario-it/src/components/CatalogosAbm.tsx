import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, RefreshCw, Search, Edit2, Trash2, Check, X, 
  ArrowUp, ArrowDown, Power, HelpCircle, Download, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle, Layers, Filter, FolderPlus
} from 'lucide-react';
import { CatalogoItem, CatalogoTipo } from '../types';
import { 
  CATALOGOS_CONFIG, 
  CATALOGOS_DEFAULT_DATA, 
  AVAILABLE_ICONS, 
  COLOR_OPTIONS,
  CatalogoConfig
} from '../constants/catalogosDefault';
import { CatalogIcon } from './CatalogIcon';

const STORAGE_KEY = 'bacar_catalogos_data_v1';
const CONFIGS_STORAGE_KEY = 'bacar_catalogos_configs_v1';

export default function CatalogosAbm() {
  // Catalog categories configs state (Default 9 + user-created)
  const [catalogosConfigList, setCatalogosConfigList] = useState<CatalogoConfig[]>(() => {
    try {
      const stored = localStorage.getItem(CONFIGS_STORAGE_KEY);
      if (stored) {
        const parsed: CatalogoConfig[] = JSON.parse(stored);
        const existingIds = new Set(parsed.map(c => c.id));
        const missingDefaults = CATALOGOS_CONFIG.filter(c => !existingIds.has(c.id));
        return [...parsed, ...missingDefaults];
      }
    } catch (e) {
      console.error('Error cargando configs de catálogos de localStorage:', e);
    }
    return CATALOGOS_CONFIG;
  });

  const saveCatalogosConfigs = (newConfigs: CatalogoConfig[]) => {
    setCatalogosConfigList(newConfigs);
    try {
      localStorage.setItem(CONFIGS_STORAGE_KEY, JSON.stringify(newConfigs));
    } catch (e) {
      console.error('Error guardando configs de catálogos:', e);
    }
  };

  // Persistence state
  const [catalogosData, setCatalogosData] = useState<Record<string, CatalogoItem[]>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge defaults to ensure any new system catalogs (licenses, maintenance, etc.) are available
        return {
          ...CATALOGOS_DEFAULT_DATA,
          ...parsed
        };
      }
    } catch (e) {
      console.error('Error cargando catálogos de localStorage:', e);
    }
    return CATALOGOS_DEFAULT_DATA;
  });

  const saveCatalogos = (newData: Record<string, CatalogoItem[]>) => {
    setCatalogosData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error('Error guardando catálogos:', e);
    }
  };

  // Active catalog selection
  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoTipo>('tipos_stock');

  // Search and filters
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  // Modal ABM State for Items
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<CatalogoItem | null>(null);
  
  // Modal Form Inputs for Items
  const [formCodigo, setFormCodigo] = useState('');
  const [formEtiqueta, setFormEtiqueta] = useState('');
  const [formIcono, setFormIcono] = useState('Package');
  const [formColor, setFormColor] = useState('blue');
  const [formOrden, setFormOrden] = useState<number>(1);
  const [formEstado, setFormEstado] = useState<'activo' | 'inactivo'>('activo');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Modal ABM State for Creating New Catalog Category
  const [modalNuevoCatalogoAbierto, setModalNuevoCatalogoAbierto] = useState(false);
  const [catNombre, setCatNombre] = useState('');
  const [catCodigo, setCatCodigo] = useState('');
  const [catDescripcion, setCatDescripcion] = useState('');
  const [catIcono, setCatIcono] = useState('Package');
  const [catBadgeColor, setCatBadgeColor] = useState('blue');
  const [catError, setCatError] = useState<string | null>(null);

  // Toast / Feedback message
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'success' | 'info' | 'error'; texto: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto dismiss toast
  useEffect(() => {
    if (mensajeToast) {
      const timer = setTimeout(() => setMensajeToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [mensajeToast]);

  // Current active catalog items
  const itemsActuales = useMemo(() => {
    return (catalogosData[catalogoActivo] || []).slice().sort((a, b) => a.orden - b.orden);
  }, [catalogosData, catalogoActivo]);

  // Stats
  const totalItems = itemsActuales.length;
  const activosCount = itemsActuales.filter(i => i.estado === 'activo').length;
  const inactivosCount = itemsActuales.filter(i => i.estado === 'inactivo').length;

  // Filtered items
  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return itemsActuales.filter(item => {
      const matchBusqueda = !q || 
        item.codigo.toLowerCase().includes(q) || 
        item.etiqueta.toLowerCase().includes(q) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(q));
      
      const matchEstado = filtroEstado === 'todos' || item.estado === filtroEstado;

      return matchBusqueda && matchEstado;
    });
  }, [itemsActuales, busqueda, filtroEstado]);

  // Active Catalog Config
  const configActual = useMemo(() => {
    return catalogosConfigList.find(c => c.id === catalogoActivo) || catalogosConfigList[0] || CATALOGOS_CONFIG[0];
  }, [catalogoActivo, catalogosConfigList]);

  // Open Modal for New Item
  const handleNuevoItem = () => {
    const proximoOrden = itemsActuales.length > 0 ? Math.max(...itemsActuales.map(i => i.orden)) + 1 : 1;
    setItemEditando(null);
    setFormCodigo('');
    setFormEtiqueta('');
    setFormIcono(configActual.icono || 'Package');
    setFormColor('blue');
    setFormOrden(proximoOrden);
    setFormEstado('activo');
    setFormDescripcion('');
    setFormError(null);
    setModalAbierto(true);
  };

  // Open Modal for Edit
  const handleEditarItem = (item: CatalogoItem) => {
    setItemEditando(item);
    setFormCodigo(item.codigo);
    setFormEtiqueta(item.etiqueta);
    setFormIcono(item.icono || 'Package');
    setFormColor(item.color || 'blue');
    setFormOrden(item.orden);
    setFormEstado(item.estado);
    setFormDescripcion(item.descripcion || '');
    setFormError(null);
    setModalAbierto(true);
  };

  // Toggle Item State (Activo / Inactivo)
  const handleToggleEstado = (id: string) => {
    const itemTarget = itemsActuales.find(i => i.id === id);
    if (!itemTarget) return;

    const nuevoEstado = itemTarget.estado === 'activo' ? 'inactivo' : 'activo';
    const actualizados = itemsActuales.map(item => 
      item.id === id ? { ...item, estado: nuevoEstado } : item
    );

    saveCatalogos({
      ...catalogosData,
      [catalogoActivo]: actualizados
    });

    setMensajeToast({
      tipo: 'info',
      texto: `Item "${itemTarget.etiqueta}" cambiado a ${nuevoEstado === 'activo' ? 'Activo' : 'Inactivo'}.`
    });
  };

  // Reorder Items (Up / Down)
  const handleMoverOrden = (index: number, direccion: 'arriba' | 'abajo') => {
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= itemsFiltrados.length) return;

    const itemA = itemsFiltrados[index];
    const itemB = itemsFiltrados[targetIndex];

    // Swap their 'orden' values
    const ordenA = itemA.orden;
    const ordenB = itemB.orden;

    const actualizados = itemsActuales.map(item => {
      if (item.id === itemA.id) return { ...item, orden: ordenB };
      if (item.id === itemB.id) return { ...item, orden: ordenA };
      return item;
    });

    saveCatalogos({
      ...catalogosData,
      [catalogoActivo]: actualizados
    });
  };

  // Delete Item
  const handleEliminarItem = (item: CatalogoItem) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el registro "${item.etiqueta}" (${item.codigo}) del catálogo?`
    );
    if (!confirmar) return;

    const actualizados = itemsActuales.filter(i => i.id !== item.id);
    saveCatalogos({
      ...catalogosData,
      [catalogoActivo]: actualizados
    });

    setMensajeToast({
      tipo: 'success',
      texto: `Item "${item.etiqueta}" eliminado correctamente.`
    });
  };

  // Save Modal (Create or Update)
  const handleGuardarForm = (e: React.FormEvent) => {
    e.preventDefault();

    const codigoLimpio = formCodigo.trim().toLowerCase().replace(/\s+/g, '_');
    const etiquetaLimpia = formEtiqueta.trim();

    if (!codigoLimpio) {
      setFormError('El código identificador es obligatorio.');
      return;
    }
    if (!etiquetaLimpia) {
      setFormError('La etiqueta / nombre visible es obligatoria.');
      return;
    }

    // Check duplicate code
    const existeCodigo = itemsActuales.some(i => 
      i.codigo.toLowerCase() === codigoLimpio && (!itemEditando || i.id !== itemEditando.id)
    );
    if (existeCodigo) {
      setFormError(`El código "${codigoLimpio}" ya existe en este catálogo. Utilice uno distinto.`);
      return;
    }

    if (itemEditando) {
      // Update
      const actualizados = itemsActuales.map(item => {
        if (item.id === itemEditando.id) {
          return {
            ...item,
            codigo: codigoLimpio,
            etiqueta: etiquetaLimpia,
            icono: formIcono,
            color: formColor,
            orden: Number(formOrden) || item.orden,
            estado: formEstado,
            descripcion: formDescripcion.trim()
          };
        }
        return item;
      });

      saveCatalogos({
        ...catalogosData,
        [catalogoActivo]: actualizados
      });

      setMensajeToast({
        tipo: 'success',
        texto: `✓ Registro "${etiquetaLimpia}" modificado con éxito.`
      });
    } else {
      // Create new
      const nuevoItem: CatalogoItem = {
        id: `${catalogoActivo.substring(0, 3)}-${Date.now()}`,
        codigo: codigoLimpio,
        etiqueta: etiquetaLimpia,
        icono: formIcono,
        color: formColor,
        orden: Number(formOrden) || (itemsActuales.length + 1),
        estado: formEstado,
        descripcion: formDescripcion.trim()
      };

      saveCatalogos({
        ...catalogosData,
        [catalogoActivo]: [...itemsActuales, nuevoItem]
      });

      setMensajeToast({
        tipo: 'success',
        texto: `✓ Nuevo item "${etiquetaLimpia}" incorporado al catálogo.`
      });
    }

    setModalAbierto(false);
  };

  // Refresh data simulation
  const handleActualizar = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setMensajeToast({
        tipo: 'info',
        texto: 'Catálogo sincronizado y actualizado en tiempo real.'
      });
    }, 600);
  };

  // Create New Custom Catalog Category
  const handleCrearNuevoCatalogo = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = catNombre.trim();
    let codigoLimpio = catCodigo.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (!nombreLimpio) {
      setCatError('El nombre del catálogo es obligatorio.');
      return;
    }
    if (!codigoLimpio) {
      codigoLimpio = nombreLimpio.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    if (!codigoLimpio) {
      setCatError('El identificador / código técnico es inválido.');
      return;
    }

    if (catalogosConfigList.some(c => c.id === codigoLimpio)) {
      setCatError(`Ya existe un catálogo con el código "${codigoLimpio}". Por favor use otro.`);
      return;
    }

    const nuevoCatalogo: CatalogoConfig = {
      id: codigoLimpio,
      nombre: nombreLimpio,
      descripcion: catDescripcion.trim() || `Catálogo de ${nombreLimpio} para gestión IT.`,
      icono: catIcono || 'Package',
      badgeColor: catBadgeColor || 'blue'
    };

    const nuevasConfigs = [...catalogosConfigList, nuevoCatalogo];
    saveCatalogosConfigs(nuevasConfigs);

    // Initialize items for this catalog if not existing
    if (!catalogosData[codigoLimpio]) {
      saveCatalogos({
        ...catalogosData,
        [codigoLimpio]: []
      });
    }

    setCatalogoActivo(codigoLimpio);
    setModalNuevoCatalogoAbierto(false);
    setMensajeToast({
      tipo: 'success',
      texto: `✓ Nuevo catálogo "${nombreLimpio}" creado. ¡Ya puedes añadirle items!`
    });
  };

  // Delete Custom Catalog Category
  const handleEliminarCatalogoPersonalizado = (catalogoId: string, nombreCat: string) => {
    const esDefault = CATALOGOS_CONFIG.some(c => c.id === catalogoId);
    if (esDefault) {
      alert('Los catálogos base oficiales del sistema no pueden eliminarse.');
      return;
    }

    const items = catalogosData[catalogoId] || [];
    const confirmacion = window.confirm(
      `¿Desea eliminar la categoría de catálogo "${nombreCat}"? Contiene ${items.length} items.`
    );
    if (!confirmacion) return;

    const filtrados = catalogosConfigList.filter(c => c.id !== catalogoId);
    saveCatalogosConfigs(filtrados);

    const nuevaData = { ...catalogosData };
    delete nuevaData[catalogoId];
    saveCatalogos(nuevaData);

    setCatalogoActivo('tipos_stock');
    setMensajeToast({
      tipo: 'info',
      texto: `Catálogo "${nombreCat}" eliminado.`
    });
  };

  // Reset to initial seeds
  const handleRestablecerInicial = () => {
    const ok = window.confirm('¿Desea restablecer todos los catálogos a sus valores iniciales por defecto? Se restaurarán los 9 catálogos del sistema.');
    if (!ok) return;

    saveCatalogos(CATALOGOS_DEFAULT_DATA);
    saveCatalogosConfigs(CATALOGOS_CONFIG);
    setCatalogoActivo('tipos_stock');
    setMensajeToast({
      tipo: 'info',
      texto: 'Catálogos restablecidos a los 9 catálogos oficiales del sistema.'
    });
  };

  // Helper color map
  const getColorClasses = (colorName?: string) => {
    const opt = COLOR_OPTIONS.find(c => c.id === colorName) || COLOR_OPTIONS[0];
    return { bg: opt.bg, text: opt.text, border: opt.border };
  };

  return (
    <div className="space-y-5" id="catalogos-abm-container">
      
      {/* Toast Notification Alert */}
      {mensajeToast && (
        <div 
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 ${
            mensajeToast.tipo === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : mensajeToast.tipo === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {mensajeToast.tipo === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{mensajeToast.texto}</span>
          </div>
          <button 
            type="button"
            onClick={() => setMensajeToast(null)}
            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header Container (matching screenshot with red accent line & enhanced layout) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Top Brand Accent Line */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Title & Stats */}
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch bg-red-600 rounded-full shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Catálogos
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 rounded-md">
                  ABM Central
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-1">
                <span className="font-mono text-slate-800 font-bold">{totalItems} ITEMS</span>
                <span className="text-slate-300 mx-2">·</span>
                <span className="text-emerald-700 font-mono font-bold">{activosCount} ACTIVOS</span>
                <span className="text-slate-300 mx-2">·</span>
                <span className="text-slate-500 font-mono font-bold">{inactivosCount} INACTIVOS</span>
              </p>
            </div>
          </div>

          {/* Top Actions: Actualizar, Crear Catálogo & Nuevo Item */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleActualizar}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer hover:border-slate-300 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatNombre('');
                setCatCodigo('');
                setCatDescripcion('');
                setCatIcono('Package');
                setCatBadgeColor('blue');
                setCatError(null);
                setModalNuevoCatalogoAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Crear Catálogo</span>
            </button>

            <button
              type="button"
              onClick={handleNuevoItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo item</span>
            </button>
          </div>
        </div>

        {/* Catalog Selector Tabs */}
        <div className="px-4 sm:px-5 pb-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {catalogosConfigList.map(cat => {
            const esActivo = cat.id === catalogoActivo;
            const cantidad = (catalogosData[cat.id] || []).length;
            const esCustom = !CATALOGOS_CONFIG.some(c => c.id === cat.id);
            
            return (
              <div key={cat.id} className="inline-flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogoActivo(cat.id);
                    setBusqueda('');
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    esActivo 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  <CatalogIcon name={cat.icono} className={`w-3.5 h-3.5 ${esActivo ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{cat.nombre}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    esActivo ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {cantidad}
                  </span>
                </button>
                {esCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarCatalogoPersonalizado(cat.id, cat.nombre);
                    }}
                    title="Eliminar este catálogo personalizado"
                    className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Quick button to add new custom catalog tab */}
          <button
            type="button"
            onClick={() => {
              setCatNombre('');
              setCatCodigo('');
              setCatDescripcion('');
              setCatIcono('Package');
              setCatBadgeColor('blue');
              setCatError(null);
              setModalNuevoCatalogoAbierto(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-dashed border-indigo-300 hover:border-indigo-400 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Nuevo Catálogo</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Código o etiqueta..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              ESTADO
            </span>
            <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-medium">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtroEstado === 'todos' 
                    ? 'bg-slate-900 text-white font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('activo')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtroEstado === 'activo' 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Activos ({activosCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('inactivo')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filtroEstado === 'inactivo' 
                    ? 'bg-slate-600 text-white font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactivos ({inactivosCount})
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Catalog Info & Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Table Subheader: Name of active catalog */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CatalogIcon name={configActual.icono} className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800">
              Catálogo: <strong className="text-slate-950">{configActual.nombre}</strong>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              — {configActual.descripcion}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Mostrando {itemsFiltrados.length} de {totalItems}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-20 text-center">ORDEN</th>
                <th className="py-3 px-4 w-44">CÓDIGO</th>
                <th className="py-3 px-4">ETIQUETA</th>
                <th className="py-3 px-4 w-28 text-center">ICONO</th>
                <th className="py-3 px-4 w-32 text-center">ESTADO</th>
                <th className="py-3 px-4 w-44 text-right pr-6">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-700">No se encontraron items</p>
                      <p className="text-xs text-slate-400">
                        {busqueda || filtroEstado !== 'todos' 
                          ? 'Ningún registro coincide con los filtros aplicados.' 
                          : 'Este catálogo aún no tiene elementos registrados.'}
                      </p>
                      {(busqueda || filtroEstado !== 'todos') && (
                        <button
                          type="button"
                          onClick={() => { setBusqueda(''); setFiltroEstado('todos'); }}
                          className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                          Limpiar Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item, idx) => {
                  const esActivo = item.estado === 'activo';
                  const colorClasses = getColorClasses(item.color);

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !esActivo ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Orden & Up/Down Arrows */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md min-w-[24px]">
                            {item.orden}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoverOrden(idx, 'arriba')}
                              className="text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 cursor-pointer"
                              title="Subir orden"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === itemsFiltrados.length - 1}
                              onClick={() => handleMoverOrden(idx, 'abajo')}
                              className="text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 cursor-pointer"
                              title="Bajar orden"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Código (slug) */}
                      <td className="py-3 px-4">
                        <code className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200/80">
                          {item.codigo}
                        </code>
                      </td>

                      {/* Etiqueta / Nombre Visible */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.etiqueta}
                          </span>
                          {item.descripcion && (
                            <span className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                              {item.descripcion}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Icono (Real rendered Lucide Icon) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className={`p-1.5 rounded-lg border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} shadow-2xs`}>
                            <CatalogIcon name={item.icono || 'Package'} className="w-4 h-4" />
                          </div>
                        </div>
                      </td>

                      {/* Estado con Toggle rápido */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(item.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            esActivo 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clic para cambiar estado (Activo / Inactivo)"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{esActivo ? '✓ Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditarItem(item)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(item.id)}
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                              esActivo 
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' 
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminarItem(item)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Tools */}
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Los cambios en los catálogos se guardan localmente y se propagan a todo el sistema.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestablecerInicial}
              className="text-slate-400 hover:text-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer catálogos originales</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: ALTA Y MODIFICACIÓN (ABM) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  {itemEditando ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {itemEditando ? `Editar Item: ${itemEditando.etiqueta}` : 'Nuevo Item en Catálogo'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Catálogo activo: <strong>{configActual.nombre}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleGuardarForm} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Código & Orden */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Código Identificador <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="ej: camara_ip, monitor..."
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <span className="text-[10px] text-slate-400">Slug único sin espacios.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Orden
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formOrden}
                    onChange={(e) => setFormOrden(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 outline-none focus:border-blue-500 transition-all text-center"
                  />
                </div>
              </div>

              {/* Etiqueta / Nombre Visible */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Etiqueta Visible <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formEtiqueta}
                  onChange={(e) => setFormEtiqueta(e.target.value)}
                  placeholder="ej: Cámara IP, Monitor LED..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Icon Selector Grid with Live Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Ícono Representativo
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Seleccionado:</span>
                    <div className="p-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      <CatalogIcon name={formIcono} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto">
                  {AVAILABLE_ICONS.map(ic => {
                    const isSelected = formIcono === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setFormIcono(ic.name)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-xs scale-105' 
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                        title={ic.label}
                      >
                        <CatalogIcon name={ic.name} className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Color de Acento
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_OPTIONS.map(c => {
                    const isSelected = formColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormColor(c.id)}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${c.bg} ${c.text} ${
                          isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105' : c.border
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estado Switch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Estado del Item</span>
                  <span className="text-[10px] text-slate-400">
                    {formEstado === 'activo' ? 'Habilitado y visible en selectores del sistema' : 'Deshabilitado temporalmente'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setFormEstado(prev => prev === 'activo' ? 'inactivo' : 'activo')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    formEstado === 'activo' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {formEstado === 'activo' ? '✓ Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Descripción Opcional */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Descripción / Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalles sobre uso, alcance o especificaciones..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {itemEditando ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Categoría de Catálogo */}
      {modalNuevoCatalogoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white uppercase">
                    Crear Nuevo Catálogo
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Define una nueva categoría maestra para clasificar activos IT
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNuevoCatalogoAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCrearNuevoCatalogo} className="p-5 space-y-4 text-xs">
              
              {/* Error Box */}
              {catError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{catError}</span>
                </div>
              )}

              {/* Nombre del Catálogo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Nombre del Catálogo *
                </label>
                <input
                  type="text"
                  required
                  value={catNombre}
                  onChange={(e) => {
                    setCatNombre(e.target.value);
                    if (!catCodigo || catCodigo === catNombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')) {
                      setCatCodigo(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                    }
                  }}
                  placeholder="ej: Tipos de Periféricos, Plataformas Cloud, Niveles de SLA..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Código / Slug Identificador */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Código Técnico Identificador *
                </label>
                <input
                  type="text"
                  required
                  value={catCodigo}
                  onChange={(e) => setCatCodigo(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ej: tipos_perifericos"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <span className="text-[10px] text-slate-400">
                  Identificador único del sistema en minúsculas y sin espacios.
                </span>
              </div>

              {/* Icon Selector Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Ícono del Catálogo
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Seleccionado:</span>
                    <div className="p-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      <CatalogIcon name={catIcono} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-28 overflow-y-auto">
                  {AVAILABLE_ICONS.map(ic => {
                    const isSelected = catIcono === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setCatIcono(ic.name)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-xs scale-105' 
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                        title={ic.label}
                      >
                        <CatalogIcon name={ic.name} className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Color Distintivo
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_OPTIONS.map(c => {
                    const isSelected = catBadgeColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCatBadgeColor(c.id)}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${c.bg} ${c.text} ${
                          isSelected ? 'ring-2 ring-slate-900 border-slate-900 scale-105' : c.border
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Descripción o Propósito (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={catDescripcion}
                  onChange={(e) => setCatDescripcion(e.target.value)}
                  placeholder="Explica qué tipo de registros se gestionarán en esta categoría..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoCatalogoAbierto(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Catálogo</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
