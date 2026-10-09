import { Link } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';

export function StudioLoading({ message = 'Cargando…' }) {
  return (
    <div className="p-8 text-center text-slate-500 text-base">{message}</div>
  );
}

export function StudioError({ message }) {
  return (
    <div className="p-8 text-center text-red-600 text-base font-medium">{message}</div>
  );
}

export function StudioPageShell({ title, subtitle, actions, children }) {
  const header = (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex gap-3 min-w-0">
        <span
          className="w-1.5 self-stretch min-h-[2.75rem] rounded-full bg-accent shrink-0"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wide leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );

  const hasBody = children != null && children !== false;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs border-t-[3px] border-t-accent p-5 sm:p-6 ${
        hasBody ? 'space-y-6' : ''
      }`}
    >
      {header}
      {hasBody ? children : null}
    </div>
  );
}

export function StudioPrimaryButton({ children, onClick, to, type = 'button', disabled, id, requiresWrite = false, requiresAdmin = false }) {
  const { loading, puedeEscribir, esAdministrador } = usePermisos();
  if (requiresWrite && (loading || !puedeEscribir)) return null;
  if (requiresAdmin && (loading || !esAdministrador)) return null;
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

export function StudioSecondaryButton({ children, onClick, to, disabled, type = 'button', requiresWrite = false, requiresAdmin = false }) {
  const { loading, puedeEscribir, esAdministrador } = usePermisos();
  if (requiresWrite && (loading || !puedeEscribir)) return null;
  if (requiresAdmin && (loading || !esAdministrador)) return null;
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

export function StudioDataTable({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-auto h-full">{children}</div>
    </div>
  );
}

export function studioTableClass() {
  return 'w-full text-left border-collapse text-sm text-slate-700';
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
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between transition-all hover:shadow-md h-full min-w-0 ${accentClass}`}>
      <div className="space-y-2 min-w-0">
        <span className="text-base font-semibold text-slate-500 tracking-wider uppercase block truncate">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-slate-900 tabular-nums">{value}</span>
          {subtitle ? <span className="text-base text-slate-500 shrink-0">{subtitle}</span> : null}
        </div>
      </div>
      {Icon ? (
        <div className={`p-3 rounded-lg shrink-0 ${iconClass ?? 'bg-slate-100 text-slate-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
      ) : null}
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="no-underline text-inherit block h-full min-w-0">
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
