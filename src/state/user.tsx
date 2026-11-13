import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './auth';
import { DEFAULT_SETTINGS, deepMerge, type Settings, type UserDoc } from '../lib/progress';
import { readLocal, writeLocal } from '../lib/storage';

type Status = 'loading' | 'signed-out' | 'needs-setup' | 'ready' | 'error';
export type Patch = Record<string, unknown>;

interface UserState {
  status: Status;
  uid: string | null;
  email: string;
  googleName: string;
  data: UserDoc | null;
  /** Save a change. With delayMs, several quick changes are saved together. */
  update: (patch: Patch, opts?: { delayMs?: number }) => void;
  /** Save anything still waiting (used before sign-out). */
  flush: () => Promise<void>;
  createProfile: (name: string, optIn: boolean) => Promise<void>;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
}

const UserCtx = createContext<UserState | null>(null);

const SETTINGS_KEY = 'fluently:settings';

/** Apply the font, text size and dark mode to the page, and keep a copy on this device. */
function applySettings(s: Settings) {
  const root = document.documentElement;
  if (s.dark) root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  root.setAttribute('data-font', s.font);
  root.style.setProperty('--text-scale', String(s.textSize / 100));
  writeLocal(SETTINGS_KEY, s);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [server, setServer] = useState<UserDoc | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  // Changes waiting for the debounce timer, and changes sent but not yet seen in a snapshot.
  const [unsent, setUnsent] = useState<Patch>({});
  const [sent, setSent] = useState<Patch>({});
  const unsentRef = useRef<Patch>({});
  const timer = useRef<number | null>(null);
  const [localSettings, setLocalSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}),
  }));

  const uid = user?.uid ?? null;

  useEffect(() => {
    setServer(null);
    setExists(null);
    setFailed(false);
    setUnsent({});
    setSent({});
    unsentRef.current = {};
    if (!uid || !db) return;
    const ref = doc(db, 'users', uid);
    return onSnapshot(
      ref,
      (snap) => {
        setExists(snap.exists());
        setServer(snap.exists() ? (snap.data() as UserDoc) : null);
        setSent({});
      },
      () => setFailed(true),
    );
  }, [uid]);

  const write = useCallback(
    (patch: Patch) => {
      if (!uid || !db || Object.keys(patch).length === 0) return Promise.resolve();
      setSent((s) => deepMerge(s, patch));
      return setDoc(doc(db, 'users', uid), patch, { merge: true }).catch(() => {
        /* offline writes are queued by Firestore; other failures show up in the snapshot listener */
      });
    },
    [uid],
  );

  const flush = useCallback(async () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const patch = unsentRef.current;
    unsentRef.current = {};
    setUnsent({});
    await write(patch);
  }, [write]);

  const update = useCallback(
    (patch: Patch, opts?: { delayMs?: number }) => {
      if (opts?.delayMs) {
        unsentRef.current = deepMerge(unsentRef.current, patch);
        setUnsent(unsentRef.current);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void flush(), opts.delayMs);
        return;
      }
      // Anything waiting goes out with this change.
      const all = deepMerge(unsentRef.current, patch);
      unsentRef.current = {};
      setUnsent({});
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      void write(all);
    },
    [flush, write],
  );

  // Save waiting changes when the page is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const onPageHide = () => void flush();
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  const data = useMemo(() => {
    if (!server) return null;
    return deepMerge(deepMerge(server, sent), unsent);
  }, [server, sent, unsent]);

  // Record the visit once per session.
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (uid && exists && seen.current !== uid) {
      seen.current = uid;
      void write({ lastSeenAt: Date.now() });
    }
  }, [uid, exists, write]);

  const settings: Settings = useMemo(
    () => (data?.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : localSettings),
    [data?.settings, localSettings],
  );

  useEffect(() => applySettings(settings), [settings]);

  const setSettings = useCallback(
    (s: Partial<Settings>) => {
      const next = { ...settings, ...s };
      setLocalSettings(next);
      if (data) update({ settings: next });
      else applySettings(next);
    },
    [settings, data, update],
  );

  const createProfile = useCallback(
    async (name: string, optIn: boolean) => {
      if (!uid || !db || !user) return;
      const now = Date.now();
      const fresh: UserDoc = {
        name: name.trim().slice(0, 30),
        email: user.email ?? '',
        createdAt: now,
        lastSeenAt: now,
        emailOptIn: optIn,
        emailOptInAt: optIn ? now : null,
        tourDone: false,
        settings: localSettings,
        streak: { count: 0, lastDay: '' },
        last: null,
        grammar: {},
      };
      await setDoc(doc(db, 'users', uid), fresh);
    },
    [uid, user, localSettings],
  );

  let status: Status;
  if (loading) status = 'loading';
  else if (!user) status = 'signed-out';
  else if (failed) status = 'error';
  else if (exists === null) status = 'loading';
  else if (!exists) status = 'needs-setup';
  else status = 'ready';

  const value: UserState = {
    status,
    uid,
    email: user?.email ?? '',
    googleName: user?.displayName ?? '',
    data,
    update,
    flush,
    createProfile,
    settings,
    setSettings,
  };

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser(): UserState {
  const v = useContext(UserCtx);
  if (!v) throw new Error('useUser must be used inside UserProvider');
  return v;
}
