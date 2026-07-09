import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatInboxHeader } from '@/components/chat/ChatInboxHeader';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { useChatSocket } from '@/context/ChatContext';
import { fetchChatConversations, type ChatConversation } from '@/services/remote/chatApi';

function toFriendlyChatError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Could not load messages';
  if (/route not found/i.test(message)) {
    return 'Chat is not available on this server yet. Restart API with latest code (docker compose up --build).';
  }
  return message;
}

export default function CoachChatTabScreen() {
  const { conversationVersion } = useChatSocket();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const conversations = await fetchChatConversations();
      setItems(conversations);
    } catch (err) {
      setError(toFriendlyChatError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [conversationVersion, load]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ChatInboxHeader title="Coach chat" />
      <ChatConversationList
        items={items}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        bottomPadding={FLOATING_TAB_BAR_CLEARANCE}
      />
    </View>
  );
}
