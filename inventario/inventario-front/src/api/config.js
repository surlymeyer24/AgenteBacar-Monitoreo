/** Origen del backend Spring (sin barra final). Producción: VITE_API_ORIGIN en build (obligatorio en vite.config.js). */
const defaultDevOrigin = 'http://localhost:8081';

function trimOrigin(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  return String(raw).replace(/\/$/, '');
}

const fromEnv = trimOrigin(import.meta.env.VITE_API_ORIGIN);

export const API_ORIGIN =
  fromEnv || (import.meta.env.DEV ? defaultDevOrigin : '');
