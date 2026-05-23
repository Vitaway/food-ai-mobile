import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getStoredProfile, saveProfile as persistProfile } from '@/services/local/storage';
import type { UserProfile } from '@/types';
import { createId } from '@/utils/dates';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';

type ProfileDraft = Omit<
  UserProfile,
  'id' | 'macroTargets' | 'bmr' | 'tdee' | 'waterTargetMl' | 'onboardingComplete' | 'createdAt' | 'updatedAt'
>;

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  saveProfile: (draft: ProfileDraft) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function buildProfile(draft: ProfileDraft, existing?: UserProfile | null): UserProfile {
  const { bmr, tdee, macroTargets } = calculateMacroTargets(
    draft.weightKg,
    draft.heightCm,
    draft.age,
    draft.sex,
    draft.activityLevel,
    draft.goal,
  );
  const now = new Date().toISOString();

  return {
    ...draft,
    id: existing?.id ?? createId('user'),
    macroTargets,
    bmr,
    tdee,
    waterTargetMl: calculateWaterTargetMl(draft.weightKg),
    onboardingComplete: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = await getStoredProfile();
    setProfile(stored);
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const saveProfile = useCallback(
    async (draft: ProfileDraft) => {
      const next = buildProfile(draft, profile);
      await persistProfile(next);
      setProfile(next);
      return next;
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      hasCompletedOnboarding: Boolean(profile?.onboardingComplete),
      saveProfile,
      refreshProfile,
    }),
    [profile, isLoading, saveProfile, refreshProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}
