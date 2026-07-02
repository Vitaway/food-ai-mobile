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

import { API_BASE_URL, isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { emitUnauthorized } from '@/lib/authEvents';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ServerNotification,
} from '@/services/remote/consumerApi';

const MIN_REFRESH_MS = 5000;

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

  const refreshServerNotifications = useCallback(async (force = false) => {
    if (!isApiConfigured() || !isAuthenticated) {
      setServerNotifications([]);
      setServerUnreadCount(0);
      setHasLoadedNotifications(false);
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
        setServerNotifications(items);
        setServerUnreadCount(items.filter((item) => !item.read).length);
        setHasLoadedNotifications(true);
      } finally {
        refreshInflightRef.current = null;
      }
    })();

    return refreshInflightRef.current;
  }, [isAuthenticated]);

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
      setServerNotifications([]);
      setServerUnreadCount(0);
      setHasLoadedNotifications(false);
      setIsConnected(false);
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    void refreshRef.current(true);

    const socket = new WebSocket(notificationsWsUrl(token));
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = (event) => {
      setIsConnected(false);
      if (event.code === 4401 || event.code === 4403) {
        emitUnauthorized();
      }
    };
    socket.onerror = () => setIsConnected(false);
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
          let isNew = false;
          setServerNotifications((current) => {
            const exists = current.some((item) => item.id === notification.id);
            if (exists) return current;
            isNew = true;
            return [notification, ...current];
          });
          if (isNew && !notification.read) {
            toastRef.current.info(notification.message, notification.title);
          }
        }
      } catch {
        /* ignore malformed payloads */
      }
    };

    return () => {
      socket.close();
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
