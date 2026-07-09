import { useChatSocket } from '@/context/ChatContext';

/** Live chat unread badge count (WebSocket + initial fetch). */
export function useChatUnreadCount() {
  const { unreadCount } = useChatSocket();
  return unreadCount;
}
