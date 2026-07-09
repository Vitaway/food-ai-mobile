import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCoachProfile,
  updateCoachPassword,
  updateCoachProfile,
  uploadCoachAvatar,
} from '@/api/coachApi';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';
import type { CoachProfile, UpdateCoachPasswordPayload, UpdateCoachProfilePayload } from '@/types';

function syncAuthProfile(profile: CoachProfile) {
  const session = useAuthStore.getState().session;
  if (!session) return;
  useAuthStore.getState().setSession({
    ...session,
    user: {
      ...session.user,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    },
  });
}

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
    onSuccess: (profile) => {
      syncAuthProfile(profile);
      void qc.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUploadCoachAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadCoachAvatar,
    onSuccess: (profile) => {
      syncAuthProfile(profile);
      void qc.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateCoachPassword() {
  return useMutation({
    mutationFn: (payload: UpdateCoachPasswordPayload) => updateCoachPassword(payload),
  });
}
