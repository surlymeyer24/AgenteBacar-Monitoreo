import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const CONCILIACIONES_URL = `${API_ORIGIN}/api/conciliaciones`;

export async function fetchConciliaciones(params = {}) {
  const qs = new URLSearchParams();
  if (params.decision) qs.set('decision', params.decision);
  if (params.historicoCompleto) qs.set('historicoCompleto', 'true');
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch(`${CONCILIACIONES_URL}${suffix}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function fetchConciliacionPendientesCount() {
  return apiFetch(`${CONCILIACIONES_URL}/pendientes/count`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function confirmarConciliacion(id, body = {}) {
  return apiFetch(`${CONCILIACIONES_URL}/${encodeURIComponent(id)}/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function rechazarConciliacion(id, body = {}) {
  return apiFetch(`${CONCILIACIONES_URL}/${encodeURIComponent(id)}/rechazar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function posponerConciliacion(id) {
  return apiFetch(`${CONCILIACIONES_URL}/${encodeURIComponent(id)}/posponer`, {
    method: 'POST',
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function fetchStockSinAgente() {
  return apiFetch(`${CONCILIACIONES_URL}/stock-sin-agente`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
