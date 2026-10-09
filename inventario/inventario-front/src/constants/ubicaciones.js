/** Alias legacy (enum/Firestore) → codigo del catálogo `ubicaciones_computadora`. */
const UBICACION_CODIGO_ALIASES = {
  seguridadprivad: 'seguridad_privada',
};

/** Fallback alineado al seed Java cuando el catálogo aún no cargó. */
export const UBICACIONES_COMPUTADORA_LABELS = {
  ADMINISTRACION: 'Administración',
  MONITOREO: 'Monitoreo',
  TESORERIA: 'Tesorería',
  CAPITAL_HUMANO: 'Capital Humano',
  SISTEMAS: 'Sistemas',
  SEGURIDAD_PRIVADA: 'Seguridad Privada',
  SEGURIDADPRIVAD: 'Seguridad Privada',
  OPERACIONES: 'Operaciones',
};

/** Normaliza un valor guardado en entidad → codigo snake_case del catálogo. */
export function codigoCatalogoDesdeValor(valor) {
  if (!valor) return '';
  const lower = String(valor).trim().toLowerCase().replace(/-/g, '_');
  return UBICACION_CODIGO_ALIASES[lower] ?? lower;
}

/**
 * Label legible para ubicación de PC: prioriza items del catálogo, luego fallback fijo.
 * @param {string} key valor en Firestore (ej. SEGURIDAD_PRIVADA)
 * @param {Array<{codigo:string,label:string}>} [catalogItems] items de useCatalogo('ubicaciones_computadora')
 */
export function labelUbicacion(key, catalogItems) {
  if (!key) return '—';
  const raw = String(key).trim();
  const codigo = codigoCatalogoDesdeValor(raw);

  if (catalogItems?.length) {
    const item = catalogItems.find(i => i.codigo === codigo);
    if (item?.label) return item.label;
  }

  const enumKey = raw.toUpperCase().replace(/-/g, '_');
  if (UBICACIONES_COMPUTADORA_LABELS[enumKey]) {
    return UBICACIONES_COMPUTADORA_LABELS[enumKey];
  }

  return raw.includes('_') ? raw.replace(/_/g, ' ') : raw;
}

/** @deprecated Preferir labelUbicacion(key, catalogItems). */
export function labelUbicacionEnum(key) {
  return labelUbicacion(key);
}

/**
 * Compara ubicación del documento con el filtro elegido.
 * Normaliza mayúsculas para tolerar datos antiguos y selección en el combo.
 */
export function coincideUbicacionFiltro(valorDoc, codigoFiltro) {
  if (!codigoFiltro || !String(codigoFiltro).trim()) return true;
  const v = (valorDoc ?? '').toString().trim().toUpperCase();
  const f = String(codigoFiltro).trim().toUpperCase();
  return v === f;
}

/** Valores históricos de cámara (antes de ubicación libre en API). */
export const UBICACIONES_CAMARA_LEGACY = [
  'GUARDIA',
  'MONITOREO',
  'ADMINISTRACION',
  'TESORERIA',
  'CAPITAL_HUMANO',
  'SISTEMAS',
  'SEGURIDADPRIVADA',
  'ESTACIONAMIENTO',
  'CALLE1',
  'CALLE2',
];

/**
 * Puntos de cámara importados desde inventario (columna «nombre camara»).
 * La API acepta cualquier texto; esta lista alimenta sugerencias en formularios.
 */
export const UBICACIONES_CAMARA_IMPORTADAS = [
  'ADM GER PAS',
  'Administracion Rack',
  'Box Entrega',
  'Buzon',
  'Buzon2',
  'CobroExpress',
  'Depositario Buzon',
  'Domo Santiago',
  'Egreso',
  'Espera Boxes',
  'Estanco adentro',
  'Guarda IZQ',
  'Guardia',
  'INGTES',
  'IP Domo',
  'Ingreso',
  'Ingreso Olmos',
  'IngresoSistemas',
  'Monitoreo Rack',
  'Olmos D',
  'Olmos1',
  'Olmos2',
  'OlmosI',
  'Patio Interno',
  'Planta',
  'Planta 2',
  'Planta 3',
  'Planta 4',
  'Planta 5',
  'Planta 6',
  'Playa',
  'Playa 2',
  'Porton Ingreso',
  'Puerta Chapa',
  'Puerta Sala De Armas',
  'Puerta Taller',
  'Puerta Tesoreria',
  'PuertaRoja',
  'Recepcion',
  'Reja Monitoreo',
  'Sala De Armas Afuera',
  'Sala de Armas',
  'Sala de Armas 2',
  'Salida',
  'salidaTes',
  'Santiago 1',
  'Santiago 2',
  'Santiago 3',
  'TES1',
  'TES2',
  'Taller1',
  'Taller2',
  'Taller3',
  'Taller4',
  'TallerDepo',
  'TallerPañol',
];

const _camaraSugeridasSet = new Set([
  ...UBICACIONES_CAMARA_LEGACY,
  ...UBICACIONES_CAMARA_IMPORTADAS,
]);

/** Sugerencias para alta/edición de cámaras (legacy + importación). */
export const UBICACIONES_CAMARA_SUGERIDAS = [..._camaraSugeridasSet].sort((a, b) =>
  String(a).localeCompare(String(b), 'es'),
);
