import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured, mensajeFirebaseNoConfig, COLLECTIONS } from '../lib/firebase';
import { normalizarUltimaSincronizacion } from '../utils/syncActividad';

function docToSesion(id, data) {
  const ultimaSyncRaw = data.ultima_sincronizacion ?? data.ultimaSincronizacion ?? null;
  const ultimaSync = normalizarUltimaSincronizacion(ultimaSyncRaw) ?? ultimaSyncRaw;
  const resumen = data.sesion_resumen_hoy ?? null;
  return {
    id,
    hostname: data.hostname ?? null,
    ubicacion: data.ubicacion ?? null,
    ultima_sincronizacion: ultimaSync,
    sesion_estado: data.sesion_estado ?? null,
    sesion_bloqueo_auto_min: data.sesion_bloqueo_auto_min ?? null,
    sesion_resumen_hoy: resumen
      ? {
          fecha: resumen.fecha ?? null,
          horas_activa: resumen.horas_activa ?? 0,
          horas_bloqueada: resumen.horas_bloqueada ?? 0,
          horas_sin_usuario: resumen.horas_sin_usuario ?? 0,
          transiciones: resumen.transiciones ?? 0,
          max_horas_activa_continua: resumen.max_horas_activa_continua ?? 0,
        }
      : null,
  };
}

export function useComputadorasSesion() {
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
    const col = collection(firestore, COLLECTIONS.HW_COMPUTADORAS);
    const unsub = onSnapshot(
      col,
      snap => {
        const list = snap.docs.map(d => docToSesion(d.id, d.data()));
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
