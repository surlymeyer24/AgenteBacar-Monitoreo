import { Search } from 'lucide-react';
import FriendlySelect from './FriendlySelect';
import FriendlyDatePicker from './FriendlyDatePicker';

/**
 * Contenedor principal para los filtros de las tablas.
 * Usa componentes anidados (Compound Components) para mayor flexibilidad.
 */
function TableFilters({ children }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center w-full">
      {children}
    </div>
  );
}

/**
 * Input de búsqueda general (texto libre) con ícono de lupa.
 */
function SearchFilter({ id = 'table-search', value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus:border-[var(--color-accent)] transition-all"
      />
    </div>
  );
}

/**
 * Dropdown de filtro con panel custom amigable.
 */
function SelectFilter({ id, label, value, onChange, children, minWidth = 'auto', className = '' }) {
  return (
    <FriendlySelect
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      minWidth={minWidth}
      className={className}
      variant="filter"
    >
      {children}
    </FriendlySelect>
  );
}

/**
 * Date picker amigable (calendario custom, mismo look que el select).
 */
function DateFilter({ id, label, value, onChange, minWidth = '12rem', className = '' }) {
  return (
    <FriendlyDatePicker
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      minWidth={minWidth}
      className={className}
      variant="filter"
    />
  );
}

TableFilters.Search = SearchFilter;
TableFilters.Select = SelectFilter;
TableFilters.Date = DateFilter;

export default TableFilters;
