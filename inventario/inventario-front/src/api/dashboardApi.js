import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

/** GET estadísticas agregadas (por defecto http://localhost:8081/api/dashboard/stats). */
const STATS_URL = `${API_ORIGIN}/api/dashboard/stats`;

export function fetchDashboardStats() {
  return apiFetch(STATS_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
