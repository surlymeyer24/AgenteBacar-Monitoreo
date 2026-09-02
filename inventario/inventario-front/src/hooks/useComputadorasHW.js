import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured, mensajeFirebaseNoConfig, COLLECTIONS } from '../lib/firebase';
import { normalizarUltimaSincronizacion } from '../utils/syncActividad';

function docToComputadora(id, data) {
  const ultimaSyncRaw = data.ultima_sincronizacion ?? data.ultimaSincronizacion ?? null;
  const ultimaSync = normalizarUltimaSincronizacion(ultimaSyncRaw) ?? ultimaSyncRaw;
  return {
    id,
    hostname: data.hostname ?? null,
    version_agente: data.version_agente ?? null,
    version: data.version ?? null,
    estado_conexion: data.estado_conexion ?? data.estadoConexion ?? null,
    estadoConexion: data.estadoConexion ?? data.estado_conexion ?? null,
    ultima_sincronizacion: ultimaSync,
    ultimaSincronizacion: ultimaSync,
    estadoAgente: data.estadoAgente ?? null,
  };
}

export function useComputadorasHW() {
  const [computadoras, setComputadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setError(mensajeFirebaseNoConfig());
        setLoading(false);
      });
      return undefined;
    }
    const firestore = initFirebase();
    if (!firestore) {
      setError('No se pudo conectar a Firebase.');
      setLoading(false);
      return undefined;
    }
    /** Sin `select()` en este SDK: la colección entra completa; el listado en UI solo usa hostname/versión. */
    const col = collection(firestore, COLLECTIONS.HW_COMPUTADORAS);
    const unsub = onSnapshot(
      col,
      snap => {
        const list = snap.docs.map(d => docToComputadora(d.id, d.data()));
        setComputadoras(list);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { computadoras, loading, error };
}
