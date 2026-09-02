import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/etiquetas-qr`;

export function fetchEtiquetasQr() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchEtiquetaQr(uuid) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchEtiquetaQrPorHostname(hostname) {
  const h = encodeURIComponent(hostname);
  return apiFetch(`${BASE_URL}/por-hostname/${h}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchProgresosLogistica() {
  return apiFetch(`${BASE_URL}/progreso`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchProgresoLogistica(uuid) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/progreso`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarProgresoLogistica(uuid, cambio) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/progreso`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambio),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarProgresoLogisticaMasivo({ uuids, fases, completado }) {
  return apiFetch(`${BASE_URL}/progreso`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuids, fases, completado }),
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
