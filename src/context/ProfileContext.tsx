import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { services } from '@/services';
import { clearAllLocalData, clearNutritionData } from '@/services/local/storage';
import type { UserProfile } from '@/types';
import { createId } from '@/utils/dates';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';

type ProfileDraft = Omit<
  UserProfile,
  'id' | 'macroTargets' | 'bmr' | 'tdee' | 'waterTargetMl' | 'onboardingComplete' | 'createdAt' | 'updatedAt'
>;

type AccountFields = Pick<UserProfile, 'displayName' | 'email' | 'avatarUrl'>;

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  saveProfile: (draft: ProfileDraft) => Promise<UserProfile>;
  updateAccount: (fields: Partial<AccountFields>) => Promise<UserProfile | null>;
  resetNutritionData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
    const stored = await services.profileRepository.getProfile();
    setProfile(stored);
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const saveProfile = useCallback(
    async (draft: ProfileDraft) => {
      const next = buildProfile(draft, profile);
      await services.profileRepository.saveProfile(next);
      setProfile(next);
      return next;
    },
    [profile],
  );

  const updateAccount = useCallback(
    async (fields: Partial<AccountFields>) => {
      if (!profile) return null;
      const next: UserProfile = {
        ...profile,
        ...fields,
        updatedAt: new Date().toISOString(),
      };
      await services.profileRepository.saveProfile(next);
      setProfile(next);
      return next;
    },
    [profile],
  );

  const resetNutritionData = useCallback(async () => {
    await clearNutritionData();
  }, []);

  const deleteAccount = useCallback(async () => {
    await clearAllLocalData();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      hasCompletedOnboarding: Boolean(profile?.onboardingComplete),
      saveProfile,
      updateAccount,
      resetNutritionData,
      deleteAccount,
      refreshProfile,
    }),
    [profile, isLoading, saveProfile, updateAccount, resetNutritionData, deleteAccount, refreshProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}
