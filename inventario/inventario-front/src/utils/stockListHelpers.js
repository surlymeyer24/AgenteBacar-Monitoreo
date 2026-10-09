export function resolveTipoEquipoPc(pc) {
  const te = pc?.tipoEquipo;
  if (typeof te === 'string' && te.trim()) return te.trim();
  if (te && typeof te === 'object' && te.tipo) return String(te.tipo).trim();
  return pc?.especificacionEsperada?.tipoEquipo?.trim() || '';
}

export function resolveCondicionPc(pc) {
  return pc?.condicion?.trim()
    || pc?.especificacionEsperada?.condicion?.trim()
    || '';
}

export function getCategoryColor(category) {
  switch (category?.toLowerCase()) {
    case 'computadora': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'camara_ip': return 'bg-teal-50 text-teal-700 border-teal-100';
    case 'teclado': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    case 'mouse': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'monitor': return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'impresora': return 'bg-amber-50 text-amber-700 border-amber-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
}

export function getUbicacionStock(pc) {
  return pc?.ubicacionStock?.trim() || null;
}
