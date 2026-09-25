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
