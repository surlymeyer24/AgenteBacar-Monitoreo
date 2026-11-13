/**
 * ModuleHeader.jsx
 * Componente estándar de encabezado de módulo (basado en Periféricos / Stitch BACAR).
 * Regla de diseño de sistema: todos los módulos deben usar este encabezado en card blanca.
 */
export default function ModuleHeader({
  title,
  badge,
  description,
  actions,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
