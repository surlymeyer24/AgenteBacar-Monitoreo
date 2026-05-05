import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/nvrs`;

function encId(id) {
  return encodeURIComponent(String(id ?? ''));
}

export function fetchNvrs() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchNvr(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearNvr(data) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** Cámaras vinculadas a una NVR (`GET /api/nvrs/:id/camaras`). */
export function fetchCamarasPorNvr(nvrId) {
  return apiFetch(`${BASE_URL}/${encId(nvrId)}/camaras`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
