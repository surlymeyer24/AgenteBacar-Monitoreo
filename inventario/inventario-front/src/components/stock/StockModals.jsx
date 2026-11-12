import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, PlusCircle, Edit3, Trash2, UserCheck, CornerDownLeft, User, Building2 } from 'lucide-react';
import {
  altaUnidadStock,
  modificarUnidadStock,
  bajaUnidadStock,
  asignarUnidadStock,
  devolverUnidadStock,
} from '../../api/stockApi';
import { useStockInvalidation } from '../../hooks/useStockInvalidation';
import { labelTipoStock, opcionesTipoStock } from '../../constants/tiposStock';
import { useCatalogo, opcionesEnumCatalogo } from '../../hooks/useCatalogo';
import {
  UBICACIONES_COMPUTADORA,
  UBICACIONES_COMPUTADORA_LABELS,
  labelUbicacion,
} from '../../constants/ubicaciones';

const CONDICIONES = ['Nuevo', 'Usado', 'Reacondicionado', 'Para repuesto'];
const UBICACIONES_SUGERIDAS = ['Depósito Central', 'Sistemas', 'Taller', 'Puesto IT', 'Rack Principal'];

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors disabled:opacity-50 disabled:bg-slate-50';
const labelClass = 'block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1';

export function ModalAlta({ open, onClose }) {
  const [form, setForm] = useState({
    tipo: 'computadora',
    marca: '',
    modelo: '',
    serieOImei: '',
    condicion: 'Usado',
    ubicacion: 'Depósito Central',
    hostname: '',
    notas: '',
    comentarios: '',
    cantidad: 1,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { invalidarTodo } = useStockInvalidation();

  useEffect(() => {
    if (open) {
      setForm({
        tipo: 'computadora',
        marca: '',
        modelo: '',
        serieOImei: '',
        condicion: 'Usado',
        ubicacion: 'Depósito Central',
        hostname: '',
        notas: '',
        comentarios: '',
        cantidad: 1,
      });
      setError('');
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tipo) {
      setError('El tipo de equipo es obligatorio.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await altaUnidadStock(form);
      await invalidarTodo();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al dar de alta la unidad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <PlusCircle className="w-4 h-4 text-[#0c66e4]" />
              Nueva unidad en stock
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className={inputClass}
                  required
                >
                  {opcionesTipoStock().map((t) => (
                    <option key={t} value={t}>
                      {labelTipoStock(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Condición</label>
                <select
                  value={form.condicion}
                  onChange={(e) => setForm({ ...form, condicion: e.target.value })}
                  className={inputClass}
                >
                  {CONDICIONES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Marca</label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  placeholder="Ej. Dell, Lenovo, HP"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Ej. Latitude 5420, ThinkCentre"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>N° Serie / IMEI</label>
                <input
                  type="text"
                  value={form.serieOImei}
                  onChange={(e) => setForm({ ...form, serieOImei: e.target.value })}
                  placeholder="Serie o identificador físico"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  list="lista-ubicaciones-alta"
                  placeholder="Depósito Central"
                  className={inputClass}
                />
                <datalist id="lista-ubicaciones-alta">
                  {UBICACIONES_SUGERIDAS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className={labelClass}>Hostname (opcional)</label>
                <input
                  type="text"
                  value={form.hostname}
                  onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                  placeholder="Ej. NB-IT-01"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Cantidad (unidades)</label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: parseInt(e.target.value, 10) || 1 })}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Notas / Observaciones</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Detalles sobre accesorios, estado, estantería..."
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Comentarios</label>
                <textarea
                  value={form.comentarios}
                  onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
                  placeholder="Comentarios visibles en la tabla de stock..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                {guardando ? 'Guardando…' : 'Crear unidad'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ModalEditar({ open, unidad, onClose }) {
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    serieOImei: '',
    condicion: '',
    ubicacion: '',
    notas: '',
    comentarios: '',
    cantidad: 1,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { invalidarUnidades } = useStockInvalidation();

  useEffect(() => {
    if (unidad) {
      setForm({
        marca: unidad.marca || '',
        modelo: unidad.modelo || '',
        serieOImei: unidad.serieOImei || '',
        condicion: unidad.condicion || 'Usado',
        ubicacion: unidad.ubicacion || 'Depósito Central',
        notas: unidad.notas || '',
        comentarios: unidad.comentarios || '',
        cantidad: unidad.cantidad || 1,
      });
      setError('');
    }
  }, [unidad]);

  if (!open || !unidad) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await modificarUnidadStock(unidad.codigo, form);
      await invalidarUnidades();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al modificar la unidad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <Edit3 className="w-4 h-4 text-slate-700" />
              Editar unidad {unidad.codigo}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between text-xs text-slate-600">
              <span>
                <strong>Código:</strong> {unidad.codigo}
              </span>
              <span>
                <strong>Tipo:</strong> {labelTipoStock(unidad.tipo)}
              </span>
              <span>
                <strong>Estado:</strong> {unidad.estadoDeposito || 'Sin Asignar'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Marca</label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>N° Serie / IMEI</label>
                <input
                  type="text"
                  value={form.serieOImei}
                  onChange={(e) => setForm({ ...form, serieOImei: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Condición</label>
                <select
                  value={form.condicion}
                  onChange={(e) => setForm({ ...form, condicion: e.target.value })}
                  className={inputClass}
                >
                  {CONDICIONES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  list="lista-ubicaciones-edit"
                  className={inputClass}
                />
                <datalist id="lista-ubicaciones-edit">
                  {UBICACIONES_SUGERIDAS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className={labelClass}>Cantidad (unidades)</label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: parseInt(e.target.value, 10) || 1 })}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Comentarios</label>
                <textarea
                  value={form.comentarios}
                  onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
                  placeholder="Comentarios visibles en la tabla de stock..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ModalBaja({ open, unidad, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { invalidarTodo } = useStockInvalidation();

  useEffect(() => {
    if (open) {
      setMotivo('');
      setError('');
    }
  }, [open]);

  if (!open || !unidad) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('El motivo de baja es obligatorio.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await bajaUnidadStock(unidad.codigo, motivo.trim());
      await invalidarTodo();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al dar de baja la unidad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border-2 border-red-500/30 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
        >
          <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-50/60">
            <span className="font-extrabold text-sm text-red-900 flex items-center gap-2 uppercase tracking-wide">
              <Trash2 className="w-4 h-4 text-red-600" />
              Dar de baja {unidad.codigo}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-sm text-slate-700 space-y-1">
              <div>
                <strong>Equipo:</strong> {labelTipoStock(unidad.tipo)} {unidad.marca} {unidad.modelo}
              </div>
              {unidad.serieOImei && (
                <div>
                  <strong>Serie:</strong> {unidad.serieOImei}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Motivo de la baja *</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explicá el motivo (rotura irreparable, obsolescencia, desguace)..."
                rows={3}
                required
                className={inputClass}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                {guardando ? 'Confirmando…' : 'Confirmar baja'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ModalAsignar({ open, unidad, onClose }) {
  const [tipoAsignacion, setTipoAsignacion] = useState('PERSONA'); // 'PERSONA' | 'AREA'
  const [cantidadAsignar, setCantidadAsignar] = useState(1);
  const [responsable, setResponsable] = useState('');
  const [area, setArea] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { invalidarTodo } = useStockInvalidation();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');

  const opcionesArea =
    ubicCompItems.length > 0
      ? opcionesEnumCatalogo(ubicCompItems)
      : UBICACIONES_COMPUTADORA.map((k) => ({
          value: k,
          label: UBICACIONES_COMPUTADORA_LABELS[k] || k,
        }));

  useEffect(() => {
    if (open) {
      setTipoAsignacion('PERSONA');
      setCantidadAsignar(1);
      setResponsable('');
      setArea('');
      setMotivo('');
      setError('');
    }
  }, [open]);

  if (!open || !unidad) return null;

  const disponible = Math.max(1, unidad.cantidad ?? 1);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cantidadAsignar < 1 || cantidadAsignar > disponible) {
      setError(`La cantidad debe estar entre 1 y ${disponible}.`);
      return;
    }
    if (tipoAsignacion === 'PERSONA' && !responsable.trim()) {
      setError('El nombre del responsable es obligatorio.');
      return;
    }
    if (tipoAsignacion === 'AREA' && !area.trim()) {
      setError('Debe seleccionar el área / sector de destino.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await asignarUnidadStock(unidad.codigo, {
        asignacionTipo: tipoAsignacion,
        responsable: tipoAsignacion === 'PERSONA' ? responsable.trim() : null,
        area: area.trim(),
        motivo: motivo.trim(),
        cantidad: cantidadAsignar,
      });
      await invalidarTodo();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al asignar la unidad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-[#0c66e4]" />
              Asignar equipo {unidad.codigo}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-sm text-slate-700 space-y-1">
              <div>
                <strong>Equipo:</strong> {labelTipoStock(unidad.tipo)} {unidad.marca} {unidad.modelo}
              </div>
              {unidad.serieOImei && (
                <div>
                  <strong>Serie/IMEI:</strong> {unidad.serieOImei}
                </div>
              )}
            </div>

            {disponible > 1 && (
              <div>
                <label className={labelClass}>Cantidad a asignar (disponibles: {disponible})</label>
                <input
                  type="number"
                  min={1}
                  max={disponible}
                  value={cantidadAsignar}
                  onChange={(e) => setCantidadAsignar(parseInt(e.target.value, 10) || 1)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Selector Tipo Asignación */}
            <div>
              <label className={labelClass}>Destino de asignación</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTipoAsignacion('PERSONA')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoAsignacion === 'PERSONA'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  A Persona
                </button>
                <button
                  type="button"
                  onClick={() => setTipoAsignacion('AREA')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoAsignacion === 'AREA'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  A Área (uso común)
                </button>
              </div>
            </div>

            {tipoAsignacion === 'PERSONA' ? (
              <>
                <div>
                  <label className={labelClass}>Responsable *</label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre y Apellido del colaborador"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Área / Sector (opcional)</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar área…</option>
                    {opcionesArea.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className={labelClass}>Área / Sector de destino *</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Seleccionar área…</option>
                  {opcionesArea.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  El equipo quedará asignado para uso general de este sector, sin un custodio personal único.
                </p>
              </div>
            )}

            <div>
              <label className={labelClass}>Motivo / Observaciones (opcional)</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Reemplazo por falla, nuevo ingreso..."
                className={inputClass}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                {guardando ? 'Asignando…' : 'Confirmar asignación'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function ModalDevolver({ open, movimientoOUnidad, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [cantidadDevolver, setCantidadDevolver] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { invalidarTodo } = useStockInvalidation();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');

  useEffect(() => {
    if (open) {
      setMotivo('');
      setCantidadDevolver(Math.max(1, movimientoOUnidad?.cantidad ?? 1));
      setError('');
    }
  }, [open, movimientoOUnidad]);

  if (!open || !movimientoOUnidad) return null;

  const codigo = movimientoOUnidad.codigo;
  const asignadas = Math.max(1, movimientoOUnidad.cantidad ?? 1);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cantidadDevolver < 1 || cantidadDevolver > asignadas) {
      setError(`La cantidad debe estar entre 1 y ${asignadas}.`);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await devolverUnidadStock(codigo, { motivo: motivo.trim(), cantidad: cantidadDevolver });
      await invalidarTodo();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al devolver la unidad al depósito.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <CornerDownLeft className="w-4 h-4 text-[#0c66e4]" />
              Devolver {codigo} al depósito
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-sm text-slate-700 space-y-1">
              {movimientoOUnidad.responsable && (
                <div>
                  <strong>Responsable actual:</strong> {movimientoOUnidad.responsable}
                </div>
              )}
              {movimientoOUnidad.area && (
                <div>
                  <strong>Área:</strong> {labelUbicacion(movimientoOUnidad.area, ubicCompItems)}
                </div>
              )}
              {movimientoOUnidad.marca && (
                <div>
                  <strong>Equipo:</strong> {movimientoOUnidad.marca} {movimientoOUnidad.modelo}
                </div>
              )}
              <div className="text-xs text-slate-500 pt-1">
                La unidad pasará a estado <em>Sin Asignar</em> en depósito y quedará disponible para nueva asignación.
              </div>
            </div>

            <div>
              {asignadas > 1 && (
                <div className="mb-3">
                  <label className={labelClass}>Cantidad a devolver (asignadas: {asignadas})</label>
                  <input
                    type="number"
                    min={1}
                    max={asignadas}
                    value={cantidadDevolver}
                    onChange={(e) => setCantidadDevolver(parseInt(e.target.value, 10) || 1)}
                    className={inputClass}
                  />
                </div>
              )}
              <label className={labelClass}>Motivo de devolución (opcional)</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Fin de contrato, cambio de rol, devuelto en óptimas condiciones..."
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                {guardando ? 'Devolviendo…' : 'Devolver al depósito'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
