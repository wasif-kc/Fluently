import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { USE_EMULATORS } from '../config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

function isPhone(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

const QUIET_ERRORS = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).catch((e: { code?: string }) => {
      if (!QUIET_ERRORS.has(e.code ?? '')) setError(e.code ?? 'unknown');
    });
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!auth || !USE_EMULATORS) return;
    // Test helper for the local emulator only: sign in without a Google popup.
    (window as unknown as Record<string, unknown>).__fluentlyTestSignIn = async (email: string, name: string) => {
      const sub = email.replace(/[^a-z0-9]/gi, '').slice(0, 20);
      const cred = GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true, name }));
      await signInWithCredential(auth!, cred);
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) return;
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (isPhone()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? 'unknown';
      if (QUIET_ERRORS.has(code)) return; // the student closed the window: nothing to say
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return;
      }
      setError(code);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await fbSignOut(auth);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, error, signIn, signOut, clearError: () => setError(null) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
