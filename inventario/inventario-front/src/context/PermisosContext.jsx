import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { fetchUsuarioMe } from '../api/usuarioApi';

const PermisosContext = createContext(null);

const REINTENTOS_MAX = 6;
const ESPERA_BASE_MS = 700;
const ESPERA_TOPE_MS = 8000;

/**
 * Un 4xx es una respuesta legítima del backend y no cambia si insistimos.
 * Reintentamos solo fallas de red (sin status) y errores 5xx, típicos de un backend reiniciándose.
 */
function esFallaTransitoria(err) {
  const status = err?.status;
  return status == null || status >= 500;
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function permisosDesdeRol(rol) {
  const normalizado = rol ?? 'VISUALIZADOR';
  return {
    rol: normalizado,
    puedeEscribir: normalizado === 'USUARIO' || normalizado === 'ADMINISTRADOR',
    esAdministrador: normalizado === 'ADMINISTRADOR',
  };
}

export function PermisosProvider({ children }) {
  const firebaseUser = useFirebaseAuthUser();
  const [estado, setEstado] = useState({ loading: true, rol: null, puedeEscribir: false, esAdministrador: false });

  useEffect(() => {
    if (firebaseUser === undefined) {
      return;
    }

    if (firebaseUser === false) {
      setEstado({ loading: false, ...permisosDesdeRol('ADMINISTRADOR') });
      return;
    }

    if (!firebaseUser) {
      setEstado({ loading: false, rol: null, puedeEscribir: false, esAdministrador: false });
      return;
    }

    let cancelado = false;
    setEstado(prev => ({ ...prev, loading: true }));

    (async () => {
      for (let intento = 0; intento <= REINTENTOS_MAX; intento += 1) {
        try {
          const usuario = await fetchUsuarioMe();
          if (cancelado) return;
          if (!usuario?.rol) {
            console.warn('[permisos] /api/usuarios/me sin rol; usando VISUALIZADOR', usuario);
          }
          setEstado({ loading: false, ...permisosDesdeRol(usuario?.rol) });
          return;
        } catch (err) {
          if (cancelado) return;

          if (!esFallaTransitoria(err) || intento === REINTENTOS_MAX) {
            console.error('[permisos] no se pudo cargar /api/usuarios/me; usando VISUALIZADOR', err);
            setEstado({ loading: false, ...permisosDesdeRol('VISUALIZADOR') });
            return;
          }

          const espera = Math.min(ESPERA_BASE_MS * 2 ** intento, ESPERA_TOPE_MS);
          console.warn(`[permisos] fallo al cargar permisos, reintento ${intento + 1}/${REINTENTOS_MAX} en ${espera} ms`, err);
          await esperar(espera);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [firebaseUser]);

  const value = useMemo(() => estado, [estado]);

  return (
    <PermisosContext.Provider value={value}>
      {children}
    </PermisosContext.Provider>
  );
}

export function usePermisos() {
  const ctx = useContext(PermisosContext);
  if (!ctx) {
    throw new Error('usePermisos debe usarse dentro de PermisosProvider');
  }
  return ctx;
}
