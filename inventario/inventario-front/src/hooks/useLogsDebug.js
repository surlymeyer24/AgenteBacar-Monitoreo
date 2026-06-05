import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured, COLLECTIONS } from '../lib/firebase';

/** Máximo de documentos en la suscripción (mismo cap que logs_actualizaciones). */
export const LOGS_DEBUG_SNAPSHOT_CAP = 500;

/**
 * Normaliza un doc de logs_debug al mismo shape que logs_actualizaciones:
 *  tipo     → evento
 *  mensaje  → detalle
 * Agrega _fuente = 'debug' para distinguir el origen en la tabla combinada.
 */
function docToLogDebug(id, data) {
  return {
    id: `debug_${id}`,
    timestamp: data.timestamp ?? null,
    evento: data.tipo ?? '',
    detalle: data.mensaje ?? '',
    uuid: data.uuid ?? '',
    hostname: data.hostname ?? '',
    version_agente: data.version_agente ?? '',
    _fuente: 'debug',
  };
}

function constraintsRangoTimestamp(desdeMs, hastaMs) {
  const constraints = [];
  if (desdeMs != null) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(desdeMs))));
  }
  if (hastaMs != null) {
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(new Date(hastaMs))));
  }
  return constraints;
}

/**
 * Suscripción en tiempo real a la colección logs_debug.
 * Los docs tienen TTL (expire_at), por lo que no se ofrece función de borrado manual.
 *
 * @param {{ desde: Date|null, hasta: Date|null }} filtroFechas
 */
export function useLogsDebug(filtroFechas) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const desdeMs = filtroFechas?.desde?.getTime() ?? null;
  const hastaMs = filtroFechas?.hasta?.getTime() ?? null;

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setError('Firebase no está configurado.');
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

    const col = collection(firestore, COLLECTIONS.LOGS_DEBUG);
    const constraints = [
      ...constraintsRangoTimestamp(desdeMs, hastaMs),
      orderBy('timestamp', 'desc'),
      limit(LOGS_DEBUG_SNAPSHOT_CAP),
    ];
    const q = query(col, ...constraints);

    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => docToLogDebug(d.id, d.data()));
        setLogs(list);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [desdeMs, hastaMs]);

  return { logs, loading, error };
}
