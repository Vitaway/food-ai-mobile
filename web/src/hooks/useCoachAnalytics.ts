import { useQuery } from '@tanstack/react-query';
import { fetchCoachAnalytics } from '@/api/coachApi';

export const analyticsKeys = {
  all: ['coach-analytics'] as const,
};

export function useCoachAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.all,
    queryFn: fetchCoachAnalytics,
  });
}
