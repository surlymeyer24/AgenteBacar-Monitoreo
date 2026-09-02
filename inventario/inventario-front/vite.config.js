import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png', 'icons/apple-touch-icon.png'],
        manifest: {
          id: '/etiquetas-qr',
          name: 'Etiquetas QR Bacar',
          short_name: 'Etiquetas QR',
          description: 'Fichas y checklist de etiquetas QR del inventario IT Bacar.',
          lang: 'es-AR',
          start_url: '/etiquetas-qr',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0e0f36',
          theme_color: '#0e0f36',
          icons: [
            { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          globIgnores: ['**/xlsx-*.js', '**/pdf-*.js', '**/charts-*.js'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: {
      outDir: '../public',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('jspdf')) return 'pdf';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('qrcode')) return 'qrcode';
            return 'vendor';
          },
        },
      },
    },
  };
});
