import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function trimValorEnv(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function readEnv(key) {
  return trimValorEnv(import.meta.env[key]);
}

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

let db = null;

export function isFirebaseConfigured() {
  return !!(firebaseConfig.projectId && firebaseConfig.apiKey);
}

/** Texto de ayuda si falta configuración (sin secretos). */
export function mensajeFirebaseNoConfig() {
  const faltan = [];
  if (!firebaseConfig.apiKey) faltan.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) faltan.push('VITE_FIREBASE_PROJECT_ID');
  return (
    `Faltan o están vacías: ${faltan.join(', ')}. ` +
    'Revisá que cada variable empiece con VITE_. Podés usar .env en la carpeta inventario-front (raíz, junto a package.json) o en inventario-front/src. ' +
    'Detené y volvé a ejecutar npm run dev para que Vite cargue los cambios.'
  );
}

/**
 * Instancia única de la app Firebase (Firestore + Auth comparten la misma app).
 * @returns {import('firebase/app').FirebaseApp | null}
 */
export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

/**
 * Auth (email/contraseña). Null si falta configuración.
 * @returns {import('firebase/auth').Auth | null}
 */
export function getFirebaseAuth() {
  const application = getFirebaseApp();
  return application ? getAuth(application) : null;
}

/** @returns {import('firebase/firestore').Firestore | null} */
export function initFirebase() {
  if (db) return db;
  const application = getFirebaseApp();
  if (!application) return null;
  try {
    db = getFirestore(application);
    return db;
  } catch (e) {
    console.error('Firebase init error:', e);
    return null;
  }
}

export const COLLECTIONS = {
  CONFIG: 'config',
  HW_COMPUTADORAS: 'computadoras',
  HW_TAREAS: 'tareas',
  LOGS_ACTUALIZACIONES: 'logs_actualizaciones',
  USUARIOS: 'usuarios',
};

/** IDs de documentos en {@link COLLECTIONS.CONFIG} (solo lectura desde el front; reglas Firestore). */
export const CONFIG_DOCS = {
  /** URL pública del instalador y versión mostrada en Sistema → Descarga del agente. */
  AGENTE_HW: 'agente_hw',
};
