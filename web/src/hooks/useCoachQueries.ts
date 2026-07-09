import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignClient,
  unassignClient,
  createReviewTask,
  fetchClientById,
  fetchClientSummary,
  fetchClients,
  fetchCoachOperations,
  fetchPastReviews,
  fetchCoachQueue,
  fetchCoachStats,
  fetchCohorts,
  fetchMealById,
  fetchMessages,
  fetchReviewDraft,
  fetchReviewTasks,
  fetchTeamStats,
  reviewMeal,
  saveReviewDraft,
  sendMessage,
  type QueueQuery,
} from '@/api/coachApi';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';

export const coachKeys = {
  all: ['coach'] as const,
  stats: (cohortId?: string) => [...coachKeys.all, 'stats', cohortId] as const,
  queue: (params?: QueueQuery) => [...coachKeys.all, 'queue', params] as const,
  pastReviews: (params?: { search?: string; action?: 'approve' | 'reject' }) =>
    [...coachKeys.all, 'past-reviews', params] as const,
  meal: (id: string) => [...coachKeys.all, 'meal', id] as const,
  clients: (cohortId?: string) => [...coachKeys.all, 'clients', cohortId] as const,
  client: (id: string) => [...coachKeys.all, 'client', id] as const,
  clientSummary: (id: string) => [...coachKeys.all, 'client-summary', id] as const,
  cohorts: () => [...coachKeys.all, 'cohorts'] as const,
  team: () => [...coachKeys.all, 'team'] as const,
  messages: (clientId: string) => [...coachKeys.all, 'messages', clientId] as const,
  operations: () => [...coachKeys.all, 'operations'] as const,
  reviewDraft: (mealId: string) => [...coachKeys.all, 'review-draft', mealId] as const,
  reviewTasks: (mealId: string) => [...coachKeys.all, 'review-tasks', mealId] as const,
};

export function useCoachStats(cohortId?: string) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.stats(cohortId),
    queryFn: () => fetchCoachStats(cohortId),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useCoachQueue(params?: QueueQuery) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.queue(params),
    queryFn: () => fetchCoachQueue(params),
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });
}

export function useCoachPastReviews(params?: {
  search?: string;
  action?: 'approve' | 'reject';
  limit?: number;
}) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.pastReviews(params),
    queryFn: () => fetchPastReviews(params),
    enabled: isAuthenticated,
  });
}

export function useCoachMeal(mealId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.meal(mealId ?? ''),
    queryFn: () => fetchMealById(mealId!),
    enabled: isAuthenticated && Boolean(mealId),
  });
}

export function useCoachClients(cohortId?: string) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.clients(cohortId),
    queryFn: () => fetchClients(cohortId),
    enabled: isAuthenticated,
  });
}

export function useCoachClient(clientId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.client(clientId ?? ''),
    queryFn: () => fetchClientById(clientId!),
    enabled: isAuthenticated && Boolean(clientId),
  });
}

export function useCoachClientSummary(clientId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.clientSummary(clientId ?? ''),
    queryFn: () => fetchClientSummary(clientId!),
    enabled: isAuthenticated && Boolean(clientId),
  });
}

export function useCoachCohorts() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.cohorts(),
    queryFn: fetchCohorts,
    enabled: isAuthenticated,
  });
}

export function useCoachTeam(enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.team(),
    queryFn: fetchTeamStats,
    enabled: isAuthenticated && enabled,
  });
}

export function useCoachMessages(clientId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.messages(clientId ?? ''),
    queryFn: () => fetchMessages(clientId!),
    enabled: isAuthenticated && Boolean(clientId),
  });
}

export function useUnassignClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unassignClient,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

export function useReviewMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewMeal,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
      void qc.invalidateQueries({ queryKey: ['coach', 'past-reviews'] });
    },
  });
}

export function useAssignClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignClient,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

export function useSendCoachMessage(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, mealId }: { body: string; mealId?: string }) =>
      sendMessage(clientId, body, mealId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.messages(clientId) });
      void qc.invalidateQueries({ queryKey: coachKeys.stats() });
    },
  });
}

export function useCoachOperations() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.operations(),
    queryFn: fetchCoachOperations,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useReviewDraft(mealId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.reviewDraft(mealId ?? ''),
    queryFn: () => fetchReviewDraft(mealId!),
    enabled: isAuthenticated && Boolean(mealId),
  });
}

export function useSaveReviewDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      ...payload
    }: {
      mealId: string;
      mealName?: string;
      items?: import('@/types').DetectedFoodItem[];
      note?: string;
      trainingNote?: string;
    }) => saveReviewDraft(mealId, { ...payload, items: payload.items ?? [] }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: coachKeys.reviewDraft(vars.mealId) });
    },
  });
}

export function useReviewTasks(mealId: string | null) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.reviewTasks(mealId ?? ''),
    queryFn: () => fetchReviewTasks(mealId!),
    enabled: isAuthenticated && Boolean(mealId),
  });
}

export function useCreateReviewTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      ...payload
    }: {
      mealId: string;
      type: 'second_opinion' | 'escalation';
      note?: string;
      notifyUser?: boolean;
    }) => createReviewTask(mealId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: coachKeys.reviewTasks(vars.mealId) });
    },
  });
}
