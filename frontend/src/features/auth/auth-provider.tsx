'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { api, API_URL, ApiError, configureApiClient } from '@/lib/api-client';
import type { Me } from '@/types';

export const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE === 'dev' ? 'dev' : 'firebase';
const DEV_KEY = 'ahl.devUid';
/** Session (Firebase ID + refresh token) for this browser tab session only. */
const SESSION_KEY = 'ahl.session';
/** Idle timeout for shared laboratory workstations. */
const IDLE_MS = 30 * 60_000;
/** Refresh the ID token this long before it expires. */
const REFRESH_EARLY_MS = 5 * 60_000;

interface Session {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: Me | null;
  can: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  devSignIn: (uid: string) => Promise<void>;
  signOut: (reason?: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Stores a new session (e.g. after a password change). */
  setSession: (s: { idToken: string; refreshToken: string; expiresIn: number }) => void;
}

const AuthContext = React.createContext<AuthState | null>(null);

const readSession = (): Session | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

/** Public auth endpoints are called with plain fetch (the API client would ask for a token). */
async function authPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the laboratory server. Check your connection and try again.');
  }
  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: { code: string; message: string } } | null;
  if (!res.ok || !json?.success) throw new ApiError(res.status, json?.error?.code ?? 'HTTP_ERROR', json?.error?.message ?? `Request failed (${res.status})`);
  return json.data as T;
}

/**
 * Staff sign-in. In production mode the browser sends the email and password to OUR
 * server, which signs in with Firebase Authentication and returns Firebase tokens — so a
 * browser that cannot reach googleapis.com (extensions, proxies, filters) can still sign in.
 * Every API call carries the Firebase ID token, which the server verifies.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<AuthState['status']>('loading');
  const [user, setUser] = React.useState<Me | null>(null);
  const session = React.useRef<Session | null>(null);
  const refreshing = React.useRef<Promise<Session | null> | null>(null);
  const devUid = React.useRef<string | null>(null);

  const storeSession = React.useCallback((s: { idToken: string; refreshToken: string; expiresIn: number } | null) => {
    if (!s) {
      session.current = null;
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
      return;
    }
    session.current = { idToken: s.idToken, refreshToken: s.refreshToken, expiresAt: Date.now() + s.expiresIn * 1000 };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.current)); } catch { /* private mode */ }
  }, []);

  const getToken = React.useCallback(async () => {
    if (AUTH_MODE === 'dev') return devUid.current ? `dev:${devUid.current}` : null;
    const s = session.current;
    if (!s) return null;
    if (s.expiresAt - Date.now() > REFRESH_EARLY_MS) return s.idToken;
    // One refresh at a time, shared by all requests waiting for a token.
    refreshing.current ??= authPost<{ idToken: string; refreshToken: string; expiresIn: number }>('/auth/token-refresh', { refreshToken: s.refreshToken })
      .then((r) => { storeSession(r); return session.current; })
      .catch(() => { storeSession(null); return null; })
      .finally(() => { refreshing.current = null; });
    return (await refreshing.current)?.idToken ?? null;
  }, [storeSession]);

  const clear = React.useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const loadMe = React.useCallback(async () => {
    try {
      setUser(await api.get<Me>('/auth/me'));
      setStatus('authenticated');
    } catch (err) {
      clear();
      if (err instanceof ApiError && err.code === 'ACCOUNT_NOT_PROVISIONED') toast.error(err.message);
      throw err;
    }
  }, [clear]);

  const signOut = React.useCallback(
    async (reason?: string) => {
      await api.post('/auth/session-events', { event: 'logout' }).catch(() => undefined);
      if (AUTH_MODE === 'dev') {
        devUid.current = null;
        sessionStorage.removeItem(DEV_KEY);
      } else {
        storeSession(null);
      }
      clear();
      if (reason) toast.info(reason);
      router.replace('/login');
    },
    [clear, router, storeSession],
  );

  React.useEffect(() => {
    configureApiClient({
      getToken,
      onUnauthenticated: (code) => {
        if (code === 'SESSION_EXPIRED' || code === 'UNAUTHENTICATED') void signOut('Your session has ended. Please sign in again.');
      },
    });
  }, [getToken, signOut]);

  // Restore session
  React.useEffect(() => {
    if (AUTH_MODE === 'dev') {
      devUid.current = sessionStorage.getItem(DEV_KEY);
      if (devUid.current) loadMe().catch(() => sessionStorage.removeItem(DEV_KEY));
      else setStatus('unauthenticated');
      return;
    }
    session.current = readSession();
    if (session.current) loadMe().catch(() => storeSession(null));
    else setStatus('unauthenticated');
  }, [loadMe, storeSession]);

  // Idle logout
  React.useEffect(() => {
    if (status !== 'authenticated') return;
    let timer = setTimeout(() => void signOut('Signed out after 30 minutes of inactivity.'), IDLE_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void signOut('Signed out after 30 minutes of inactivity.'), IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [status, signOut]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      storeSession(await authPost<{ idToken: string; refreshToken: string; expiresIn: number }>('/auth/password-login', { email: email.trim(), password }));
      await loadMe();
      await api.post('/auth/session-events', { event: 'login' }).catch(() => undefined);
    },
    [loadMe, storeSession],
  );

  const devSignIn = React.useCallback(
    async (uid: string) => {
      devUid.current = uid;
      sessionStorage.setItem(DEV_KEY, uid);
      await loadMe();
      await api.post('/auth/session-events', { event: 'login' }).catch(() => undefined);
    },
    [loadMe],
  );

  const value = React.useMemo<AuthState>(
    () => ({ status, user, can: (p) => !!user?.permissions.includes(p), signIn, devSignIn, signOut, refresh: loadMe, setSession: storeSession }),
    [status, user, signIn, devSignIn, signOut, loadMe, storeSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
