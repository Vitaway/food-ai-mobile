import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCoachQueue,
  fetchCoachStats,
  fetchClients,
  fetchMealById,
  reviewMeal,
} from '@/api/coachApi';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';

export const coachKeys = {
  all: ['coach'] as const,
  stats: () => [...coachKeys.all, 'stats'] as const,
  queue: () => [...coachKeys.all, 'queue'] as const,
  meal: (id: string) => [...coachKeys.all, 'meal', id] as const,
  clients: () => [...coachKeys.all, 'clients'] as const,
};

export function useCoachStats() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.stats(),
    queryFn: fetchCoachStats,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useCoachQueue() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.queue(),
    queryFn: fetchCoachQueue,
    enabled: isAuthenticated,
    refetchInterval: 15_000,
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

export function useCoachClients() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: coachKeys.clients(),
    queryFn: fetchClients,
    enabled: isAuthenticated,
  });
}

export function useReviewMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewMeal,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}
