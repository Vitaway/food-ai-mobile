import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

const NAV_LOCK_MS = 700;

/**
 * Router helpers that ignore double-tap navigation (prevents duplicate stack screens).
 */
export function useNavigateOnce() {
  const router = useRouter();
  const busy = useRef(false);

  const run = useCallback((action: () => void) => {
    if (busy.current) return;
    busy.current = true;
    action();
    setTimeout(() => {
      busy.current = false;
    }, NAV_LOCK_MS);
  }, []);

  const push = useCallback((href: Href) => run(() => router.push(href)), [router, run]);

  const replace = useCallback((href: Href) => run(() => router.replace(href)), [router, run]);

  const back = useCallback(() => run(() => router.back()), [router, run]);

  return { push, replace, back, router, run };
}
