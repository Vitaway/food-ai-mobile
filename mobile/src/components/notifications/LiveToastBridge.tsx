import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useOptionalChatSocket } from '@/context/ChatContext';
import { useToast } from '@/context/ToastContext';

/**
 * Shows in-app toasts for live chat messages while the app is open.
 * Meal/review notifications toast from NotificationContext (WebSocket) + push.
 */
export function LiveToastBridge() {
  const { session } = useAuth();
  const chat = useOptionalChatSocket();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const router = useRouter();
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!chat) return;
    return chat.subscribeMessages(({ conversationId, message }) => {
      if (!message?.id) return;
      if (seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);

      if (message.isMine) return;
      const myId = session?.user?.id;
      if (myId && message.senderUserId === myId) return;

      // Don't toast if already viewing that thread
      if (pathnameRef.current?.includes(`/chat/${conversationId}`)) return;

      const preview =
        message.body?.trim() ||
        (message.attachmentUrl ? 'Sent an attachment' : 'New message');
      const title = message.senderName?.trim() || 'New message';

      toastRef.current.incoming(preview.slice(0, 120), title, 'info');
    });
  }, [chat, session?.user?.id, router]);

  return null;
}
