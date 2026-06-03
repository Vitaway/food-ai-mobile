import { useCallback, useRef } from 'react';

const DEFAULT_LOCK_MS = 650;

/**
 * Ignores rapid repeat presses (double-tap) for the same handler.
 */
export function useSinglePress<T extends (...args: any[]) => any>(
  callback?: T,
  lockMs = DEFAULT_LOCK_MS,
): T | undefined {
  const busy = useRef(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: unknown[]) => {
      const fn = callbackRef.current;
      if (!fn || busy.current) return;
      busy.current = true;

      const release = () => {
        setTimeout(() => {
          busy.current = false;
        }, lockMs);
      };

      try {
        const result = fn(...args) as unknown;
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          void (result as Promise<unknown>).finally(release);
          return;
        }
      } catch (error) {
        release();
        throw error;
      }

      release();
    }) as T,
    [lockMs],
  );
}
