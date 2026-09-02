import WriteGate from './WriteGate';
import { DetailSection } from './DetailOverlayShell';
import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';

export function fmtFechaIso(s) {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR');
}

export function fmtFechaAlta(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v);
}

export function toFechaAltaIso(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return '';
}

function labelEstado(raw) {
  if (raw == null || raw === '') return '—';
  const key = String(raw).trim();
  return ESTADO_OPERATIVO_LABELS[key] ?? key;
}

function badgeEstadoClass(raw, activo) {
  const e = String(raw ?? '').toUpperCase().replace(/\s+/g, '_');
  if (e.includes('BAJA') || e.includes('INACTIV')) return 'bg-red-50 text-red-700 border-red-200';
  if (e.includes('MANTEN')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (e.includes('ASIGNAD') || e.includes('ACTIV') || e.includes('OPERATIV')) {
    return activo
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  }
  if (e.includes('SIN_ASIGNAR') || e.includes('SIN ASIGNAR')) {
    return activo
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  }
  return activo
    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';
}

/** Grilla de campos clave/valor para el body del overlay. */
export function DetailFieldGrid({ fields }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {fields.map(({ label, value, mono, fullWidth }) => (
        <div key={label} className={fullWidth ? 'sm:col-span-2' : undefined}>
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</dt>
          <dd className={`text-slate-800 mt-0.5 font-semibold break-all ${mono ? 'font-mono' : ''}`}>
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function HistorialEstadosSection({ historial = [] }) {
  return (
    <DetailSection title="Historial de estados (IT)">
      {historial.length === 0 ? (
        <p className="text-sm text-slate-500">Sin cambios de estado registrados</p>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[36rem]">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200">
                  <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Motivo</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">Inicio</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">Fin</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {historial.map((h, i) => {
                  const activo = !!h.activo;
                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${activo ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${badgeEstadoClass(h.estado, activo)}`}
                        >
                          {labelEstado(h.estado)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-sm text-slate-700 font-medium max-w-[18rem]">
                        <span className="line-clamp-2">{h.motivo?.trim() ? h.motivo : '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                          {fmtFechaIso(h.fechaHoraInicio)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {h.fechaHoraFin ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                            {fmtFechaIso(h.fechaHoraFin)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm font-semibold">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-middle text-center">
                        {activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DetailSection>
  );
}

export function CambiarEstadoForm({
  idPrefix,
  estados,
  labels,
  estadoSel,
  setEstadoSel,
  motivo,
  setMotivo,
  onSubmit,
  guardando,
  msg,
  motivoObligatorio = true,
}) {
  return (
    <DetailSection title="Cambiar estado (IT)">
      <WriteGate
        fallback={<p className="text-sm text-slate-500">Sin permiso de escritura.</p>}
      >
        <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
          <div>
            <label htmlFor={`${idPrefix}-estado`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              id={`${idPrefix}-estado`}
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
              className="inventory-input"
            >
              <option value="">Seleccionar…</option>
              {estados.map(k => (
                <option key={k} value={k}>{labels[k] ?? k}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-motivo`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Motivo {motivoObligatorio ? '(obligatorio)' : '(opcional)'}
            </label>
            <textarea
              id={`${idPrefix}-motivo`}
              rows={3}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo del cambio de estado"
              className="inventory-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={guardando || !estadoSel || (motivoObligatorio && !motivo.trim())}
            className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg font-bold text-sm cursor-pointer transition-colors"
          >
            {guardando ? 'Guardando…' : 'Cambiar estado'}
          </button>
          {msg ? <p className="text-sm text-red-600 font-medium">{msg}</p> : null}
        </form>
      </WriteGate>
    </DetailSection>
  );
}
