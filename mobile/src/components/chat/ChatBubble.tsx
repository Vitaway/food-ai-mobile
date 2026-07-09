import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, View } from 'react-native';

import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { Text } from '@/components/ui/Text';
import { chatTheme } from '@/components/chat/chatTheme';
import { formatChatTime } from '@/utils/chatFormatting';
import { resolveMediaUrl } from '@/utils/mediaUrls';
import type { ChatMessage } from '@/services/remote/chatApi';

type ChatBubbleProps = {
  message: ChatMessage;
  showSenderName?: boolean;
  avatarUrl?: string | null;
  onMealPress?: (mealId: string) => void;
};

function MessageAttachment({
  message,
}: {
  message: ChatMessage;
}) {
  const url = resolveMediaUrl(message.attachmentUrl);
  if (!url) return null;

  if (message.attachmentKind === 'image') {
    return (
      <Pressable
        onPress={() => void Linking.openURL(url)}
        className="mb-1 overflow-hidden rounded-lg">
        <Image
          source={{ uri: url }}
          className="max-h-56 w-full min-w-[180px]"
          resizeMode="cover"
          accessibilityLabel={message.attachmentName ?? 'Image attachment'}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      className="mb-1 flex-row items-center gap-2 self-start rounded-md px-2 py-1.5"
      style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
      <Text className="text-base">📎</Text>
      <Text className="max-w-[200px] font-sans-semibold text-xs" style={{ color: chatTheme.link }}>
        {message.attachmentName ?? 'Open file'}
      </Text>
    </Pressable>
  );
}

export function ChatBubble({
  message,
  showSenderName = false,
  avatarUrl,
  onMealPress,
}: ChatBubbleProps) {
  const isMine = message.isMine;
  const bubbleAvatar = avatarUrl ?? message.senderAvatarUrl;

  return (
    <View className={`flex-row items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine ? (
        <ChatAvatar name={message.senderName} imageUrl={bubbleAvatar} size="sm" className="mb-1 h-8 w-8" />
      ) : null}

      <View
        className="max-w-[78%] px-3 py-2"
        style={{
          backgroundColor: isMine ? chatTheme.outgoingBubble : chatTheme.incomingBubble,
          borderRadius: 12,
          borderTopRightRadius: isMine ? 4 : 12,
          borderTopLeftRadius: isMine ? 12 : 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 1.5,
          elevation: 1,
        }}>
        {!isMine && showSenderName ? (
          <Text className="mb-0.5 font-sans-semibold text-xs" style={{ color: chatTheme.header }}>
            {message.senderName}
          </Text>
        ) : null}

        {message.attachmentUrl ? <MessageAttachment message={message} /> : null}

        {message.body ? (
          <Text className="text-[15px] leading-[21px]" style={{ color: chatTheme.bubbleText }}>
            {message.body}
          </Text>
        ) : null}

        {message.mealId ? (
          <Pressable
            onPress={() => onMealPress?.(message.mealId!)}
            className="mt-1.5 self-start rounded-md px-2 py-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <Text className="font-sans-semibold text-xs" style={{ color: chatTheme.link }}>
              View meal →
            </Text>
          </Pressable>
        ) : null}

        <View className="mt-1 flex-row items-end justify-end gap-1">
          <Text className="text-[11px]" style={{ color: chatTheme.bubbleMeta }}>
            {formatChatTime(message.createdAt)}
          </Text>
        </View>
      </View>

      {isMine ? (
        <ChatAvatar name={message.senderName} imageUrl={bubbleAvatar} size="sm" className="mb-1 h-8 w-8" />
      ) : null}
    </View>
  );
}
