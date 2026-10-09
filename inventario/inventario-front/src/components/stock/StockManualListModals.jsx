import {
  Package, Check, X, UserCheck, Edit2, Trash2, Layers,
  ArrowUpRight, MapPin, Plus, Router, Archive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ArmarComboModal from '../ArmarComboModal';
import StockPcLoteFormFields from '../StockPcLoteFormFields';
import FriendlySelect from '../FriendlySelect';
import { normalizarTipoStock, esTipoInfra, labelTipoStock } from '../../constants/tiposStock';

const INFRA_TIPOS_FALLBACK = [
  { codigo: 'router', label: 'Router' },
  { codigo: 'switch', label: 'Switch' },
  { codigo: 'access_point', label: 'Access Point' },
  { codigo: 'telefono_ip', label: 'Teléfono IP' },
  { codigo: 'camara_ip', label: 'Cámara IP' },
];

function opcionesInfra(catalogoItems) {
  const codigos = new Set(catalogoItems.map(i => normalizarTipoStock(i.codigo)));
  const extras = INFRA_TIPOS_FALLBACK
    .filter(f => !codigos.has(f.codigo))
    .map((f, i) => ({ ...f, activo: true, orden: 900 + i }));
  return [...catalogoItems, ...extras].filter(t => esTipoInfra(t.codigo));
}
import { opcionesCatalogo, opcionesEnumCatalogo } from '../../hooks/useCatalogo';
import { etiquetaFromItem, UBICACION_DEPOSITO_DEFAULT } from '../../utils/stockPcHelpers';
import { getUbicacionStock } from '../../utils/stockListHelpers';
import { opcionesPcAsignable } from '../../utils/perifericoPcHelpers';

export default function StockManualListModals({
  itemForm,
  comboForm,
  pcModals,
  tiposStockCatalogo,
  tiposEquipoItems,
  condicionesItems,
  ubicCompItems,
  pcsAsignables,
  unidadesFiltradas,
  setPcsStock,
  setTodasPcs,
}) {
  const opcionesPcAsignacion = opcionesPcAsignable(pcsAsignables);

  return (
    <>
      <AnimatePresence>
        {pcModals.asignarPc && (
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
                  Asignar {pcModals.asignarPc.hostname || pcModals.asignarPc.uuid?.slice(0, 8)}
                </span>
                <button type="button" onClick={() => pcModals.setAsignarPc(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
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
                    value={pcModals.asignarA}
                    onChange={(e) => pcModals.setAsignarA(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Nuevo ingreso, reemplazo..."
                    value={pcModals.asignarMotivo}
                    onChange={(e) => pcModals.setAsignarMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => pcModals.setAsignarPc(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={pcModals.handleAsignar}
                    disabled={!pcModals.asignarA.trim() || pcModals.asignando}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {pcModals.asignando ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pcModals.asignarPeriferico && (
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
                  Asignar {pcModals.asignarPeriferico.nombre || 'periférico'}
                </span>
                <button type="button" onClick={() => pcModals.setAsignarPeriferico(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-medium">
                  Vincula 1 unidad del stock a una computadora del inventario. Si hay más de 1 en stock, se descuenta del lote automáticamente.
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">Computadora *</label>
                  {pcsAsignables.length === 0 ? (
                    <p className="text-amber-700 font-medium">No hay computadoras disponibles para asignar.</p>
                  ) : (
                    <FriendlySelect
                      name="pcUuidAsignarPerif"
                      value={pcModals.pcUuidAsignar}
                      placeholder="Seleccionar PC…"
                      options={opcionesPcAsignacion}
                      onChange={pcModals.setPcUuidAsignar}
                    />
                  )}
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Reemplazo, alta de puesto..."
                    value={pcModals.motivoAsignarPerif}
                    onChange={(e) => pcModals.setMotivoAsignarPerif(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => pcModals.setAsignarPeriferico(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={pcModals.handleAsignarPeriferico}
                    disabled={!pcModals.pcUuidAsignar.trim() || pcModals.asignandoPerif || pcsAsignables.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {pcModals.asignandoPerif ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pcModals.asignarDesdeListaOpen && (
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
                <button type="button" onClick={() => pcModals.setAsignarDesdeListaOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Buscar por hostname..."
                  value={pcModals.buscarUnidad}
                  onChange={(e) => pcModals.setBuscarUnidad(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {unidadesFiltradas.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">No hay computadoras disponibles en depósito.</div>
                ) : (
                  unidadesFiltradas.map(pc => (
                    <button
                      key={pc.uuid}
                      type="button"
                      onClick={() => {
                        pcModals.setAsignarDesdeListaOpen(false);
                        pcModals.openAsignarPc(pc);
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900">{pc.hostname || pc.uuid?.slice(0, 8)}</span>
                        <span className="text-xs text-slate-400 ml-2">{pc.sistemaOperativo || ''}</span>
                        {getUbicacionStock(pc) && (
                          <span className="text-xs text-slate-500 ml-2 inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getUbicacionStock(pc)}
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

      <AnimatePresence>
        {comboForm.isComboOpen && (
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
                <button type="button" onClick={() => comboForm.setIsComboOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={comboForm.handleSubmitCombo} className="p-5 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
                {comboForm.comboError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {comboForm.comboError}
                  </div>
                )}
                <div>
                  <label className="text-slate-700 block mb-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Combo Logitech MK270"
                    value={comboForm.comboNombre}
                    onChange={(e) => comboForm.setComboNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Ubicación (compartida)</label>
                  <input
                    type="text"
                    placeholder="Ej. Depósito 1"
                    value={comboForm.comboUbicacion}
                    onChange={(e) => comboForm.setComboUbicacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700">Items del combo ({comboForm.comboItems.length})</label>
                    <button
                      type="button"
                      onClick={comboForm.handleAddComboItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {' '}
                      Agregar item
                    </button>
                  </div>
                  {comboForm.comboItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Item
                          {' '}
                          {idx + 1}
                        </span>
                        {comboForm.comboItems.length > 2 && (
                          <button type="button" onClick={() => comboForm.handleRemoveComboItem(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
                            onChange={(e) => comboForm.handleComboItemChange(idx, 'tipo', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          >
                            {opcionesCatalogo(tiposStockCatalogo, item.tipo).map(t => (
                              <option key={t.codigo} value={t.codigo}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Nombre</label>
                          <input
                            type="text"
                            placeholder="Ej. K120"
                            value={item.nombre}
                            onChange={(e) => comboForm.handleComboItemChange(idx, 'nombre', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Fabricante</label>
                          <input
                            type="text"
                            placeholder="Ej. Logitech"
                            value={item.fabricante}
                            onChange={(e) => comboForm.handleComboItemChange(idx, 'fabricante', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => comboForm.handleComboItemChange(idx, 'cantidad', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => comboForm.setIsComboOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={comboForm.creandoCombo}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {comboForm.creandoCombo ? 'Creando...' : 'Crear Combo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemForm.isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  {itemForm.editingItem ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                  <span>
                    {itemForm.editingItem
                      ? (itemForm.formModeLotePc ? 'Modificar ítem de stock' : 'Modificar suministro')
                      : (itemForm.formModeLotePc ? 'Cargar stock de PC' : 'Registrar Nueva Adquisición IT')}
                  </span>
                </span>
                <button type="button" onClick={itemForm.closeForm} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form key={itemForm.editingItem?.id ?? 'nuevo'} onSubmit={itemForm.handleSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                {itemForm.formCargando && (
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold">
                    Cargando datos guardados…
                  </div>
                )}
                {itemForm.formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {itemForm.formError}
                  </div>
                )}
                {itemForm.formModeLotePc ? (
                  <StockPcLoteFormFields
                    cpu={itemForm.formCpu}
                    onCpuChange={itemForm.setFormCpu}
                    ram={itemForm.formRam}
                    onRamChange={itemForm.setFormRam}
                    disco={itemForm.formDisco}
                    onDiscoChange={itemForm.setFormDisco}
                    tipoEquipo={itemForm.formTipoEquipo}
                    onTipoEquipoChange={itemForm.setFormTipoEquipo}
                    condicion={itemForm.formCondicion}
                    onCondicionChange={itemForm.setFormCondicion}
                    descripcion={itemForm.formNombre}
                    onDescripcionChange={itemForm.setFormNombre}
                    fabricante={itemForm.formFabricante}
                    onFabricanteChange={itemForm.setFormFabricante}
                    ubicacionDeposito={itemForm.formUbicacion}
                    onUbicacionDepositoChange={itemForm.setFormUbicacion}
                    cantidad={itemForm.formCantidad}
                    onCantidadChange={itemForm.setFormCantidad}
                    etiqueta={itemForm.formSpecPreview}
                    tiposEquipoItems={tiposEquipoItems}
                    condicionesItems={condicionesItems}
                    showIntroBanner={!itemForm.editingItem}
                    disabled={itemForm.formCargando}
                  />
                ) : (
                  <div>
                    <label className="text-slate-700 block mb-1">Nombre Comercial de Hardware / Software *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Memoria RAM DDR5 32GB 4800MHz"
                      value={itemForm.formNombre}
                      onChange={(e) => itemForm.setFormNombre(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                )}
                {!itemForm.formModeLotePc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 block mb-1">Categoría (Tipo)</label>
                      <select
                        required
                        value={itemForm.formTipo}
                        onChange={(e) => itemForm.setFormTipo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        {(esTipoInfra(itemForm.formTipo)
                          ? opcionesInfra(tiposStockCatalogo)
                          : opcionesCatalogo(tiposStockCatalogo, itemForm.formTipo)
                              .filter(t => normalizarTipoStock(t.codigo) !== 'computadora' && !esTipoInfra(t.codigo))
                        ).map(t => (
                          <option key={t.codigo} value={t.codigo}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Fabricante (Marca)</label>
                      <input
                        type="text"
                        placeholder="Ej. Logitech, Dell, AMD"
                        value={itemForm.formFabricante}
                        onChange={(e) => itemForm.setFormFabricante(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                {!itemForm.formModeLotePc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 block mb-1">Conexión</label>
                      <input
                        type="text"
                        placeholder="Ej. USB, Bluetooth"
                        value={itemForm.formConexion}
                        onChange={(e) => itemForm.setFormConexion(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">
                        Número de serie
                        {normalizarTipoStock(itemForm.formTipo) === 'monitor' && (
                          <span className="text-teal-700 font-normal normal-case"> (recomendado para matching con agente)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. SN123456789"
                        value={itemForm.formNumeroSerie}
                        onChange={(e) => itemForm.setFormNumeroSerie(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Ubicación (depósito)</label>
                      <input
                        type="text"
                        placeholder={UBICACION_DEPOSITO_DEFAULT}
                        value={itemForm.formUbicacion}
                        onChange={(e) => itemForm.setFormUbicacion(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 block mb-1">Cantidad *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={itemForm.formCantidad}
                        onChange={(e) => itemForm.setFormCantidad(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {itemForm.editingItem && (
                      <button
                        type="button"
                        onClick={() => itemForm.handleDelete(itemForm.editingItem.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={itemForm.closeForm} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={itemForm.formCargando}
                      className={`px-5 py-2 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                        itemForm.formModeLotePc ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{itemForm.editingItem ? 'Guardar cambios' : 'Confirmar Registro'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pcModals.sacarUnidadLote && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-teal-600" />
                  Sacar 1 unidad del stock
                </span>
                <button type="button" onClick={() => pcModals.setSacarUnidadLote(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-[11px] font-semibold">
                  Se crea una <strong>computadora trazable</strong> con las specs del lote y se resta 1 unidad del stock.
                  Quedará en la pestaña <strong>Computadoras</strong> lista para armar combo.
                </div>
                <div>
                  <p className="text-slate-500 font-medium mb-1">Lote</p>
                  <p className="text-slate-900">{pcModals.sacarUnidadLote.nombre || '—'}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{etiquetaFromItem(pcModals.sacarUnidadLote) || '—'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Disponibles:
                    {' '}
                    {pcModals.sacarUnidadLote.cantidad ?? 1}
                  </p>
                </div>
                {pcModals.sacarUnidadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {pcModals.sacarUnidadError}
                  </div>
                )}
                <div>
                  <label className="text-slate-700 block mb-1">Hostname *</label>
                  <input
                    type="text"
                    required
                    value={pcModals.sacarUnidadHostname}
                    onChange={(e) => pcModals.setSacarUnidadHostname(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej. Preparación de entrega"
                    value={pcModals.sacarUnidadMotivo}
                    onChange={(e) => pcModals.setSacarUnidadMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => pcModals.setSacarUnidadLote(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={pcModals.handleConfirmSacarUnidad}
                    disabled={!pcModals.sacarUnidadHostname.trim() || pcModals.sacandoUnidad}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {pcModals.sacandoUnidad ? 'Creando…' : 'Sacar unidad'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pcModals.asignarUbicItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Asignar ubicación — {pcModals.asignarUbicItem.nombre || 'equipo'}
                </span>
                <button type="button" onClick={() => pcModals.setAsignarUbicItem(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-medium">
                  Asigná este equipo de stock a una ubicación física (rack, oficina, sucursal).
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">Ubicación *</label>
                  <FriendlySelect
                    options={opcionesEnumCatalogo(ubicCompItems)}
                    value={pcModals.asignarUbicNueva}
                    onChange={pcModals.setAsignarUbicNueva}
                    placeholder="Seleccionar ubicación…"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Instalación nueva, reemplazo…"
                    value={pcModals.asignarUbicMotivo}
                    onChange={(e) => pcModals.setAsignarUbicMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => pcModals.setAsignarUbicItem(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={pcModals.handleAsignarUbicacion}
                    disabled={!pcModals.asignarUbicNueva.trim() || pcModals.asignandoUbic}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {pcModals.asignandoUbic ? 'Asignando…' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemForm.bajaItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-rose-600" />
                  Dar de baja 1 — {itemForm.bajaItem.nombre || 'ítem'}
                </span>
                <button type="button" onClick={() => itemForm.setBajaItem(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-medium">
                  Se descuenta 1 unidad del stock. Esa unidad pasa a la pestaña Bajas.
                  {(itemForm.bajaItem.cantidad ?? 1) > 1
                    ? ' El resto de la fila sigue disponible.'
                    : ' Es la última unidad de la fila.'}
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Roto, extraviado, fuera de uso…"
                    value={itemForm.bajaMotivo}
                    onChange={(e) => itemForm.setBajaMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => itemForm.setBajaItem(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={itemForm.handleConfirmarBajaUnidad}
                    disabled={!itemForm.bajaMotivo.trim() || itemForm.bajando}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {itemForm.bajando ? 'Dando de baja…' : 'Dar de baja 1'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {pcModals.armarPc && (
        <ArmarComboModal
          computadora={pcModals.armarPc}
          onClose={() => pcModals.setArmarPc(null)}
          onSuccess={(updated) => {
            if (updated?.uuid) {
              setPcsStock(prev => prev.map(p => (p.uuid === updated.uuid ? { ...p, ...updated } : p)));
              setTodasPcs(prev => prev.map(p => (p.uuid === updated.uuid ? { ...p, ...updated } : p)));
            }
            pcModals.setArmarPc(null);
          }}
        />
      )}
    </>
  );
}
