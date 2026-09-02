import { ChevronLeft, Pencil } from 'lucide-react';
import WriteGate from './WriteGate';

/**
 * Shell de detalle en overlay (mismo patrón visual que ComputadoraDetail).
 * Los detalles de NVR, cámara, servidores, red y tesorería lo usan como contenedor.
 */
export default function DetailOverlayShell({
  onClose,
  title,
  titleIcon = null,
  subtitle = null,
  statusDot = null, // 'active' | 'inactive' | null
  actions = null,
  tabs = null, // [{ id, label }]
  activeTab = null,
  onTabChange = null,
  loading = false,
  error = null,
  maxWidthClass = 'max-w-7xl',
  /** En celular ocupa toda la pantalla, sin margen ni esquinas redondeadas. */
  fullBleedOnMobile = false,
  children,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center overflow-hidden ${
        fullBleedOnMobile ? 'p-0 sm:p-6' : 'p-4 sm:p-6'
      }`}
    >
      <div
        className={`bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col w-full ${maxWidthClass} max-h-full overflow-hidden ring-1 ring-slate-900/5 ${
          fullBleedOnMobile ? 'rounded-none sm:rounded-2xl h-full sm:h-auto' : 'rounded-2xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-overlay-title"
      >
        <div
          className={`bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-950 shrink-0 ${
            fullBleedOnMobile ? 'p-4 sm:p-6' : 'p-6'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded-md transition-colors mr-1 cursor-pointer shrink-0"
              title="Volver al listado"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            {statusDot === 'active' && (
              <span
                className="w-3.5 h-3.5 rounded-full inline-block bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.73)] animate-pulse shrink-0"
                aria-hidden
              />
            )}
            {statusDot === 'inactive' && (
              <span className="w-3.5 h-3.5 rounded-full inline-block bg-slate-400 shrink-0" aria-hidden />
            )}
            <div className="min-w-0">
              <h3
                id="detail-overlay-title"
                className="font-extrabold text-xl sm:text-2xl text-white leading-tight flex items-center gap-2 truncate"
              >
                {titleIcon}
                <span className="truncate">{title}</span>
              </h3>
              {subtitle ? (
                <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
          ) : null}
        </div>

        {tabs?.length > 0 && (
          <div className="flex border-b border-slate-200 bg-white px-4 sm:px-8 shrink-0 overflow-x-auto">
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={`py-4 px-4 sm:px-6 text-sm font-bold border-b-2 transition-all shrink-0 ${
                    active
                      ? 'border-[#0c66e4] text-[#0c66e4] font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div
          className={`overflow-y-auto space-y-6 flex-1 bg-slate-50 ${
            fullBleedOnMobile ? 'p-4 sm:p-8' : 'p-6 sm:p-8'
          }`}
        >
          {loading && (
            <p className="text-center text-slate-500 font-medium py-12">Cargando...</p>
          )}
          {!loading && error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          {!loading && !error && children}
        </div>
      </div>
    </div>
  );
}

/** Botón Editar para el header del overlay (solo si el usuario puede escribir). */
export function DetailEditButton({ onClick, disabled = false, label = 'Editar' }) {
  return (
    <WriteGate>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
        {label}
      </button>
    </WriteGate>
  );
}

/** Botón destructivo (eliminar) para el header del overlay. */
export function DetailDangerButton({ onClick, disabled = false, children }) {
  return (
    <WriteGate>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-950/30 hover:border-red-800 disabled:opacity-50 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
      >
        {children}
      </button>
    </WriteGate>
  );
}

/** Card de sección dentro del body del overlay. */
export function DetailSection({ title, children, actions = null }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title ? (
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
