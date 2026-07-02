import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { isApiConfigured } from '@/constants/api';
import { setApiAuthToken } from '@/lib/apiClient';
import { onUnauthorized } from '@/lib/authEvents';
import {
  loginRequest,
  logoutRequest,
  registerRequest,
  type AuthUser,
} from '@/services/remote/authApi';
import { WrongAppRoleError } from '@/utils/authErrors';

const AUTH_STORAGE_KEY = 'mirafood-auth-session';

export type AuthSession = {
  token: string;
  user: AuthUser & { patientId?: string };
  expiresAt: number;
  onboardingComplete?: boolean;
};

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function jwtExpiresAt(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    if (typeof payload.exp === 'number') return payload.exp * 1000;
  } catch {
    /* fallback */
  }
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function mapSession(data: Awaited<ReturnType<typeof loginRequest>>): AuthSession {
  const patientId = data.user.patientId ?? data.consumerProfile?.patientId;
  return {
    token: data.token,
    user: { ...data.user, patientId },
    expiresAt: jwtExpiresAt(data.token),
    onboardingComplete: data.consumerProfile?.onboardingComplete,
  };
}

async function readStoredSession(): Promise<AuthSession | null> {
  if (!isApiConfigured()) return null;
  const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.token || session.expiresAt <= Date.now()) {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function persistSession(session: AuthSession | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    setApiAuthToken(null);
    return;
  }
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
  setApiAuthToken(session.token);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback(async (next: AuthSession | null) => {
    await persistSession(next);
    setSession(next);
  }, []);

  useEffect(() => {
    readStoredSession()
      .then(async (stored) => {
        if (stored) {
          setApiAuthToken(stored.token);
          setSession(stored);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    return onUnauthorized(() => {
      void applySession(null);
    });
  }, [applySession]);

  useEffect(() => {
    if (!session) return;
    if (session.expiresAt <= Date.now()) {
      void applySession(null);
      return;
    }
    const timeoutMs = session.expiresAt - Date.now();
    const timer = setTimeout(() => {
      void applySession(null);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [session, applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginRequest(email, password);
      if (data.user.role !== 'consumer') {
        throw new WrongAppRoleError(data.user.role);
      }
      await applySession(mapSession(data));
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string, referralCode?: string) => {
      const data = await registerRequest(email, password, displayName, referralCode);
      await applySession(mapSession(data));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    await applySession(null);
  }, [applySession]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session && session.expiresAt > Date.now()),
      login,
      register,
      logout,
    }),
    [session, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
