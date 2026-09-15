import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured, mensajeFirebaseNoConfig } from '../lib/firebase';
import { fetchSesionBloqueos } from '../api/sesionBloqueoApi';

const LIMITE = 500;
const REFETCH_MS = 60_000;

function isoToFirestoreTs(iso) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0 };
}

function apiToBloqueo(item) {
  return {
    id: item.id,
    computadora_id: item.computadoraId ?? item.computadora_id ?? null,
    hostname: item.hostname ?? null,
    ubicacion: item.ubicacion ?? null,
    bloqueado_en: isoToFirestoreTs(item.bloqueadoEn ?? item.bloqueado_en),
    estado_anterior: item.estadoAnterior ?? item.estado_anterior ?? null,
    sesion_bloqueo_auto_min: item.sesionBloqueoAutoMin ?? item.sesion_bloqueo_auto_min ?? null,
  };
}

export function useSesionBloqueos() {
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken(t => t + 1), []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setError(mensajeFirebaseNoConfig());
        setLoading(false);
      });
      return undefined;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setError('No se pudo conectar a Firebase Auth.');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let intervalId;

    async function cargar() {
      try {
        const data = await fetchSesionBloqueos(LIMITE);
        if (cancelled) return;
        setBloqueos(Array.isArray(data) ? data.map(apiToBloqueo) : []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'No se pudo cargar el historial de bloqueos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const unsubAuth = onAuthStateChanged(auth, user => {
      clearInterval(intervalId);
      if (!user) {
        setBloqueos([]);
        setError('Sesión requerida');
        setLoading(false);
        return;
      }
      setLoading(true);
      cargar();
      intervalId = setInterval(cargar, REFETCH_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      unsubAuth();
    };
  }, [refreshToken]);

  return { bloqueos, loading, error, refresh };
}
