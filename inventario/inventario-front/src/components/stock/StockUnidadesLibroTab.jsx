import { useState, useMemo, useEffect } from 'react';
import {
  Package, Plus, Laptop, Smartphone, Monitor, Router,
  Tv, Camera, CheckCircle2, Clock, AlertTriangle,
  RotateCcw, Trash2, Edit3, UserCheck, X, Search,
  Wrench, Bookmark, MapPin, AlertCircle
} from 'lucide-react';
import {
  fetchUnidadesStock,
  altaUnidadStock,
  modificarUnidadStock,
  bajaUnidadStock,
  asignarUnidadStock,
  devolverUnidadStock
} from '../../api/stockApi';

export default function StockUnidadesLibroTab({ onRegistrarActivoRef }) {
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [exitoAccion, setExitoAccion] = useState(null);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [condicionFiltro, setCondicionFiltro] = useState('Todas');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('Todas');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(25);

  // Modales
  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);

  // Estados de formularios
  const [formAlta, setFormAlta] = useState({
    tipo: 'monitor',
    marca: '',
    modelo: '',
    serieOImei: '',
    condicion: 'Nuevo',
    ubicacion: 'Depósito',
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
    responsable: '',
    area: '',
    motivo: '',
  });
  const [motivoDevolver, setMotivoDevolver] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar unidades
  const cargarUnidades = async () => {
    setCargando(true);
    setErrorGlobal(null);
    try {
      const data = await fetchUnidadesStock();
      setUnidades(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorGlobal(err.message || 'Error al cargar unidades de stock');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  // Exponer apertura de modal alta al padre si se requiere
  useEffect(() => {
    if (onRegistrarActivoRef) {
      onRegistrarActivoRef.current = () => {
        setErrorAccion(null);
        setExitoAccion(null);
        setModalAltaOpen(true);
      };
    }
  }, [onRegistrarActivoRef]);

  // KPIs
  const kpis = useMemo(() => {
    const total = unidades.length;
    let disponibles = 0;
    let preparacion = 0;
    let reparacion = 0;
    let reservados = 0;
    let bajas = 0;

    for (const u of unidades) {
      const est = (u.estadoDeposito || '').toLowerCase().trim();
      if (est.includes('disponible') || est.includes('sin asignar') || est === 'en_stock' || est === 'sin_asignar') {
        disponibles++;
      } else if (est.includes('preparaci') || est.includes('staging')) {
        preparacion++;
      } else if (est.includes('reparaci') || est.includes('taller')) {
        reparacion++;
      } else if (est.includes('reserva') || est.includes('ticket')) {
        reservados++;
      } else if (est.includes('baja') || est.includes('scrap')) {
        bajas++;
      } else {
        disponibles++; // fallback
      }
    }

    const pctDisponibles = total > 0 ? ((disponibles / total) * 100).toFixed(1) : '0';
    return { total, disponibles, pctDisponibles, preparacion, reparacion, reservados, bajas };
  }, [unidades]);

  // Opciones para selects de filtros
  const opcionesTipos = useMemo(() => {
    const set = new Set();
    unidades.forEach(u => { if (u.tipo) set.add(u.tipo); });
    return ['Todos', ...Array.from(set)];
  }, [unidades]);

  const opcionesUbicaciones = useMemo(() => {
    const set = new Set();
    unidades.forEach(u => { if (u.ubicacion) set.add(u.ubicacion); });
    return ['Todas', ...Array.from(set)];
  }, [unidades]);

  // Filtrado
  const unidadesFiltradas = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return unidades.filter(u => {
      if (tipoFiltro !== 'Todos' && u.tipo?.toLowerCase() !== tipoFiltro.toLowerCase()) {
        return false;
      }
      if (condicionFiltro !== 'Todas' && u.condicion?.toLowerCase() !== condicionFiltro.toLowerCase()) {
        return false;
      }
      if (ubicacionFiltro !== 'Todas' && u.ubicacion?.toLowerCase() !== ubicacionFiltro.toLowerCase()) {
        return false;
      }
      if (estadoFiltro !== 'Todos') {
        const est = (u.estadoDeposito || '').toLowerCase();
        if (estadoFiltro === 'Disponible' && !est.includes('disponible') && !est.includes('sin asignar') && est !== 'en_stock') return false;
        if (estadoFiltro === 'En preparación' && !est.includes('preparaci')) return false;
        if (estadoFiltro === 'En reparación' && !est.includes('reparaci')) return false;
        if (estadoFiltro === 'Reservado' && !est.includes('reserva')) return false;
        if (estadoFiltro === 'Baja' && !est.includes('baja')) return false;
      }
      if (q) {
        const blob = [
          u.codigo,
          u.tipo,
          u.marca,
          u.modelo,
          u.serieOImei,
          u.ubicacion,
          u.estadoDeposito,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [unidades, buscar, tipoFiltro, estadoFiltro, condicionFiltro, ubicacionFiltro]);

  // Paginación
  const totalFiltrados = unidadesFiltradas.length;
  const totalPaginas = Math.ceil(totalFiltrados / porPagina) || 1;
  const inicioIndice = (paginaActual - 1) * porPagina;
  const unidadesPaginadas = unidadesFiltradas.slice(inicioIndice, inicioIndice + porPagina);

  // Handlers para acciones
  const handleAltaSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorAccion(null);
    try {
      await altaUnidadStock(formAlta);
      setModalAltaOpen(false);
      setExitoAccion(`Unidad dada de alta exitosamente.`);
      await cargarUnidades();
    } catch (err) {
      setErrorAccion(err.message || 'Error al dar de alta la unidad');
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
      condicion: u.condicion || '',
      ubicacion: u.ubicacion || '',
      hostname: '',
      notas: '',
    });
    setErrorAccion(null);
    setModalEditarOpen(true);
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada) return;
    setGuardando(true);
    setErrorAccion(null);
    try {
      await modificarUnidadStock(unidadSeleccionada.codigo, formEditar);
      setModalEditarOpen(false);
      setExitoAccion(`Unidad ${unidadSeleccionada.codigo} modificada exitosamente.`);
      await cargarUnidades();
    } catch (err) {
      setErrorAccion(err.message || 'Error al modificar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenBaja = (u) => {
    setUnidadSeleccionada(u);
    setMotivoBaja('');
    setErrorAccion(null);
    setModalBajaOpen(true);
  };

  const handleBajaSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada) return;
    if (!motivoBaja.trim()) {
      setErrorAccion('El motivo de la baja es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorAccion(null);
    try {
      await bajaUnidadStock(unidadSeleccionada.codigo, motivoBaja.trim());
      setModalBajaOpen(false);
      setExitoAccion(`Unidad ${unidadSeleccionada.codigo} dada de baja.`);
      await cargarUnidades();
    } catch (err) {
      setErrorAccion(err.message || 'Error al dar de baja la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenAsignar = (u) => {
    setUnidadSeleccionada(u);
    setFormAsignar({ responsable: '', area: '', motivo: '' });
    setErrorAccion(null);
    setModalAsignarOpen(true);
  };

  const handleAsignarSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada) return;
    if (!formAsignar.responsable.trim()) {
      setErrorAccion('El nombre del responsable es obligatorio.');
      return;
    }
    setGuardando(true);
    setErrorAccion(null);
    try {
      await asignarUnidadStock(unidadSeleccionada.codigo, {
        responsable: formAsignar.responsable.trim(),
        area: formAsignar.area.trim(),
        motivo: formAsignar.motivo.trim(),
      });
      setModalAsignarOpen(false);
      setExitoAccion(`Unidad ${unidadSeleccionada.codigo} asignada a ${formAsignar.responsable.trim()}.`);
      await cargarUnidades();
    } catch (err) {
      setErrorAccion(err.message || 'Error al asignar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenDevolver = (u) => {
    setUnidadSeleccionada(u);
    setMotivoDevolver('');
    setErrorAccion(null);
    setModalDevolverOpen(true);
  };

  const handleDevolverSubmit = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada) return;
    setGuardando(true);
    setErrorAccion(null);
    try {
      await devolverUnidadStock(unidadSeleccionada.codigo, {
        motivo: motivoDevolver.trim() || 'Devolución a Disponible',
      });
      setModalDevolverOpen(false);
      setExitoAccion(`Unidad ${unidadSeleccionada.codigo} devuelta a Disponible.`);
      await cargarUnidades();
    } catch (err) {
      setErrorAccion(err.message || 'Error al devolver la unidad');
    } finally {
      setGuardando(false);
    }
  };

  // Helper para renderizar iconos según tipo
  const renderTipoIcon = (tipo) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('notebook') || t.includes('nb')) return <Laptop className="w-4 h-4 text-indigo-500" />;
    if (t.includes('pc') || t.includes('desktop')) return <Laptop className="w-4 h-4 text-blue-500" />;
    if (t.includes('celular') || t.includes('cel')) return <Smartphone className="w-4 h-4 text-sky-500" />;
    if (t.includes('monitor') || t.includes('mon')) return <Monitor className="w-4 h-4 text-cyan-600" />;
    if (t.includes('router') || t.includes('switch') || t.includes('ap')) return <Router className="w-4 h-4 text-amber-500" />;
    if (t.includes('tv') || t.includes('televisor')) return <Tv className="w-4 h-4 text-purple-500" />;
    if (t.includes('camara') || t.includes('cámara')) return <Camera className="w-4 h-4 text-rose-500" />;
    return <Package className="w-4 h-4 text-slate-500" />;
  };

  // Helper para renderizar badge de estado
  const renderEstadoBadge = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est.includes('disponible') || est.includes('sin asignar') || est === 'en_stock') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Disponible
        </span>
      );
    }
    if (est.includes('preparaci')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          En preparación
        </span>
      );
    }
    if (est.includes('reparaci')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          En reparación
        </span>
      );
    }
    if (est.includes('reserva')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Reservado
        </span>
      );
    }
    if (est.includes('baja') || est.includes('scrap')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Baja
        </span>
      );
    }
    if (est.includes('asignad')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Asignada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {estado || 'Disponible'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mensajes de Alerta/Error */}
      {errorAccion && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorAccion}</span>
          </div>
          <button type="button" onClick={() => setErrorAccion(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {exitoAccion && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exitoAccion}</span>
          </div>
          <button type="button" onClick={() => setExitoAccion(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5 KPIs Superiores (según prototipo) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Disponibles */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Disponibles
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{kpis.disponibles}</span>
              <span className="text-xs font-bold text-emerald-600">{kpis.pctDisponibles}%</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* En preparación */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              En preparación
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{kpis.preparacion}</span>
              <span className="text-xs font-medium text-slate-500">Staging</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* En reparación */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              En reparación
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{kpis.reparacion}</span>
              <span className="text-xs font-medium text-slate-500">Taller</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Reservados */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Reservados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{kpis.reservados}</span>
              <span className="text-xs font-medium text-slate-500">Tickets</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        {/* Bajas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Bajas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{kpis.bajas}</span>
              <span className="text-xs font-medium text-slate-500">Scrap</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPaginaActual(1); }}
            placeholder="Código interno, serie, modelo o marca..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        <select
          value={tipoFiltro}
          onChange={(e) => { setTipoFiltro(e.target.value); setPaginaActual(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          {opcionesTipos.map(t => <option key={t} value={t}>Tipo: {t}</option>)}
        </select>

        <select
          value={estadoFiltro}
          onChange={(e) => { setEstadoFiltro(e.target.value); setPaginaActual(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          <option value="Todos">Estado: Todos</option>
          <option value="Disponible">Disponible</option>
          <option value="En preparación">En preparación</option>
          <option value="En reparación">En reparación</option>
          <option value="Reservado">Reservado</option>
          <option value="Baja">Baja</option>
        </select>

        <select
          value={condicionFiltro}
          onChange={(e) => { setCondicionFiltro(e.target.value); setPaginaActual(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          <option value="Todas">Condición: Todas</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Usado">Usado</option>
        </select>

        <select
          value={ubicacionFiltro}
          onChange={(e) => { setUbicacionFiltro(e.target.value); setPaginaActual(1); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          {opcionesUbicaciones.map(u => <option key={u} value={u}>Ubicación: {u}</option>)}
        </select>
      </div>

      {/* Tabla del Libro Común */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Código Interno</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Marca y Modelo</th>
                <th className="py-3.5 px-4">Número de Serie</th>
                <th className="py-3.5 px-4">Condición</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Fecha Ingreso</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Cargando unidades del stock de depósito...
                  </td>
                </tr>
              ) : unidadesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No se encontraron unidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                unidadesPaginadas.map((u) => {
                  const est = (u.estadoDeposito || '').toLowerCase();
                  const esAsignada = est.includes('asignad');
                  const esBaja = est.includes('baja');

                  return (
                    <tr key={u.codigo || u.serieOImei} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${esBaja ? 'bg-slate-400' : esAsignada ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                          {u.codigo || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {renderTipoIcon(u.tipo)}
                          <span className="capitalize">{u.tipo || 'Activo'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {u.marca} {u.modelo}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {u.serieOImei || 'S/N'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          (u.condicion || '').toLowerCase() === 'nuevo'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.condicion || 'Usado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderEstadoBadge(u.estadoDeposito)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.fechaIngreso || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {u.ubicacion || 'Depósito'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Modificar serie o ubicación */}
                          {!esBaja && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditar(u)}
                              title="Modificar activo (serie, ubicación, condición)"
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Asignar con nombre */}
                          {!esBaja && !esAsignada && (
                            <button
                              type="button"
                              onClick={() => handleOpenAsignar(u)}
                              title="Asignar a persona"
                              className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Devolver si estuviera asignada */}
                          {esAsignada && (
                            <button
                              type="button"
                              onClick={() => handleOpenDevolver(u)}
                              title="Devolver a Disponible"
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Baja con motivo */}
                          {!esBaja && (
                            <button
                              type="button"
                              onClick={() => handleOpenBaja(u)}
                              title="Dar de baja con motivo"
                              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="py-3 px-4 bg-slate-50/75 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando <span className="font-bold text-slate-700">{totalFiltrados > 0 ? inicioIndice + 1 : 0}</span> a{' '}
            <span className="font-bold text-slate-700">{Math.min(inicioIndice + porPagina, totalFiltrados)}</span> de{' '}
            <span className="font-bold text-slate-700">{totalFiltrados}</span> activos
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Ver:</span>
              <select
                value={porPagina}
                onChange={(e) => { setPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 font-medium"
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-2 font-bold text-slate-700">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Alta de Activo (Monitor, Celular, Notebook, etc.) */}
      {modalAltaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">Registrar Activo en Stock</h3>
              <button type="button" onClick={() => setModalAltaOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAltaSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo de Activo *</label>
                <select
                  value={formAlta.tipo}
                  onChange={(e) => setFormAlta({ ...formAlta, tipo: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  required
                >
                  <option value="monitor">Monitor (MON)</option>
                  <option value="notebook">Notebook (NB)</option>
                  <option value="desktop">Computadora PC (PC)</option>
                  <option value="celular">Celular (CEL)</option>
                  <option value="teclado">Teclado (TEC)</option>
                  <option value="mouse">Mouse (MOU)</option>
                  <option value="impresora">Impresora (IMP)</option>
                  <option value="webcam">Webcam (WEB)</option>
                  <option value="router">Router (RTR)</option>
                  <option value="switch">Switch (SW)</option>
                  <option value="camara">Cámara (CAM)</option>
                  <option value="televisor">Televisor (TV)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formAlta.marca}
                    onChange={(e) => setFormAlta({ ...formAlta, marca: e.target.value })}
                    placeholder="Samsung, Dell, Lenovo..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formAlta.modelo}
                    onChange={(e) => setFormAlta({ ...formAlta, modelo: e.target.value })}
                    placeholder="24'', ThinkPad, etc."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Número de Serie o IMEI</label>
                <input
                  type="text"
                  value={formAlta.serieOImei}
                  onChange={(e) => setFormAlta({ ...formAlta, serieOImei: e.target.value })}
                  placeholder="SN-XXXXX o 15 dígitos IMEI"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Condición</label>
                  <select
                    value={formAlta.condicion}
                    onChange={(e) => setFormAlta({ ...formAlta, condicion: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={formAlta.ubicacion}
                    onChange={(e) => setFormAlta({ ...formAlta, ubicacion: e.target.value })}
                    placeholder="Depósito, Estantería B1..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAltaOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Registrar Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modificar Activo (Serie o Ubicación) */}
      {modalEditarOpen && unidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Modificar Activo</h3>
                <p className="text-xs text-slate-500 font-mono">{unidadSeleccionada.codigo} · {unidadSeleccionada.tipo}</p>
              </div>
              <button type="button" onClick={() => setModalEditarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditarSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Número de Serie o IMEI</label>
                <input
                  type="text"
                  value={formEditar.serieOImei}
                  onChange={(e) => setFormEditar({ ...formEditar, serieOImei: e.target.value })}
                  placeholder="Número de serie o IMEI"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Ubicación / Estante</label>
                <input
                  type="text"
                  value={formEditar.ubicacion}
                  onChange={(e) => setFormEditar({ ...formEditar, ubicacion: e.target.value })}
                  placeholder="Depósito, Taller IT, Estantería..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formEditar.marca}
                    onChange={(e) => setFormEditar({ ...formEditar, marca: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formEditar.modelo}
                    onChange={(e) => setFormEditar({ ...formEditar, modelo: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Baja de Celular o Unidad con Motivo */}
      {modalBajaOpen && unidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Dar de Baja Activo</h3>
                <p className="text-xs text-rose-600 font-bold">{unidadSeleccionada.codigo} · {unidadSeleccionada.marca} {unidadSeleccionada.modelo}</p>
              </div>
              <button type="button" onClick={() => setModalBajaOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBajaSubmit} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                ¿Confirmás la baja definitiva de esta unidad del stock? Esta acción no se puede deshacer y requiere asentar el motivo obligatorio.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo de la baja *</label>
                <textarea
                  rows="3"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  placeholder="Rotura irreparable, pantalla rota, obsoleto..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalBajaOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !motivoBaja.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Dando de baja...' : 'Confirmar Baja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Asignar Notebook o Unidad con Nombre */}
      {modalAsignarOpen && unidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Asignar Activo a Persona</h3>
                <p className="text-xs text-indigo-600 font-bold">{unidadSeleccionada.codigo} · {unidadSeleccionada.marca} {unidadSeleccionada.modelo}</p>
              </div>
              <button type="button" onClick={() => setModalAsignarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAsignarSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Responsable *</label>
                <input
                  type="text"
                  value={formAsignar.responsable}
                  onChange={(e) => setFormAsignar({ ...formAsignar, responsable: e.target.value })}
                  placeholder="Nombre y Apellido (ej. Carlos Varela)"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Área / Sector</label>
                <input
                  type="text"
                  value={formAsignar.area}
                  onChange={(e) => setFormAsignar({ ...formAsignar, area: e.target.value })}
                  placeholder="Administración, Ventas, Planta Embalaje..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo / Notas</label>
                <input
                  type="text"
                  value={formAsignar.motivo}
                  onChange={(e) => setFormAsignar({ ...formAsignar, motivo: e.target.value })}
                  placeholder="Asignación por nuevo ingreso, reemplazo..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAsignarOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !formAsignar.responsable.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Devolver Unidad a Disponible */}
      {modalDevolverOpen && unidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Devolver Unidad a Disponible</h3>
                <p className="text-xs text-emerald-600 font-bold">{unidadSeleccionada.codigo} · {unidadSeleccionada.marca} {unidadSeleccionada.modelo}</p>
              </div>
              <button type="button" onClick={() => setModalDevolverOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDevolverSubmit} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                La unidad volverá al estado <strong>Disponible</strong> en depósito, desvinculando al responsable actual.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo de devolución</label>
                <input
                  type="text"
                  value={motivoDevolver}
                  onChange={(e) => setMotivoDevolver(e.target.value)}
                  placeholder="Fin de proyecto, renuncia, equipo devuelto..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalDevolverOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Devolviendo...' : 'Confirmar Devolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
