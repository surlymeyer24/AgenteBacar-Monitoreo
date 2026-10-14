import { normalizarTipoStock, esTipoInfra, labelTipoStock } from '../constants/tiposStock';
import { UBICACION_DEPOSITO_DEFAULT } from './stockPcHelpers';

const ESTADO_ASIGNADA = 'Asignada';

export function esEstadoAsignada(estado, estadoLabels = {}) {
  const e = (estado ?? '').trim();
  return e === ESTADO_ASIGNADA || e === estadoLabels.ASIGNADA;
}

/** Ítem de stock manual actualmente en custodia (PC o ubicación física). */
export function esItemAsignado(item, estadoLabels = {}) {
  if (!item) return false;
  const tipo = normalizarTipoStock(item.tipo);
  if (tipo === 'computadora') return false;

  if (esEstadoAsignada(item.estado, estadoLabels)) return true;

  if (item.computadoraUuid || item.computadoraHostname) return true;

  const ub = (item.ubicacion ?? '').trim().toLowerCase();
  if (esTipoInfra(tipo) && ub && ub !== UBICACION_DEPOSITO_DEFAULT) return true;

  return false;
}

export function esAsignacionInfra(item, estadoLabels = {}) {
  const tipo = normalizarTipoStock(item?.tipo);
  if (!esTipoInfra(tipo)) return false;
  return esItemAsignado(item, estadoLabels);
}

export function esAsignacionPeriferico(item, estadoLabels = {}) {
  const tipo = normalizarTipoStock(item?.tipo);
  if (tipo === 'computadora' || esTipoInfra(tipo)) return false;
  return esItemAsignado(item, estadoLabels);
}

export function destinoAsignacion(item) {
  if (item.computadoraUuid || item.computadoraHostname) {
    return {
      tipo: 'pc',
      label: item.computadoraHostname || item.computadoraUuid?.slice(0, 8) || 'PC',
      uuid: item.computadoraUuid || null,
    };
  }
  const ub = (item.ubicacion ?? '').trim();
  if (ub && ub.toLowerCase() !== UBICACION_DEPOSITO_DEFAULT) {
    return { tipo: 'ubicacion', label: ub, uuid: null };
  }
  return { tipo: 'desconocido', label: '—', uuid: null };
}

/** Fecha del último paso a Asignada en el historial IT. */
export function fechaAsignacionDesdeHistorial(item) {
  const historial = item?.historialEstados ?? [];
  let mejor = null;
  for (const entry of historial) {
    const nombre = entry?.estado?.nombre ?? entry?.estado;
    if (typeof nombre !== 'string') continue;
    if (!nombre.toLowerCase().includes('asignad')) continue;
    const raw = entry.fechaHoraInicio;
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    if (!mejor || d > mejor) mejor = d;
  }
  return mejor;
}

export function motivoAsignacionDesdeHistorial(item) {
  const historial = item?.historialEstados ?? [];
  for (let i = historial.length - 1; i >= 0; i -= 1) {
    const entry = historial[i];
    const nombre = entry?.estado?.nombre ?? entry?.estado;
    if (typeof nombre === 'string' && nombre.toLowerCase().includes('asignad')) {
      return (entry.motivo ?? '').trim() || null;
    }
  }
  return null;
}

export function fmtFechaAsignacion(item) {
  const d = fechaAsignacionDesdeHistorial(item);
  if (!d) return '—';
  return d.toLocaleString('es-AR');
}

export function resumenItemAsignado(item) {
  return item.nombre?.trim()
    || item.fabricante?.trim()
    || labelTipoStock(item.tipo)
    || item.id;
}

export function filtrarAsignados(lista, estadoLabels = {}) {
  return (lista ?? []).filter(item => esItemAsignado(item, estadoLabels));
}

/** Ítem aún en depósito (no en custodia / asignación activa). */
export function esItemEnBodega(item, estadoLabels = {}) {
  const tipo = normalizarTipoStock(item?.tipo);
  if (tipo === 'computadora') return false;
  return !esItemAsignado(item, estadoLabels);
}

export function filtrarEnBodega(lista, estadoLabels = {}) {
  return (lista ?? []).filter(item => esItemEnBodega(item, estadoLabels));
}
