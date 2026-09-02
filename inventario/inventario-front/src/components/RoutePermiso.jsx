import { Navigate } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';

function PermisosLoading() {
  return <p className="estado-msg layout-boot-msg">Cargando permisos…</p>;
}

export function PermisosBoot({ children }) {
  const { loading } = usePermisos();
  if (loading) return <PermisosLoading />;
  return children;
}

export function RequireWrite({ children }) {
  const { loading, puedeEscribir } = usePermisos();
  if (loading) return <PermisosLoading />;
  if (!puedeEscribir) return <Navigate to="/" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { loading, esAdministrador } = usePermisos();
  if (loading) return <PermisosLoading />;
  if (!esAdministrador) return <Navigate to="/" replace />;
  return children;
}
