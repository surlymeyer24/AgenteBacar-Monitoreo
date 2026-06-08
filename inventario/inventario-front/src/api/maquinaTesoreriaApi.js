import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/maquinas-tesoreria`;

export function fetchMaquinas(tipo) {
  const url = tipo ? `${BASE_URL}?tipo=${encodeURIComponent(tipo)}` : BASE_URL;
  return apiFetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchMaquina(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearMaquina(data) {
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

export function actualizarMaquina(id, data) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (res.status === 404) throw new Error('Máquina no encontrada');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function cambiarEstadoMaquina(id, body) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Estado o motivo inválido');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
