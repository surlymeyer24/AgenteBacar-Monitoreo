import { Navigate } from 'react-router-dom';

/** Redirección legacy → asignaciones integradas en stock. */
export default function AsignacionesStock() {
  return <Navigate to="/perifericos/stock?vista=asignaciones" replace />;
}
