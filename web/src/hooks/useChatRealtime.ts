import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '@/api/chatApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { chatKeys } from '@/hooks/useChatQueries';
import { getApiBaseUrl } from '@/lib/apiClient';

export function useChatRealtime(conversationId?: string | null) {
  const token = useAuthStore((s) => s.session?.token);
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

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
          const existing = qc.getQueryData<ChatMessage[]>(chatKeys.messages(targetId));

          if (existing?.length) {
            qc.setQueryData<ChatMessage[]>(chatKeys.messages(targetId), (current) => {
              if (!current?.length) return current;
              if (current.some((item) => item.id === payload.message!.id)) return current;
              return [...current, payload.message!];
            });
          } else {
            void qc.invalidateQueries({ queryKey: chatKeys.messages(targetId) });
          }

          void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
        }
      } catch {
        void qc.invalidateQueries({ queryKey: chatKeys.all });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, qc]);
}
