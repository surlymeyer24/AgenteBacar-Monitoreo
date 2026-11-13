import { labelTipoStock, normalizarTipoStock } from '../constants/tiposStock';

function textoEstado(estado) {
  if (estado && typeof estado === 'object') {
    return estado.nombre ?? estado.Nombre ?? '';
  }
  return estado ?? '';
}

/** Estado operativo Baja (nombre de catálogo, etiqueta «Baja» o clave BAJA). */
export function esEstadoOperativoBaja(estado, estadoLabels = {}) {
  const e = String(textoEstado(estado)).trim();
  if (!e) return false;
  if (e === 'Baja' || (estadoLabels.BAJA && e === estadoLabels.BAJA)) return true;
  return e.toUpperCase().replace(/\s+/g, '_') === 'BAJA';
}

function entradaVigente(entry) {
  if (entry?.activo === true) return true;
  if (entry?.activo === false) return false;
  return entry?.fechaHoraFin == null || entry?.fechaHoraFin === '';
}

/**
 * Tramo de Baja del historial, si el objeto ya lo trae.
 * Sin historial devuelve desde/motivo vacíos: no se inventan.
 */
export function tramoBajaDesdeHistorial(item, estadoLabels = {}) {
  const historial = Array.isArray(item?.historialEstados) ? item.historialEstados : [];
  let ultima = null;
  for (let i = historial.length - 1; i >= 0; i -= 1) {
    const entry = historial[i];
    if (!esEstadoOperativoBaja(textoEstado(entry?.estado), estadoLabels)) continue;
    const tramo = {
      desde: entry?.fechaHoraInicio || null,
      motivo: (entry?.motivo ?? '').trim() || null,
    };
    if (entradaVigente(entry)) return tramo;
    if (!ultima) ultima = tramo;
  }
  return ultima ?? { desde: null, motivo: null };
}

function nombreManual(item) {
  return item?.nombre?.trim()
    || item?.fabricante?.trim()
    || labelTipoStock(item?.tipo)
    || item?.id
    || 'Sin nombre';
}

/**
 * Filas de solo lectura: computadoras en Baja y periféricos manuales en Baja.
 * Una PC en Sin asignar / disponible no entra.
 */
export function armarFilasBaja({ pcs = [], manuales = [], estadoLabels = {} } = {}) {
  const filasPc = [];
  for (const pc of pcs) {
    if (!esEstadoOperativoBaja(pc?.estadoActual, estadoLabels)) continue;
    const tramo = tramoBajaDesdeHistorial(pc, estadoLabels);
    const hostname = (pc?.hostname ?? '').trim();
    filasPc.push({
      id: `pc:${pc?.uuid || hostname || filasPc.length}`,
      href: pc?.uuid ? `/computadoras/${encodeURIComponent(pc.uuid)}` : null,
      nombre: hostname || 'Sin hostname',
      clase: 'Computadora',
      cantidad: 1,
      estado: 'Baja',
      desde: tramo.desde,
      motivo: tramo.motivo,
    });
  }

  const filasManual = [];
  for (const item of manuales) {
    if (!esEstadoOperativoBaja(item?.estado, estadoLabels)) continue;
    const tramo = tramoBajaDesdeHistorial(item, estadoLabels);
    const tipo = normalizarTipoStock(item?.tipo);
    const clase = tipo === 'computadora' ? 'Lote de PCs' : (labelTipoStock(item?.tipo) || 'Componente');
    const cantidad = Number(item?.cantidad);
    filasManual.push({
      id: `manual:${item?.id || filasManual.length}`,
      href: item?.id ? `/perifericos/stock/${encodeURIComponent(item.id)}` : null,
      nombre: nombreManual(item),
      clase,
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
      estado: 'Baja',
      desde: tramo.desde,
      motivo: tramo.motivo,
    });
  }

  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
  filasPc.sort(porNombre);
  filasManual.sort(porNombre);
  return [...filasPc, ...filasManual];
}
