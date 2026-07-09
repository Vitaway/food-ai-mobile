import { useQuery } from '@tanstack/react-query';
import { fetchCoachAnalytics } from '@/api/coachApi';
import { useCoachStore } from '@/stores/coachStore';

export const analyticsKeys = {
  all: (cohortId?: string | null) => ['coach-analytics', cohortId] as const,
};

export function useCoachAnalytics() {
  const cohortId = useCoachStore((s) => s.cohortId);
  return useQuery({
    queryKey: analyticsKeys.all(cohortId),
    queryFn: () => fetchCoachAnalytics(cohortId ?? undefined),
  });
}
