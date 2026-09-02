import { useCallback, useEffect, useId, useMemo, useRef, useState, Children, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

function optionsFromChildren(children) {
  return Children.toArray(children)
    .filter(isValidElement)
    .filter((child) => child.type === 'option')
    .map((child) => ({
      value: child.props.value == null ? '' : String(child.props.value),
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
    }));
}

function normalizeOptions(options, children) {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((opt) => ({
      value: opt.value == null ? '' : String(opt.value),
      label: opt.label ?? String(opt.value ?? ''),
      disabled: Boolean(opt.disabled),
    }));
  }
  return optionsFromChildren(children);
}

/**
 * Select con panel desplegable custom (el menú nativo no se puede estilizar bien).
 * API: value + onChange(string). Opcional name/required para forms.
 */
export default function FriendlySelect({
  id,
  name,
  value = '',
  onChange,
  options,
  children,
  label,
  placeholder = 'Seleccionar…',
  disabled = false,
  required = false,
  className = '',
  triggerClassName = '',
  minWidth = 'auto',
  variant = 'field', // 'field' | 'filter'
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const listId = `${selectId}-listbox`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [menuStyle, setMenuStyle] = useState(null);

  const items = useMemo(() => normalizeOptions(options, children), [options, children]);
  const selected = items.find((o) => o.value === String(value ?? '')) ?? null;
  const display = selected?.label ?? placeholder;

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxH = 280;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const height = Math.min(maxH, openUp ? spaceAbove : spaceBelow);
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 160),
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight: Math.max(120, height),
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
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = items.findIndex((o) => o.value === String(value ?? ''));
    setHighlight(idx >= 0 ? idx : items.findIndex((o) => !o.disabled));
    // Focus list for keyboard nav
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, items, value]);

  function commit(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e) {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => {
        let i = h;
        for (let n = 0; n < items.length; n += 1) {
          i = (i + 1) % items.length;
          if (!items[i]?.disabled) return i;
        }
        return h;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        let i = h;
        for (let n = 0; n < items.length; n += 1) {
          i = (i - 1 + items.length) % items.length;
          if (!items[i]?.disabled) return i;
        }
        return h;
      });
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = items[highlight];
      if (opt && !opt.disabled) commit(opt.value);
    }
  }

  const isFilter = variant === 'filter';

  return (
    <div
      ref={rootRef}
      className={`friendly-select relative ${className}`}
      style={{ minWidth }}
    >
      {/* Native mirror for required / form submit */}
      {(name || required) && (
        <select
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          name={name}
          value={value ?? ''}
          required={required}
          disabled={disabled}
          onChange={() => {}}
        >
          {items.map((opt) => (
            <option key={`native-${opt.value}`} value={opt.value} disabled={opt.disabled}>
              {typeof opt.label === 'string' ? opt.label : opt.value}
            </option>
          ))}
        </select>
      )}

      {label && !isFilter && (
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={isFilter && label ? String(label) : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={
          triggerClassName
          || (isFilter
            ? `relative flex w-full items-center gap-2 bg-white border border-slate-200 pl-3 pr-9 py-2 rounded-xl text-sm font-semibold text-slate-800 shadow-sm text-left hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] transition-all ${open ? 'border-[var(--color-accent)] ring-[3px] ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]' : ''}`
            : `inventory-select relative text-left flex items-center ${open ? 'border-[var(--color-accent)]' : ''} ${!selected ? 'text-slate-400' : ''}`)
        }
      >
        {isFilter && label ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
            <span className="truncate font-semibold text-slate-800">{display}</span>
          </span>
        ) : (
          <span className="truncate flex-1">{display}</span>
        )}
        <ChevronDown
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open
        && createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={selectId}
            style={menuStyle ?? undefined}
            onKeyDown={onListKeyDown}
            className="friendly-select__menu m-0 p-1.5 list-none overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl outline-none"
          >
            {items.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-slate-400">Sin opciones</li>
            ) : (
              items.map((opt, index) => {
                const isSelected = String(value ?? '') === opt.value;
                const isActive = index === highlight;
                return (
                  <li
                    key={`${opt.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isActive
                          ? 'bg-[color-mix(in_srgb,var(--color-accent)_10%,white)] text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                    } ${isSelected ? 'font-semibold text-slate-900' : 'font-medium'}`}
                    onMouseEnter={() => !opt.disabled && setHighlight(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (!opt.disabled) commit(opt.value);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden />}
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
