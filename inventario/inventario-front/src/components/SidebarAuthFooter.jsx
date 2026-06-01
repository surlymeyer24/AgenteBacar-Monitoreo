import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { LogOut } from 'lucide-react';

export default function SidebarAuthFooter() {
  const user = useFirebaseAuthUser();

  if (user === undefined || user === false || user === null) {
    return null;
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }

  return (
    <div className="sidebar-auth-footer">
      <p className="sidebar-auth-email small" title={user.email ?? ''}>
        {user.email ?? 'Sesión'}
      </p>
      <button type="button" className="nav-link sidebar-logout" onClick={() => void handleLogout()}>
        <LogOut size={18} />
        <span className="sidebar-logout-text">Cerrar sesión</span>
      </button>
    </div>
  );
}
