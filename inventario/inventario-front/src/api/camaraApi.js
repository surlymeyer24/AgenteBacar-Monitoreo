import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/camaras`;

function encId(id) {
  return encodeURIComponent(String(id ?? ''));
}

export function fetchCamaras(params = {}) {
  const q = new URLSearchParams();
  if (params.ubicacion) q.set('ubicacion', params.ubicacion);
  if (params.nvrId) q.set('nvrId', params.nvrId);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch(`${BASE_URL}${suffix}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchCamara(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function createCamara(body) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarCamara(id, data) {
  return apiFetch(`${BASE_URL}/${encId(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (res.status === 404) throw new Error('Cámara no encontrada');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function updateUbicacionCamara(id, ubicacion) {
  return apiFetch(`${BASE_URL}/${encId(id)}/ubicacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ubicacion }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Ubicación inválida');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function updateEstadoCamara(id, estado, motivo) {
  return apiFetch(`${BASE_URL}/${encId(id)}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, motivo }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Estado o motivo inválido');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchHistorialCamara(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}/historial`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** Asigna o quita NVR (`POST /api/camaras/:id/nvr`). Pasar `null` o `''` para desasignar. */
export function asignarNvrCamara(id, nvrId) {
  return apiFetch(`${BASE_URL}/${encId(id)}/nvr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nvrId: nvrId && String(nvrId).trim() ? String(nvrId).trim() : null }),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** DELETE /api/camaras/:id — borra el documento en Firestore. */
export function deleteCamara(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}`, { method: 'DELETE' }).then(res => {
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}
