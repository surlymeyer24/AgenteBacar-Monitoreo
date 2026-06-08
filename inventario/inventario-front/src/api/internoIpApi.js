import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/internos`;

/**
 * Obtener todos los internos IP
 */
export async function fetchInternos() {
  const res = await apiFetch(BASE_URL);
  if (!res.ok) throw new Error('Error fetching internos');
  return res.json();
}

/**
 * Obtener interno IP por ID
 */
export async function fetchInternoById(id) {
  const res = await apiFetch(`${BASE_URL}/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Error fetching interno by id');
  }
  return res.json();
}

/**
 * Crear interno IP (uno solo)
 */
export async function createInterno(data) {
  const res = await apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creating interno');
  return res.text(); // returns ID
}

/**
 * Crear internos IP (masivo)
 */
export async function createBulkInternos(dataArray) {
  const res = await apiFetch(`${BASE_URL}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataArray),
  });
  if (!res.ok) throw new Error('Error creating internos in bulk');
  return res.text(); // returns count
}

/**
 * Actualizar interno IP (parcial/completo)
 */
export async function updateInterno(id, data) {
  const res = await apiFetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating interno');
  return res.text(); // OK
}

/**
 * Cambiar estado de interno IP
 */
export async function cambiarEstadoInterno(id, payload) {
  const res = await apiFetch(`${BASE_URL}/${id}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // { estado, motivo }
  });
  if (!res.ok) throw new Error('Error changing state');
  return res.text(); // OK
}

/**
 * Obtener historial de estados del interno
 */
export async function fetchHistorialInterno(id) {
  const res = await apiFetch(`${BASE_URL}/${id}/historial`);
  if (!res.ok) throw new Error('Error fetching history');
  return res.json();
}

/**
 * Eliminar interno IP
 */
export async function deleteInterno(id) {
  const res = await apiFetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting interno');
  return res.text(); // OK
}
