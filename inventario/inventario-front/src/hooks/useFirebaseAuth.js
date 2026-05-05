import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';

/**
 * Estado de sesión Firebase.
 * - `undefined`: aún cargando
 * - `false`: sin variables VITE_FIREBASE_* → no se exige login (modo local / sin proyecto)
 * - `null`: hay Firebase pero no hay usuario
 * - objeto `import('firebase/auth').User`: sesión activa
 */
export function useFirebaseAuthUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => setUser(false));
      return undefined;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      queueMicrotask(() => setUser(null));
      return undefined;
    }
    return onAuthStateChanged(auth, next => setUser(next));
  }, []);

  return user;
}
