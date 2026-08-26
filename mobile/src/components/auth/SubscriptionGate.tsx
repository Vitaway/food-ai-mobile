import { useEffect, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { onSubscriptionRequired } from '@/lib/subscriptionEvents';

/**
 * Quietly syncs subscription access when APIs return 403.
 * Does NOT toast or navigate — freemium only shows paywall when the user
 * intentionally tries a paid action (see useRequirePaid).
 */
export function SubscriptionGate() {
  const { isCoach } = useAuth();
  const { hasCompletedOnboarding } = useProfile();
  const { refreshSubscriptionAccess } = useSubscriptionAccess();
  const lastAt = useRef(0);
  const onboardedRef = useRef(hasCompletedOnboarding);
  onboardedRef.current = hasCompletedOnboarding;

  useEffect(() => {
    if (isCoach) return;
    const unsubscribe = onSubscriptionRequired(() => {
      if (!onboardedRef.current) return;
      const now = Date.now();
      if (now - lastAt.current < 2500) return;
      lastAt.current = now;
      void refreshSubscriptionAccess();
    });
    return () => {
      unsubscribe();
    };
  }, [isCoach, refreshSubscriptionAccess]);

  return null;
}
