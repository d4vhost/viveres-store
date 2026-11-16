import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Los valores de ejemplo de .env.example no cuentan como configuración real.
const PLACEHOLDER_KEYS = ['TU_API_KEY', 'AIzaSy...'];
const PLACEHOLDER_PROJECTS = ['tu-proyecto'];

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !PLACEHOLDER_KEYS.includes(firebaseConfig.apiKey) &&
    !PLACEHOLDER_PROJECTS.includes(firebaseConfig.projectId),
);

function createFirestore(): Firestore {
  const app = initializeApp(firebaseConfig);
  try {
    // Caché persistente: la app sigue funcionando sin internet y sincroniza al volver.
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    console.warn('Sin persistencia offline de Firestore, se usa caché en memoria.', err);
    return getFirestore(app);
  }
}

/** Firestore si hay credenciales en .env; `null` significa modo local (IndexedDB). */
export const firestore: Firestore | null = isFirebaseConfigured ? createFirestore() : null;
