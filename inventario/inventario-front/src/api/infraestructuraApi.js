import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/infraestructura`;

/**
 * Actualiza o migra un equipo de red (router / switch / access point) conservando el ID.
 */
export function cambiarTipoInfraestructura(payload) {
  return apiFetch(`${BASE_URL}/cambiar-tipo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async res => {
    if (res.status === 400) {
      const msg = await res.text();
      throw new Error(msg || 'Datos inválidos');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchDuplicadosInfraestructura() {
  return apiFetch(`${BASE_URL}/duplicados`).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function limpiarDuplicadosInfraestructura() {
  return apiFetch(`${BASE_URL}/limpiar-duplicados`, { method: 'POST' }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
