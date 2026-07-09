import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatInboxHeader } from '@/components/chat/ChatInboxHeader';
import { useChatSocket } from '@/context/ChatContext';
import { fetchChatConversations, type ChatConversation } from '@/services/remote/chatApi';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';

export default function ChatInboxScreen() {
  const { back } = useNavigateOnce();
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
      setError(err instanceof Error ? err.message : 'Could not load messages');
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
      <ChatInboxHeader title="Coach chat" onBack={back} />
      <ChatConversationList items={items} loading={loading} error={error} onRetry={() => void load()} />
    </View>
  );
}
