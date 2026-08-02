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
import { useAuth } from '@/context/AuthContext';
import { fetchSubscriptionAccess } from '@/services/remote/consumerApi';

type SubscriptionAccessContextValue = {
  /** True once we've attempted to load access for the current session. */
  isSubscriptionReady: boolean;
  /** Product access allowed (active sub or enforcement off). */
  hasActiveSubscription: boolean;
  refreshSubscriptionAccess: () => Promise<boolean>;
};

const SubscriptionAccessContext = createContext<SubscriptionAccessContextValue | null>(null);

export function SubscriptionAccessProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [isSubscriptionReady, setIsSubscriptionReady] = useState(() => !isApiConfigured());
  const [hasActiveSubscription, setHasActiveSubscription] = useState(() => !isApiConfigured());

  const refreshSubscriptionAccess = useCallback(async (): Promise<boolean> => {
    if (!isApiConfigured() || !isAuthenticated) {
      setHasActiveSubscription(!isApiConfigured());
      setIsSubscriptionReady(true);
      return !isApiConfigured();
    }

    try {
      const access = await fetchSubscriptionAccess();
      const allowed = Boolean(access.allowed);
      setHasActiveSubscription(allowed);
      setIsSubscriptionReady(true);
      return allowed;
    } catch {
      // Fail closed when enforcement is expected — keep user on paywall until known.
      setHasActiveSubscription(false);
      setIsSubscriptionReady(true);
      return false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isApiConfigured()) {
        setHasActiveSubscription(true);
        setIsSubscriptionReady(true);
        return;
      }
      if (!isAuthenticated) {
        setHasActiveSubscription(false);
        setIsSubscriptionReady(true);
        return;
      }

      setIsSubscriptionReady(false);
      try {
        const access = await fetchSubscriptionAccess();
        if (!cancelled) {
          setHasActiveSubscription(Boolean(access.allowed));
        }
      } catch {
        if (!cancelled) {
          setHasActiveSubscription(false);
        }
      } finally {
        if (!cancelled) {
          setIsSubscriptionReady(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      isSubscriptionReady,
      hasActiveSubscription,
      refreshSubscriptionAccess,
    }),
    [isSubscriptionReady, hasActiveSubscription, refreshSubscriptionAccess],
  );

  return (
    <SubscriptionAccessContext.Provider value={value}>{children}</SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess() {
  const context = useContext(SubscriptionAccessContext);
  if (!context) {
    throw new Error('useSubscriptionAccess must be used within SubscriptionAccessProvider');
  }
  return context;
}
