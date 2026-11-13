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

/**
 * Criterio único de "unidad en depósito" (contador del encabezado y tabla de Depósito).
 * Los estados llegan con formatos distintos según la colección de origen
 * ("Sin Asignar", "SIN_ASIGNAR", "en_stock", "EN_DEPOSITO"...), por eso se excluye
 * lo que no está en depósito en vez de enumerar lo que sí.
 */
export function esUnidadEnDeposito(u) {
  if ((u?.cantidad ?? 1) <= 0) return false;
  const e = (u?.estadoDeposito || u?.estado || '').toUpperCase();
  if (e.includes('BAJA') || e.includes('RETIR')) return false;
  // ACTIV cubre "ACTIVA" (movimientos) y "activo" (celular asignado).
  if (e.includes('ASIGNAD') || e.includes('ACTIV') || e.includes('OPERATIV')) return false;
  return true;
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

export function puedeArmarPcStock(pc) {
  return pc.origenAlta === 'STOCK' && pc.estadoPreparacion === 'SIN_ARMAR';
}

export function formatearNombreEquipo(item) {
  if (!item) return '—';
  const desc = item.descripcionCompleta || item.descripcionStock;
  const marca = (item.marca || '').trim();
  const modelo = (item.modelo || '').trim();

  let mm = [marca, modelo].filter(Boolean).join(' ');
  if (marca && modelo && marca.toLowerCase() === modelo.toLowerCase()) {
    mm = marca;
  }

  const esGenerico = !mm || /pc\s*clon/i.test(mm);

  if (desc && esGenerico) {
    return desc;
  }
  if (desc && mm) {
    return `${mm} · ${desc}`;
  }
  return desc || mm || item.tipo || '—';
}
