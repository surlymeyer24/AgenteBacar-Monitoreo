import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { usePermisos } from '../hooks/usePermisos';
import { LogOut } from 'lucide-react';

function inicialesDesdeEmail(email) {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const partes = local.split(/[._-]+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

function labelRol(rol) {
  if (rol === 'ADMINISTRADOR') return 'ADMINISTRADOR';
  if (rol === 'USUARIO') return 'USUARIO';
  if (rol === 'VISUALIZADOR') return 'VISUALIZADOR';
  return rol ?? 'USUARIO';
}

export default function SidebarAuthFooter() {
  const user = useFirebaseAuthUser();
  const { rol } = usePermisos();

  if (user === undefined || user === false || user === null) {
    return null;
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Sesión';
  const iniciales = inicialesDesdeEmail(user.email);

  return (
    <div className="sidebar-auth-footer">
      <div className="sidebar-auth-profile">
        <div className="sidebar-auth-avatar" aria-hidden>
          {iniciales}
        </div>
        <div className="sidebar-auth-meta">
          <p className="sidebar-auth-name" title={user.email ?? ''}>
            {displayName}
          </p>
          <p className="sidebar-auth-role">{labelRol(rol)}</p>
        </div>
        <button
          type="button"
          className="sidebar-logout-icon"
          onClick={() => void handleLogout()}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
