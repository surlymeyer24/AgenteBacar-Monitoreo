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
  'router',
  'switch',
  'access_point',
  'telefono_ip',
  'otro',
];

const LABELS_TIPO_STOCK = {
  camara_ip: 'Cámara IP',
  access_point: 'Access Point',
  telefono_ip: 'Teléfono IP',
};

const TIPOS_INFRA_SET = new Set([
  'router', 'switch', 'access_point', 'telefono_ip', 'camara_ip',
]);

export function esTipoInfra(tipo) {
  return TIPOS_INFRA_SET.has(normalizarTipoStock(tipo));
}

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
