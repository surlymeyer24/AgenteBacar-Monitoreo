import { NavLink } from 'react-router-dom';

/** Pestañas Inventario / Asignación dentro del área de computadoras. */
export default function ComputadoraSubnav({ variant = 'default' }) {
  const inBlock = variant === 'inBlock';
  return (
    <div
      className={inBlock ? 'detail-tabs detail-tabs--in-block' : 'detail-tabs'}
      role="tablist"
      aria-label="Vista de computadoras"
      style={inBlock ? undefined : { marginTop: '0.35rem', marginBottom: '0.35rem' }}
    >
      <NavLink
        to="/computadoras"
        end
        className={({ isActive }) => `detail-tab${isActive ? ' detail-tab--active' : ''}`}
      >
        Inventario
      </NavLink>
      <NavLink
        to="/computadoras/asignaciones"
        className={({ isActive }) => `detail-tab${isActive ? ' detail-tab--active' : ''}`}
      >
        Asignación
      </NavLink>
    </div>
  );
}
