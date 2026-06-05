import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/servidores`;

function encId(id) {
  return encodeURIComponent(String(id ?? ''));
}

export function fetchServidores() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchServidor(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearServidor(body) {
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

export function actualizarServidor(id, body) {
  return apiFetch(`${BASE_URL}/${encId(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function eliminarServidor(id) {
  return apiFetch(`${BASE_URL}/${encId(id)}`, { method: 'DELETE' }).then(res => {
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}
