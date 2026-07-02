import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { ToastHost } from '@/components/ui/ToastHost';
import type { ToastItem, ToastType } from '@/components/ui/ToastCard';

type ToastInput = {
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  show: (toast: ToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
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
    ({ type, title, message, durationMs = 4200 }: ToastInput) => {
      const id = nextToastId();
      setToasts((current) => [...current, { id, type, title, message }].slice(-4));

      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, title) => show({ type: 'success', message, title }),
      error: (message, title) => show({ type: 'error', message, title, durationMs: 5200 }),
      info: (message, title) => show({ type: 'info', message, title }),
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
