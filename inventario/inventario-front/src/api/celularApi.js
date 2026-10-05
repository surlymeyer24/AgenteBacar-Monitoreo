import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';
import {
  normalizarConCargador,
  normalizarCondicionCelular,
} from '../constants/celulares.js';

const BASE_URL = `${API_ORIGIN}/api/celulares`;

async function parseErrorBody(res, fallback) {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
  } catch {
    /* respuesta sin JSON */
  }
  return fallback || `HTTP ${res.status}`;
}

export function fetchCelulares() {
  return apiFetch(BASE_URL).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function fetchCelular(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`).then(res => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export function crearCelular(body) {
  return apiFetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async res => {
    if (res.status === 400 || res.status === 409) {
      throw new Error(await parseErrorBody(res, 'Datos inválidos'));
    }
    if (!res.ok) throw new Error(await parseErrorBody(res));
    return res.json();
  });
}

export function actualizarCelular(id, body) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async res => {
    if (res.status === 400 || res.status === 409) {
      throw new Error(await parseErrorBody(res, 'Datos inválidos'));
    }
    if (res.status === 404) throw new Error('Celular no encontrado');
    if (!res.ok) throw new Error(await parseErrorBody(res));
    return res.json();
  });
}

export function deleteCelular(id) {
  return apiFetch(`${BASE_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(res => {
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  });
}

/**
 * Cuerpo PUT completo a partir del celular actual (el backend exige marca, modelo,
 * IMEI, cargador y condición; no se pueden omitir en un update).
 */
function cuerpoDesdeCelular(celular, extras) {
  if (celular == null || !celular.id) {
    throw new Error('Celular inválido: falta id');
  }
  const imei = celular.imei == null ? '' : String(celular.imei).trim();
  const conCargador = normalizarConCargador(celular.conCargador);
  const condicion = normalizarCondicionCelular(celular.condicion);
  const marca = celular.marca == null ? '' : String(celular.marca).trim();
  const modelo = celular.modelo == null ? '' : String(celular.modelo).trim();
  if (!marca || !modelo || !imei || conCargador == null || !condicion) {
    throw new Error(
      'El celular no tiene marca, modelo, IMEI, cargador y condición completos. Completalos en el listado de celulares antes de asignar o devolver.',
    );
  }
  const linea = celular.lineaNumero == null ? '' : String(celular.lineaNumero).trim();
  return {
    marca,
    modelo,
    imei,
    conCargador,
    condicion,
    lineaNumero: linea || undefined,
    ...extras,
  };
}

/**
 * Asigna un celular en stock a un responsable: estado `activo` y traza
 * `asignadoDesdeStock: true`. El backend fija `fechaAsignacion` (ISO-8601).
 * Hay que pasar el objeto actual (GET/listado) para no perder IMEI/cargador/condición.
 *
 * @param {object} celular — documento actual (`id` obligatorio)
 * @param {{ responsable: string, area?: string }} opts
 * @returns {Promise<object>} CelularDTO actualizado
 * @throws {Error} 400/409 con el mensaje del backend, o validación local
 */
export function asignarCelular(celular, { responsable, area } = {}) {
  try {
    const nombre = responsable == null ? '' : String(responsable).trim();
    if (!nombre) {
      throw new Error('El responsable es obligatorio para asignar el celular');
    }
    const areaActual = celular?.area == null ? '' : String(celular.area).trim();
    const areaNueva = area == null ? '' : String(area).trim();
    const body = cuerpoDesdeCelular(celular, {
      responsable: nombre,
      area: areaNueva || areaActual || 'Depósito',
      estado: 'activo',
      asignadoDesdeStock: true,
    });
    return actualizarCelular(celular.id, body);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Devuelve el celular al depósito: estado `en_stock` y sin responsable.
 * El backend limpia la traza (`asignadoDesdeStock: false`, `fechaAsignacion: null`).
 * `asignadoDesdeStock: false` va explícito; con `en_stock` el servidor igual la borra.
 * Conserva marca/modelo/IMEI/cargador/condición/línea/área.
 *
 * @param {object} celular — documento actual (`id` obligatorio)
 * @returns {Promise<object>} CelularDTO actualizado
 * @throws {Error} 400/409 con el mensaje del backend, o validación local
 */
export function devolverCelularAStock(celular) {
  try {
    const areaActual = celular?.area == null ? '' : String(celular.area).trim();
    const body = cuerpoDesdeCelular(celular, {
      responsable: undefined,
      area: areaActual || 'Depósito',
      estado: 'en_stock',
      asignadoDesdeStock: false,
    });
    return actualizarCelular(celular.id, body);
  } catch (err) {
    return Promise.reject(err);
  }
}
