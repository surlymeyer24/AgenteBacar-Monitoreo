import { API_ORIGIN } from './config';
import { apiFetch } from './http';

export async function fetchUnidadesStock() {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: no se pudieron cargar las unidades de stock`);
  }
  return res.json();
}

export async function fetchUnidadStock(codigo) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades/${encodeURIComponent(codigo)}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: no se encontró la unidad ${codigo}`);
  }
  return res.json();
}

export async function altaUnidadStock(data) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}: no se pudo dar de alta la unidad`);
  }
  return res.json();
}

export async function modificarUnidadStock(codigo, data) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades/${encodeURIComponent(codigo)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}: no se pudo modificar la unidad ${codigo}`);
  }
  return res.json();
}

export async function bajaUnidadStock(codigo, motivo) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades/${encodeURIComponent(codigo)}/baja`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}: no se pudo dar de baja la unidad ${codigo}`);
  }
  return res.json();
}

export async function asignarUnidadStock(codigo, { responsable, area, motivo }) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades/${encodeURIComponent(codigo)}/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responsable, area, motivo }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}: no se pudo asignar la unidad ${codigo}`);
  }
  return res.json();
}

export async function devolverUnidadStock(codigo, { motivo } = {}) {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/unidades/${encodeURIComponent(codigo)}/devolver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}: no se pudo devolver la unidad ${codigo}`);
  }
  return res.json();
}

export async function fetchAsignacionesStock() {
  const res = await apiFetch(`${API_ORIGIN}/api/stock/asignaciones`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: no se pudieron cargar las asignaciones`);
  }
  return res.json();
}
