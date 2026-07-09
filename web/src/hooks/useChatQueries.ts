import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ensureDirectConversation,
  ensurePatientConversation,
  ensureTeamChannel,
  fetchChatContacts,
  fetchChatConversation,
  fetchChatConversations,
  fetchChatMembers,
  fetchChatMessages,
  fetchChatUnreadCount,
  fetchUsers,
  markChatRead,
  sendChatMessage,
  sendChatMessageWithAttachment,
} from '@/api/chatApi';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  contacts: () => [...chatKeys.all, 'contacts'] as const,
  users: () => [...chatKeys.all, 'users'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  members: (id: string) => [...chatKeys.all, 'members', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  unread: () => [...chatKeys.all, 'unread'] as const,
};

export function useChatContacts(enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.contacts(),
    queryFn: fetchChatContacts,
    enabled: isAuthenticated && enabled,
    retry: 1,
  });
}

export function useUsers(enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.users(),
    queryFn: fetchUsers,
    enabled: isAuthenticated && enabled,
    retry: 1,
  });
}

export function useEnsureDirectConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => ensureDirectConversation(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      void qc.invalidateQueries({ queryKey: chatKeys.contacts() });
      void qc.invalidateQueries({ queryKey: chatKeys.users() });
    },
  });
}

export function useChatConversations() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchChatConversations,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useChatUnreadCount() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.unread(),
    queryFn: fetchChatUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useChatConversation(conversationId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.conversation(conversationId ?? ''),
    queryFn: () => fetchChatConversation(conversationId!),
    enabled: isAuthenticated && Boolean(conversationId),
  });
}

export function useChatMembers(conversationId: string | null, enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.members(conversationId ?? ''),
    queryFn: () => fetchChatMembers(conversationId!),
    enabled: isAuthenticated && Boolean(conversationId) && enabled,
    retry: 1,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useChatMessages(conversationId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: () => fetchChatMessages(conversationId!),
    enabled: isAuthenticated && Boolean(conversationId),
    refetchInterval: 15_000,
  });
}

export function useEnsurePatientConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ensurePatientConversation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      void qc.invalidateQueries({ queryKey: chatKeys.contacts() });
    },
  });
}

export function useEnsureTeamChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ensureTeamChannel,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      void qc.invalidateQueries({ queryKey: chatKeys.contacts() });
    },
  });
}

export function useSendChatMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      mealId,
      file,
    }: {
      body?: string;
      mealId?: string;
      file?: File;
    }) => {
      if (file) {
        return sendChatMessageWithAttachment(conversationId, file, body, mealId);
      }
      return sendChatMessage(conversationId, body ?? '', mealId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      void qc.invalidateQueries({ queryKey: chatKeys.unread() });
      void qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markChatRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.unread() });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      void qc.invalidateQueries({ queryKey: ['coach'] });
    },
  });
}
