import { useEffect, useMemo, useState } from 'react';
import {
  Plus, RefreshCw, Search, Edit2, X,
  ArrowUp, ArrowDown, Power, CheckCircle2, AlertCircle, Sparkles,
} from 'lucide-react';
import {
  fetchCatalogo,
  crearCatalogoItem,
  actualizarCatalogoItem,
  cambiarActivoCatalogoItem,
} from '../api/catalogoApi';
import CatalogIcon from '../components/CatalogIcon';
import { CATALOGOS_CONFIG } from '../constants/catalogosConfig';
import { AVAILABLE_ICONS, getColorClasses } from '../constants/catalogosConstants';

const FORM_INICIAL = {
  codigo: '',
  label: '',
  orden: '',
  icono: 'Package',
};

export default function CatalogosAdmin() {
  const [catalogoActivo, setCatalogoActivo] = useState(CATALOGOS_CONFIG[0].id);
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoCodigo, setEditandoCodigo] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [mensajeToast, setMensajeToast] = useState(null);

  useEffect(() => {
    if (mensajeToast) {
      const timer = setTimeout(() => setMensajeToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [mensajeToast]);

  function cargar(silent = false) {
    if (!silent) setCargando(true);
    setError(null);
    fetchCatalogo(catalogoActivo, true)
      .then(setLista)
      .catch(() => setError('No se pudo cargar el catálogo.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargar(); }, [catalogoActivo]);

  const configActual = useMemo(
    () => CATALOGOS_CONFIG.find(c => c.id === catalogoActivo) || CATALOGOS_CONFIG[0],
    [catalogoActivo],
  );

  const itemsActuales = useMemo(
    () => [...lista].sort((a, b) => a.orden - b.orden),
    [lista],
  );

  const totalItems = itemsActuales.length;
  const activosCount = itemsActuales.filter(i => i.activo).length;
  const inactivosCount = totalItems - activosCount;

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return itemsActuales.filter(item => {
      const matchBusqueda = !q
        || item.codigo.toLowerCase().includes(q)
        || item.label.toLowerCase().includes(q);
      const matchEstado = filtroEstado === 'todos'
        || (filtroEstado === 'activo' && item.activo)
        || (filtroEstado === 'inactivo' && !item.activo);
      return matchBusqueda && matchEstado;
    });
  }, [itemsActuales, busqueda, filtroEstado]);

  function handleActualizar() {
    setIsRefreshing(true);
    fetchCatalogo(catalogoActivo, true)
      .then(data => {
        setLista(data);
        setMensajeToast({ tipo: 'info', texto: 'Catálogo sincronizado y actualizado.' });
      })
      .catch(() => setMensajeToast({ tipo: 'error', texto: 'No se pudo actualizar el catálogo.' }))
      .finally(() => setIsRefreshing(false));
  }

  function abrirNuevo() {
    const proximoOrden = itemsActuales.length > 0
      ? Math.max(...itemsActuales.map(i => i.orden)) + 1
      : 1;
    setEditandoCodigo(null);
    setForm({
      ...FORM_INICIAL,
      icono: configActual.icono || 'Package',
      orden: String(proximoOrden),
    });
    setFormError('');
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditandoCodigo(item.codigo);
    setForm({
      codigo: item.codigo,
      label: item.label,
      orden: String(item.orden),
      icono: item.icono || 'Package',
    });
    setFormError('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const codigoLimpio = form.codigo.trim().toLowerCase().replace(/\s+/g, '_');
    const labelLimpia = form.label.trim();

    if (!labelLimpia) {
      setFormError('La etiqueta visible es obligatoria.');
      return;
    }
    if (!editandoCodigo && !codigoLimpio) {
      setFormError('El código identificador es obligatorio.');
      return;
    }

    setGuardando(true);
    setFormError('');

    try {
      if (editandoCodigo) {
        await actualizarCatalogoItem(catalogoActivo, editandoCodigo, {
          label: labelLimpia,
          orden: form.orden ? parseInt(form.orden, 10) : null,
          icono: form.icono || null,
        });
        setMensajeToast({ tipo: 'success', texto: `✓ Registro "${labelLimpia}" modificado con éxito.` });
      } else {
        await crearCatalogoItem(catalogoActivo, {
          codigo: codigoLimpio,
          label: labelLimpia,
          orden: form.orden ? parseInt(form.orden, 10) : null,
          icono: form.icono || null,
        });
        setMensajeToast({ tipo: 'success', texto: `✓ Nuevo item "${labelLimpia}" incorporado al catálogo.` });
      }
      cerrarModal();
      cargar(true);
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(item) {
    const nuevoActivo = !item.activo;
    const accion = nuevoActivo ? 'activar' : 'desactivar';
    if (!nuevoActivo) {
      const msg = `¿Desactivar "${item.label}"?\n\nLos ítems existentes conservan este tipo; no aparecerá en altas nuevas.`;
      if (!window.confirm(msg)) return;
    }

    try {
      await cambiarActivoCatalogoItem(catalogoActivo, item.codigo, nuevoActivo);
      cargar(true);
      setMensajeToast({
        tipo: 'info',
        texto: `Item "${item.label}" cambiado a ${nuevoActivo ? 'Activo' : 'Inactivo'}.`,
      });
    } catch {
      setMensajeToast({ tipo: 'error', texto: `No se pudo ${accion} el item.` });
    }
  }

  async function handleMoverOrden(index, direccion) {
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= itemsFiltrados.length) return;

    const itemA = itemsFiltrados[index];
    const itemB = itemsFiltrados[targetIndex];
    const ordenA = itemA.orden;
    const ordenB = itemB.orden;

    try {
      await Promise.all([
        actualizarCatalogoItem(catalogoActivo, itemA.codigo, { orden: ordenB }),
        actualizarCatalogoItem(catalogoActivo, itemB.codigo, { orden: ordenA }),
      ]);
      cargar(true);
    } catch {
      setMensajeToast({ tipo: 'error', texto: 'No se pudo reordenar el item.' });
    }
  }

  return (
    <div className="space-y-5" id="catalogos-abm-container">

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

      {error && (
        <div className="px-4 py-2.5 rounded-xl border bg-rose-50 text-rose-800 border-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => cargar()}
            className="ml-auto text-rose-700 hover:text-rose-900 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleActualizar}
              disabled={isRefreshing || cargando}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer hover:border-slate-300 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={abrirNuevo}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo item</span>
            </button>
          </div>
        </div>

        {/* Selector de catálogo */}
        <div className="px-4 sm:px-5 pb-3 border-b border-slate-100 flex items-center gap-2">
          <CatalogIcon name={configActual.icono} className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={catalogoActivo}
            onChange={(e) => {
              setCatalogoActivo(e.target.value);
              setBusqueda('');
            }}
            className="flex-1 max-w-sm px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-2xs"
          >
            {CATALOGOS_CONFIG.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
          {totalItems > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {totalItems} items
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="p-3 sm:p-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
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

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              ESTADO
            </span>
            <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-medium">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'activo', label: `Activos (${activosCount})` },
                { id: 'inactivo', label: `Inactivos (${inactivosCount})` },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFiltroEstado(opt.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filtroEstado === opt.id
                      ? opt.id === 'activo'
                        ? 'bg-emerald-600 text-white font-bold'
                        : opt.id === 'inactivo'
                          ? 'bg-slate-600 text-white font-bold'
                          : 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CatalogIcon name={configActual.icono} className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 truncate">
              Catálogo: <strong className="text-slate-950">{configActual.nombre}</strong>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
              — {configActual.descripcion}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            Mostrando {itemsFiltrados.length} de {totalItems}
          </span>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="py-16 text-center text-slate-400 text-sm">Cargando catálogo…</div>
          ) : (
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
                ) : itemsFiltrados.map((item, idx) => {
                  const esActivo = item.activo;
                  const colorClasses = getColorClasses(item.codigo);

                  return (
                    <tr
                      key={item.codigo}
                      className={`hover:bg-slate-50/80 transition-colors ${!esActivo ? 'bg-slate-50/40 opacity-75' : ''}`}
                    >
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

                      <td className="py-3 px-4">
                        <code className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200/80">
                          {item.codigo}
                        </code>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs">{item.label}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className={`p-1.5 rounded-lg border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} shadow-2xs`}>
                            <CatalogIcon name={item.icono || 'Package'} className="w-4 h-4" />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            esActivo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clic para cambiar estado"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{esActivo ? '✓ Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(item)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActivo(item)}
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                              esActivo
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Los cambios se guardan en el servidor y se propagan a todo el sistema.</span>
        </div>
      </div>

      {/* Modal ABM */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  {editandoCodigo ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editandoCodigo ? `Editar Item: ${form.label}` : 'Nuevo Item en Catálogo'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Catálogo activo: <strong>{configActual.nombre}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Código Identificador <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editandoCodigo}
                    value={form.codigo}
                    onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                    placeholder="ej: camara_ip, monitor..."
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
                  />
                  {!editandoCodigo && (
                    <span className="text-[10px] text-slate-400">Slug único sin espacios.</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Orden
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.orden}
                    onChange={e => setForm(f => ({ ...f, orden: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-800 outline-none focus:border-blue-500 transition-all text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Etiqueta Visible <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="ej: Cámara IP, Monitor LED..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Ícono Representativo
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Seleccionado:</span>
                    <div className="p-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      <CatalogIcon name={form.icono} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto">
                  {AVAILABLE_ICONS.map(ic => {
                    const isSelected = form.icono === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, icono: ic.name }))}
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {guardando ? 'Guardando…' : editandoCodigo ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
