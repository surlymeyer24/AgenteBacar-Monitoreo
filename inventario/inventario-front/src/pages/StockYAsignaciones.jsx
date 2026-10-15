import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package, Plus, Laptop, Smartphone, Monitor, Router,
  Tv, Camera, CheckCircle2, Clock, AlertTriangle,
  RotateCcw, Trash2, Edit3, UserCheck, X, Search,
  Wrench, Bookmark, MapPin, AlertCircle, Download,
  ClipboardList, History, ArrowUpRight, ArrowDownLeft,
  Filter, Check, User, Building, QrCode, FileText, Layers
} from 'lucide-react';
import {
  fetchUnidadesStock,
  fetchAsignacionesStock,
  altaUnidadStock,
  modificarUnidadStock,
  bajaUnidadStock,
  asignarUnidadStock,
  devolverUnidadStock
} from '../api/stockApi';

export default function StockYAsignaciones() {
  const [unidades, setUnidades] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [exitoAccion, setExitoAccion] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = searchParams.get('tab') || 'stock';
  const [tabPrincipal, setTabPrincipalState] = useState(tabInicial);

  const setTabPrincipal = (nuevaTab) => {
    setTabPrincipalState(nuevaTab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', nuevaTab);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && (t === 'stock' || t === 'asignaciones' || t === 'ambas' || t === 'movimientos')) {
      setTabPrincipalState(t);
    }
  }, [searchParams]);

  // Filtros de tabla de Stock
  const [categoriaStock, setCategoriaStock] = useState('Todas'); // 'Todas', 'PCs', 'Notebooks', 'Perifericos', 'Celulares', 'Infraestructura'
  const [buscarStock, setBuscarStock] = useState('');
  const [estadoStockFiltro, setEstadoStockFiltro] = useState('Todos');
  const [condicionStockFiltro, setCondicionStockFiltro] = useState('Todas');
  const [ubicacionStockFiltro, setUbicacionStockFiltro] = useState('Todas');
  const [paginaStock, setPaginaStock] = useState(1);
  const porPaginaStock = 10;

  // Filtros de tabla de Asignaciones
  const [buscarAsignacion, setBuscarAsignacion] = useState('');
  const [areaAsignacionFiltro, setAreaAsignacionFiltro] = useState('Todas');
  const [estadoAsignacionFiltro, setEstadoAsignacionFiltro] = useState('Todos');
  const [paginaAsignacion, setPaginaAsignacion] = useState(1);
  const porPaginaAsignacion = 10;

  // Modales
  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  // Estados de formularios
  const [formAlta, setFormAlta] = useState({
    tipo: 'notebook',
    marca: '',
    modelo: '',
    serieOImei: '',
    condicion: 'Nuevo / Sellado',
    ubicacion: 'Estante A1-B3',
    hostname: '',
    notas: '',
  });

  const [formEditar, setFormEditar] = useState({
    marca: '',
    modelo: '',
    serieOImei: '',
    condicion: '',
    ubicacion: '',
    hostname: '',
    notas: '',
  });

  const [motivoBaja, setMotivoBaja] = useState('');

  const [formAsignar, setFormAsignar] = useState({
    codigo: '',
    responsable: '',
    area: '',
    motivo: '',
  });

  const [motivoDevolver, setMotivoDevolver] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar datos conjuntos
  const cargarDatos = async () => {
    setCargando(true);
    setErrorGlobal(null);
    try {
      const [unidadesData, movsData] = await Promise.all([
        fetchUnidadesStock(),
        fetchAsignacionesStock(),
      ]);
      setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
      setMovimientos(Array.isArray(movsData) ? movsData : []);
    } catch (err) {
      setErrorGlobal(err.message || 'Error al cargar inventario y asignaciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Notificación temporal
  const mostrarExito = (msg) => {
    setExitoAccion(msg);
    setErrorAccion(null);
    setTimeout(() => setExitoAccion(null), 4500);
  };

  const mostrarError = (msg) => {
    setErrorAccion(msg);
    setExitoAccion(null);
    setTimeout(() => setErrorAccion(null), 6000);
  };

  // KPIs consolidados unificados
  const kpis = useMemo(() => {
    let disponibles = 0;
    let staging = 0;
    let reparacion = 0;
    let bajas = 0;

    for (const u of unidades) {
      const est = (u.estadoDeposito || '').toLowerCase();
      if (est.includes('disponible') || est.includes('sin_asignar')) {
        disponibles++;
      } else if (est.includes('prep') || est.includes('staging')) {
        staging++;
      } else if (est.includes('reparac') || est.includes('taller')) {
        reparacion++;
      } else if (est.includes('baja')) {
        bajas++;
      }
    }

    let activas = 0;
    let entregasMes = 0;
    let pendientes = 0;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    for (const m of movimientos) {
      const est = (m.estado || '').toLowerCase();
      if (est.includes('activa') || est.includes('activo')) {
        activas++;
      } else if (est.includes('pendiente')) {
        pendientes++;
      }

      const acc = (m.accion || '').toLowerCase();
      const fechaM = m.fecha ? new Date(m.fecha) : null;
      const esMesActual = fechaM && !isNaN(fechaM) && fechaM.getMonth() === mesActual && fechaM.getFullYear() === anioActual;

      if (esMesActual && (acc.includes('asignac') || acc.includes('entrega') || acc.includes('liberac'))) {
        entregasMes++;
      }
    }

    const totalUnidades = unidades.length || 1;
    const porcentajeDisp = ((disponibles / totalUnidades) * 100).toFixed(1);

    return {
      disponibles,
      porcentajeDisp,
      tallerTotal: staging + reparacion,
      staging,
      reparacion,
      activas,
      entregasMes,
      pendientes,
      bajas,
    };
  }, [unidades, movimientos]);

  // Conteos por categoría de stock
  const conteosCategoria = useMemo(() => {
    let pcs = 0;
    let notebooks = 0;
    let perifericos = 0;
    let celulares = 0;
    let infraestructura = 0;

    for (const u of unidades) {
      const t = (u.tipo || '').toLowerCase();
      if (t === 'pc' || t === 'computadora' || t === 'desktop') pcs++;
      else if (t === 'notebook' || t === 'laptop') notebooks++;
      else if (t === 'celular' || t === 'smartphone') celulares++;
      else if (t === 'router' || t === 'switch' || t === 'access_point' || t === 'red') infraestructura++;
      else perifericos++;
    }

    return {
      todas: unidades.length,
      pcs,
      notebooks,
      perifericos,
      celulares,
      infraestructura,
    };
  }, [unidades]);

  // Filtrado de Unidades de Stock
  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((u) => {
      const t = (u.tipo || '').toLowerCase();
      if (categoriaStock === 'PCs' && !(t === 'pc' || t === 'computadora' || t === 'desktop')) return false;
      if (categoriaStock === 'Notebooks' && !(t === 'notebook' || t === 'laptop')) return false;
      if (categoriaStock === 'Celulares' && !(t === 'celular' || t === 'smartphone')) return false;
      if (categoriaStock === 'Infraestructura' && !(t === 'router' || t === 'switch' || t === 'access_point' || t === 'red')) return false;
      if (categoriaStock === 'Periféricos' && (t === 'pc' || t === 'computadora' || t === 'desktop' || t === 'notebook' || t === 'laptop' || t === 'celular' || t === 'router' || t === 'switch' || t === 'access_point')) return false;

      if (buscarStock.trim()) {
        const q = buscarStock.toLowerCase();
        const texto = `${u.codigo || ''} ${u.marca || ''} ${u.modelo || ''} ${u.serieOImei || ''} ${u.ubicacion || ''} ${u.tipo || ''}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }

      if (estadoStockFiltro !== 'Todos') {
        const est = (u.estadoDeposito || '').toLowerCase();
        if (!est.includes(estadoStockFiltro.toLowerCase())) return false;
      }

      if (condicionStockFiltro !== 'Todas') {
        const c = (u.condicion || '').toLowerCase();
        if (!c.includes(condicionStockFiltro.toLowerCase())) return false;
      }

      if (ubicacionStockFiltro !== 'Todas') {
        const ub = (u.ubicacion || '').toLowerCase();
        if (!ub.includes(ubicacionStockFiltro.toLowerCase())) return false;
      }

      return true;
    });
  }, [unidades, categoriaStock, buscarStock, estadoStockFiltro, condicionStockFiltro, ubicacionStockFiltro]);

  // Paginación Stock
  const totalPaginasStock = Math.ceil(unidadesFiltradas.length / porPaginaStock) || 1;
  const unidadesPaginadas = useMemo(() => {
    const inicio = (paginaStock - 1) * porPaginaStock;
    return unidadesFiltradas.slice(inicio, inicio + porPaginaStock);
  }, [unidadesFiltradas, paginaStock]);

  // Opciones únicas de ubicaciones para el filtro
  const ubicacionesUnicas = useMemo(() => {
    const s = new Set();
    unidades.forEach(u => { if (u.ubicacion) s.add(u.ubicacion); });
    return ['Todas', ...Array.from(s)];
  }, [unidades]);

  // Filtrado de Asignaciones
  const asignacionesFiltradas = useMemo(() => {
    return movimientos.filter((m) => {
      if (buscarAsignacion.trim()) {
        const q = buscarAsignacion.toLowerCase();
        const texto = `${m.responsable || ''} ${m.codigo || ''} ${m.modelo || ''} ${m.marca || ''} ${m.serieOImei || ''}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }

      if (areaAsignacionFiltro !== 'Todas') {
        if ((m.area || '') !== areaAsignacionFiltro) return false;
      }

      if (estadoAsignacionFiltro !== 'Todos') {
        const est = (m.estado || '').toLowerCase();
        if (!est.includes(estadoAsignacionFiltro.toLowerCase())) return false;
      }

      return true;
    });
  }, [movimientos, buscarAsignacion, areaAsignacionFiltro, estadoAsignacionFiltro]);

  // Paginación Asignaciones
  const totalPaginasAsig = Math.ceil(asignacionesFiltradas.length / porPaginaAsignacion) || 1;
  const asignacionesPaginadas = useMemo(() => {
    const inicio = (paginaAsignacion - 1) * porPaginaAsignacion;
    return asignacionesFiltradas.slice(inicio, inicio + porPaginaAsignacion);
  }, [asignacionesFiltradas, paginaAsignacion]);

  const areasUnicas = useMemo(() => {
    const s = new Set();
    movimientos.forEach(m => { if (m.area) s.add(m.area); });
    return ['Todas', ...Array.from(s)];
  }, [movimientos]);

  // Ícono según tipo de activo
  const getIconoTipo = (tipo = '') => {
    const t = tipo.toLowerCase();
    if (t.includes('pc') || t.includes('desktop') || t.includes('computadora')) return <Laptop className="w-4 h-4 text-slate-700" />;
    if (t.includes('notebook') || t.includes('laptop')) return <Laptop className="w-4 h-4 text-blue-600" />;
    if (t.includes('celular') || t.includes('smartphone')) return <Smartphone className="w-4 h-4 text-emerald-600" />;
    if (t.includes('monitor') || t.includes('pantalla')) return <Monitor className="w-4 h-4 text-purple-600" />;
    if (t.includes('router') || t.includes('switch') || t.includes('access_point')) return <Router className="w-4 h-4 text-orange-600" />;
    if (t.includes('tv') || t.includes('televisor')) return <Tv className="w-4 h-4 text-indigo-600" />;
    if (t.includes('camara')) return <Camera className="w-4 h-4 text-pink-600" />;
    return <Package className="w-4 h-4 text-slate-500" />;
  };

  // Badge de Estado de Stock
  const renderBadgeEstadoStock = (estado = '') => {
    const e = estado.toLowerCase();
    if (e.includes('disponible') || e.includes('sin_asignar')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Disponible
        </span>
      );
    }
    if (e.includes('prep') || e.includes('staging')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Staging (ISO/SOE)
        </span>
      );
    }
    if (e.includes('reparac') || e.includes('taller')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          En Taller IT
        </span>
      );
    }
    if (e.includes('reserv')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Reservado
        </span>
      );
    }
    if (e.includes('baja')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Baja
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        {estado || 'En depósito'}
      </span>
    );
  };

  // Badge de Condición
  const renderBadgeCondicion = (cond = '') => {
    const c = cond.toLowerCase();
    if (c.includes('nuevo') || c.includes('sellado')) {
      return <span className="text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">Nuevo / Sellado</span>;
    }
    if (c.includes('reacond') || c.includes('a')) {
      return <span className="text-xs font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">Reacondicionado A</span>;
    }
    if (c.includes('usado') || c.includes('bueno')) {
      return <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">Usado Bueno</span>;
    }
    if (c.includes('revis') || c.includes('fuente') || c.includes('taller')) {
      return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Revisión Fuente</span>;
    }
    return <span className="text-xs text-slate-600">{cond || 'Operativo'}</span>;
  };

  // Avatar con iniciales
  const renderAvatar = (nombre = '') => {
    const partes = nombre.trim().split(' ');
    const iniciales = partes.length >= 2
      ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
      : (nombre.slice(0, 2).toUpperCase() || 'US');
    return (
      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
        {iniciales}
      </div>
    );
  };

  // Formato de código legible con prefijo STK
  const formatCodigoInterno = (cod = '') => {
    if (!cod) return '—';
    if (cod.startsWith('STK-')) return cod;
    return `STK-${cod}`;
  };

  // Handlers de Acciones de Stock
  const handleAltaSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorAccion(null);
    try {
      await altaUnidadStock(formAlta);
      setModalAltaOpen(false);
      setFormAlta({
        tipo: 'notebook',
        marca: '',
        modelo: '',
        serieOImei: '',
        condicion: 'Nuevo / Sellado',
        ubicacion: 'Estante A1-B3',
        hostname: '',
        notas: '',
      });
      await cargarDatos();
      mostrarExito('¡Unidad ingresada al stock correctamente!');
    } catch (err) {
      mostrarError(err.message || 'Error al dar de alta la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenEditar = (u) => {
    setUnidadSeleccionada(u);
    setFormEditar({
      marca: u.marca || '',
      modelo: u.modelo || '',
      serieOImei: u.serieOImei || '',
      condicion: u.condicion || 'Nuevo / Sellado',
      ubicacion: u.ubicacion || 'Estante A1-B3',
      hostname: u.hostname || '',
      notas: u.notas || '',
    });
    setModalEditarOpen(true);
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada?.codigo) return;
    setGuardando(true);
    setErrorAccion(null);
    try {
      await modificarUnidadStock(unidadSeleccionada.codigo, formEditar);
      setModalEditarOpen(false);
      await cargarDatos();
      mostrarExito(`Unidad ${unidadSeleccionada.codigo} modificada exitosamente.`);
    } catch (err) {
      mostrarError(err.message || 'Error al modificar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenBaja = (u) => {
    setUnidadSeleccionada(u);
    setMotivoBaja('');
    setModalBajaOpen(true);
  };

  const handleBajaSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada?.codigo) return;
    if (!motivoBaja.trim()) {
      mostrarError('El motivo de la baja es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorAccion(null);
    try {
      await bajaUnidadStock(unidadSeleccionada.codigo, motivoBaja);
      setModalBajaOpen(false);
      await cargarDatos();
      mostrarExito(`Baja de ${unidadSeleccionada.codigo} registrada.`);
    } catch (err) {
      mostrarError(err.message || 'Error al procesar la baja');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenAsignar = (u = null) => {
    if (u) {
      setUnidadSeleccionada(u);
      setFormAsignar({
        codigo: u.codigo,
        responsable: '',
        area: '',
        motivo: '',
      });
    } else {
      setUnidadSeleccionada(null);
      setFormAsignar({
        codigo: '',
        responsable: '',
        area: '',
        motivo: '',
      });
    }
    setModalAsignarOpen(true);
  };

  const handleAsignarSubmit = async (e) => {
    e.preventDefault();
    const codigoDestino = formAsignar.codigo || unidadSeleccionada?.codigo;
    if (!codigoDestino) {
      mostrarError('Debes seleccionar una unidad a asignar.');
      return;
    }
    if (!formAsignar.responsable.trim()) {
      mostrarError('El nombre del responsable es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorAccion(null);
    try {
      await asignarUnidadStock(codigoDestino, {
        responsable: formAsignar.responsable,
        area: formAsignar.area,
        motivo: formAsignar.motivo,
      });
      setModalAsignarOpen(false);
      await cargarDatos();
      mostrarExito(`Activo ${codigoDestino} asignado con éxito a ${formAsignar.responsable}.`);
    } catch (err) {
      mostrarError(err.message || 'Error al asignar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenDevolver = (m = null, u = null) => {
    setMovimientoSeleccionado(m);
    setUnidadSeleccionada(u);
    setMotivoDevolver('');
    setModalDevolverOpen(true);
  };

  const handleDevolverSubmit = async (e) => {
    e.preventDefault();
    const cod = movimientoSeleccionado?.codigo || unidadSeleccionada?.codigo;
    if (!cod) return;
    setGuardando(true);
    setErrorAccion(null);
    try {
      await devolverUnidadStock(cod, motivoDevolver);
      setModalDevolverOpen(false);
      await cargarDatos();
      mostrarExito(`Unidad ${cod} devuelta a Disponible en depósito.`);
    } catch (err) {
      mostrarError(err.message || 'Error al registrar la devolución');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* 1. Header Unificado con badges y botones de acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Depósito: Stock y Asignaciones
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Módulo Depósito • Central Córdoba [INV-ALM-01]
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Control físico de existencias en almacén y trazabilidad integral de asignaciones, entregas y custodias a responsables con soporte de firmas digitales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorAccion(null);
              setModalAltaOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-700" />
            Registrar activo
          </button>
          <button
            type="button"
            onClick={() => handleOpenAsignar(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nueva asignación / entrega
          </button>
        </div>
      </div>

      {/* Alertas flotantes de éxito o error */}
      {exitoAccion && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exitoAccion}</span>
          </div>
          <button type="button" onClick={() => setExitoAccion(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorAccion && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorAccion}</span>
          </div>
          <button type="button" onClick={() => setErrorAccion(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Pestañas de Navegación del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTabPrincipal('stock')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabPrincipal === 'stock'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Stock de Depósito
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              tabPrincipal === 'stock' ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {unidades.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabPrincipal('asignaciones')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabPrincipal === 'asignaciones'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Asignaciones de Stock
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              tabPrincipal === 'asignaciones' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {kpis.activas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabPrincipal('ambas')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabPrincipal === 'ambas'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Vista General (Ambas)
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Sincronizado en tiempo real</span>
        </div>
      </div>

      {/* 3. 5 KPIs Consolidados Unificados */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Disponibles en Almacén</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.disponibles}</span>
            <span className="text-xs font-bold text-emerald-600">{kpis.porcentajeDisp}% total</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Listos para entrega inmediata</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Taller / Preparación</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.tallerTotal}</span>
            <span className="text-xs font-bold text-slate-500">unidades</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
            <span className="text-blue-600 bg-blue-50 px-1 rounded">Staging {kpis.staging}</span>
            <span className="text-amber-600 bg-amber-50 px-1 rounded">En reparación {kpis.reparacion}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Asignaciones Activas</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.activas}</span>
            <span className="text-xs font-bold text-indigo-600">en campo</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Actas vigentes en nómina</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Entregas del Mes</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.entregasMes}</span>
            <span className="text-xs font-bold text-rose-600">+22% MoM</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Ritmo de recambio óptimo</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Pendientes de Firma</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.pendientes}</span>
            <span className="text-xs font-bold text-amber-600">actos req.</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Requerir firma digital QR</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. BLOQUE: TABLA DE STOCK DE DEPÓSITO (LISTA CONTINUA)         */}
      {/* ============================================================== */}
      {(tabPrincipal === 'stock' || tabPrincipal === 'ambas') && (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Pestañas de categoría de activo tipo pills */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'Todas', label: 'Todas', count: conteosCategoria.todas },
              { id: 'PCs', label: 'PCs', count: conteosCategoria.pcs },
              { id: 'Notebooks', label: 'Notebooks', count: conteosCategoria.notebooks },
              { id: 'Periféricos', label: 'Periféricos', count: conteosCategoria.perifericos },
              { id: 'Celulares', label: 'Celulares', count: conteosCategoria.celulares },
              { id: 'Infraestructura', label: 'Infraestructura', count: conteosCategoria.infraestructura },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoriaStock(cat.id);
                  setPaginaStock(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoriaStock === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  categoriaStock === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-400">
            Mostrando {unidadesPaginadas.length} de {unidadesFiltradas.length} activos
          </span>
        </div>

        {/* Filtros de Stock */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={buscarStock}
              onChange={(e) => {
                setBuscarStock(e.target.value);
                setPaginaStock(1);
              }}
              placeholder="Buscar por código, serie o modelo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>

          <select
            value={estadoStockFiltro}
            onChange={(e) => {
              setEstadoStockFiltro(e.target.value);
              setPaginaStock(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="Staging">Staging</option>
            <option value="Taller">En Taller</option>
            <option value="Reservado">Reservado</option>
            <option value="Baja">Baja</option>
          </select>

          <select
            value={condicionStockFiltro}
            onChange={(e) => {
              setCondicionStockFiltro(e.target.value);
              setPaginaStock(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="Todas">Condición: Todas</option>
            <option value="Nuevo">Nuevo / Sellado</option>
            <option value="Reacondicionado">Reacondicionado</option>
            <option value="Usado Bueno">Usado Bueno</option>
            <option value="Revisión">Revisión Fuente</option>
          </select>

          <select
            value={ubicacionStockFiltro}
            onChange={(e) => {
              setUbicacionStockFiltro(e.target.value);
              setPaginaStock(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
          >
            {ubicacionesUnicas.map(u => (
              <option key={u} value={u}>
                {u === 'Todas' ? 'Estantería: Todas' : u}
              </option>
            ))}
          </select>

          {(buscarStock || estadoStockFiltro !== 'Todos' || condicionStockFiltro !== 'Todas' || ubicacionStockFiltro !== 'Todas') && (
            <button
              type="button"
              onClick={() => {
                setBuscarStock('');
                setEstadoStockFiltro('Todos');
                setCondicionStockFiltro('Todas');
                setUbicacionStockFiltro('Todas');
                setPaginaStock(1);
              }}
              className="text-xs text-red-600 font-bold hover:underline px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla continua de Stock */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Código Interno</th>
                <th className="py-3 px-4">Tipo / Hardware</th>
                <th className="py-3 px-4">Marca y Modelo</th>
                <th className="py-3 px-4">Serie / Identificador</th>
                <th className="py-3 px-4">Condición</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    Cargando inventario de depósito...
                  </td>
                </tr>
              ) : unidadesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No se encontraron activos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                unidadesPaginadas.map((u) => {
                  const est = (u.estadoDeposito || '').toLowerCase();
                  const esDisponible = est.includes('disponible') || est.includes('sin_asignar');
                  return (
                    <tr key={u.codigo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-red-600">
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatCodigoInterno(u.codigo)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-800 capitalize">
                          {getIconoTipo(u.tipo)}
                          <span>{u.tipo || 'Equipo'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.marca} {u.modelo}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{u.notas || 'Sin especificaciones extras'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {u.serieOImei || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {renderBadgeCondicion(u.condicion)}
                      </td>
                      <td className="py-3 px-4">
                        {renderBadgeEstadoStock(u.estadoDeposito)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {u.ubicacion || 'Depósito'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {esDisponible ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAsignar(u)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold shadow-2xs transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Asignar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDevolver(null, u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              Devolver
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditar(u)}
                            title="Editar serie o ubicación"
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenBaja(u)}
                            title="Dar de baja con motivo"
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Paginación Stock */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Página {paginaStock} de {totalPaginasStock}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaStock <= 1}
              onClick={() => setPaginaStock(p => p - 1)}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 font-bold text-slate-800">{paginaStock}</span>
            <button
              type="button"
              disabled={paginaStock >= totalPaginasStock}
              onClick={() => setPaginaStock(p => p + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOQUE: TRAZABILIDAD DE ASIGNACIONES Y ENTREGAS RECIENTES             */}
      {/* ========================================================================= */}
      {(tabPrincipal === 'asignaciones' || tabPrincipal === 'ambas') && (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Cabecera del bloque de trazabilidad */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Trazabilidad de Asignaciones y Entregas Recientes
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {kpis.activas} en custodia
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Historial cronológico de entregas de equipamiento, actas firmadas y devoluciones a depósito.
            </p>
          </div>

          {/* Filtros de Asignaciones */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={buscarAsignacion}
                onChange={(e) => {
                  setBuscarAsignacion(e.target.value);
                  setPaginaAsignacion(1);
                }}
                placeholder="Filtrar por responsable..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <select
              value={areaAsignacionFiltro}
              onChange={(e) => {
                setAreaAsignacionFiltro(e.target.value);
                setPaginaAsignacion(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-hidden"
            >
              {areasUnicas.map(a => (
                <option key={a} value={a}>
                  {a === 'Todas' ? 'Área: Todos' : a}
                </option>
              ))}
            </select>

            <select
              value={estadoAsignacionFiltro}
              onChange={(e) => {
                setEstadoAsignacionFiltro(e.target.value);
                setPaginaAsignacion(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Activa">Activa / En campo</option>
              <option value="Finalizada">Finalizada / Reingresada</option>
              <option value="Pendiente">Pendiente de firma</option>
            </select>
          </div>
        </div>

        {/* Tabla de Asignaciones */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Activo Asignado</th>
                <th className="py-3 px-4">Responsable en Custodia</th>
                <th className="py-3 px-4">Área / Sector</th>
                <th className="py-3 px-4">Tipo Movimiento</th>
                <th className="py-3 px-4">Estado de Custodia</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Cargando bitácora de custodia...
                  </td>
                </tr>
              ) : asignacionesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No hay asignaciones registradas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                asignacionesPaginadas.map((m) => {
                  const est = (m.estado || '').toLowerCase();
                  const esActiva = est.includes('activa') || est.includes('activo');
                  const esPendiente = est.includes('pendiente');
                  const acc = (m.accion || '').toLowerCase();

                  return (
                    <tr key={m.id || m.codigo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {m.fecha ? new Date(m.fecha).toLocaleDateString() : 'Hoy'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Remito #{m.id ? String(m.id).slice(-6).toUpperCase() : (m.codigo || '—')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          {getIconoTipo(m.tipo)}
                          <span>{m.marca} {m.modelo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                          <span className="text-red-600 font-bold">{formatCodigoInterno(m.codigo)}</span>
                          <span className="text-slate-400">• S/N: {m.serieOImei || '—'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {renderAvatar(m.responsable || 'Usuario')}
                          <div>
                            <div className="font-bold text-slate-900">{m.responsable || 'Sin responsable'}</div>
                            <div className="text-[11px] text-slate-400">{m.area ? `Área: ${m.area}` : 'En custodia'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Building className="w-3 h-3 text-blue-500" />
                          {m.area || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          {acc.includes('devoluc') ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>{m.accion || 'Asignación'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {esActiva ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Activa / Firmada Digital
                          </span>
                        ) : esPendiente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente de Firma (SMS)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                            Reingresado a Depósito
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {esActiva && (
                            <button
                              type="button"
                              onClick={() => handleOpenDevolver(m, null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              Devolver
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => alert(`Acta digital del activo ${m.codigo} asignado a ${m.responsable}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 rounded text-xs font-semibold"
                            title="Ver Acta Digital"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Acta
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

        {/* Footer de Trazabilidad */}
        <div className="p-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronización de trazabilidad en tiempo real con Active Directory y RRHH</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaAsignacion <= 1}
              onClick={() => setPaginaAsignacion(p => p - 1)}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 font-bold text-slate-800">{paginaAsignacion}</span>
            <button
              type="button"
              disabled={paginaAsignacion >= totalPaginasAsig}
              onClick={() => setPaginaAsignacion(p => p + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES: ALTA, EDITAR, BAJA, ASIGNAR Y DEVOLVER                          */}
      {/* ========================================================================= */}

      {/* Modal Alta de Unidad */}
      {modalAltaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Registrar Nuevo Activo en Stock</h3>
              <button type="button" onClick={() => setModalAltaOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAltaSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Activo *</label>
                <select
                  value={formAlta.tipo}
                  onChange={(e) => setFormAlta(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 font-semibold"
                  required
                >
                  <option value="notebook">Notebook (NB)</option>
                  <option value="pc">PC de Escritorio (PC)</option>
                  <option value="monitor">Monitor (MON)</option>
                  <option value="celular">Celular (CEL)</option>
                  <option value="teclado">Teclado (TEC)</option>
                  <option value="mouse">Mouse (MOU)</option>
                  <option value="router">Router (RTR)</option>
                  <option value="switch">Switch (SW)</option>
                  <option value="access_point">Access Point (AP)</option>
                  <option value="impresora">Impresora (IMP)</option>
                  <option value="televisor">Televisor (TV)</option>
                  <option value="camara">Cámara IP (CAM)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formAlta.marca}
                    onChange={(e) => setFormAlta(f => ({ ...f, marca: e.target.value }))}
                    placeholder="Ej. Lenovo, Dell, Samsung"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formAlta.modelo}
                    onChange={(e) => setFormAlta(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="Ej. ThinkPad T14, Galaxy A54"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Serie o IMEI</label>
                <input
                  type="text"
                  value={formAlta.serieOImei}
                  onChange={(e) => setFormAlta(f => ({ ...f, serieOImei: e.target.value }))}
                  placeholder="Ej. PF-385XKL2"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Condición</label>
                  <select
                    value={formAlta.condicion}
                    onChange={(e) => setFormAlta(f => ({ ...f, condicion: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Nuevo / Sellado">Nuevo / Sellado</option>
                    <option value="Reacondicionado A">Reacondicionado A</option>
                    <option value="Usado Bueno">Usado Bueno</option>
                    <option value="Revisión Fuente">Revisión Fuente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación / Estante</label>
                  <input
                    type="text"
                    value={formAlta.ubicacion}
                    onChange={(e) => setFormAlta(f => ({ ...f, ubicacion: e.target.value }))}
                    placeholder="Ej. Estante A1-B3"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas / Especificaciones</label>
                <input
                  type="text"
                  value={formAlta.notas}
                  onChange={(e) => setFormAlta(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Ej. i7-1270P • 32GB RAM • 512GB SSD"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAltaOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Serie / Ubicación */}
      {modalEditarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Editar {unidadSeleccionada?.codigo}</h3>
                <p className="text-[11px] text-slate-400">{unidadSeleccionada?.marca} {unidadSeleccionada?.modelo}</p>
              </div>
              <button type="button" onClick={() => setModalEditarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditarSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Serie / IMEI</label>
                <input
                  type="text"
                  value={formEditar.serieOImei}
                  onChange={(e) => setFormEditar(f => ({ ...f, serieOImei: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Condición</label>
                  <select
                    value={formEditar.condicion}
                    onChange={(e) => setFormEditar(f => ({ ...f, condicion: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Nuevo / Sellado">Nuevo / Sellado</option>
                    <option value="Reacondicionado A">Reacondicionado A</option>
                    <option value="Usado Bueno">Usado Bueno</option>
                    <option value="Revisión Fuente">Revisión Fuente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={formEditar.ubicacion}
                    onChange={(e) => setFormEditar(f => ({ ...f, ubicacion: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  value={formEditar.notas}
                  onChange={(e) => setFormEditar(f => ({ ...f, notas: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEditarOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baja con Motivo */}
      {modalBajaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-rose-900 text-sm">Dar de Baja {unidadSeleccionada?.codigo}</h3>
              </div>
              <button type="button" onClick={() => setModalBajaOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBajaSubmit} className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Estás por dar de baja la unidad <strong>{unidadSeleccionada?.marca} {unidadSeleccionada?.modelo}</strong> ({unidadSeleccionada?.codigo}). El motivo es obligatorio para asentar en auditoría.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de la Baja *</label>
                <textarea
                  rows="3"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  placeholder="Ej. Pantalla rota sin repuesto / Obsoleto / Daño eléctrico irreparable"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500/20"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBajaOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {guardando ? 'Confirmando...' : 'Confirmar Baja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar a Responsable */}
      {modalAsignarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {unidadSeleccionada ? `Asignar ${unidadSeleccionada.codigo}` : 'Nueva Asignación / Entrega'}
                </h3>
                {unidadSeleccionada && (
                  <p className="text-[11px] text-slate-400">{unidadSeleccionada.marca} {unidadSeleccionada.modelo}</p>
                )}
              </div>
              <button type="button" onClick={() => setModalAsignarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAsignarSubmit} className="p-4 space-y-3">
              {!unidadSeleccionada && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Activo a Asignar *</label>
                  <select
                    value={formAsignar.codigo}
                    onChange={(e) => setFormAsignar(f => ({ ...f, codigo: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 font-mono font-semibold"
                    required
                  >
                    <option value="">-- Seleccionar unidad de depósito --</option>
                    {unidades
                      .filter(u => (u.estadoDeposito || '').toLowerCase().includes('disp') || (u.estadoDeposito || '').toLowerCase().includes('sin_asig'))
                      .map(u => (
                        <option key={u.codigo} value={u.codigo}>
                          {formatCodigoInterno(u.codigo)} - {u.tipo} {u.marca} {u.modelo} ({u.serieOImei || 'S/N'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Responsable *</label>
                <input
                  type="text"
                  value={formAsignar.responsable}
                  onChange={(e) => setFormAsignar(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Ej. Laura Gómez"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Área o Sector</label>
                <input
                  type="text"
                  value={formAsignar.area}
                  onChange={(e) => setFormAsignar(f => ({ ...f, area: e.target.value }))}
                  placeholder="Ej. Administración Central, Ventas, Tesorería"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Acta (Opcional)</label>
                <input
                  type="text"
                  value={formAsignar.motivo}
                  onChange={(e) => setFormAsignar(f => ({ ...f, motivo: e.target.value }))}
                  placeholder="Ej. Renovación de equipo, Ingreso de personal"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAsignarOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {guardando ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devolver a Disponible */}
      {modalDevolverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Devolver {movimientoSeleccionado?.codigo || unidadSeleccionada?.codigo} a Depósito
                </h3>
              </div>
              <button type="button" onClick={() => setModalDevolverOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDevolverSubmit} className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                El equipo volverá a estar <strong>Disponible</strong> en depósito sin responsable asignado, y se cerrará su ciclo de custodia en la bitácora.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de la Devolución (Opcional)</label>
                <input
                  type="text"
                  value={motivoDevolver}
                  onChange={(e) => setMotivoDevolver(e.target.value)}
                  placeholder="Ej. Recambio de equipo, Baja de empleado, Devolución voluntaria"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalDevolverOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {guardando ? 'Procesando...' : 'Confirmar Devolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
