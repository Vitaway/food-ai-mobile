import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';
import { onSubscriptionRequired } from '@/lib/subscriptionEvents';

/**
 * When product APIs return 403 subscription-required, refresh access + paywall.
 */
export function SubscriptionGate() {
  const router = useRouter();
  const toast = useToast();
  const { refreshSubscriptionAccess } = useSubscriptionAccess();
  const lastAt = useRef(0);

  useEffect(() => {
    const unsubscribe = onSubscriptionRequired((message) => {
      const now = Date.now();
      if (now - lastAt.current < 2500) return;
      lastAt.current = now;
      void refreshSubscriptionAccess().then((allowed) => {
        if (allowed) return;
        toast.error(message || 'An active subscription is required.', 'Subscription needed');
        router.replace('/profile/subscription');
      });
    });
    return () => {
      unsubscribe();
    };
  }, [router, toast, refreshSubscriptionAccess]);

  return null;
}
