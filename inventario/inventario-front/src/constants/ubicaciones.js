/** Etiqueta legible para un valor de ubicación (enum con guiones bajos o texto libre). */
export function labelUbicacionEnum(key) {
  if (!key) return '—';
  return String(key).replace(/_/g, ' ');
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

/** Nombres del enum `Ubicacion` (backend Java, `com.bacarsa.inventario.models.Ubicacion`). */
export const UBICACIONES_COMPUTADORA = [
  'ADMINISTRACION',
  'MONITOREO',
  'TESORERIA',
  'CAPITAL_HUMANO',
  'SISTEMAS',
  'SEGURIDAD_PRIVADA',
  'OPERACIONES',
];

/** Nombres del enum `UbicacionRed` (routers / switches). */
export const UBICACIONES_RED = [
  'RACK_PRINCIPAL',
  'RACK_SECUNDARIO',
  'ADMINISTRACION',
  'MONITOREO',
  'SISTEMAS',
  'GUARDIA',
];

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

/** Alias: listado combinado para combos y datalist. */
export const UBICACIONES_CAMARA = UBICACIONES_CAMARA_SUGERIDAS;
