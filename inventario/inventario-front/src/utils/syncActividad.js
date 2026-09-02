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

function syncTimestampToMs(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Epoch en segundos (p. ej. exportaciones antiguas)
    return raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw.toDate === 'function') {
    const t = raw.toDate().getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof raw === 'object') {
    if (typeof raw.seconds === 'number') {
      return raw.seconds * 1000 + Math.floor((raw.nanoseconds ?? 0) / 1e6);
    }
    if (typeof raw._seconds === 'number') {
      return raw._seconds * 1000 + Math.floor((raw._nanoseconds ?? 0) / 1e6);
    }
  }
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Normaliza timestamps de Firestore/API a ISO string para la UI y cálculos de sync. */
export function normalizarUltimaSincronizacion(raw) {
  const ms = syncTimestampToMs(raw);
  if (ms === null) return null;
  return new Date(ms).toISOString();
}

/**
 * Edad en ms desde ultimaSincronización; null si no hay fecha válida.
 */
export function edadUltimaSyncMs(c) {
  const raw = c?.ultimaSincronizacion ?? c?.ultima_sincronizacion;
  const ms = syncTimestampToMs(raw);
  if (ms === null) return null;
  const age = Date.now() - ms;
  if (age < 0) return null;
  return age;
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

export function tituloSyncDot(n) {
  if (n === 'activo') {
    return `Sync reciente (ciclo agente ~${CICLO_SYNC_AGENTE_MINUTOS} min; menos de ~${MINUTOS_LABEL_UMBRAL_ACTIVO} min)`;
  }
  if (n === 'intermedio') {
    return `Última sync entre ~${MINUTOS_LABEL_UMBRAL_ACTIVO} minutos y 1 hora`;
  }
  if (n === 'sin_actividad') return 'Sin sync hace más de 1 hora';
  return 'Sin datos de última sincronización';
}

/** Solo sync reciente (verde). Ignora estado_conexion ONLINE desactualizado. */
export function esSyncActivo(c) {
  return nivelActividadSync(c) === 'activo';
}

/** Estilos inline equivalentes a syncDotClass (lista de computadoras). */
export function syncDotInlineStyle(nivel) {
  const base = { flexShrink: 0, width: 10, height: 10, borderRadius: '50%' };
  if (nivel === 'activo') {
    return { ...base, backgroundColor: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' };
  }
  if (nivel === 'intermedio') {
    return { ...base, backgroundColor: '#fbbf24' };
  }
  if (nivel === 'sin_datos') {
    return { ...base, backgroundColor: '#cbd5e1' };
  }
  return { ...base, backgroundColor: '#f87171' };
}
