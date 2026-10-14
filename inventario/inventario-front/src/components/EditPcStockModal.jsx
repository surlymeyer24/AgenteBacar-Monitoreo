import { Check, Edit2, Laptop, Trash2, Warehouse, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ComputadoraStockFormFields from './ComputadoraStockFormFields';
import StockPcLoteFormFields from './StockPcLoteFormFields';

/**
 * Modal unificado para crear o editar computadoras trazables en stock.
 * Modo edit: mismo formulario teal que "Modificar ítem de stock" (lotes).
 * Modo create: alta con hostname (ComputadoraStockFormFields).
 */
export default function EditPcStockModal({
  open,
  mode = 'edit',
  pc,
  cargando = false,
  error,
  // create mode
  hostname,
  onHostnameChange,
  especificacionEsperada,
  sistemaOperativo,
  onSistemaOperativoChange,
  ubicacionSede,
  onUbicacionSedeChange,
  motivo,
  onMotivoChange,
  // edit mode (lote-style fields)
  formCpu,
  onFormCpuChange,
  formRam,
  onFormRamChange,
  formDisco,
  onFormDiscoChange,
  formDescripcion,
  onFormDescripcionChange,
  formSpecPreview,
  formCantidad = '1',
  // shared
  tipoEquipo,
  onTipoEquipoChange,
  condicion,
  onCondicionChange,
  ubicacionDeposito,
  onUbicacionDepositoChange,
  tiposEquipoItems,
  condicionesItems,
  ubicCompItems,
  yaEnDeposito = false,
  motivoIngreso,
  onMotivoIngresoChange,
  guardando = false,
  eliminando = false,
  ingresando = false,
  onGuardar,
  onIngresarStock,
  onEliminar,
  onClose,
  guardarDisabled = false,
  guardarLabel,
}) {
  const isCreate = mode === 'create';
  const visible = open && (isCreate || pc);
  const formDisabled = cargando || ingresando || guardando || eliminando;

  const titulo = isCreate
    ? 'Nueva computadora'
    : 'Modificar ítem de stock';

  const primaryLabel = guardarLabel ?? (isCreate ? 'Agregar al Stock' : 'Guardar cambios');

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                {isCreate ? (
                  <Laptop className="w-4 h-4 text-blue-600" />
                ) : (
                  <Edit2 className="w-4 h-4 text-teal-600" />
                )}
                {titulo}
              </span>
              <button type="button" onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
              {isCreate && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] font-semibold">
                  Alta de una PC con hostname y UUID. Podés armar combo y conciliar con AgenteBacar.
                  Para contar stock sin hostname (ej. 3× Ryzen), usá la pestaña <strong>Stock de PCs</strong>.
                </div>
              )}
              {cargando && (
                <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold">
                  Cargando datos guardados…
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                  {error}
                </div>
              )}
              {isCreate ? (
                <ComputadoraStockFormFields
                  hostname={hostname ?? ''}
                  onHostnameChange={onHostnameChange}
                  hostnameRequired
                  especificacionEsperada={especificacionEsperada}
                  sistemaOperativo={sistemaOperativo}
                  onSistemaOperativoChange={onSistemaOperativoChange}
                  ubicacionSede={ubicacionSede}
                  onUbicacionSedeChange={onUbicacionSedeChange}
                  tipoEquipo={tipoEquipo}
                  onTipoEquipoChange={onTipoEquipoChange}
                  condicion={condicion}
                  onCondicionChange={onCondicionChange}
                  ubicacionDeposito={ubicacionDeposito}
                  onUbicacionDepositoChange={onUbicacionDepositoChange}
                  motivo={motivo}
                  onMotivoChange={onMotivoChange}
                  showMotivo
                  tiposEquipoItems={tiposEquipoItems}
                  condicionesItems={condicionesItems}
                  ubicCompItems={ubicCompItems}
                  accent="blue"
                  disabled={formDisabled}
                />
              ) : (
                <StockPcLoteFormFields
                  cpu={formCpu}
                  onCpuChange={onFormCpuChange}
                  ram={formRam}
                  onRamChange={onFormRamChange}
                  disco={formDisco}
                  onDiscoChange={onFormDiscoChange}
                  tipoEquipo={tipoEquipo}
                  onTipoEquipoChange={onTipoEquipoChange}
                  condicion={condicion}
                  onCondicionChange={onCondicionChange}
                  descripcion={formDescripcion}
                  onDescripcionChange={onFormDescripcionChange}
                  etiqueta={formSpecPreview}
                  ubicacionDeposito={ubicacionDeposito}
                  onUbicacionDepositoChange={onUbicacionDepositoChange}
                  cantidad={formCantidad}
                  onCantidadChange={() => {}}
                  tiposEquipoItems={tiposEquipoItems}
                  condicionesItems={condicionesItems}
                  hideFabricante
                  cantidadReadonly
                  disabled={formDisabled}
                />
              )}
              {!isCreate && !yaEnDeposito && (
                <div>
                  <label className="text-slate-700 block mb-1">Motivo del ingreso</label>
                  <input
                    type="text"
                    value={motivoIngreso}
                    onChange={(e) => onMotivoIngresoChange(e.target.value)}
                    disabled={formDisabled}
                    placeholder="Ej. Devolución desde usuario"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              )}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isCreate && onEliminar && (
                    <button
                      type="button"
                      onClick={onEliminar}
                      disabled={formDisabled}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                  {!isCreate && !yaEnDeposito && onIngresarStock && (
                    <button
                      type="button"
                      onClick={onIngresarStock}
                      disabled={formDisabled}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Warehouse className="w-4 h-4" />
                      {ingresando ? 'Ingresando...' : 'Ingresar a stock'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={onGuardar}
                    disabled={guardarDisabled || formDisabled}
                    className={`px-5 py-2 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isCreate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {guardando ? (isCreate ? 'Creando...' : 'Guardando...') : primaryLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
