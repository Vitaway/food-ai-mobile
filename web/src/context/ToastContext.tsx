import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { ToastItem, ToastType } from '@/components/ui/ToastCard';
import { ToastHost } from '@/components/ui/ToastHost';
import { playIncomingNotificationSound } from '@/lib/notificationSound';

type ToastInput = {
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  sound?: boolean;
};

type ToastContextValue = {
  show: (toast: ToastInput) => string;
  success: (message: string, title?: string, opts?: { sound?: boolean }) => string;
  error: (message: string, title?: string, opts?: { sound?: boolean }) => string;
  info: (message: string, title?: string, opts?: { sound?: boolean }) => string;
  /** Incoming live event — toast + sound. */
  incoming: (message: string, title?: string, type?: ToastType) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

function nextToastId() {
  toastCounter += 1;
  return `toast-${toastCounter}`;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ type, title, message, durationMs = 6200, sound = false }: ToastInput) => {
      const id = nextToastId();
      setToasts((current) => [...current, { id, type, title, message }].slice(-4));
      if (sound) playIncomingNotificationSound();

      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title, opts) =>
        show({ type: 'success', message, title, sound: opts?.sound }),
      error: (message, title, opts) =>
        show({ type: 'error', message, title, durationMs: 7200, sound: opts?.sound }),
      info: (message, title, opts) => show({ type: 'info', message, title, sound: opts?.sound }),
      incoming: (message, title, type = 'info') =>
        show({ type, message, title, sound: true, durationMs: 7000 }),
      dismiss,
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
