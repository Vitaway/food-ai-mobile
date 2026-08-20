import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { API_BASE_URL, isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { claimIncomingToast } from '@/services/local/incomingNotificationToasts';

type QueuePayload = {
  type?: string;
  reason?: string;
  mealId?: string;
  mealName?: string;
  mealType?: string;
  clientName?: string;
};

type CoachQueueRealtimeValue = {
  queueVersion: number;
  isConnected: boolean;
  /** Forces queue refresh in the UI (used on push notifications). */
  bumpQueueVersion: () => void;
};

const CoachQueueRealtimeContext = createContext<CoachQueueRealtimeValue | null>(null);

function coachQueueWsUrl(token: string) {
  const wsBase = API_BASE_URL.replace(/^http/i, 'ws');
  return `${wsBase}/ws/coach-queue?token=${encodeURIComponent(token)}`;
}

export function CoachQueueRealtimeProvider({ children }: PropsWithChildren) {
  const { session, isCoach, isAuthenticated } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [queueVersion, setQueueVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = session?.token;

  const bumpQueueVersion = useCallback(() => {
    setQueueVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !isCoach || !token) {
      intentionalCloseRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    intentionalCloseRef.current = false;

    const connect = () => {
      if (intentionalCloseRef.current) return;
      const socket = new WebSocket(coachQueueWsUrl(token));
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (intentionalCloseRef.current) return;
        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current = attempt + 1;
        const delay = Math.min(20_000, 1500 * 2 ** Math.min(attempt, 4));
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as QueuePayload;
          if (payload.type !== 'queue_updated') return;
          setQueueVersion((value) => value + 1);

          if (payload.reason === 'submitted') {
            const mealId = payload.mealId ?? `${payload.clientName}:${payload.mealName}`;
            if (!claimIncomingToast(`queue:${mealId}`)) return;
            const client = payload.clientName?.trim() || 'A patient';
            const meal = payload.mealName?.trim() || payload.mealType?.trim() || 'a meal';
            toastRef.current.incoming(`${client} submitted ${meal} for review.`, 'New meal in queue', 'info');
          }
          if (payload.reason === 'escalated') {
            const mealId = payload.mealId ?? 'escalated';
            if (!claimIncomingToast(`queue-esc:${mealId}`)) return;
            toastRef.current.incoming(
              `${payload.clientName ?? 'A patient'} · ${payload.mealName ?? 'a meal'} has been waiting too long.`,
              'Review needs pickup',
              'info',
            );
          }
        } catch {
          setQueueVersion((value) => value + 1);
        }
      };
    };

    connect();

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') setQueueVersion((value) => value + 1);
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      intentionalCloseRef.current = true;
      appSub.remove();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, isCoach, token]);

  const value = useMemo(
    () => ({ queueVersion, isConnected, bumpQueueVersion }),
    [queueVersion, isConnected, bumpQueueVersion],
  );

  return (
    <CoachQueueRealtimeContext.Provider value={value}>{children}</CoachQueueRealtimeContext.Provider>
  );
}

export function useCoachQueueRealtime() {
  return useContext(CoachQueueRealtimeContext) ?? {
    queueVersion: 0,
    isConnected: false,
    bumpQueueVersion: () => undefined,
  };
}
