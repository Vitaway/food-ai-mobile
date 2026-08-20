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

import { clearNutritionData, clearProfileData } from '@/services/local/storage';
import { isApiConfigured } from '@/constants/api';
import { setApiAuthToken } from '@/lib/apiClient';
import { onUnauthorized } from '@/lib/authEvents';
import {
  loginRequest,
  logoutRequest,
  registerRequest,
  fetchMeRequest,
  isMfaChallenge,
  verifyMfaRequest,
  appleSignInRequest,
  googleSignInRequest,
  type AuthResponse,
  type AuthUser,
} from '@/services/remote/authApi';
import { MfaRequiredError, WrongAppRoleError } from '@/utils/authErrors';
import { isCoachRole, isMobileAllowedRole } from '@/utils/roles';

const AUTH_STORAGE_KEY = 'mirafood-auth-session';

export type AuthSession = {
  token: string;
  user: AuthUser & { patientId?: string };
  expiresAt: number;
  onboardingComplete?: boolean;
};

type SocialAuthPayload = {
  identityToken: string;
  fullName?: string;
  email?: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCoach: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeMfaLogin: (challengeToken: string, code: string) => Promise<void>;
  loginWithApple: (payload: SocialAuthPayload) => Promise<void>;
  loginWithGoogle: (payload: SocialAuthPayload) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    referralCode?: string,
    registrationSource?: 'individual' | 'company' | 'institution',
  ) => Promise<void>;
  logout: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
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

function mapSession(data: AuthResponse): AuthSession {
  const patientId = data.user.patientId ?? data.consumerProfile?.patientId;
  return {
    token: data.token,
    user: { ...data.user, patientId },
    expiresAt: jwtExpiresAt(data.token),
    onboardingComplete: Boolean(data.consumerProfile?.onboardingComplete),
  };
}

function assertMobileSession(data: AuthResponse): AuthResponse {
  const role = data.user?.role;
  if (!role || !isMobileAllowedRole(role)) {
    throw new WrongAppRoleError(role || 'unknown');
  }
  return data;
}

function mapMeToSession(session: AuthSession, me: Awaited<ReturnType<typeof fetchMeRequest>>): AuthSession {
  const patientId = me.patientId ?? me.consumerProfile?.patientId ?? session.user.patientId;
  const onboardingComplete =
    isCoachRole(me.role) || Boolean(me.consumerProfile?.onboardingComplete);
  return {
    ...session,
    user: {
      id: me.id,
      email: me.email,
      displayName: me.displayName,
      role: me.role,
      avatarUrl: me.avatarUrl,
      patientId,
    },
    onboardingComplete: onboardingComplete || session.onboardingComplete,
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
    return {
      ...session,
      onboardingComplete: Boolean(session.onboardingComplete),
    };
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
  const [isLoading, setIsLoading] = useState(() => isApiConfigured());

  const applySession = useCallback(async (next: AuthSession | null) => {
    await persistSession(next);
    setSession(next);
  }, []);

  useEffect(() => {
    if (!isApiConfigured()) {
      setIsLoading(false);
      return;
    }

    readStoredSession()
      .then(async (stored) => {
        if (!stored) return;

        setApiAuthToken(stored.token);
        setSession(stored);

        try {
          const me = await fetchMeRequest();
          if (!isMobileAllowedRole(me.role)) {
            await persistSession(null);
            setSession(null);
            return;
          }
          const refreshed = mapMeToSession(stored, me);
          if (
            refreshed.onboardingComplete !== stored.onboardingComplete ||
            refreshed.user.patientId !== stored.user.patientId
          ) {
            await persistSession(refreshed);
            setSession(refreshed);
          }
        } catch {
          /* offline; keep stored session */
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void applySession(null);
    });
    return () => {
      unsubscribe();
    };
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

  const applyAuthResponse = useCallback(
    async (data: AuthResponse) => {
      const session = mapSession(assertMobileSession(data));
      if (isCoachRole(session.user.role)) {
        session.onboardingComplete = true;
      }
      await applySession(session);
    },
    [applySession],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginRequest(email, password);
      if (isMfaChallenge(data)) {
        throw new MfaRequiredError({
          challengeToken: data.challengeToken,
          email: data.email,
          role: data.role,
          debugCode: data.debugCode,
        });
      }
      if (!data?.user || !data.token) {
        throw new WrongAppRoleError('unknown');
      }
      await applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const completeMfaLogin = useCallback(
    async (challengeToken: string, code: string) => {
      const data = await verifyMfaRequest(challengeToken, code);
      if (!data?.user || !data.token) {
        throw new WrongAppRoleError('unknown');
      }
      await applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const loginWithApple = useCallback(
    async (payload: SocialAuthPayload) => {
      const data = await appleSignInRequest(payload);
      if (!data?.user || !data.token) {
        throw new WrongAppRoleError('unknown');
      }
      await applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const loginWithGoogle = useCallback(
    async (payload: SocialAuthPayload) => {
      const data = await googleSignInRequest(payload);
      if (!data?.user || !data.token) {
        throw new WrongAppRoleError('unknown');
      }
      await applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      referralCode?: string,
      registrationSource?: 'individual' | 'company' | 'institution',
    ) => {
      const data = await registerRequest(
        email,
        password,
        displayName,
        referralCode,
        registrationSource,
      );
      await applySession(mapSession(data));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    await clearProfileData();
    await clearNutritionData();
    await applySession(null);
  }, [applySession]);

  const markOnboardingComplete = useCallback(async () => {
    if (!session || session.onboardingComplete) return;
    const next: AuthSession = { ...session, onboardingComplete: true };
    await applySession(next);
  }, [session, applySession]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session && session.expiresAt > Date.now()),
      isCoach: isCoachRole(session?.user.role),
      login,
      completeMfaLogin,
      loginWithApple,
      loginWithGoogle,
      register,
      logout,
      markOnboardingComplete,
    }),
    [
      session,
      isLoading,
      login,
      completeMfaLogin,
      loginWithApple,
      loginWithGoogle,
      register,
      logout,
      markOnboardingComplete,
    ],
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
