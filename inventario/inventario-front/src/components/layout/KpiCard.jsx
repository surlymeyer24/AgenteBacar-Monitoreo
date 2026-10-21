/**
 * KpiCard.jsx
 * Tarjeta individual de métrica/KPI estándar (basada en el diseño de Periféricos).
 */
export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        {icon && <div className="shrink-0">{icon}</div>}
      </div>
      <div className="my-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
      </div>
      {subtitle && (
        <span className="text-xs text-slate-400 truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
}
