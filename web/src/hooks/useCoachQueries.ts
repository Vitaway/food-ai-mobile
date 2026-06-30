import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCoachQueue,
  fetchCoachStats,
  fetchClients,
  fetchMealById,
  reviewMeal,
} from '@/api/mockCoachApi';

export const coachKeys = {
  all: ['coach'] as const,
  stats: () => [...coachKeys.all, 'stats'] as const,
  queue: () => [...coachKeys.all, 'queue'] as const,
  meal: (id: string) => [...coachKeys.all, 'meal', id] as const,
  clients: () => [...coachKeys.all, 'clients'] as const,
};

export function useCoachStats() {
  return useQuery({
    queryKey: coachKeys.stats(),
    queryFn: fetchCoachStats,
    refetchInterval: 30_000,
  });
}

export function useCoachQueue() {
  return useQuery({
    queryKey: coachKeys.queue(),
    queryFn: fetchCoachQueue,
    refetchInterval: 15_000,
  });
}

export function useCoachMeal(mealId: string | null) {
  return useQuery({
    queryKey: coachKeys.meal(mealId ?? ''),
    queryFn: () => fetchMealById(mealId!),
    enabled: Boolean(mealId),
  });
}

export function useCoachClients() {
  return useQuery({
    queryKey: coachKeys.clients(),
    queryFn: fetchClients,
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
