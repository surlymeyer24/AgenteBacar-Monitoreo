import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/sesion-bloqueos`;

export function fetchSesionBloqueos(limit = 500) {
  const qs = new URLSearchParams();
  if (limit) qs.set('limit', String(limit));
  const url = `${BASE_URL}?${qs.toString()}`;
  return apiFetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function sincronizarHistorialBloqueosInicial() {
  return apiFetch(`${API_ORIGIN}/api/admin/sesion-bloqueos/sincronizar-inicial`, {
    method: 'POST',
  }).then(async res => {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  });
}
