import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { firebaseConfig, FIREBASE_READY, USE_EMULATORS } from './config';

export const app = FIREBASE_READY ? initializeApp(firebaseConfig) : null;

// Sign-in. The Google popup/redirect helper is passed only when the student presses
// "Continue with Google" (see state/auth.tsx). Setting it here would make phones download
// Google's sign-in helper on every visit, even when nobody signs in.
export const auth = app
  ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] })
  : null;
if (auth && USE_EMULATORS) connectAuthEmulator(auth, window.location.origin, { disableWarnings: true });

let dbModule: Promise<typeof import('./lib/db')> | null = null;

/** Loads the database code (once). Only signed-in students need it. */
export function loadDb(): Promise<typeof import('./lib/db')> {
  if (!dbModule) {
    dbModule = import('./lib/db').catch((e) => {
      dbModule = null;
      throw e;
    });
  }
  return dbModule;
}

const HINT_KEY = 'fluently:signedIn';

/** Remember on this device that someone is signed in, so the database code can start loading straight away next time. */
export function setSignedInHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(HINT_KEY, '1');
    else localStorage.removeItem(HINT_KEY);
  } catch {
    /* storage blocked: ignore */
  }
}

export function hasSignedInHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}
