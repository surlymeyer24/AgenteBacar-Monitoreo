/** Valores del enum `EstadoOperativo` (backend) para el desplegable de cambio de estado. */
export const ESTADOS_OPERATIVOS = [
  'ASIGNADA',
  'SIN_ASIGNAR',
  'EN_MANTENIMIENTO',
  'BAJA',
  'ACTIVA',
  'INACTIVA'
];

/** Etiquetas en UI (alineadas con `EstadoOperativo.getNombre()`). */
export const ESTADO_OPERATIVO_LABELS = {
  ASIGNADA: 'Asignada',
  SIN_ASIGNAR: 'Sin Asignar',
  EN_MANTENIMIENTO: 'En mantenimiento',
  BAJA: 'Baja',
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva'
};
