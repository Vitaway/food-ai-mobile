import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCoachProfile,
  updateCoachPassword,
  updateCoachProfile,
} from '@/api/coachApi';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';
import type { UpdateCoachPasswordPayload, UpdateCoachProfilePayload } from '@/types';

export const profileKeys = {
  all: ['coach-profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

export function useCoachProfile() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchCoachProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoachProfilePayload) => updateCoachProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateCoachPassword() {
  return useMutation({
    mutationFn: (payload: UpdateCoachPasswordPayload) => updateCoachPassword(payload),
  });
}
