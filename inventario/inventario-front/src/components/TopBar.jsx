import { useState, useEffect, useMemo } from 'react';
import { Search, Bell } from 'lucide-react';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { useNavigate } from 'react-router-dom';
import { initFirebase, COLLECTIONS } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function obtenerIniciales(nombre, email) {
  if (nombre && nombre.trim()) {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return partes[0].slice(0, 2).toUpperCase();
  }
  if (!email) return 'U';
  const local = email.split('@')[0] ?? '';
  const partes = local.split(/[._-]+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || 'U';
}

export default function TopBar() {
  const user = useFirebaseAuthUser();
  const navigate = useNavigate();

  const [nombreCustom, setNombreCustom] = useState(
    () => localStorage.getItem('bacarsa_profile_name') || ''
  );

  // Escuchar actualizaciones reactivas de perfil
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

  // Cargar perfil desde Firestore si localStorage está vacío
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
        console.warn('Error leyendo perfil de Firestore en TopBar:', err);
      }
    };

    loadFromFirestore();
    return () => {
      cancel = true;
    };
  }, [user?.uid, nombreCustom]);

  const nombreUsuario = useMemo(() => {
    const raw = nombreCustom || user?.displayName || user?.email?.split('@')[0] || 'usuario';
    const first = raw.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }, [nombreCustom, user]);

  const iniciales = useMemo(() => {
    return obtenerIniciales(nombreCustom || user?.displayName, user?.email);
  }, [nombreCustom, user]);

  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
      {/* Buscador de ancho completo */}
      <div className="relative flex-1 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Buscar por serie, IP, MAC o responsable..."
          className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
        />
      </div>

      {/* Acciones del lado derecho */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notificaciones */}
        <button
          type="button"
          title="Notificaciones"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
        </button>

        {/* Perfil de usuario con saludo reactivo */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200/80">
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            title={user?.email || 'Mi Perfil'}
            className="w-8 h-8 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs border border-red-800 shrink-0"
          >
            {iniciales}
          </button>
          <span className="text-xs sm:text-sm font-semibold text-slate-700 select-none">
            Hola, {nombreUsuario}
          </span>
        </div>
      </div>
    </header>
  );
}
