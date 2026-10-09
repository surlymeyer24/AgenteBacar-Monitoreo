import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/perifericos-manuales`;

export function fetchPerifericosM() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchPerifericoM(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function createPerifericoM(body) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function actualizarPerifericoM(id, body) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/actualizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function asignarPerifericoM(id, computadoraUuid, motivo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ computadoraUuid, motivo }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchPerifericosPorPc(uuid) {
  return apiFetch(`${API_ORIGIN}/api/computadoras/${encodeURIComponent(uuid)}/perifericos-manuales`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function updateEstadoPerifericoM(id, estado, motivo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, motivo }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Estado o motivo inválido');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function createComboPerifericoM(body) {
  return apiFetch(`${BASE_URL}/combo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function deletePerifericoM(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}

export function asignarUbicacionM(id, ubicacion, motivo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/asignar-ubicacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ubicacion, motivo }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Datos inválidos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function bajaUnidadStockM(id, motivo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/baja-unidad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  }).then(async (res) => {
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo dar de baja la unidad');
    }
    if (res.status === 404) throw new Error('Ítem de stock no encontrado');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function devolverStockM(id, motivo) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}/devolver-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo: motivo || undefined }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('No se pudo devolver a stock');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function sacarUnidadStockM(loteId, body = {}) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(loteId)}/sacar-unidad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async res => {
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo sacar la unidad del stock');
    }
    if (res.status === 404) throw new Error('Ítem de stock no encontrado');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
