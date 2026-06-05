import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Mismas claves que usa `src/lib/firebase.js`. Permite `.env` en la raíz del front o en `src/` (Vite solo lee la raíz por defecto). */
const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (mode === 'production' && !env.VITE_API_ORIGIN?.trim()) {
    throw new Error(
      'Build de producción: define VITE_API_ORIGIN (URL HTTPS pública del backend, sin barra final). ' +
        'Copia inventario-front/.env.production.example a .env.production y ajusta el valor.',
    );
  }

  const envRoot = loadEnv(mode, __dirname, '');
  const envSrc = loadEnv(mode, path.join(__dirname, 'src'), '');
  function mergeFirebaseKey(key) {
    const a = envRoot[key];
    const b = envSrc[key];
    const raw = (a != null && String(a).trim() !== '') ? a : b;
    return raw != null ? String(raw).trim() : '';
  }

  /** @type {Record<string, string>} */
  const defineFirebase = {};
  for (const key of FIREBASE_ENV_KEYS) {
    defineFirebase[`import.meta.env.${key}`] = JSON.stringify(mergeFirebaseKey(key));
  }

  return {
    define: defineFirebase,
    plugins: [react(), tailwindcss()],
    build: {
      outDir: '../public',
      emptyOutDir: true,
    },
  };
});
