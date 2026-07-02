import { useQuery } from '@tanstack/react-query';
import {
  fetchConsumerDashboard,
  fetchConsumerMeal,
  fetchConsumerMeals,
  fetchConsumerProfile,
} from '@/features/consumer/api/consumerApi';

export const consumerKeys = {
  all: ['consumer'] as const,
  profile: () => [...consumerKeys.all, 'profile'] as const,
  dashboard: () => [...consumerKeys.all, 'dashboard'] as const,
  meals: () => [...consumerKeys.all, 'meals'] as const,
  meal: (id: string) => [...consumerKeys.all, 'meal', id] as const,
};

export function useConsumerProfile() {
  return useQuery({
    queryKey: consumerKeys.profile(),
    queryFn: fetchConsumerProfile,
  });
}

export function useConsumerDashboard() {
  return useQuery({
    queryKey: consumerKeys.dashboard(),
    queryFn: fetchConsumerDashboard,
  });
}

export function useConsumerMeals() {
  return useQuery({
    queryKey: consumerKeys.meals(),
    queryFn: fetchConsumerMeals,
  });
}

export function useConsumerMeal(id: string) {
  return useQuery({
    queryKey: consumerKeys.meal(id),
    queryFn: () => fetchConsumerMeal(id),
    enabled: Boolean(id),
  });
}
