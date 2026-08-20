import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Navigate back within coach profile stack, or return to the Profile tab. */
export function useCoachProfileBack() {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(coach)/profile');
  }, [router]);
}
