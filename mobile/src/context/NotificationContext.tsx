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
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ServerNotification,
} from '@/services/remote/consumerApi';

type NotificationContextValue = {
  serverNotifications: ServerNotification[];
  serverUnreadCount: number;
  isConnected: boolean;
  refreshServerNotifications: () => Promise<void>;
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
  const [serverNotifications, setServerNotifications] = useState<ServerNotification[]>([]);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const refreshServerNotifications = useCallback(async () => {
    if (!isApiConfigured() || !isAuthenticated) {
      setServerNotifications([]);
      setServerUnreadCount(0);
      return;
    }

    const items = await fetchNotifications();
    setServerNotifications(items);
    setServerUnreadCount(items.filter((item) => !item.read).length);
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

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !session?.token) {
      setServerNotifications([]);
      setServerUnreadCount(0);
      setIsConnected(false);
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    void refreshServerNotifications();

    const socket = new WebSocket(notificationsWsUrl(session.token));
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
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
          setServerNotifications((current) => {
            const exists = current.some((item) => item.id === payload.notification.id);
            if (exists) return current;
            return [payload.notification, ...current];
          });
          if (!payload.notification.read) {
            setServerUnreadCount((count) => count + 1);
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
  }, [isAuthenticated, refreshServerNotifications, session?.token]);

  const value = useMemo(
    () => ({
      serverNotifications,
      serverUnreadCount,
      isConnected,
      refreshServerNotifications,
      markServerRead,
      markAllServerRead,
    }),
    [
      serverNotifications,
      serverUnreadCount,
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
