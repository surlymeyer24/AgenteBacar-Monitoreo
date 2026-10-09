export const ESTADOS_TELEVISOR = ['activo', 'en_stock', 'baja'];

export function normalizarEstadoTelevisor(raw) {
  if (!raw || !String(raw).trim()) return 'activo';
  const s = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'enstock') return 'en_stock';
  if (ESTADOS_TELEVISOR.includes(s)) return s;
  if (s.includes('stock')) return 'en_stock';
  if (s.includes('baja') || s.includes('inactiv')) return 'baja';
  return 'activo';
}
