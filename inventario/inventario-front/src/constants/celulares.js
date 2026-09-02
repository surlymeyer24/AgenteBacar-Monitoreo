export const ESTADOS_CELULAR = ['activo', 'en_stock', 'baja'];

export const ESTADO_CELULAR_LABELS = {
  activo: 'Activo',
  en_stock: 'En stock',
  baja: 'Baja',
};

export function normalizarEstadoCelular(raw) {
  if (!raw || !String(raw).trim()) return 'activo';
  const s = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'enstock') return 'en_stock';
  if (ESTADOS_CELULAR.includes(s)) return s;
  if (s.includes('stock')) return 'en_stock';
  if (s.includes('baja') || s.includes('inactiv')) return 'baja';
  return 'activo';
}
