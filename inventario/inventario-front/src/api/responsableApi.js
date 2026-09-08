import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/responsables`;

export function fetchResponsables() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchResponsableDetalle(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function reconstruirResponsables() {
  return apiFetch(`${BASE_URL}/reconstruir`, { method: 'POST' }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}
