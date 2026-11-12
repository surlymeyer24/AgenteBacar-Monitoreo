import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  initFirebase,
  isFirebaseConfigured,
  COLLECTIONS,
  CONFIG_DOCS,
} from '../lib/firebase';

const FALLBACK_URL =
  'https://github.com/surlymeyer24/HWAgente/releases/download/v5.0.0/AgenteBacar.exe';
const FALLBACK_VERSION = '5.0.0';

function trimStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

function etiquetaVersion(v) {
  const s = trimStr(v);
  if (!s) return null;
  return s.startsWith('v') ? s : `v${s}`;
}

/** Intenta sacar una etiqueta tipo v1.2.3 de URLs de GitHub Releases u otras rutas. */
function inferirVersionDeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    const idx = seg.findIndex(s => s === 'download');
    if (idx > 0) {
      const tag = seg[idx - 1];
      if (/^v?\d+\.\d+/.test(tag)) return etiquetaVersion(tag);
    }
  } catch {
    /* ignore */
  }
  const m = url.match(/(v?\d+\.\d+\.\d+)/);
  return m ? etiquetaVersion(m[1]) : null;
}

function nombreArchivoDesdeUrl(url) {
  if (!url) return 'AgenteBacar.exe';
  try {
    const last = new URL(url).pathname.split('/').pop();
    if (last && /\.(exe|msi)$/i.test(last)) return decodeURIComponent(last);
  } catch {
    /* ignore */
  }
  return 'AgenteBacar.exe';
}

function primerCampo(data, keys) {
  for (const k of keys) {
    const v = trimStr(data[k]);
    if (v) return v;
  }
  return '';
}

const defaultState = {
  urlDescarga: FALLBACK_URL,
  versionEtiqueta: etiquetaVersion(FALLBACK_VERSION),
  nombreArchivo: 'AgenteBacar.exe',
  loading: true,
};

/**
 * Lee en tiempo real el documento Firestore {@code config/agente_hw}.
 *
 * Campos canónicos: {@code url_descarga}, {@code version}, {@code nombre_archivo}.
 * Legacy aliases ({@code url}, {@code download_url}, {@code version_publicada},
 * {@code version_agente_publicada}) se mantienen como fallback de lectura para
 * docs que aún no fueron migrados; solo {@code url_descarga} y {@code version}
 * deben usarse en escrituras nuevas.
 */
export function useConfigAgenteDescarga() {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setState(s => ({ ...s, loading: false }));
      return undefined;
    }
    const fs = initFirebase();
    if (!fs) {
      setState(s => ({ ...s, loading: false }));
      return undefined;
    }
    const ref = doc(fs, COLLECTIONS.CONFIG, CONFIG_DOCS.AGENTE_HW);
    const unsub = onSnapshot(
      ref,
      snap => {
        const data = snap.exists() ? snap.data() : {};
        // Canonical → legacy fallback (para docs aún no migrados)
        const urlRaw = trimStr(data.url_descarga) || primerCampo(data, ['url', 'download_url']);
        const urlDescarga = urlRaw || FALLBACK_URL;
        const verRaw = trimStr(data.version) || primerCampo(data, ['version_publicada', 'version_agente_publicada']);
        let versionEtiqueta = verRaw ? etiquetaVersion(verRaw) : inferirVersionDeUrl(urlDescarga);
        if (!versionEtiqueta) versionEtiqueta = etiquetaVersion(FALLBACK_VERSION);
        const nombreArchivo =
          trimStr(data.nombre_archivo) || nombreArchivoDesdeUrl(urlDescarga);

        setState({
          urlDescarga,
          versionEtiqueta,
          nombreArchivo,
          loading: false,
        });
      },
      () => {
        setState({
          urlDescarga: FALLBACK_URL,
          versionEtiqueta: etiquetaVersion(FALLBACK_VERSION),
          nombreArchivo: 'AgenteBacar.exe',
          loading: false,
        });
      },
    );
    return () => unsub();
  }, []);

  return state;
}
