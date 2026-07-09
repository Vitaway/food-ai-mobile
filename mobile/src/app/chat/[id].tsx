import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatDateDivider } from '@/components/chat/ChatDateDivider';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { ChatThreadHeader } from '@/components/chat/ChatThreadHeader';
import { chatTheme } from '@/components/chat/chatTheme';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { useAuth } from '@/context/AuthContext';
import { useChatSocket } from '@/context/ChatContext';
import { useProfile } from '@/context/ProfileContext';
import {
  fetchChatConversation,
  fetchChatMessages,
  markChatRead,
  sendChatMessage,
  sendChatMessageWithAttachment,
  type ChatAttachmentUpload,
  type ChatMessage,
} from '@/services/remote/chatApi';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { isDocumentPickerAvailable, pickDocument } from '@/services/pickers/documentPicker';
import { resolveMediaUrl } from '@/utils/mediaUrls';

import { groupMessagesByDate } from '@/utils/chatFormatting';

export default function ChatThreadScreen() {
  const { id, mealId, title: titleParam, peerAvatarUrl: peerAvatarParam } = useLocalSearchParams<{
    id: string;
    mealId?: string;
    title?: string;
    peerAvatarUrl?: string;
  }>();
  const conversationId = typeof id === 'string' ? id : '';
  const linkedMealId = typeof mealId === 'string' ? mealId : undefined;
  const initialTitle = typeof titleParam === 'string' ? titleParam : 'Coach';
  const { back } = useNavigateOnce();
  const router = useRouter();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { subscribeMessages, refreshUnread } = useChatSocket();

  const [title, setTitle] = useState(initialTitle);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(
    typeof peerAvatarParam === 'string' && peerAvatarParam ? peerAvatarParam : null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachmentUpload | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const groups = useMemo(() => groupMessagesByDate(messages), [messages]);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const [rows, conv] = await Promise.all([
        fetchChatMessages(conversationId),
        fetchChatConversation(conversationId).catch(() => null),
      ]);
      setMessages(rows);
      if (conv?.title) setTitle(conv.title);
      if (conv?.peerAvatarUrl) setPeerAvatarUrl(conv.peerAvatarUrl);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    void markChatRead(conversationId).then(() => refreshUnread()).catch(() => undefined);
  }, [conversationId, refreshUnread]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribeMessages(({ conversationId: incomingId, message }) => {
      if (incomingId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      void markChatRead(conversationId).then(() => refreshUnread()).catch(() => undefined);
    });
  }, [conversationId, subscribeMessages, refreshUnread]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPendingAttachment({
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function handlePickFile() {
    const asset = await pickDocument();
    if (!asset) return;

    setPendingAttachment({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
    });
  }

  async function handleSend() {
    const trimmed = body.trim();
    if ((!trimmed && !pendingAttachment) || !conversationId || sending) return;
    setSending(true);
    try {
      const message = pendingAttachment
        ? await sendChatMessageWithAttachment(
            conversationId,
            pendingAttachment,
            trimmed || undefined,
            linkedMealId,
          )
        : await sendChatMessage(conversationId, trimmed, linkedMealId);
      setMessages((prev) => [...prev, { ...message, isMine: true }]);
      setBody('');
      setPendingAttachment(null);
    } finally {
      setSending(false);
    }
  }

  const myAvatarUrl =
    resolveMediaUrl(profile?.avatarUrl) ?? resolveMediaUrl(session?.user.avatarUrl ?? null);

  return (
    <View className="flex-1" style={{ backgroundColor: chatTheme.header }}>
      <StatusBar style="light" />
      <ChatThreadHeader title={title} imageUrl={peerAvatarUrl} onBack={back} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View className="flex-1" style={{ backgroundColor: chatTheme.background }}>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={semanticColors.primary} />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              className="flex-1"
              contentContainerClassName="gap-1 px-3 py-3"
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8 py-20">
                  <View
                    className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
                    <Text className="text-3xl">💬</Text>
                  </View>
                  <Text className="text-center text-sm leading-5" style={{ color: chatTheme.bubbleMeta }}>
                    Share extra details about your meal — portions, ingredients, or how it was prepared.
                  </Text>
                </View>
              ) : (
                groups.map((group) => (
                  <View key={group.dateKey} className="gap-1">
                    <ChatDateDivider label={group.label} />
                    {group.messages.map((m, index) => {
                      const prev = group.messages[index - 1];
                      const showSenderName = !m.isMine && (!prev || prev.senderUserId !== m.senderUserId);
                      return (
                        <ChatBubble
                          key={m.id}
                          message={m}
                          showSenderName={showSenderName}
                          avatarUrl={m.isMine ? myAvatarUrl : m.senderAvatarUrl ?? peerAvatarUrl}
                          onMealPress={(mealId) => router.push(`/meal/${mealId}`)}
                        />
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <ChatInputBar
            value={body}
            onChangeText={setBody}
            onSend={() => void handleSend()}
            onAttachImage={() => void handlePickImage()}
            onAttachFile={isDocumentPickerAvailable() ? () => void handlePickFile() : undefined}
            pendingAttachment={pendingAttachment}
            onClearAttachment={() => setPendingAttachment(null)}
            sending={sending}
            mealLinked={Boolean(linkedMealId)}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
