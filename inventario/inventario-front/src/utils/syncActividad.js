/**
 * Ciclo base del agente: datos dinámicos ligeros (CPU, RAM, discos, red, seguridad) cada ~5 min.
 * El sync en verde usa este intervalo + un margen por jitter de red/reloj.
 */
export const CICLO_SYNC_AGENTE_MINUTOS = 5;

const MS_CICLO_AGENTE = CICLO_SYNC_AGENTE_MINUTOS * 60 * 1000;
/** Permite perder un ciclo completo (ej. congestión) sin pasar de verde a ámbar de inmediato. */
const CICLOS_PARA_SYNC_VERDE = 2;
/** Margen por jitter de red/reloj después de los ciclos contados. */
const MS_MARGEN_SYNC_ACTIVO = 90 * 1000;
const MS_UMBRAL_SYNC_ACTIVO = CICLOS_PARA_SYNC_VERDE * MS_CICLO_AGENTE + MS_MARGEN_SYNC_ACTIVO;

const MS_1_H = 60 * 60 * 1000;

/** Entero para textos de UI (“menos de ~X min”). */
export const MINUTOS_LABEL_UMBRAL_ACTIVO = Math.ceil(MS_UMBRAL_SYNC_ACTIVO / 60000);

/**
 * Edad en ms desde ultimaSincronización; null si no hay fecha válida.
 */
export function edadUltimaSyncMs(c) {
  const raw = c?.ultimaSincronizacion ?? c?.ultima_sincronizacion;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Date.now() - raw;
  }
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  return Date.now() - t;
}

/**
 * Actividad del agente según última sync (alineado al dashboard Java).
 * - activo (sync verde): hasta 2× ciclo (~10 min) + margen (~11,5 min)
 * - intermedio (ámbar): más allá de ese umbral hasta 1 h
 * - sin_actividad (rojo): más de 1 h desde la última sync
 * - sin_datos (gris): sin timestamp de sync
 */
export function nivelActividadSync(c) {
  const age = edadUltimaSyncMs(c);
  if (age === null) return 'sin_datos';
  if (age < MS_UMBRAL_SYNC_ACTIVO) return 'activo';
  if (age > MS_1_H) return 'sin_actividad';
  return 'intermedio';
}
