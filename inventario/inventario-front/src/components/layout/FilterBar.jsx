import { Search, FilterX } from 'lucide-react';

/**
 * FilterBar.jsx
 * Barra estándar de búsqueda y filtros proporcionales en una sola fila (basada en Periféricos).
 *
 * Uso:
 *   <FilterBar activeCount={filtrosActivos} onReset={resetFiltros} extraFooterLeft={...}>
 *     <FilterBar.Search value={buscar} onChange={setBuscar} placeholder="Buscar..." />
 *     <FilterBar.Select value={estado} onChange={setEstado}>
 *       <option value="">Estado: Todos</option>
 *     </FilterBar.Select>
 *   </FilterBar>
 */
function FilterBar({
  children,
  activeCount = 0,
  onReset,
  extraFooterLeft = null,
  card = false,
  className = '',
}) {
  const showFooter = Boolean(extraFooterLeft) || activeCount > 0;

  return (
    <div
      className={`${
        card ? 'bg-white rounded-xl border border-slate-200 shadow-xs ' : ''
      }p-3.5 space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {children}
      </div>

      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div>{extraFooterLeft}</div>

          {activeCount > 0 && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-slate-500">
                Filtros aplicados:{' '}
                <strong className="text-slate-800 font-semibold">
                  {activeCount} activo{activeCount === 1 ? '' : 's'}
                </strong>
              </span>

              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSearch({
  id,
  value,
  onChange,
  placeholder = 'Buscar...',
  widthClass = 'w-[36%] min-w-[200px] flex-1',
  className = '',
}) {
  return (
    <div className={`relative ${widthClass} ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
      />
    </div>
  );
}

function FilterSelect({
  id,
  value,
  onChange,
  children,
  widthClass = '!w-[15%] max-w-[16%] min-w-[120px]',
  className = '',
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value, e)}
      className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 ${widthClass} truncate cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

FilterBar.Search = FilterSearch;
FilterBar.Select = FilterSelect;

export default FilterBar;
