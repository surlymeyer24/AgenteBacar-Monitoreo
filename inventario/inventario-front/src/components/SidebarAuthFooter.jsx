import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth, initFirebase, COLLECTIONS } from '../lib/firebase';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { usePermisos } from '../hooks/usePermisos';
import { doc, getDoc } from 'firebase/firestore';
import { LogOut } from 'lucide-react';

function obtenerIniciales(nombre, email) {
  if (nombre && nombre.trim()) {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return partes[0].slice(0, 2).toUpperCase();
  }
  if (!email) return 'SA';
  const local = email.split('@')[0] ?? '';
  const partes = local.split(/[._-]+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || 'SA';
}

function labelRol(rol) {
  if (rol === 'ADMINISTRADOR') return 'Administrador';
  if (rol === 'USUARIO') return 'Operador';
  if (rol === 'VISUALIZADOR') return 'Visualizador';
  return rol ?? 'Usuario';
}

export default function SidebarAuthFooter({ sidebarCollapsed }) {
  const user = useFirebaseAuthUser();
  const { rol } = usePermisos();

  const [nombreCustom, setNombreCustom] = useState(
    () => localStorage.getItem('bacarsa_profile_name') || ''
  );

  // Escuchar cambios reactivos de perfil
  useEffect(() => {
    const handleProfileUpdated = (e) => {
      const nuevo = e.detail?.nombre || localStorage.getItem('bacarsa_profile_name') || '';
      if (nuevo) setNombreCustom(nuevo);
    };

    window.addEventListener('bacarsa_profile_updated', handleProfileUpdated);
    window.addEventListener('storage', handleProfileUpdated);

    return () => {
      window.removeEventListener('bacarsa_profile_updated', handleProfileUpdated);
      window.removeEventListener('storage', handleProfileUpdated);
    };
  }, []);

  // Cargar perfil desde Firestore si es necesario
  useEffect(() => {
    if (!user?.uid || nombreCustom) return;

    let cancel = false;
    const loadFromFirestore = async () => {
      try {
        const db = initFirebase();
        if (db) {
          const ref = doc(db, COLLECTIONS.USUARIOS, user.uid);
          const snap = await getDoc(ref);
          if (!cancel && snap.exists()) {
            const data = snap.data();
            if (data?.nombre) {
              setNombreCustom(data.nombre);
              localStorage.setItem('bacarsa_profile_name', data.nombre);
            }
          }
        }
      } catch (err) {
        console.warn('Error leyendo perfil de Firestore en SidebarAuthFooter:', err);
      }
    };

    loadFromFirestore();
    return () => {
      cancel = true;
    };
  }, [user?.uid, nombreCustom]);

  if (user === undefined || user === false || user === null) {
    return null;
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }

  const displayName = nombreCustom || user.displayName?.trim() || user.email?.split('@')[0] || 'Soporte Administrador';
  const iniciales = obtenerIniciales(displayName, user.email);

  return (
    <div className="sidebar-auth-footer p-2.5 sm:p-3 border-t border-slate-800/80 bg-[#0b0f19]">
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
        <div
          className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700/60"
          title={`${displayName} (${labelRol(rol)})`}
          aria-hidden
        >
          {iniciales}
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1 sidebar-user-meta">
            <p className="text-xs font-semibold text-white truncate" title={user.email ?? ''}>
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{labelRol(rol)}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`w-full mt-2.5 pt-2 border-t border-slate-800/60 flex items-center ${
          sidebarCollapsed ? 'justify-center px-0' : 'justify-center gap-2 px-2'
        } text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-lg py-1.5 transition-colors cursor-pointer`}
        onClick={() => void handleLogout()}
        title="Cerrar sesión"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0" />
        {!sidebarCollapsed && <span className="sidebar-logout-text">Cerrar sesión</span>}
      </button>
    </div>
  );
}
