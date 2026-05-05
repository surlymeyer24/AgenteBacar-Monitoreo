import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured, mensajeFirebaseNoConfig, COLLECTIONS } from '../lib/firebase';

function docToTarea(id, data) {
  return {
    id,
    titulo: data.titulo ?? null,
    descripcion: data.descripcion ?? null,
    estado: data.estado ?? null,
    maquinaId: data.maquinaId ?? null,
    hostname: data.hostname ?? null,
    fechaHora: data.fechaHora ?? null,
    log: data.log ?? null,
    logs: Array.isArray(data.logs) ? data.logs : null,
    resultado: data.resultado ?? null,
  };
}

export function useTareasHW() {
  const [tareas, setTareas] = useState([]);
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
    const col = collection(firestore, COLLECTIONS.HW_TAREAS);
    const unsub = onSnapshot(
      col,
      snap => {
        const list = snap.docs.map(d => docToTarea(d.id, d.data()));
        setTareas(list);
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

  return { tareas, loading, error };
}
