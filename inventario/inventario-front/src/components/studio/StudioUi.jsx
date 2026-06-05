import { Link } from 'react-router-dom';

export function StudioLoading({ message = 'Cargando…' }) {
  return (
    <div className="p-8 text-center text-slate-500 text-sm">{message}</div>
  );
}

export function StudioError({ message }) {
  return (
    <div className="p-8 text-center text-red-600 text-sm font-medium">{message}</div>
  );
}

export function StudioPageShell({ title, subtitle, actions, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function StudioPrimaryButton({ children, onClick, to, type = 'button', disabled, id }) {
  const cls =
    'inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-xs';
  if (to) {
    return (
      <Link to={to} id={id} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} id={id} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function StudioSecondaryButton({ children, onClick, to, disabled, type = 'button' }) {
  const cls =
    'inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg font-medium text-sm transition-colors';
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function StudioCardGrid({ children, emptyMessage }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  if (!items.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400 shadow-xs">
        {emptyMessage ?? 'Sin registros'}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {children}
    </div>
  );
}

export function StudioPerifericoCard({
  badge,
  badgeClass = 'bg-slate-100 text-slate-600',
  meta,
  title,
  lines = [],
  footerLabel,
  footerValue,
  footerLink,
  footerLinkLabel = 'Ver equipo',
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {badge ? (
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {badge}
            </span>
          ) : (
            <span />
          )}
          {meta ? <span className="text-[10px] text-slate-400 font-mono">{meta}</span> : null}
        </div>
        {title ? <h3 className="font-bold text-slate-900 text-xs leading-snug">{title}</h3> : null}
        {lines.map((line, i) => (
          <p key={i} className="text-[11px] text-slate-500 font-medium">
            {line}
          </p>
        ))}
      </div>

      {(footerLabel || footerValue || footerLink) && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold gap-2">
          <div className="min-w-0">
            {footerLabel ? (
              <span className="text-[10px] text-slate-400 block font-normal text-left">{footerLabel}</span>
            ) : null}
            {footerValue ? <span className="text-slate-700 truncate block">{footerValue}</span> : null}
          </div>
          {footerLink ? (
            <Link to={footerLink} className="p-1 text-[#0c66e4] hover:underline font-bold text-[11px] shrink-0">
              {footerLinkLabel}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function StudioDataTable({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-auto h-full">{children}</div>
    </div>
  );
}

export function studioTableClass() {
  return 'w-full text-left border-collapse text-xs text-slate-700';
}

export function studioTheadClass() {
  return 'bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider';
}

export function studioThClass() {
  return 'py-3 px-4 whitespace-nowrap';
}

export function studioTdClass() {
  return 'py-3 px-4 whitespace-nowrap';
}

export function studioRowClass(clickable = true) {
  return `divide-y divide-slate-100 ${clickable ? 'hover:bg-slate-50/40 transition-colors cursor-pointer' : ''}`;
}

export function StudioMetricCard({ title, value, subtitle, icon: Icon, iconClass, to, accentClass = '' }) {
  const inner = (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between transition-all hover:shadow-md ${accentClass}`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
          {subtitle ? <span className="text-xs text-slate-500">{subtitle}</span> : null}
        </div>
      </div>
      {Icon ? (
        <div className={`p-3 rounded-lg ${iconClass ?? 'bg-slate-100 text-slate-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
      ) : null}
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="no-underline text-inherit block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function StudioFilterBar({ children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 flex-wrap">
      {children}
    </div>
  );
}

export function StudioSection({ title, icon: Icon, iconClass, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {title ? (
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 m-0">
          {Icon ? <Icon className={`w-5 h-5 shrink-0 ${iconClass ?? 'text-slate-500'}`} /> : null}
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

export function StudioKpiBox({ label, value, sub, mono = false }) {
  return (
    <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center space-y-1">
      <span className="text-[9px] text-slate-400 uppercase font-semibold block">{label}</span>
      <p className={`font-bold text-slate-800 mt-1 ${mono ? 'font-mono text-xs' : 'text-sm truncate'}`} title={typeof value === 'string' ? value : undefined}>
        {value}
      </p>
      {sub ? <p className="text-[10px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

export function StudioDiskBar({ label, tipo, libreGb, totalGb, porcentajeUsado }) {
  const pct = Number(porcentajeUsado) || 0;
  const libre = Number(libreGb);
  const total = Number(totalGb);
  const barColor = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-blue-600';
  return (
    <div className="p-3 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/30">
      <div className="flex justify-between items-center text-[11px] gap-2">
        <span className="font-bold text-slate-800">{label}{tipo ? ` (${tipo})` : ''}</span>
        <span className="text-slate-500 shrink-0">
          {Number.isFinite(libre) && Number.isFinite(total)
            ? `Libre: ${libre.toFixed(1)} GB de ${total.toFixed(1)} GB`
            : `${pct.toFixed(1)}% usado`}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 text-right">{pct.toFixed(1)}% espacio utilizado</p>
    </div>
  );
}

export function StudioDetailTabs({ tabs, active, onChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-2 pt-2">
      <div className="flex gap-1 border-b border-slate-100" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              active === tab.id
                ? 'text-[#0c66e4] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0c66e4] after:rounded-t'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function syncDotClass(nivel) {
  if (nivel === 'activo') return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
  if (nivel === 'intermedio') return 'bg-amber-400';
  if (nivel === 'sin_datos') return 'bg-slate-300';
  return 'bg-red-400';
}

export function estadoBadgeClass(estado) {
  const e = (estado ?? '').toLowerCase();
  if (e.includes('asign') || e.includes('activ')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (e.includes('manten') || e.includes('repar')) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (e.includes('baja') || e.includes('retir')) return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-50 text-slate-700 border border-slate-200';
}

export function osBadgeClass(so) {
  const s = (so ?? '').toLowerCase();
  if (s.includes('11')) return 'bg-blue-50 text-blue-700';
  if (s.includes('10')) return 'bg-indigo-50 text-indigo-700';
  return 'bg-slate-100 text-slate-700';
}
