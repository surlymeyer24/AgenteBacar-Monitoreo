import { useState } from 'react';
import { API_ORIGIN } from '../api/config.js';
import { apiFetch } from '../api/http.js';

const BASE_URL = `${API_ORIGIN}/api/computadoras`;

async function mensajeErrorHttp(res) {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    /* cuerpo no JSON */
  }
  if (res.status === 401) return 'Sesión expirada o no autorizada. Volvé a iniciar sesión.';
  if (res.status === 404) return 'PC no encontrada en el backend.';
  return `Error del servidor (HTTP ${res.status})`;
}

/**
 * Envía un comando a múltiples PCs a través del backend (colección `tareas` en Firestore).
 *
 * @param {string[]} computadoraIds
 * @param {string} comando  "ACTUALIZAR_DATOS" | "ACTUALIZAR_AGENTE" | "RESETEAR_ID"
 * @returns {Promise<{ ok: boolean, enviados?: number, message?: string }>}
 */
export async function enviarComandoAMaquinas(computadoraIds, comando) {
  if (computadoraIds.length === 0) return { ok: true, enviados: 0 };
  if (!API_ORIGIN) {
    return {
      ok: false,
      message: 'Backend no configurado. Definí VITE_API_ORIGIN o ejecutá el servidor en localhost:8081.',
    };
  }
  try {
    const res = await apiFetch(`${BASE_URL}/comando-masivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids: computadoraIds, comando }),
    });
    if (!res.ok) {
      return { ok: false, message: await mensajeErrorHttp(res) };
    }
    const data = await res.json();
    return { ok: true, enviados: data.enviados ?? computadoraIds.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al enviar comando';
    if (msg === 'Failed to fetch') {
      return { ok: false, message: 'No se pudo contactar al backend. Verificá que esté en ejecución y VITE_API_ORIGIN.' };
    }
    return { ok: false, message: msg };
  }
}

/**
 * Hook para enviar un comando a una única PC (usa comando-masivo con un solo UUID).
 *
 * @param {string} computadoraId  UUID de la PC
 */
export function useComandoHW(computadoraId) {
  const [sendingComando, setSendingComando] = useState(null);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const enviar = async (comando) => {
    if (!computadoraId) return { ok: false, message: 'Sin UUID de computadora' };
    setSendingComando(comando);
    setError(null);
    setOkMsg(null);
    const res = await enviarComandoAMaquinas([computadoraId], comando);
    setSendingComando(null);
    if (res.ok) {
      setOkMsg('Comando enviado al agente.');
    } else {
      setError(res.message ?? 'Error al enviar comando');
    }
    return res;
  };

  return {
    enviarActualizarDatos: () => enviar('ACTUALIZAR_DATOS'),
    enviarActualizarAgente: () => enviar('ACTUALIZAR_AGENTE'),
    sendingComando,
    sending: sendingComando !== null,
    error,
    okMsg,
  };
}
