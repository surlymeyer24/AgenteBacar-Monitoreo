import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/usuarios`;

export function fetchUsuarios() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchUsuario(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchUsuarioMe() {
  return apiFetch(`${BASE_URL}/me`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) {
      // El status viaja en el error para que quien llame pueda reintentar solo fallas transitorias.
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  });
}

export function lookupUsuarioAuth(email) {
  const q = encodeURIComponent(email.trim());
  return apiFetch(`${BASE_URL}/lookup-auth?email=${q}`).then(async res => {
    if (res.status === 404) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || 'No hay cuenta Firebase con ese correo.');
    }
    if (res.status === 409) throw new Error('Ese usuario ya está registrado.');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearUsuario(data) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (res.status === 409) throw new Error('Ese usuario ya está registrado en el inventario.');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarUsuario(id, data) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function eliminarUsuario(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  });
}
