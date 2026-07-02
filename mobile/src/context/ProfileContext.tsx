import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { services } from '@/services';
import {
  fetchConsumerProfile,
  updateConsumerProfile,
} from '@/services/remote/consumerApi';
import { clearAllLocalData, clearNutritionData } from '@/services/local/storage';
import type { ActivityLevel, HealthGoal, UserProfile, UserSex } from '@/types';
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
  patientId: string | null;
  saveProfile: (draft: ProfileDraft) => Promise<UserProfile>;
  updateAccount: (fields: Partial<AccountFields>) => Promise<UserProfile | null>;
  resetNutritionData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function defaultMacroDraft(draft: ProfileDraft) {
  return calculateMacroTargets(
    draft.weightKg,
    draft.heightCm,
    draft.age,
    draft.sex,
    draft.activityLevel,
    draft.goal,
  );
}

function normalizeRemoteProfile(
  patientId: string,
  raw: Partial<UserProfile>,
  existing?: UserProfile | null,
): UserProfile {
  const draft: ProfileDraft = {
    displayName: raw.displayName,
    email: raw.email,
    avatarUrl: raw.avatarUrl,
    age: raw.age ?? existing?.age ?? 30,
    sex: (raw.sex ?? existing?.sex ?? null) as UserSex,
    heightCm: raw.heightCm ?? existing?.heightCm ?? 170,
    weightKg: raw.weightKg ?? existing?.weightKg ?? 70,
    goal: (raw.goal ?? existing?.goal ?? 'maintain_weight') as HealthGoal,
    activityLevel: (raw.activityLevel ?? existing?.activityLevel ?? 'moderately_active') as ActivityLevel,
    dietaryPreferences: raw.dietaryPreferences ?? existing?.dietaryPreferences ?? [],
    targetWeightKg: raw.targetWeightKg ?? existing?.targetWeightKg,
    goalPace: raw.goalPace ?? existing?.goalPace,
    mealsPerDay: raw.mealsPerDay ?? existing?.mealsPerDay,
    allergies: raw.allergies ?? existing?.allergies ?? [],
  };

  const { bmr, tdee, macroTargets } = raw.macroTargets
    ? { bmr: raw.bmr ?? 0, tdee: raw.tdee ?? 0, macroTargets: raw.macroTargets }
    : defaultMacroDraft(draft);

  const now = new Date().toISOString();
  return {
    ...draft,
    id: patientId,
    macroTargets,
    bmr,
    tdee,
    waterTargetMl: raw.waterTargetMl ?? calculateWaterTargetMl(draft.weightKg),
    onboardingComplete: Boolean(raw.onboardingComplete),
    createdAt: raw.createdAt ?? existing?.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

function buildProfile(
  draft: ProfileDraft,
  existing?: UserProfile | null,
  patientId?: string | null,
): UserProfile {
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
    id: patientId ?? existing?.id ?? createId('user'),
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
  const { isAuthenticated, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const patientId = session?.user.patientId ?? profile?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (isApiConfigured() && !isAuthenticated) {
      setProfile(null);
      return;
    }
    if (isApiConfigured() && isAuthenticated) {
      const remote = await fetchConsumerProfile();
      const stored = await services.profileRepository.getProfile();
      const normalized = normalizeRemoteProfile(remote.patientId, remote.profile, stored);
      await services.profileRepository.saveProfile(normalized);
      setProfile(normalized);
      return;
    }
    const stored = await services.profileRepository.getProfile();
    setProfile(stored);
  }, [isAuthenticated]);

  useEffect(() => {
    setIsLoading(true);
    refreshProfile().finally(() => setIsLoading(false));
  }, [isAuthenticated, session?.user.id, refreshProfile]);

  const saveProfile = useCallback(
    async (draft: ProfileDraft) => {
      const next = buildProfile(draft, profile, patientId);
      await services.profileRepository.saveProfile(next);
      if (isApiConfigured() && isAuthenticated) {
        const { avatarUrl: nextAvatar, ...rest } = next;
        const payload: Partial<UserProfile> & { onboardingComplete?: boolean } = {
          ...rest,
          onboardingComplete: true,
        };
        if (nextAvatar?.startsWith('http')) {
          payload.avatarUrl = nextAvatar;
        }
        await updateConsumerProfile(payload);
      }
      setProfile(next);
      return next;
    },
    [profile, patientId, isAuthenticated],
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
      if (isApiConfigured() && isAuthenticated) {
        const payload = { ...fields };
        if (fields.avatarUrl && !fields.avatarUrl.startsWith('http')) {
          delete payload.avatarUrl;
        }
        await updateConsumerProfile(payload);
      }
      setProfile(next);
      return next;
    },
    [profile, isAuthenticated],
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
      patientId,
      saveProfile,
      updateAccount,
      resetNutritionData,
      deleteAccount,
      refreshProfile,
    }),
    [
      profile,
      isLoading,
      patientId,
      saveProfile,
      updateAccount,
      resetNutritionData,
      deleteAccount,
      refreshProfile,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}
