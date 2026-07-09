import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Navigate back within profile stack, or return to the Profile tab when there is no history. */
export function useProfileBack() {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  }, [router]);
}
