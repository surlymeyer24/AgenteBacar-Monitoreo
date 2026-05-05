import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured, mensajeFirebaseNoConfig, COLLECTIONS } from '../lib/firebase';

/** Máximo de documentos en la suscripción en vivo (sin esto, Firestore envía toda la colección). */
export const LOGS_SNAPSHOT_CAP = 1000;

function docToLog(id, data) {
  return {
    id,
    timestamp: data.timestamp ?? null,
    evento: data.evento ?? '',
    detalle: data.detalle ?? '',
    uuid: data.uuid ?? '',
    hostname: data.hostname ?? '',
    version_agente: data.version_agente ?? '',
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

const BORRADO_LOTE = 500;

export async function deleteLogsActualizacionCoinciden(filtroFechas) {
  if (!isFirebaseConfigured()) {
    return { ok: false, message: 'Firebase no está configurado (.env).' };
  }
  const firestore = initFirebase();
  if (!firestore) {
    return { ok: false, message: 'No se pudo obtener Firestore.' };
  }

  const desdeMs = filtroFechas.desde?.getTime() ?? null;
  const hastaMs = filtroFechas.hasta?.getTime() ?? null;
  const col = collection(firestore, COLLECTIONS.LOGS_ACTUALIZACIONES);

  let deleted = 0;
  try {
    while (true) {
      const q = query(
        col,
        ...constraintsRangoTimestamp(desdeMs, hastaMs),
        orderBy('timestamp', 'desc'),
        limit(BORRADO_LOTE),
      );
      const snap = await getDocs(q);
      if (snap.empty) break;

      const batch = writeBatch(firestore);
      for (const d of snap.docs) {
        batch.delete(d.ref);
      }
      await batch.commit();
      deleted += snap.docs.length;
    }
    return { ok: true, deleted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export function useLogsActualizacion(filtroFechas) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const desdeMs = filtroFechas?.desde?.getTime() ?? null;
  const hastaMs = filtroFechas?.hasta?.getTime() ?? null;

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

    const col = collection(firestore, COLLECTIONS.LOGS_ACTUALIZACIONES);
    const constraints = [
      ...constraintsRangoTimestamp(desdeMs, hastaMs),
      orderBy('timestamp', 'desc'),
      limit(LOGS_SNAPSHOT_CAP),
    ];
    const q = query(col, ...constraints);

    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => docToLog(d.id, d.data()));
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
