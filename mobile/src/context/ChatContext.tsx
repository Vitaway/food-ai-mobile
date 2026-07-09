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
import { emitUnauthorized } from '@/lib/authEvents';
import {
  fetchChatUnreadCount,
  type ChatMessage,
} from '@/services/remote/chatApi';

type ChatMessageEvent = {
  conversationId: string;
  message: ChatMessage;
};

type ChatMessageListener = (event: ChatMessageEvent) => void;

type ChatContextValue = {
  unreadCount: number;
  conversationVersion: number;
  isConnected: boolean;
  refreshUnread: () => Promise<void>;
  subscribeMessages: (listener: ChatMessageListener) => () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function chatWsUrl(token: string) {
  const wsBase = API_BASE_URL.replace(/^http/i, 'ws');
  return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`;
}

export function ChatProvider({ children }: PropsWithChildren) {
  const { session, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationVersion, setConversationVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<ChatMessageListener>());

  const refreshUnread = useCallback(async () => {
    if (!isApiConfigured() || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const next = await fetchChatUnreadCount();
      setUnreadCount(Math.max(0, Number(next.count) || 0));
    } catch {
      /* keep previous count */
    }
  }, [isAuthenticated]);

  const subscribeMessages = useCallback((listener: ChatMessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const token = session?.token;

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !token) {
      setUnreadCount(0);
      setIsConnected(false);
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    void refreshUnread();

    const socket = new WebSocket(chatWsUrl(token));
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
        const payload = JSON.parse(String(event.data)) as {
          type?: string;
          conversationId?: string;
          message?: ChatMessage;
          unreadCount?: number;
        };

        if (payload.type === 'unread_count' && typeof payload.unreadCount === 'number') {
          setUnreadCount(Math.max(0, payload.unreadCount));
          setConversationVersion((v) => v + 1);
          return;
        }

        if (payload.type === 'message' && payload.conversationId && payload.message) {
          setConversationVersion((v) => v + 1);
          for (const listener of listenersRef.current) {
            listener({ conversationId: payload.conversationId!, message: payload.message! });
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
  }, [isAuthenticated, token, refreshUnread]);

  const value = useMemo(
    () => ({
      unreadCount,
      conversationVersion,
      isConnected,
      refreshUnread,
      subscribeMessages,
    }),
    [unreadCount, conversationVersion, isConnected, refreshUnread, subscribeMessages],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatSocket() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatSocket must be used within ChatProvider');
  }
  return context;
}

export function useOptionalChatSocket() {
  return useContext(ChatContext);
}
