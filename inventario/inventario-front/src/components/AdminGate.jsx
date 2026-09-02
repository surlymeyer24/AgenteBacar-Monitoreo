import { usePermisos } from '../hooks/usePermisos';

export default function AdminGate({ children, fallback = null }) {
  const { loading, esAdministrador } = usePermisos();
  if (loading || !esAdministrador) return fallback;
  return children;
}
