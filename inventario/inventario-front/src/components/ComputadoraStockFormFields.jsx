import { opcionesEnumCatalogo } from '../hooks/useCatalogo';
import { UBICACION_DEPOSITO_DEFAULT, formatSpecResumen } from '../utils/stockPcHelpers';
import { stockInputClass, stockSelectClass } from '../utils/stockFormStyles';

/**
 * Campos unificados para alta/edición de computadoras trazables en stock.
 * Mismo orden y etiquetas en crear y editar.
 */
export default function ComputadoraStockFormFields({
  hostname,
  onHostnameChange,
  hostnameReadonly = false,
  hostnameRequired = false,
  especificacionEsperada,
  sistemaOperativo,
  onSistemaOperativoChange,
  ubicacionSede,
  onUbicacionSedeChange,
  tipoEquipo,
  onTipoEquipoChange,
  condicion,
  onCondicionChange,
  ubicacionDeposito,
  onUbicacionDepositoChange,
  motivo,
  onMotivoChange,
  showMotivo = false,
  tiposEquipoItems,
  condicionesItems,
  ubicCompItems,
  accent = 'blue',
  disabled = false,
}) {
  const inputCls = stockInputClass(accent);
  const selectCls = stockSelectClass(accent);
  const tipoOpts = opcionesEnumCatalogo(tiposEquipoItems);
  const condOpts = opcionesEnumCatalogo(condicionesItems);
  const sedeOpts = opcionesEnumCatalogo(ubicCompItems);
  const spec = especificacionEsperada;
  const tieneSpec = spec && (spec.cpuModelo || spec.ramTotalGb || spec.discoResumen);

  return (
    <>
      <div>
        <label className="text-slate-700 block mb-1">
          Hostname{hostnameRequired ? ' *' : ''}
        </label>
        <input
          type="text"
          required={hostnameRequired && !hostnameReadonly}
          readOnly={hostnameReadonly}
          disabled={disabled && !hostnameReadonly}
          placeholder="Ej: PC-ADMIN-01"
          value={hostname}
          onChange={(e) => onHostnameChange?.(e.target.value)}
          className={hostnameReadonly ? stockInputClass(accent, { readonly: true }) : inputCls}
        />
      </div>

      {tieneSpec && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Especificación de hardware
          </p>
          <p className="text-[11px] text-slate-700 font-semibold">{formatSpecResumen(spec)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            {spec.cpuModelo && (
              <div>
                <span className="text-slate-400 block">CPU</span>
                <span className="text-slate-800 font-semibold">{spec.cpuModelo}</span>
              </div>
            )}
            {spec.ramTotalGb != null && spec.ramTotalGb > 0 && (
              <div>
                <span className="text-slate-400 block">RAM</span>
                <span className="text-slate-800 font-semibold">{spec.ramTotalGb} GB</span>
              </div>
            )}
            {spec.discoResumen && (
              <div>
                <span className="text-slate-400 block">Disco</span>
                <span className="text-slate-800 font-semibold">{spec.discoResumen}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div>
        <label className="text-slate-700 block mb-1">Sistema operativo</label>
        <input
          type="text"
          disabled={disabled}
          placeholder="Ej: Windows 11 Pro"
          value={sistemaOperativo}
          onChange={(e) => onSistemaOperativoChange(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-700 block mb-1">Ubicación (sede)</label>
          <select
            disabled={disabled}
            value={ubicacionSede}
            onChange={(e) => onUbicacionSedeChange(e.target.value)}
            className={selectCls}
          >
            <option value="">Sin definir</option>
            {sedeOpts.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
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
      </div>

      {showMotivo && (
        <div>
          <label className="text-slate-700 block mb-1">Motivo</label>
          <input
            type="text"
            disabled={disabled}
            placeholder="Ej: Compra nueva, donación..."
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            className={inputCls}
          />
        </div>
      )}
    </>
  );
}
