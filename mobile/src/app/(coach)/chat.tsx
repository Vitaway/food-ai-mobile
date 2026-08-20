import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { useChatSocket } from '@/context/ChatContext';
import { fetchChatConversations, type ChatConversation } from '@/services/remote/chatApi';

export default function CoachChatTabScreen() {
  const { conversationVersion } = useChatSocket();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchChatConversations());
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
      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <GradientHeaderTitle>Messages</GradientHeaderTitle>
            <Text className="mt-1 text-sm text-white/80">Patient conversations</Text>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>
      <ContentSheet className="flex-1 pt-0">
        <ChatConversationList
          items={items}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No patient threads yet"
          emptyHint="When a patient logs a meal or messages you, the conversation will appear here."
          bottomPadding={FLOATING_TAB_BAR_CLEARANCE}
        />
      </ContentSheet>
    </View>
  );
}
