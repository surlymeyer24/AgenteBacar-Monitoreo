/**
 * TabsCard.jsx
 * Componente estándar de contenedor de solapas (basado en Periféricos).
 *
 * Puede usarse como contenedor completo que envuelve el contenido:
 *   <TabsCard tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
 *     <div className="p-4">Contenido de la solapa activa...</div>
 *   </TabsCard>
 *
 * O como card de solapas independiente si el contenido tiene su propia estructura:
 *   <TabsCard tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
 */
export default function TabsCard({
  tabs = [],
  activeTab,
  onChange,
  children,
  className = '',
  barClassName = '',
  extraRight = null,
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full ${className}`}
    >
      {/* Cabecera integrada de Solapas */}
      <div
        className={`p-2 sm:p-2.5 bg-slate-50/80 border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center justify-between gap-3 ${
          !children ? 'border-b-0' : ''
        } ${barClassName}`}
      >
        <div className="flex items-center gap-1.5 w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChange?.(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.icon && (
                  <span
                    className={`inline-flex shrink-0 ${
                      isActive ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      isActive
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && tab.count === undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {extraRight && <div className="shrink-0">{extraRight}</div>}
      </div>

      {/* Contenido / Cuerpo opcional */}
      {children}
    </div>
  );
}
