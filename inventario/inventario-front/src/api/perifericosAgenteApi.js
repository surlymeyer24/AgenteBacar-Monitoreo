import { API_ORIGIN } from './config.js';
import { apiFetch } from './http.js';

const BASE_URL = `${API_ORIGIN}/api/perifericos/agente/listados`;

/** Cache en memoria: al navegar entre listados USB/audio del agente no se vuelve a pedir el mismo JSON. */
let cache = null;
let inflight = null;

export function invalidatePerifericosAgenteListadosCache() {
  cache = null;
  inflight = null;
}

function normalize(body) {
  const empty = { teclados: [], mouse: [], webcams: [], parlantes: [], microfonos: [] };
  if (!body || typeof body !== 'object') return empty;
  return {
    teclados: Array.isArray(body.teclados) ? body.teclados : [],
    mouse: Array.isArray(body.mouse) ? body.mouse : [],
    webcams: Array.isArray(body.webcams) ? body.webcams : [],
    parlantes: Array.isArray(body.parlantes) ? body.parlantes : [],
    microfonos: Array.isArray(body.microfonos) ? body.microfonos : [],
  };
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

/** Lectura síncrona del cache del módulo (para hidratar el contexto sin esperar un tick). */
export function peekCachedPerifericosAgenteListados() {
  if (!cache) return null;
  return clone(cache);
}

/** Precarga en segundo plano (p. ej. al abrir el menú Periféricos); ignora errores. */
export function prefetchPerifericosAgenteListados() {
  return fetchPerifericosAgenteListados().catch(() => {});
}

/**
 * Los cinco listados (teclados, mouse, webcams, parlantes, micrófonos) en una sola respuesta.
 * @param {{ bypassCache?: boolean }} [opts]
 */
export function fetchPerifericosAgenteListados(opts = {}) {
  const bypassCache = Boolean(opts.bypassCache);
  if (!bypassCache && cache) {
    return Promise.resolve(clone(cache));
  }
  if (!bypassCache && inflight) {
    return inflight;
  }

  inflight = apiFetch(BASE_URL)
    .then(async res => {
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!res.ok) {
        const detail =
          body && typeof body === 'object' && (body.message ?? body.error)
            ? String(body.message ?? body.error)
            : '';
        throw new Error(detail ? `${detail} (${res.status})` : `HTTP ${res.status}`);
      }
      cache = normalize(body);
      return clone(cache);
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
