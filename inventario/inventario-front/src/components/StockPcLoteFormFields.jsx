import { opcionesEnumCatalogo } from '../hooks/useCatalogo';
import { UBICACION_DEPOSITO_DEFAULT } from '../utils/stockPcHelpers';
import { stockInputClass, stockSelectClass } from '../utils/stockFormStyles';

const ACCENT = 'teal';

/**
 * Campos unificados para alta/edición de lotes de PC (contabilidad por cantidad).
 * La etiqueta (CPU + RAM + disco) es automática; la descripción es texto libre aparte.
 */
export default function StockPcLoteFormFields({
  cpu,
  onCpuChange,
  ram,
  onRamChange,
  disco,
  onDiscoChange,
  tipoEquipo,
  onTipoEquipoChange,
  condicion,
  onCondicionChange,
  descripcion,
  onDescripcionChange,
  etiqueta,
  fabricante,
  onFabricanteChange,
  ubicacionDeposito,
  onUbicacionDepositoChange,
  cantidad,
  onCantidadChange,
  tiposEquipoItems,
  condicionesItems,
  showIntroBanner = false,
  hideFabricante = false,
  cantidadReadonly = false,
  disabled = false,
}) {
  const inputCls = stockInputClass(ACCENT);
  const selectCls = stockSelectClass(ACCENT);
  const tipoOpts = opcionesEnumCatalogo(tiposEquipoItems);
  const condOpts = opcionesEnumCatalogo(condicionesItems);

  return (
    <>
      {showIntroBanner && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-[11px] font-semibold">
          Contabilidad por cantidad. La <strong>etiqueta</strong> se arma sola con CPU y RAM.
          La <strong>descripción</strong> es opcional y queda aparte (ej. uso, lote de compra).
        </div>
      )}

      <div>
        <label className="text-slate-700 block mb-1">Etiqueta</label>
        <div className="px-3 py-2 border border-teal-200 bg-teal-50 rounded-lg text-teal-900 text-sm font-semibold min-h-[38px] flex items-center">
          {etiqueta || <span className="text-teal-600/70 font-normal text-xs">Completá CPU y RAM para generar la etiqueta</span>}
        </div>
      </div>

      <div>
        <label className="text-slate-700 block mb-1">Descripción</label>
        <input
          type="text"
          disabled={disabled}
          placeholder="Ej. PC CLON usada — lote compra marzo"
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          className={inputCls}
        />
        <p className="text-[10px] text-slate-400 font-medium mt-1">
          Texto libre, independiente de la etiqueta de hardware.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-slate-700 block mb-1">Procesador (CPU) *</label>
          <input
            type="text"
            required
            disabled={disabled}
            placeholder="Ej. Ryzen 5 5600G"
            value={cpu}
            onChange={(e) => onCpuChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">RAM (GB) *</label>
          <input
            type="number"
            min="1"
            required
            disabled={disabled}
            placeholder="8"
            value={ram}
            onChange={(e) => onRamChange(e.target.value)}
            className={stockInputClass(ACCENT, { mono: true })}
          />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">Disco</label>
          <input
            type="text"
            disabled={disabled}
            placeholder="Ej. SSD 256 GB"
            value={disco}
            onChange={(e) => onDiscoChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">Tipo de equipo</label>
          <select
            disabled={disabled}
            value={tipoEquipo}
            onChange={(e) => onTipoEquipoChange(e.target.value)}
            className={selectCls}
          >
            <option value="">Sin definir</option>
            {tipoOpts.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-700 block mb-1">Condición</label>
          <select
            disabled={disabled}
            value={condicion}
            onChange={(e) => onCondicionChange(e.target.value)}
            className={selectCls}
          >
            <option value="">Sin definir</option>
            {condOpts.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!hideFabricante && (
        <div>
          <label className="text-slate-700 block mb-1">Fabricante (Marca)</label>
          <input
            type="text"
            disabled={disabled}
            placeholder="Ej. AMD, Intel, Dell"
            value={fabricante}
            onChange={(e) => onFabricanteChange(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-700 block mb-1">Ubicación (depósito)</label>
          <input
            type="text"
            disabled={disabled}
            placeholder={UBICACION_DEPOSITO_DEFAULT}
            value={ubicacionDeposito}
            onChange={(e) => onUbicacionDepositoChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-slate-700 block mb-1">Cantidad *</label>
          <input
            type="number"
            min="1"
            required
            readOnly={cantidadReadonly}
            disabled={disabled || cantidadReadonly}
            value={cantidad}
            onChange={(e) => onCantidadChange(e.target.value)}
            className={cantidadReadonly
              ? stockInputClass(ACCENT, { readonly: true, mono: true })
              : stockInputClass(ACCENT, { mono: true })}
          />
        </div>
      </div>
    </>
  );
}
