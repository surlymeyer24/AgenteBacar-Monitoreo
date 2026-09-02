import { usePermisos } from '../hooks/usePermisos';

export default function WriteGate({ children, fallback = null }) {
  const { loading, puedeEscribir } = usePermisos();
  if (loading || !puedeEscribir) return fallback;
  return children;
}
