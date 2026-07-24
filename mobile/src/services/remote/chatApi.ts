import { apiRequest, ApiError, getApiAuthToken } from '@/lib/apiClient';
import { emitUnauthorized } from '@/lib/authEvents';
import { getApiV1Url } from '@/constants/api';

export type ChatConversation = {
  id: string;
  type: 'patient' | 'team';
  title: string;
  coachUserId?: string | null;
  clientId?: string | null;
  patientId?: string | null;
  peerAvatarUrl?: string | null;
  organization?: string | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  senderAvatarUrl?: string | null;
  body: string;
  mealId?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  attachmentKind?: 'image' | 'file' | null;
  createdAt: string;
  isMine: boolean;
};

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations');
}

export async function fetchChatConversation(conversationId: string): Promise<ChatConversation> {
  return apiRequest<ChatConversation>(`/chat/conversations/${conversationId}`);
}

export async function fetchChatUnreadCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/chat/unread-count');
}

export async function ensurePatientConversation(opts?: {
  coachUserId?: string;
}): Promise<ChatConversation> {
  return apiRequest<ChatConversation>('/chat/conversations/patient', {
    method: 'POST',
    body: JSON.stringify(opts ?? {}),
  });
}

export async function fetchChatMessages(conversationId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
}

export async function sendChatMessage(
  conversationId: string,
  body: string,
  mealId?: string,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, mealId }),
  });
}

export async function markChatRead(conversationId: string): Promise<{ ok: boolean; unreadCount: number }> {
  return apiRequest<{ ok: boolean; unreadCount: number }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}

export type ChatAttachmentUpload = {
  uri: string;
  name: string;
  mimeType: string;
};

export async function sendChatMessageWithAttachment(
  conversationId: string,
  attachment: ChatAttachmentUpload,
  body?: string,
  mealId?: string,
): Promise<ChatMessage> {
  const token = getApiAuthToken();
  if (!token) {
    throw new Error('Sign in to send messages');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: attachment.uri,
    type: attachment.mimeType,
    name: attachment.name,
  } as unknown as Blob);
  if (body?.trim()) formData.append('body', body.trim());
  if (mealId) formData.append('mealId', mealId);

  const response = await fetch(
    getApiV1Url(`/chat/conversations/${conversationId}/messages/with-attachment`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: ChatMessage;
    error?: string;
    message?: string;
  };

  if (!response.ok || payload.success === false) {
    if (response.status === 401 && token) {
      emitUnauthorized();
    }
    const message =
      (typeof payload.error === 'string' && payload.error) ||
      (typeof payload.message === 'string' && payload.message) ||
      `Send failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (payload.success === true && payload.data) {
    return payload.data;
  }

  return payload as unknown as ChatMessage;
}
