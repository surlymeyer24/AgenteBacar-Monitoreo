import { esCelularAsignadoDesdeStock, fechaAsignacionCelular } from '../constants/celulares';
import { normalizarTipoStock, esTipoInfra, labelTipoStock } from '../constants/tiposStock';
import { esPcPipelineStock, getPipelineColumn } from './pipelinePcHelpers';
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

/** PC de origen stock que está en la columna Asignada del pipeline. */
export function esPcAsignadaDesdeStock(pc, estadoLabels = {}) {
  if (!pc) return false;
  return esPcPipelineStock(pc) && getPipelineColumn(pc, estadoLabels) === 'asignada';
}

export function filtrarPcsAsignadasDesdeStock(pcs, estadoLabels = {}) {
  return (pcs ?? []).filter(pc => esPcAsignadaDesdeStock(pc, estadoLabels));
}

export function filtrarCelularesAsignadosDesdeStock(celulares) {
  return (celulares ?? []).filter(esCelularAsignadoDesdeStock);
}

export function fmtFechaValor(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-AR');
}

function textoBusqueda(parts) {
  return parts
    .filter(v => v != null && String(v).trim() !== '')
    .join(' ')
    .toLowerCase();
}

/** Fila común para periférico, infraestructura, PC o celular. */
export function filaDesdeItemStock(item, estadoLabels = {}) {
  const dest = destinoAsignacion(item);
  const motivo = motivoAsignacionDesdeHistorial(item);
  const tipoLabel = labelTipoStock(normalizarTipoStock(item.tipo));
  return {
    key: `stock:${item.id}`,
    origen: esAsignacionInfra(item, estadoLabels) ? 'infra' : 'periferico',
    titulo: resumenItemAsignado(item),
    subtituloId: item.id || null,
    subtituloExtra: item.numeroSerie ? `S/N: ${item.numeroSerie}` : null,
    tipoLabel,
    estadoActual: item.estado ?? null,
    destino: dest,
    fecha: fechaAsignacionDesdeHistorial(item),
    motivo,
    cantidad: item.cantidad ?? 1,
    linkTo: `/perifericos/stock/${encodeURIComponent(item.id)}`,
    puedeDevolver: true,
    busqueda: textoBusqueda([
      item.id,
      item.nombre,
      item.fabricante,
      item.numeroSerie,
      item.tipo,
      tipoLabel,
      dest.label,
      item.computadoraHostname,
      motivo,
    ]),
    raw: item,
  };
}

/** El listado liviano no trae historial: la fecha queda en null. */
export function filaDesdePcAsignada(pc) {
  const hostname = (pc?.hostname && String(pc.hostname).trim()) || pc?.uuid || 'Computadora';
  const responsable = (pc?.responsableInventario ?? '').trim();
  return {
    key: `pc:${pc.uuid}`,
    origen: 'pc',
    titulo: hostname,
    subtituloId: null,
    subtituloExtra: null,
    tipoLabel: 'Computadora',
    estadoActual: pc?.estadoActual ?? null,
    destino: { tipo: 'responsable', label: responsable || '—', uuid: null },
    fecha: null,
    motivo: null,
    cantidad: 1,
    linkTo: `/computadoras/${encodeURIComponent(pc.uuid)}`,
    puedeDevolver: false,
    busqueda: textoBusqueda([
      hostname,
      pc?.uuid,
      responsable,
      'computadora',
      pc?.estadoActual,
      pc?.ubicacion,
    ]),
    raw: pc,
  };
}

export function filaDesdeCelularAsignado(celular) {
  const marca = (celular?.marca ?? '').trim();
  const modelo = (celular?.modelo ?? '').trim();
  const titulo = [marca, modelo].filter(Boolean).join(' ') || 'Celular';
  const imei = (celular?.imei ?? '').trim();
  const responsable = (celular?.responsable ?? '').trim();
  const area = (celular?.area ?? '').trim();
  const destLabel = [responsable, area].filter(Boolean).join(' · ') || '—';
  return {
    key: `celular:${celular.id}`,
    origen: 'celular',
    titulo,
    subtituloId: null,
    subtituloExtra: imei ? `IMEI: ${imei}` : null,
    tipoLabel: 'Celular',
    estadoActual: null,
    destino: { tipo: 'responsable', label: destLabel, uuid: null },
    fecha: fechaAsignacionCelular(celular),
    motivo: null,
    cantidad: 1,
    linkTo: '/perifericos/celulares',
    puedeDevolver: true,
    busqueda: textoBusqueda([
      celular?.id,
      marca,
      modelo,
      titulo,
      imei,
      responsable,
      area,
      'celular',
    ]),
    raw: celular,
  };
}

export function armarFilasAsignaciones({
  items,
  pcs,
  celulares,
  estadoLabels = {},
}) {
  const stock = filtrarAsignados(items, estadoLabels).map(item => filaDesdeItemStock(item, estadoLabels));
  const dePcs = filtrarPcsAsignadasDesdeStock(pcs, estadoLabels).map(filaDesdePcAsignada);
  const deCelulares = filtrarCelularesAsignadosDesdeStock(celulares).map(filaDesdeCelularAsignado);
  return [...stock, ...dePcs, ...deCelulares];
}
