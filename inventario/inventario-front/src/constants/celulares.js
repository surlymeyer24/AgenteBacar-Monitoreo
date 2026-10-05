export const ESTADOS_CELULAR = ['activo', 'en_stock', 'baja'];

export const ESTADO_CELULAR_LABELS = {
  activo: 'Activo',
  en_stock: 'En stock',
  baja: 'Baja',
};

export const CONDICION_CELULAR_LABELS = {
  nuevo: 'Nuevo',
  usado: 'Usado',
};

export function normalizarEstadoCelular(raw) {
  if (!raw || !String(raw).trim()) return 'en_stock';
  const s = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'enstock') return 'en_stock';
  if (ESTADOS_CELULAR.includes(s)) return s;
  if (s.includes('stock')) return 'en_stock';
  if (s.includes('baja') || s.includes('inactiv')) return 'baja';
  return 'activo';
}

export function normalizarCondicionCelular(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'nuevo' || s === 'nueva') return 'nuevo';
  if (s === 'usado' || s === 'usada') return 'usado';
  return '';
}

export function normalizarConCargador(raw) {
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').trim().toLowerCase();
  if (['si', 'sí', 'true', '1', 'con', 'con cargador'].includes(s)) return true;
  if (['no', 'false', '0', 'sin', 'sin cargador'].includes(s)) return false;
  return null;
}

/** True si el celular está en depósito (`en_stock`). Null/vacío no cuenta. */
export function esCelularEnStock(celular) {
  if (celular == null || celular.estado == null || String(celular.estado).trim() === '') {
    return false;
  }
  return normalizarEstadoCelular(celular.estado) === 'en_stock';
}

/**
 * True solo si el celular está activo y salió del stock
 * (`asignadoDesdeStock === true`, o los strings `true` / `si`).
 */
export function esCelularAsignadoDesdeStock(celular) {
  if (celular == null) return false;
  if (normalizarEstadoCelular(celular.estado) !== 'activo') return false;
  return trazaAsignadoDesdeStock(celular.asignadoDesdeStock);
}

/** Date de `fechaAsignacion`, o null si falta o no parsea. */
export function fechaAsignacionCelular(celular) {
  const raw = celular?.fechaAsignacion;
  if (raw == null || String(raw).trim() === '') return null;
  const fecha = new Date(raw);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function trazaAsignadoDesdeStock(raw) {
  if (raw === true) return true;
  if (typeof raw !== 'string') return false;
  const s = raw.trim().toLowerCase();
  return s === 'true' || s === 'si' || s === 'sí';
}
