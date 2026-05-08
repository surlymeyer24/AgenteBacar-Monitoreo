import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/monitores`;

/** Monitores del agente con PC de origen — una sola respuesta del servidor (sin N+1). */
export function fetchMonitoresReportadosAgente() {
  return apiFetch(BASE_URL).then(async res => {
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      const detail =
        body && typeof body === 'object' && (body.message ?? body.error)
          ? String(body.message ?? body.error)
          : '';
      throw new Error(detail ? `${detail} (${res.status})` : `HTTP ${res.status}`);
    }
    return Array.isArray(body) ? body : [];
  });
}
