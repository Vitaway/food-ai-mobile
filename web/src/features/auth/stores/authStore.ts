import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_STORAGE_KEY } from '@/features/auth/constants';
import type { AuthSession } from '@/features/auth/types';

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
};

function isSessionValid(session: AuthSession | null): session is AuthSession {
  return Boolean(session && session.expiresAt > Date.now());
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        if (state?.session && !isSessionValid(state.session)) {
          state.clearSession();
        }
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthState): boolean {
  return isSessionValid(state.session);
}

export function selectIsCoach(state: AuthState): boolean {
  return isSessionValid(state.session) && state.session!.user.role === 'coach';
}

export function selectIsAdmin(state: AuthState): boolean {
  return isSessionValid(state.session) && state.session!.user.role === 'admin';
}

export function selectAuthUser(state: AuthState) {
  return isSessionValid(state.session) ? state.session.user : null;
}
