import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/impresoras`;

/** Lista de impresoras físicas agrupadas por nombre/driver/puerto, con PCs por cada grupo. */
export function fetchImpresorasAgrupadas() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
