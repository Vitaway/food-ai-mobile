import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { chatTheme } from '@/components/chat/chatTheme';
import type { ChatAttachmentUpload } from '@/services/remote/chatApi';

type ChatInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachImage?: () => void;
  onAttachFile?: () => void;
  pendingAttachment?: ChatAttachmentUpload | null;
  onClearAttachment?: () => void;
  sending?: boolean;
  mealLinked?: boolean;
  placeholder?: string;
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onAttachImage,
  onAttachFile,
  pendingAttachment,
  onClearAttachment,
  sending = false,
  mealLinked = false,
  placeholder = 'Message',
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const canSend = (value.trim().length > 0 || Boolean(pendingAttachment)) && !sending;
  const isImageAttachment = pendingAttachment?.mimeType.startsWith('image/');

  return (
    <View style={{ backgroundColor: chatTheme.inputBar, paddingBottom: Math.max(insets.bottom, 8) }}>
      {mealLinked ? (
        <Text className="px-4 pb-2 pt-2 text-center text-xs" style={{ color: chatTheme.bubbleMeta }}>
          Your reply will be linked to this meal for your coach
        </Text>
      ) : null}

      {pendingAttachment ? (
        <View className="mx-3 mb-2 flex-row items-center gap-3 rounded-2xl bg-white px-3 py-2">
          {isImageAttachment ? (
            <Image source={{ uri: pendingAttachment.uri }} className="h-14 w-14 rounded-lg" />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-lg bg-neutral-100">
              <Text className="text-2xl">📎</Text>
            </View>
          )}
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-sm text-neutral-900" numberOfLines={1}>
              {pendingAttachment.name}
            </Text>
            <Text className="text-xs text-neutral-500">Ready to send</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove attachment"
            onPress={onClearAttachment}
            className="h-9 w-9 items-center justify-center rounded-full">
            <Ionicons name="close" size={20} color="#667781" />
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2 px-3 py-2">
        {onAttachImage || onAttachFile ? (
          <View className="mb-0.5 flex-row">
            {onAttachImage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach photo"
                onPress={onAttachImage}
                className="h-11 w-11 items-center justify-center rounded-full">
                <Ionicons name="image-outline" size={24} color="#54656f" />
              </Pressable>
            ) : null}
            {onAttachFile ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach file"
                onPress={onAttachFile}
                className="h-11 w-11 items-center justify-center rounded-full">
                <Ionicons name="attach-outline" size={24} color="#54656f" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View
          className="min-h-[44px] flex-1 justify-center rounded-3xl px-4 py-2"
          style={{ backgroundColor: '#ffffff' }}>
          <TextInput
            className="max-h-28 text-base text-neutral-900"
            placeholder={placeholder}
            placeholderTextColor="#8696a0"
            multiline
            value={value}
            onChangeText={onChangeText}
            style={{ lineHeight: 20 }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={onSend}
          disabled={!canSend}
          className="mb-0.5 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: canSend ? chatTheme.sendButton : chatTheme.sendButtonDisabled }}>
          {sending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#ffffff" style={{ marginLeft: 2 }} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
