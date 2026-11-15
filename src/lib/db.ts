// Firestore (the student database). This file is loaded only after sign-in,
// so visitors who are not signed in never download the database code.
import {
  collection,
  doc,
  getDocs,
  initializeFirestore,
  memoryLocalCache,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { app } from '../firebase';
import { USE_EMULATORS } from '../config';

let db: Firestore | null = null;

function getDb(): Firestore {
  if (db) return db;
  if (!app) throw new Error('Firebase is not set up');
  db = USE_EMULATORS
    ? // The emulators are reached through the dev server (see vite.config.ts), so a preview link works too.
      initializeFirestore(app, {
        host: window.location.host,
        ssl: window.location.protocol === 'https:',
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
      })
    : // Keeps a copy on the device, so progress made offline is saved once back online.
      initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  return db;
}

/** Listen to one student's document. Returns a function that stops listening. */
export function watchUser(
  uid: string,
  onData: (exists: boolean, data: unknown) => void,
  onError: () => void,
): () => void {
  return onSnapshot(
    doc(getDb(), 'users', uid),
    (snap) => onData(snap.exists(), snap.exists() ? snap.data() : null),
    onError,
  );
}

/** Merge a change into a student's document. */
export function writeUser(uid: string, patch: Record<string, unknown>): Promise<void> {
  return setDoc(doc(getDb(), 'users', uid), patch, { merge: true });
}

/** Create a student's document on first sign-in. */
export function createUser(uid: string, data: Record<string, unknown>): Promise<void> {
  return setDoc(doc(getDb(), 'users', uid), data);
}

/** All students (admin page only; the security rules allow this only for admins). */
export async function listUsers(): Promise<unknown[]> {
  const snap = await getDocs(collection(getDb(), 'users'));
  return snap.docs.map((d) => d.data());
}
