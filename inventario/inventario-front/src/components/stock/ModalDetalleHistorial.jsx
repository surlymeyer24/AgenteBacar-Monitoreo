import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  UserCheck,
  CornerDownLeft,
  PlusCircle,
  Trash2,
  RotateCcw,
  Package,
  Laptop,
  Cpu,
  Network,
  Smartphone,
  MapPin,
  User,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { fetchHistorialMovimientos, fetchUnidadStock } from '../../api/stockApi';
import { labelTipoStock } from '../../constants/tiposStock';
import { labelUbicacion } from '../../constants/ubicaciones';
import { useCatalogo } from '../../hooks/useCatalogo';
import { formatearNombreEquipo } from '../../utils/stockListHelpers';

function getIconForTipo(tipo) {
  const t = (tipo || '').toLowerCase();
  if (['desktop', 'notebook', 'pc', 'computadora'].includes(t)) return Laptop;
  if (['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono'].includes(t)) return Cpu;
  if (['router', 'switch', 'access_point', 'camara', 'televisor'].includes(t)) return Network;
  if (t === 'celular') return Smartphone;
  return Package;
}

function getBadgeEstado(estado) {
  const e = (estado || '').toUpperCase();
  if (e === 'ASIGNADA' || e === 'ACTIVA') return { label: 'Asignada', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (e === 'EN_DEPOSITO' || e === 'DISPONIBLE' || e === 'SIN_ASIGNAR') return { label: 'En Depósito', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (e === 'EN_MANTENIMIENTO' || e === 'REPARACION') return { label: 'En Mantenimiento', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (e === 'BAJA') return { label: 'Baja', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  return { label: estado || '—', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function formatFecha(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return str;
  }
}

function getMovimientoIcono(accion) {
  const a = (accion || '').toLowerCase();
  if (a.includes('asig') || a.includes('entrega')) return { icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (a.includes('devol') || a.includes('retorno')) return { icon: CornerDownLeft, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (a.includes('alta') || a.includes('ingreso')) return { icon: PlusCircle, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  if (a.includes('baja') || a.includes('scrap')) return { icon: Trash2, color: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (a.includes('reactiv')) return { icon: RotateCcw, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' };
}

export default function ModalDetalleHistorial({ open, onClose, item }) {
  const [historial, setHistorial] = useState([]);
  const [unidad, setUnidad] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');

  const codigo = item?.codigo || item?.codigoInterno || item?.id;

  useEffect(() => {
    if (!open || !codigo) {
      setHistorial([]);
      setUnidad(null);
      setErrorHistorial('');
      return;
    }

    let activo = true;
    setCargando(true);
    setErrorHistorial('');

    fetchHistorialMovimientos(codigo)
      .then((data) => {
        if (activo) {
          setHistorial(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (activo) {
          setErrorHistorial(err.message || 'No se pudo cargar el historial');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    fetchUnidadStock(codigo)
      .then((data) => {
        if (activo && data) {
          setUnidad(data);
        }
      })
      .catch((err) => {
        // Fallback silencioso a los datos del item
        console.warn('No se pudo cargar la unidad completa de stock:', err);
      });

    return () => {
      activo = false;
    };
  }, [open, codigo]);

  if (!open || !item) return null;

  const datos = { ...item, ...(unidad || {}) };
  const IconoTipo = getIconForTipo(datos.tipo || datos.tipoEquipo);
  const badgeEstado = getBadgeEstado(datos.estado || datos.estadoDeposito);
  const nombreEquipo = formatearNombreEquipo(datos);

  const marcaLimpia = (datos.marca || '').trim();
  const modeloLimpio = (datos.modelo || '').trim();
  let marcaModelo = [marcaLimpia, modeloLimpio].filter(Boolean).join(' ');
  if (marcaLimpia && modeloLimpio && marcaLimpia.toLowerCase() === modeloLimpio.toLowerCase()) {
    marcaModelo = marcaLimpia;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700">
                <IconoTipo className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 font-mono tracking-tight">{codigo}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeEstado.cls}`}>
                    {badgeEstado.label}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {labelTipoStock(datos.tipo || datos.tipoEquipo)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{nombreEquipo}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Ficha técnica actual */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Ficha del Activo
              </div>

              {datos.descripcionCompleta && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                    Especificación de Stock
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {datos.descripcionCompleta}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Marca / Modelo</span>
                  <span className="font-semibold text-slate-800">{marcaModelo || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">N° Serie / IMEI</span>
                  <span className="font-mono text-slate-700">{datos.serieOImei || datos.serialEquipo || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Cantidad</span>
                  <span className="font-medium text-slate-700">
                    {datos.cantidad ?? 1}
                    {datos.loteOrigen ? ` · lote ${datos.loteOrigen}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Condición</span>
                  <span className="font-medium text-slate-700">{datos.condicion || 'USADA'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Ubicación Actual</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {labelUbicacion(datos.ubicacion || datos.area, ubicCompItems) || datos.ubicacion || datos.area || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Responsable / Área</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {datos.responsable || datos.responsableNombre ? (
                      <>
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        {datos.responsable || datos.responsableNombre}
                      </>
                    ) : datos.area ? (
                      <>
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        {labelUbicacion(datos.area, ubicCompItems) || datos.area}
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Fecha Ingreso</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    {formatFecha(datos.fechaIngreso || datos.fechaAlta || datos.createdAt)}
                  </span>
                </div>
              </div>

              {(datos.comentarios || datos.notas) && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <span className="text-slate-400 font-medium">Notas: </span>
                  {datos.comentarios || datos.notas}
                </div>
              )}
            </div>

            {/* Apartado de Historial */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Historial de Movimientos y Asignaciones
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {historial.length} {historial.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {cargando ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Cargando bitácora de movimientos…
                </div>
              ) : errorHistorial ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorHistorial}
                </div>
              ) : historial.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No hay movimientos registrados para esta unidad en la bitácora.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historial.map((m, idx) => {
                    const badge = getMovimientoIcono(m.accion);
                    const IconoAccion = badge.icon;
                    return (
                      <div key={m.id || idx} className="relative group">
                        {/* Dot icono */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center shadow-xs ${badge.color}`}
                        >
                          <IconoAccion className="w-2.5 h-2.5" />
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {m.accion || 'Movimiento'}
                              {(m.cantidad ?? 1) > 1 ? ` x${m.cantidad}` : ''}
                              {m.loteOrigen && m.codigo !== m.loteOrigen ? ` · ${m.codigo}` : ''}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{formatFecha(m.fecha)}</span>
                          </div>

                          {(m.responsable || m.area) && (
                            <div className="text-xs text-slate-700 mt-1 flex items-center gap-1.5 flex-wrap">
                              {m.responsable && (
                                <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {m.responsable}
                                </span>
                              )}
                              {m.area && (
                                <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  {labelUbicacion(m.area, ubicCompItems) || m.area}
                                </span>
                              )}
                            </div>
                          )}

                          {m.motivo && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                              "{m.motivo}"
                            </div>
                          )}

                          {m.actorUid && (
                            <div className="text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span>Registrado por: <strong className="text-slate-600">{m.actorUid}</strong></span>
                              {m.estado && (
                                <span className="font-semibold text-slate-500 uppercase">{m.estado}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
