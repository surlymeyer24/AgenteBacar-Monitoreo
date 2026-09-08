import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/catalogos`;

export function fetchCatalogo(catalogoId, incluirInactivos = false) {
  const q = incluirInactivos ? '?incluirInactivos=true' : '';
  return apiFetch(`${BASE_URL}/${encodeURIComponent(catalogoId)}${q}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearCatalogoItem(catalogoId, data) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(catalogoId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async res => {
    if (res.status === 400) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || 'Datos inválidos');
    }
    if (res.status === 409) throw new Error('Ya existe un item con ese código.');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarCatalogoItem(catalogoId, codigo, data) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(catalogoId)}/${encodeURIComponent(codigo)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async res => {
    if (res.status === 404) throw new Error('Item no encontrado.');
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function cambiarActivoCatalogoItem(catalogoId, codigo, activo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(catalogoId)}/${encodeURIComponent(codigo)}/activo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo }),
  }).then(res => {
    if (res.status === 404) throw new Error('Item no encontrado.');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
