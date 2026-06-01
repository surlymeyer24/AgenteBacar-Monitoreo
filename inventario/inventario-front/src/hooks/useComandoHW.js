import { useState } from 'react';
import { API_ORIGIN } from '../api/config.js';
import { apiFetch } from '../api/http.js';

const BASE_URL = `${API_ORIGIN}/api/computadoras`;

/**
 * Envía un comando a múltiples PCs a través del backend (no escribe directo a Firestore).
 * Reemplaza el writeBatch del SDK cliente.
 *
 * @param {string[]} computadoraIds
 * @param {string} comando  "ACTUALIZAR_DATOS" | "ACTUALIZAR_AGENTE"
 * @returns {Promise<{ ok: boolean, enviados?: number, message?: string }>}
 */
export async function enviarComandoAMaquinas(computadoraIds, comando) {
  if (computadoraIds.length === 0) return { ok: true, enviados: 0 };
  try {
    const res = await apiFetch(`${BASE_URL}/comando-masivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids: computadoraIds, comando }),
    });
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, enviados: data.enviados };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Error al enviar comando' };
  }
}

/**
 * Hook para enviar un comando a una única PC a través del backend.
 * Reemplaza el setDoc del SDK cliente.
 *
 * @param {string} computadoraId  UUID de la PC
 */
export function useComandoHW(computadoraId) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const enviar = async (comando) => {
    if (!computadoraId) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiFetch(`${BASE_URL}/${encodeURIComponent(computadoraId)}/comando`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comando }),
      });
      if (res.status === 404) {
        setError('PC no encontrada');
      } else if (!res.ok) {
        setError(`HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar comando');
    } finally {
      setSending(false);
    }
  };

  return {
    enviarActualizarDatos: () => enviar('ACTUALIZAR_DATOS'),
    enviarActualizarAgente: () => enviar('ACTUALIZAR_AGENTE'),
    sending,
    error,
  };
}
