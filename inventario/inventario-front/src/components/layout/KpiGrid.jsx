/**
 * KpiGrid.jsx
 * Grilla contenedora de KPIs estándar (basada en el diseño de Periféricos).
 */
export default function KpiGrid({
  children,
  cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  className = '',
}) {
  return (
    <div className={`grid ${cols} gap-3 w-full ${className}`}>
      {children}
    </div>
  );
}
