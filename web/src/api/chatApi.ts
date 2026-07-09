import { apiRequest } from '@/lib/apiClient';

export interface ChatConversation {
  id: string;
  type: 'patient' | 'team' | 'direct';
  title: string;
  coachUserId?: string | null;
  clientId?: string | null;
  peerUserId?: string | null;
  peerAvatarUrl?: string | null;
  organization?: string | null;
  memberCount?: number | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatContact {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  clientId: string | null;
  conversationId: string | null;
}

export interface ChatTeamMember {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl?: string | null;
  role?: string;
  title: string | null;
  isSelf: boolean;
}

export interface ChatTeamMembers {
  conversationId: string;
  organization: string;
  title: string;
  memberCount: number;
  members: ChatTeamMember[];
}

export interface ChatMessage {
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
}

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  return apiRequest<ChatConversation[]>('/chat/conversations');
}

export async function fetchChatContacts(): Promise<ChatContact[]> {
  return apiRequest<ChatContact[]>('/chat/contacts');
}

export async function fetchUsers(): Promise<ChatContact[]> {
  return apiRequest<ChatContact[]>('/users');
}

export async function fetchChatUnreadCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/chat/unread-count');
}

export async function ensurePatientConversation(opts?: {
  clientId?: string;
  coachUserId?: string;
}): Promise<ChatConversation> {
  return apiRequest<ChatConversation>('/chat/conversations/patient', {
    method: 'POST',
    body: JSON.stringify(opts ?? {}),
  });
}

export async function ensureDirectConversation(userId: string): Promise<ChatConversation> {
  return apiRequest<ChatConversation>('/chat/conversations/direct', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function ensureTeamChannel(): Promise<ChatConversation> {
  return apiRequest<ChatConversation>('/chat/conversations/team', { method: 'POST' });
}

export async function fetchChatConversation(id: string): Promise<ChatConversation> {
  return apiRequest<ChatConversation>(`/chat/conversations/${id}`);
}

export async function fetchChatMembers(conversationId: string): Promise<ChatTeamMembers> {
  return apiRequest<ChatTeamMembers>(`/chat/conversations/${conversationId}/members`);
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

export async function sendChatMessageWithAttachment(
  conversationId: string,
  file: File,
  body?: string,
  mealId?: string,
): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append('file', file);
  if (body?.trim()) formData.append('body', body.trim());
  if (mealId) formData.append('mealId', mealId);

  return apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages/with-attachment`, {
    method: 'POST',
    body: formData,
  });
}

export async function markChatRead(conversationId: string): Promise<{ ok: boolean; unreadCount: number }> {
  return apiRequest<{ ok: boolean; unreadCount: number }>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}
