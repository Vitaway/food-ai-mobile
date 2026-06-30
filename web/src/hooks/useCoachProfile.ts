import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCoachProfile,
  updateCoachPassword,
  updateCoachProfile,
} from '@/api/mockCoachProfileApi';
import type { UpdateCoachPasswordPayload, UpdateCoachProfilePayload } from '@/types';

export const profileKeys = {
  all: ['coach-profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

export function useCoachProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchCoachProfile,
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
