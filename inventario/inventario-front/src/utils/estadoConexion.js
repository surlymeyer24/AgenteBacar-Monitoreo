import { nivelActividadSync } from './syncActividad';

/**
 * Texto de conexión del agente para la UI.
 * Si hubo sincronización dentro del umbral verde del front (2× ciclo ~5 min + margen ≈ ~12 min), Activo: el campo
 * estadoConexion puede ir desfasado respecto de ultimaSincronizacion.
 * Si no, usa estadoAgente del backend; si no viene (API vieja), infiere desde el valor crudo.
 */
export function textoConexionAgente(c) {
  if (nivelActividadSync(c) === 'activo') return 'Activo';
  if (c?.estadoAgente) return c.estadoAgente;
  const raw = c?.estadoConexion ?? c?.estado_conexion;
  if (raw == null || String(raw).trim() === '') return 'Desconectado';
  return String(raw).trim().toUpperCase() === 'ONLINE' ? 'Activo' : 'Desconectado';
}
