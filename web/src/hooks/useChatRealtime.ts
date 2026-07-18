import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import type { ChatMessage } from '@/api/chatApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useToast } from '@/context/ToastContext';
import { chatKeys } from '@/hooks/useChatQueries';
import { getApiBaseUrl } from '@/lib/apiClient';

/** Shared across every mount of useChatRealtime so duplicate sockets don't multi-toast. */
const toastedChatMessageIds = new Set<string>();

function claimChatToast(id: string) {
  if (!id || toastedChatMessageIds.has(id)) return false;
  toastedChatMessageIds.add(id);
  if (toastedChatMessageIds.size > 400) {
    const first = toastedChatMessageIds.values().next().value;
    if (first) toastedChatMessageIds.delete(first);
  }
  return true;
}

export function useChatRealtime() {
  const token = useAuthStore((s) => s.session?.token);
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const toast = useToast();
  const location = useLocation();
  const wsRef = useRef<WebSocket | null>(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  useEffect(() => {
    if (!token) return;

    const base = getApiBaseUrl().replace(/^http/, 'ws');
    const ws = new WebSocket(`${base}/ws/chat?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as {
          type?: string;
          conversationId?: string;
          message?: ChatMessage;
          unreadCount?: number;
        };

        if (payload.type === 'unread_count') {
          void qc.invalidateQueries({ queryKey: chatKeys.unread() });
          void qc.invalidateQueries({ queryKey: ['coach'] });
          return;
        }

        if (payload.type === 'message' && payload.conversationId && payload.message) {
          const targetId = payload.conversationId;
          const message = payload.message;
          const existing = qc.getQueryData<ChatMessage[]>(chatKeys.messages(targetId));

          if (existing?.length) {
            qc.setQueryData<ChatMessage[]>(chatKeys.messages(targetId), (current) => {
              if (!current?.length) return current;
              if (current.some((item) => item.id === message.id)) return current;
              return [...current, message];
            });
          } else {
            void qc.invalidateQueries({ queryKey: chatKeys.messages(targetId) });
          }

          void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
          void qc.invalidateQueries({ queryKey: chatKeys.unread() });

          if (message.isMine || (userId && message.senderUserId === userId)) return;
          if (!claimChatToast(message.id)) return;

          const onThread = locationRef.current.includes(`/messages/${targetId}`);
          if (onThread) return;

          const preview =
            message.body?.trim() ||
            (message.attachmentUrl ? 'Sent an attachment' : 'New message');
          const title = message.senderName?.trim() || 'New message';
          toastRef.current.incoming(preview.slice(0, 140), title, 'info');
        }
      } catch {
        void qc.invalidateQueries({ queryKey: chatKeys.all });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, qc, userId]);
}
