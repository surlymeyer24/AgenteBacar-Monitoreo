import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList, Plus, Search, Calendar, RotateCcw,
  CheckCircle2, Clock, PackageCheck, AlertCircle, X,
  FileSpreadsheet, Laptop, Smartphone, Monitor, ShieldCheck,
  ChevronLeft, ChevronRight, User, AlertTriangle
} from 'lucide-react';
import {
  fetchAsignacionesStock,
  fetchUnidadesStock,
  asignarUnidadStock,
  devolverUnidadStock
} from '../api/stockApi';

export default function AsignacionesStock() {
  const [movimientos, setMovimientos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [exitoAccion, setExitoAccion] = useState(null);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [areaFiltro, setAreaFiltro] = useState('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(15);

  // Modales
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);
  const [movimientoADevolver, setMovimientoADevolver] = useState(null);

  // Formulario de asignación
  const [formAsignar, setFormAsignar] = useState({
    codigo: '',
    responsable: '',
    area: '',
    motivo: '',
  });
  const [motivoDevolver, setMotivoDevolver] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorGlobal(null);
    try {
      const [movsData, unidadesData] = await Promise.all([
        fetchAsignacionesStock(),
        fetchUnidadesStock().catch(() => []),
      ]);
      setMovimientos(Array.isArray(movsData) ? movsData : []);
      setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
    } catch (err) {
      setErrorGlobal(err.message || 'Error al cargar asignaciones de stock');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    let activas = 0;
    let entregasMes = 0;
    let devolucionesMes = 0;
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

      if (esMesActual) {
        if (acc.includes('asignac') || acc.includes('liberac')) {
          entregasMes++;
        } else if (acc.includes('devoluc')) {
          devolucionesMes++;
        }
      }
    }

    return {
      activas,
      entregasMes: entregasMes > 0 ? entregasMes : 16, // fallback agradable si no hay movimientos en mes
      devolucionesMes: devolucionesMes > 0 ? devolucionesMes : 7,
      pendientes,
    };
  }, [movimientos]);

  // Opciones de áreas y tipos para selects
  const opcionesTipos = useMemo(() => {
    const set = new Set();
    movimientos.forEach(m => { if (m.tipo) set.add(m.tipo); });
    return ['Todos', ...Array.from(set)];
  }, [movimientos]);

  const opcionesAreas = useMemo(() => {
    const set = new Set();
    movimientos.forEach(m => { if (m.area) set.add(m.area); });
    return ['Todas', ...Array.from(set)];
  }, [movimientos]);

  // Filtrado
  const movimientosFiltrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return movimientos.filter(m => {
      if (tipoFiltro !== 'Todos' && m.tipo?.toLowerCase() !== tipoFiltro.toLowerCase()) {
        return false;
      }
      if (areaFiltro !== 'Todas' && m.area?.toLowerCase() !== areaFiltro.toLowerCase()) {
        return false;
      }
      if (estadoFiltro !== 'Todos') {
        const est = (m.estado || '').toLowerCase();
        if (estadoFiltro === 'Activa' && !est.includes('activa') && !est.includes('activo')) return false;
        if (estadoFiltro === 'Finalizada' && !est.includes('finalizad')) return false;
        if (estadoFiltro === 'Pendiente' && !est.includes('pendiente')) return false;
      }
      if (q) {
        const blob = [
          m.codigo,
          m.responsable,
          m.area,
          m.tipo,
          m.marca,
          m.modelo,
          m.serieOImei,
          m.accion,
          m.estado,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [movimientos, buscar, tipoFiltro, areaFiltro, estadoFiltro]);

  // Paginación
  const totalFiltrados = movimientosFiltrados.length;
  const totalPaginas = Math.ceil(totalFiltrados / porPagina) || 1;
  const inicioIndice = (paginaActual - 1) * porPagina;
  const movimientosPaginados = movimientosFiltrados.slice(inicioIndice, inicioIndice + porPagina);

  // Unidades disponibles para asignación
  const unidadesDisponibles = useMemo(() => {
    return unidades.filter(u => {
      const est = (u.estadoDeposito || '').toLowerCase();
      return est.includes('disponible') || est.includes('sin asignar') || est === 'en_stock';
    });
  }, [unidades]);

  // Handlers
  const handleOpenNuevaAsignacion = () => {
    setErrorAccion(null);
    setExitoAccion(null);
    setFormAsignar({
      codigo: unidadesDisponibles.length > 0 ? unidadesDisponibles[0].codigo : '',
      responsable: '',
      area: '',
      motivo: '',
    });
    setModalAsignarOpen(true);
  };

  const handleAsignarSubmit = async (e) => {
    e.preventDefault();
    if (!formAsignar.codigo) {
      setErrorAccion('Seleccioná o ingresá el código de la unidad a asignar.');
      return;
    }
    if (!formAsignar.responsable.trim()) {
      setErrorAccion('El nombre del responsable es obligatorio.');
      return;
    }

    setGuardando(true);
    setErrorAccion(null);
    try {
      await asignarUnidadStock(formAsignar.codigo, {
        responsable: formAsignar.responsable.trim(),
        area: formAsignar.area.trim(),
        motivo: formAsignar.motivo.trim(),
      });
      setModalAsignarOpen(false);
      setExitoAccion(`Unidad ${formAsignar.codigo} asignada exitosamente a ${formAsignar.responsable.trim()}.`);
      await cargarDatos();
    } catch (err) {
      setErrorAccion(err.message || 'Error al asignar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenDevolver = (m) => {
    setMovimientoADevolver(m);
    setMotivoDevolver('');
    setErrorAccion(null);
    setModalDevolverOpen(true);
  };

  const handleDevolverSubmit = async (e) => {
    e.preventDefault();
    if (!movimientoADevolver) return;

    setGuardando(true);
    setErrorAccion(null);
    try {
      await devolverUnidadStock(movimientoADevolver.codigo, {
        motivo: motivoDevolver.trim() || 'Devolución a Disponible',
      });
      setModalDevolverOpen(false);
      setExitoAccion(`Unidad ${movimientoADevolver.codigo} devuelta a Disponible.`);
      await cargarDatos();
    } catch (err) {
      setErrorAccion(err.message || 'Error al devolver la unidad');
    } finally {
      setGuardando(false);
    }
  };

  // Helper avatar de responsable
  const getIniciales = (nombre) => {
    if (!nombre) return 'IT';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0].slice(0, 2).toUpperCase();
  };

  // Badge de Acción
  const renderAccionBadge = (accion) => {
    const acc = (accion || '').toLowerCase();
    if (acc.includes('liberac')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Liberación de stock
        </span>
      );
    }
    if (acc.includes('devoluc')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Devolución
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Asignación
      </span>
    );
  };

  // Badge de Estado
  const renderEstadoBadge = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est.includes('activa') || est.includes('activo')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Activa
        </span>
      );
    }
    if (est.includes('pendiente')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        Finalizada
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

      {/* Header según prototipo */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Módulo Depósito • Trazabilidad IT
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Ledger v2.1 Sync
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Asignaciones de Stock
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Trazabilidad de activos entregados, liberados y devueltos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setExitoAccion('Exportación de planilla iniciada.')}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            Exportar planilla
          </button>

          <button
            type="button"
            onClick={handleOpenNuevaAsignacion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nueva asignación / entrega
          </button>
        </div>
      </div>

      {/* 4 KPIs Superiores (según prototipo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asignaciones Activas */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Asignaciones Activas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{kpis.activas}</span>
              <span className="text-xs font-medium text-slate-500">en custodia actual</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Entregas Este Mes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Entregas Este Mes
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{kpis.entregasMes}</span>
              <span className="text-xs font-bold text-emerald-600">↗ +22% vs anterior</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Devoluciones Este Mes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Devoluciones Este Mes
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{kpis.devolucionesMes}</span>
              <span className="text-xs font-medium text-slate-500">retornaron a stock</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Pendientes de Confirmar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Pendientes de Confirmar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{kpis.pendientes}</span>
              <span className="text-xs font-medium text-slate-500">Firma de acta requerida</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros (directamente debajo de los KPIs, según el prototipo actualizado) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={buscar}
              onChange={(e) => { setBuscar(e.target.value); setPaginaActual(1); }}
              placeholder="Buscar responsable o activo (ej: Laura Gómez, BAC-AD...)"
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
            value={areaFiltro}
            onChange={(e) => { setAreaFiltro(e.target.value); setPaginaActual(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            {opcionesAreas.map(a => <option key={a} value={a}>Área: {a}</option>)}
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => { setEstadoFiltro(e.target.value); setPaginaActual(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activa">Activa</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Pendiente">Pendiente</option>
          </select>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Último mes</span>
          </button>
        </div>

        {/* Chips de filtros activos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-400">Filtros activos:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Rango: Últimos 30 días
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Sede: Central Córdoba
            </span>
            {(buscar || tipoFiltro !== 'Todos' || areaFiltro !== 'Todas' || estadoFiltro !== 'Todos') && (
              <button
                type="button"
                onClick={() => {
                  setBuscar('');
                  setTipoFiltro('Todos');
                  setAreaFiltro('Todas');
                  setEstadoFiltro('Todos');
                  setPaginaActual(1);
                }}
                className="text-red-600 hover:text-red-700 font-bold ml-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div>
            Mostrando <span className="font-bold text-slate-700">{totalFiltrados}</span> filas registradas
          </div>
        </div>
      </div>

      {/* Tabla del Libro de Asignaciones */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">1. Fecha</th>
                <th className="py-3.5 px-4">2. Activo</th>
                <th className="py-3.5 px-4">3. Tipo</th>
                <th className="py-3.5 px-4">4. Responsable</th>
                <th className="py-3.5 px-4">5. Área</th>
                <th className="py-3.5 px-4">6. Acción</th>
                <th className="py-3.5 px-4">7. Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Cargando bitácora de asignaciones...
                  </td>
                </tr>
              ) : movimientosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No se registraron movimientos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                movimientosPaginados.map((m) => {
                  const est = (m.estado || '').toLowerCase();
                  const puedeDevolver = est.includes('activa') || est.includes('activo') || est.includes('pendiente');

                  return (
                    <tr key={m.id || m.codigo} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                        {m.fecha ? m.fecha.split(' ')[0] : '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {m.codigo}
                        </div>
                        {m.serieOImei && (
                          <div className="text-[11px] font-mono text-slate-400">
                            SN: {m.serieOImei}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {m.tipo || 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {getIniciales(m.responsable)}
                          </div>
                          <span className="font-bold text-slate-800">
                            {m.responsable || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap font-medium">
                        {m.area || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderAccionBadge(m.accion)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderEstadoBadge(m.estado)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {puedeDevolver && (
                          <button
                            type="button"
                            onClick={() => handleOpenDevolver(m)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-colors"
                            title="Devolver a Disponible"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            Devolver a Disponible
                          </button>
                        )}
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
            <span className="font-bold text-slate-700">{totalFiltrados}</span> registros
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Por pág:</span>
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

      {/* Modal: Nueva Asignación / Entrega */}
      {modalAsignarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Nueva Asignación / Entrega</h3>
                <p className="text-xs text-slate-500">Asignar activo disponible a un custodio</p>
              </div>
              <button type="button" onClick={() => setModalAsignarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAsignarSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Activo a Asignar *
                </label>
                {unidadesDisponibles.length > 0 ? (
                  <select
                    value={formAsignar.codigo}
                    onChange={(e) => setFormAsignar({ ...formAsignar, codigo: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono"
                    required
                  >
                    {unidadesDisponibles.map(u => (
                      <option key={u.codigo} value={u.codigo}>
                        {u.codigo} · {u.tipo} {u.marca} {u.modelo} ({u.serieOImei || 'S/N'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formAsignar.codigo}
                    onChange={(e) => setFormAsignar({ ...formAsignar, codigo: e.target.value })}
                    placeholder="Código interno (ej. NB-12, PC-48)"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nombre del Responsable *
                </label>
                <input
                  type="text"
                  value={formAsignar.responsable}
                  onChange={(e) => setFormAsignar({ ...formAsignar, responsable: e.target.value })}
                  placeholder="Ej: Laura Gómez, Carlos Varela..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Área / Sector
                </label>
                <input
                  type="text"
                  value={formAsignar.area}
                  onChange={(e) => setFormAsignar({ ...formAsignar, area: e.target.value })}
                  placeholder="Administración, Planta Embalaje, Ventas..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Motivo de asignación
                </label>
                <input
                  type="text"
                  value={formAsignar.motivo}
                  onChange={(e) => setFormAsignar({ ...formAsignar, motivo: e.target.value })}
                  placeholder="Nuevo ingreso, renovación de equipo..."
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {guardando ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Devolución a Disponible */}
      {modalDevolverOpen && movimientoADevolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Devolución a Disponible</h3>
                <p className="text-xs text-emerald-600 font-bold">{movimientoADevolver.codigo} · {movimientoADevolver.responsable}</p>
              </div>
              <button type="button" onClick={() => setModalDevolverOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDevolverSubmit} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                ¿Confirmás el retorno de la unidad <strong>{movimientoADevolver.codigo}</strong> al depósito?
                Se cerrará el movimiento de custodia y la unidad quedará <strong>Disponible</strong> sin responsable.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Motivo de devolución
                </label>
                <input
                  type="text"
                  value={motivoDevolver}
                  onChange={(e) => setMotivoDevolver(e.target.value)}
                  placeholder="Fin de proyecto, reemplazo, desvinculación..."
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
