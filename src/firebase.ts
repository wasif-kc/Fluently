import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, FIREBASE_READY, USE_EMULATORS } from './config';

export const app = FIREBASE_READY ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

let firestore: Firestore | null = null;
if (app) {
  if (USE_EMULATORS) {
    // The emulators are reached through the dev server (see vite.config.ts), so a preview link works too.
    firestore = initializeFirestore(app, {
      host: window.location.host,
      ssl: window.location.protocol === 'https:',
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    });
    if (auth) connectAuthEmulator(auth, window.location.origin, { disableWarnings: true });
  } else {
    // Keeps a copy on the device, so progress made offline is saved once back online.
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
}
export const db = firestore;
