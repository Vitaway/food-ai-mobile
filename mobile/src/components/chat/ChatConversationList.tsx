import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ChatListAvatar } from '@/components/chat/ChatAvatar';
import { chatTheme } from '@/components/chat/chatTheme';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { ChatConversation } from '@/services/remote/chatApi';
import { formatInboxWhen } from '@/utils/chatFormatting';

type ChatConversationListProps = {
  items: ChatConversation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle?: string;
  emptyHint?: string;
  bottomPadding?: number;
};

function ConversationRow({ conv, onPress }: { conv: ChatConversation; onPress: () => void }) {
  const hasUnread = conv.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-black/5"
      style={{ borderBottomWidth: 1, borderBottomColor: chatTheme.listDivider }}>
      <ChatListAvatar name={conv.title} imageUrl={conv.peerAvatarUrl} />

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className={hasUnread ? 'font-sans-bold text-[16px]' : 'font-sans-semibold text-[16px]'}
            style={{ color: '#111b21' }}
            numberOfLines={1}>
            {conv.title}
          </Text>
          {conv.lastMessageAt ? (
            <Text
              className="shrink-0 text-xs"
              style={{ color: hasUnread ? chatTheme.unreadBadge : chatTheme.listPreview }}>
              {formatInboxWhen(conv.lastMessageAt)}
            </Text>
          ) : null}
        </View>

        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <Text
            className={hasUnread ? 'flex-1 font-sans-semibold text-sm' : 'flex-1 text-sm'}
            style={{ color: hasUnread ? '#111b21' : chatTheme.listPreview }}
            numberOfLines={1}>
            {conv.lastMessagePreview ?? 'No messages yet'}
          </Text>
          {hasUnread ? (
            <View
              className="h-5 min-w-5 items-center justify-center rounded-full px-1.5"
              style={{ backgroundColor: chatTheme.unreadBadge }}>
              <Text className="text-[11px] font-sans-bold text-white">
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function ChatConversationList({
  items,
  loading,
  error,
  onRetry,
  emptyTitle = 'No conversations yet',
  emptyHint = 'When your coach reaches out about a meal, the thread will appear here.',
  bottomPadding = 32,
}: ChatConversationListProps) {
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color={semanticColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="mx-5 mt-6 rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-5 py-10">
        <Text className="text-center font-sans-semibold text-neutral-700">{error}</Text>
        <Pressable onPress={onRetry} className="mt-4 self-center">
          <Text className="font-sans-semibold text-sm text-cinnamon-wood-400">Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View
          className="mb-4 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: chatTheme.inputBar }}>
          <Text className="text-4xl">💬</Text>
        </View>
        <Text className="text-center font-sans-semibold text-lg text-neutral-800">{emptyTitle}</Text>
        <Text className="mt-2 text-center text-sm leading-5" style={{ color: chatTheme.listPreview }}>
          {emptyHint}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: bottomPadding }}>
      {items.map((conv) => (
        <ConversationRow
          key={conv.id}
          conv={conv}
          onPress={() =>
            router.push({
              pathname: '/chat/[id]',
              params: {
                id: conv.id,
                title: conv.title,
                peerAvatarUrl: conv.peerAvatarUrl ?? '',
              },
            })
          }
        />
      ))}
    </ScrollView>
  );
}
