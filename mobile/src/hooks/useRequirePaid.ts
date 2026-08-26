import { useCallback, useRef } from 'react';

import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Returns true if the user can proceed with a paid action.
 * Otherwise opens the paywall sheet (no extra toast — the sheet is enough).
 */
export function useRequirePaid() {
  const { push } = useNavigateOnce();
  const { isCoach } = useAuth();
  const { hasActiveSubscription } = useSubscriptionAccess();
  const lastPromptAt = useRef(0);

  return useCallback(
    (_reason?: string) => {
      if (!isApiConfigured() || isCoach || hasActiveSubscription) return true;

      const now = Date.now();
      // Debounce so a double-tap doesn't stack paywall routes.
      if (now - lastPromptAt.current > 800) {
        lastPromptAt.current = now;
        push('/paywall');
      }
      return false;
    },
    [hasActiveSubscription, isCoach, push],
  );
}
