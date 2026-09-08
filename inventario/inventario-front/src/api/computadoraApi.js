import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/computadoras`;

export function fetchComputadoras(params = {}) {
  const q = new URLSearchParams();
  if (params.ubicacion) q.set('ubicacion', params.ubicacion);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch(`${BASE_URL}${suffix}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchComputadorasRecientes(limit = 8) {
  return apiFetch(`${BASE_URL}/recientes?limit=${limit}`).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchComputadora(uuid) {
  return apiFetch(`${BASE_URL}/${uuid}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function updateUbicacion(uuid, ubicacion) {
  return apiFetch(`${BASE_URL}/${uuid}/ubicacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ubicacion }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Ubicación inválida');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** POST /api/computadoras/{uuid}/responsable-inventario — asignación IT (persona); vacío desasigna. */
export function updateResponsableInventario(uuid, responsableInventario) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/responsable-inventario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responsableInventario:
        responsableInventario == null || responsableInventario === ''
          ? null
          : String(responsableInventario),
    }),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function updateEstado(uuid, estado, motivo, extras = {}) {
  return apiFetch(`${BASE_URL}/${uuid}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, motivo, ...extras }),
  }).then(res => {
    if (res.status === 404) return null;
    if (res.status === 400) throw new Error('Estado o motivo inválido');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** POST /api/computadoras/{uuid}/datos-stock — actualiza datos editables en depósito. */
export function updateDatosStock(uuid, body) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/datos-stock`, {
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

/** POST /api/computadoras/{uuid}/ingresar-stock — ingreso atómico a stock (datos + estado SIN_ASIGNAR). */
export function ingresarStock(uuid, body) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/ingresar-stock`, {
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

export function fetchHistorial(uuid) {
  return apiFetch(`${BASE_URL}/${uuid}/historial`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** POST /api/computadoras — crea una PC; el UUID lo genera el servidor. */
export function createComputadora(body) {
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

/** DELETE /api/computadoras/{uuid} — elimina la PC en Firestore (incl. subcolección programas). */
export function deleteComputadora(uuid) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(res => {
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}

function postPeriferico(uuid, segmento, body) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}${segmento}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function agregarImpresora(uuid, body) {
  return postPeriferico(uuid, '/perifericos/impresoras', body);
}

export function agregarMonitor(uuid, body) {
  return postPeriferico(uuid, '/perifericos/monitores', body);
}

export function agregarDispositivoUsb(uuid, body) {
  return postPeriferico(uuid, '/perifericos/usb', body);
}

export function agregarAudioEntrada(uuid, body) {
  return postPeriferico(uuid, '/perifericos/audio/entrada', body);
}

export function agregarAudioSalida(uuid, body) {
  return postPeriferico(uuid, '/perifericos/audio/salida', body);
}

async function parseErrorBody(res) {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

/** POST /api/computadoras/{uuid}/armar-combo */
export function armarCombo(uuid, body) {
  const id = encodeURIComponent(uuid);
  return apiFetch(`${BASE_URL}/${id}/armar-combo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async res => {
    if (res.status === 404) return null;
    if (res.status === 409 || res.status === 400) {
      throw new Error(await parseErrorBody(res));
    }
    if (!res.ok) throw new Error(await parseErrorBody(res));
    return res.json();
  });
}

/** GET /api/computadoras/{uuid}/perifericos-stock-disponibles */
export function fetchPerifericosStockDisponibles(uuid, tipos = []) {
  const id = encodeURIComponent(uuid);
  const q = new URLSearchParams();
  for (const t of tipos) {
    if (t) q.append('tipos', t);
  }
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch(`${BASE_URL}/${id}/perifericos-stock-disponibles${suffix}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}
