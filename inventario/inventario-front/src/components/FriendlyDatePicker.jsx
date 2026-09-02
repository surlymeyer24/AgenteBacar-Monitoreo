import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function parseIsoDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(value) {
  const dt = parseIsoDate(value);
  if (!dt) return null;
  return dt.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(viewMonth) {
  const first = startOfMonth(viewMonth);
  // Monday-based week: getDay() Sun=0 → convert to Mon=0
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    cells.push(day);
  }
  return cells;
}

/**
 * Date picker con panel custom (mismo lenguaje visual que FriendlySelect).
 * value/onChange usan string ISO `YYYY-MM-DD`.
 */
export default function FriendlyDatePicker({
  id,
  name,
  value = '',
  onChange,
  label,
  placeholder = 'Elegir fecha…',
  disabled = false,
  required = false,
  className = '',
  minWidth = 'auto',
  variant = 'field', // 'field' | 'filter'
  allowClear = true,
}) {
  const autoId = useId();
  const pickerId = id || autoId;
  const panelId = `${pickerId}-panel`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const selected = useMemo(() => parseIsoDate(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected || new Date()));

  useEffect(() => {
    if (selected) setViewMonth(startOfMonth(selected));
  }, [selected]);

  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const display = formatDisplay(value) || placeholder;
  const isFilter = variant === 'filter';
  const todayIso = toIsoDate(new Date());

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelW = Math.max(rect.width, 300);
    const panelH = 340;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < panelH && spaceAbove > spaceBelow;
    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelW - 8);
    }
    setMenuStyle({
      position: 'fixed',
      left,
      width: panelW,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      zIndex: 10000,
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const onWin = () => updateMenuPosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function commit(nextIso) {
    onChange?.(nextIso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pickDay(day) {
    if (disabled) return;
    commit(toIsoDate(day));
  }

  return (
    <div
      ref={rootRef}
      className={`friendly-date relative ${className}`}
      style={{ minWidth }}
    >
      {(name || required) && (
        <input
          type="date"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          name={name}
          value={value ?? ''}
          required={required}
          disabled={disabled}
          onChange={() => {}}
        />
      )}

      <button
        ref={triggerRef}
        type="button"
        id={pickerId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label ? String(label) : 'Elegir fecha'}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={
          isFilter
            ? `relative flex w-full items-center gap-2 bg-white border border-slate-200 pl-3 pr-9 py-2 rounded-xl text-sm font-semibold text-slate-800 shadow-sm text-left hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] transition-all ${open ? 'border-[var(--color-accent)] ring-[3px] ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]' : ''}`
            : `inventory-date relative text-left flex items-center w-full bg-none ${open ? 'border-[var(--color-accent)]' : ''} ${!selected ? 'text-slate-400' : 'text-slate-800'}`
        }
      >
        {isFilter && label ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
            <span className={`truncate font-semibold ${selected ? 'text-slate-800' : 'text-slate-400'}`}>{display}</span>
          </span>
        ) : (
          <span className="truncate flex-1 font-medium">{display}</span>
        )}
        <CalendarDays
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          aria-hidden
        />
      </button>

      {open
        && createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Calendario"
            style={menuStyle ?? undefined}
            className="friendly-date__panel rounded-xl border border-slate-200 bg-white shadow-xl p-3 outline-none"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-bold text-slate-800 tabular-nums m-0">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </p>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-400 py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day) => {
                const iso = toIsoDate(day);
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isSelected = selected && toIsoDate(selected) === iso;
                const isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={`h-9 rounded-lg text-sm font-semibold transition-colors tabular-nums ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-white shadow-sm'
                        : isToday
                          ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,white)] text-slate-900 ring-1 ring-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
                          : inMonth
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs font-bold text-[var(--color-accent)] hover:underline"
                onClick={() => {
                  const now = new Date();
                  setViewMonth(startOfMonth(now));
                  commit(toIsoDate(now));
                }}
              >
                Hoy
              </button>
              {allowClear && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  onClick={() => commit('')}
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
