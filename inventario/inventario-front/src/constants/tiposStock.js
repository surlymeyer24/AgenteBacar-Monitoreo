/** Categorías canónicas de stock manual (periféricos / ítems de inventario). */
export const TIPOS_STOCK = [
  'computadora',
  'camara_ip',
  'teclado',
  'mouse',
  'monitor',
  'impresora',
  'webcam',
  'parlante',
  'microfono',
  'otro',
];

const LABELS_TIPO_STOCK = {
  camara_ip: 'Cámara IP',
};

/** Normaliza a minúsculas; si no está en la lista canónica, devuelve el valor normalizado igual. */
export function normalizarTipoStock(tipo) {
  return (tipo ?? '').trim().toLowerCase();
}

export function labelTipoStock(tipo) {
  const t = normalizarTipoStock(tipo);
  if (!t) return '';
  if (LABELS_TIPO_STOCK[t]) return LABELS_TIPO_STOCK[t];
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Opciones del select; incluye el valor actual si es un tipo legado fuera de la lista. */
export function opcionesTipoStock(tipoActual) {
  const actual = normalizarTipoStock(tipoActual);
  if (actual && !TIPOS_STOCK.includes(actual)) {
    return [...TIPOS_STOCK, actual];
  }
  return TIPOS_STOCK;
}
