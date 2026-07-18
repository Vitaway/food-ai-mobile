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
import { emitUnauthorized } from '@/lib/authEvents';
import {
  claimIncomingToast,
  clearIncomingToastClaims,
  seedIncomingToastClaims,
  toastTypeForNotification,
} from '@/services/local/incomingNotificationToasts';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ServerNotification,
} from '@/services/remote/consumerApi';

const MIN_REFRESH_MS = 5000;
const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 20_000;

type NotificationContextValue = {
  serverNotifications: ServerNotification[];
  serverUnreadCount: number;
  hasLoadedNotifications: boolean;
  isConnected: boolean;
  refreshServerNotifications: (force?: boolean) => Promise<void>;
  markServerRead: (id: string) => Promise<void>;
  markAllServerRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function notificationsWsUrl(token: string) {
  const wsBase = API_BASE_URL.replace(/^http/i, 'ws');
  return `${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`;
}

function showNotificationToast(
  toast: ReturnType<typeof useToast>,
  notification: ServerNotification,
) {
  if (notification.read) return;
  if (!claimIncomingToast(notification.id)) return;

  const kind = toastTypeForNotification(notification);
  toast.incoming(notification.message, notification.title, kind);
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { session, isAuthenticated } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [serverNotifications, setServerNotifications] = useState<ServerNotification[]>([]);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const refreshInflightRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const hydratedRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toastNewFromList = useCallback((items: ServerNotification[]) => {
    for (const item of items) {
      if (!item.read) {
        showNotificationToast(toastRef.current, item);
      } else {
        seedIncomingToastClaims([item.id]);
      }
    }
  }, []);

  const refreshServerNotifications = useCallback(
    async (force = false) => {
      if (!isApiConfigured() || !isAuthenticated) {
        setServerNotifications([]);
        setServerUnreadCount(0);
        setHasLoadedNotifications(false);
        hydratedRef.current = false;
        clearIncomingToastClaims();
        return;
      }

      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < MIN_REFRESH_MS) {
        return;
      }
      if (refreshInflightRef.current) {
        return refreshInflightRef.current;
      }

      refreshInflightRef.current = (async () => {
        try {
          const items = await fetchNotifications();
          lastRefreshAtRef.current = Date.now();

          if (!hydratedRef.current) {
            const now = Date.now();
            for (const item of items) {
              const ageMs = now - new Date(item.createdAt).getTime();
              // Fresh unread may have raced ahead of the WS — toast them once.
              if (!item.read && Number.isFinite(ageMs) && ageMs < 20_000) {
                showNotificationToast(toastRef.current, item);
              } else {
                seedIncomingToastClaims([item.id]);
              }
            }
            hydratedRef.current = true;
          } else {
            // Missed WS / reconnect: toast anything new that showed up.
            toastNewFromList(items);
          }

          setServerNotifications(items);
          setServerUnreadCount(items.filter((item) => !item.read).length);
          setHasLoadedNotifications(true);
        } finally {
          refreshInflightRef.current = null;
        }
      })();

      return refreshInflightRef.current;
    },
    [isAuthenticated, toastNewFromList],
  );

  const markServerRead = useCallback(
    async (id: string) => {
      if (!isApiConfigured() || !isAuthenticated) return;
      await markNotificationRead(id);
      setServerNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setServerUnreadCount((count) => Math.max(0, count - 1));
    },
    [isAuthenticated],
  );

  const markAllServerRead = useCallback(async () => {
    if (!isApiConfigured() || !isAuthenticated) return;
    await markAllNotificationsRead();
    setServerNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setServerUnreadCount(0);
  }, [isAuthenticated]);

  const refreshRef = useRef(refreshServerNotifications);
  refreshRef.current = refreshServerNotifications;

  const token = session?.token;

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !token) {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
      setServerNotifications([]);
      setServerUnreadCount(0);
      setHasLoadedNotifications(false);
      setIsConnected(false);
      hydratedRef.current = false;
      clearIncomingToastClaims();
      return;
    }

    intentionalCloseRef.current = false;
    void refreshRef.current(true);

    const connect = () => {
      if (intentionalCloseRef.current) return;

      const socket = new WebSocket(notificationsWsUrl(token));
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        // Catch anything that arrived while disconnected.
        void refreshRef.current(true);
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        socketRef.current = null;
        if (event.code === 4401 || event.code === 4403) {
          emitUnauthorized();
          return;
        }
        if (intentionalCloseRef.current) return;

        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current = attempt + 1;
        const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** Math.min(attempt, 4));
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as
            | { type: 'unread_count'; unreadCount: number }
            | { type: 'notification'; notification: ServerNotification };

          if (payload.type === 'unread_count') {
            setServerUnreadCount(payload.unreadCount);
            return;
          }

          if (payload.type === 'notification') {
            const notification = payload.notification;
            setServerNotifications((current) => {
              if (current.some((item) => item.id === notification.id)) return current;
              return [notification, ...current];
            });
            // Unread badge is corrected by the follow-up `unread_count` event.
            showNotificationToast(toastRef.current, notification);
          }
        } catch {
          /* ignore malformed payloads */
        }
      };
    };

    connect();

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void refreshRef.current(true);
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      intentionalCloseRef.current = true;
      appSub.remove();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const value = useMemo(
    () => ({
      serverNotifications,
      serverUnreadCount,
      hasLoadedNotifications,
      isConnected,
      refreshServerNotifications,
      markServerRead,
      markAllServerRead,
    }),
    [
      serverNotifications,
      serverUnreadCount,
      hasLoadedNotifications,
      isConnected,
      refreshServerNotifications,
      markServerRead,
      markAllServerRead,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationSocket() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationSocket must be used within NotificationProvider');
  }
  return context;
}

export function useOptionalNotificationSocket() {
  return useContext(NotificationContext);
}
