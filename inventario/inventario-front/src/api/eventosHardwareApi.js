import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/eventos-hardware`;

function encId(id) {
  return encodeURIComponent(String(id ?? ''));
}

export function fetchEventosHardware(params = {}) {
  const qs = new URLSearchParams();
  if (params.estado) qs.set('estado', params.estado);
  if (params.uuid) qs.set('uuid', params.uuid);
  if (params.leido != null) qs.set('leido', String(params.leido));
  const query = qs.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return apiFetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function fetchEventoHardware(id) {
  const res = await apiFetch(`${BASE_URL}/${encId(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const body = await res.json(); if (body.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function fetchPendientesCount() {
  return apiFetch(`${BASE_URL}/pendientes-count`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarEventoHardware(id, body) {
  return apiFetch(`${BASE_URL}/${encId(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
