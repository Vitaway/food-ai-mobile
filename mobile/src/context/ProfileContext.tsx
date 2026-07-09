import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { services } from '@/services';
import {
  fetchConsumerProfile,
  updateConsumerProfile,
  uploadConsumerAvatar,
} from '@/services/remote/consumerApi';
import { clearAllLocalData, clearNutritionData, clearProfileData } from '@/services/local/storage';
import type { ActivityLevel, HealthGoal, UserProfile, UserSex } from '@/types';
import { createId } from '@/utils/dates';
import { resolveOnboardingComplete } from '@/utils/onboardingStatus';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';

type ProfileDraft = Omit<
  UserProfile,
  'id' | 'macroTargets' | 'bmr' | 'tdee' | 'waterTargetMl' | 'onboardingComplete' | 'createdAt' | 'updatedAt'
>;

type AccountFields = Pick<UserProfile, 'displayName' | 'email' | 'avatarUrl'>;

type ProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  /** True once onboarding status is safe to use for routing. */
  isBootstrapReady: boolean;
  hasCompletedOnboarding: boolean;
  patientId: string | null;
  saveProfile: (draft: ProfileDraft) => Promise<UserProfile>;
  updateAccount: (fields: Partial<AccountFields>) => Promise<UserProfile | null>;
  uploadAvatar: (localUri: string) => Promise<UserProfile | null>;
  updateHealthProfile: (draft: Omit<ProfileDraft, 'displayName' | 'avatarUrl' | 'email'>) => Promise<UserProfile>;
  resetNutritionData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function profileMatchesSession(profile: UserProfile | null, patientId: string | undefined) {
  return Boolean(profile && patientId && profile.id === patientId);
}

async function loadProfileForSession(patientId: string | undefined): Promise<UserProfile | null> {
  const stored = await services.profileRepository.getProfile();
  if (!stored) return null;
  if (patientId && stored.id !== patientId) {
    await clearProfileData();
    await clearNutritionData();
    return null;
  }
  return stored;
}

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
    onboardingComplete: resolveOnboardingComplete(raw),
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
  const { isAuthenticated, session, markOnboardingComplete } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapReady, setIsBootstrapReady] = useState(() => !isApiConfigured());

  const patientId = session?.user.patientId ?? profile?.id ?? null;

  const loadedForUserIdRef = useRef<string | null>(null);
  const profileInflightRef = useRef<Promise<void> | null>(null);
  const userId = session?.user.id ?? null;

  const syncProfileFromRemote = useCallback(async (): Promise<boolean> => {
    if (!isApiConfigured() || !isAuthenticated) return false;

    const patientId = session?.user.patientId;

    try {
      const remote = await fetchConsumerProfile();
      const stored = await loadProfileForSession(patientId ?? remote.patientId);
      const existing = stored?.id === remote.patientId ? stored : null;
      const normalized = normalizeRemoteProfile(remote.patientId, remote.profile, existing);
      await services.profileRepository.saveProfile(normalized);
      setProfile(normalized);
      if (normalized.onboardingComplete) {
        await markOnboardingComplete();
      }
      return normalized.onboardingComplete;
    } catch {
      return false;
    }
  }, [isAuthenticated, session?.user.patientId, markOnboardingComplete]);

  const refreshProfile = useCallback(async () => {
    if (isApiConfigured() && !isAuthenticated) {
      setProfile(null);
      return;
    }

    if (profileInflightRef.current) {
      return profileInflightRef.current;
    }

    profileInflightRef.current = (async () => {
      try {
        const patientId = session?.user.patientId;
        const stored = await loadProfileForSession(patientId);
        if (stored) {
          setProfile(stored);
          if (stored.onboardingComplete) {
            await markOnboardingComplete();
          }
        } else {
          setProfile(null);
        }
        await syncProfileFromRemote();
      } finally {
        profileInflightRef.current = null;
      }
    })();

    return profileInflightRef.current;
  }, [isAuthenticated, session?.user.patientId, markOnboardingComplete, syncProfileFromRemote]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateProfile() {
      if (isApiConfigured() && !isAuthenticated) {
        loadedForUserIdRef.current = null;
        setProfile(null);
        setIsLoading(false);
        setIsBootstrapReady(true);
        return;
      }

      const isNewUser = Boolean(userId && loadedForUserIdRef.current !== userId);
      const patientId = session?.user.patientId;
      const sessionSaysComplete = Boolean(session?.onboardingComplete);

      if (isNewUser) {
        setProfile(null);
      }

      setIsLoading(true);
      setIsBootstrapReady(false);

      try {
        if (!isApiConfigured()) {
          const stored = await services.profileRepository.getProfile();
          if (!cancelled) {
            setProfile(stored);
            if (stored?.onboardingComplete) {
              await markOnboardingComplete();
            }
          }
          return;
        }

        const stored = await loadProfileForSession(patientId);
        if (!cancelled) {
          if (stored) {
            setProfile(stored);
            if (stored.onboardingComplete) {
              await markOnboardingComplete();
            }
          } else if (isNewUser) {
            setProfile(null);
          }
        }

        if (sessionSaysComplete) {
          if (!cancelled) {
            loadedForUserIdRef.current = userId;
          }
          void syncProfileFromRemote();
          return;
        }

        await syncProfileFromRemote();
      } finally {
        if (!cancelled) {
          loadedForUserIdRef.current = userId;
          setIsLoading(false);
          setIsBootstrapReady(true);
        }
      }
    }

    void hydrateProfile();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId, session?.user.patientId, session?.onboardingComplete, markOnboardingComplete, syncProfileFromRemote]);

  const persistRemoteProfile = useCallback(
    async (next: UserProfile, avatarOverride?: string) => {
      if (!isApiConfigured() || !isAuthenticated) return;

      const avatarUrl = avatarOverride ?? next.avatarUrl;
      const payload: Partial<UserProfile> & { onboardingComplete?: boolean } = {
        displayName: next.displayName,
        age: next.age,
        sex: next.sex,
        heightCm: next.heightCm,
        weightKg: next.weightKg,
        goal: next.goal,
        activityLevel: next.activityLevel,
        dietaryPreferences: next.dietaryPreferences,
        allergies: next.allergies,
        targetWeightKg: next.targetWeightKg,
        goalPace: next.goalPace,
        mealsPerDay: next.mealsPerDay,
        macroTargets: next.macroTargets,
        bmr: next.bmr,
        tdee: next.tdee,
        waterTargetMl: next.waterTargetMl,
        onboardingComplete: next.onboardingComplete,
      };
      if (avatarUrl?.startsWith('http')) {
        payload.avatarUrl = avatarUrl;
      }
      await updateConsumerProfile(payload);
    },
    [isAuthenticated],
  );

  const uploadAvatar = useCallback(
    async (localUri: string) => {
      if (!profile) return null;

      let remoteAvatarUrl: string | undefined;
      if (isApiConfigured() && isAuthenticated) {
        const remote = await uploadConsumerAvatar(localUri);
        remoteAvatarUrl = remote.profile.avatarUrl;
      }

      const next: UserProfile = {
        ...profile,
        avatarUrl: remoteAvatarUrl ?? localUri,
        updatedAt: new Date().toISOString(),
      };
      await services.profileRepository.saveProfile(next);
      setProfile(next);
      return next;
    },
    [profile, isAuthenticated],
  );

  const saveProfile = useCallback(
    async (draft: ProfileDraft) => {
      let avatarUrl = draft.avatarUrl;
      if (avatarUrl && !avatarUrl.startsWith('http') && isApiConfigured() && isAuthenticated) {
        try {
          const remote = await uploadConsumerAvatar(avatarUrl);
          avatarUrl = remote.profile.avatarUrl ?? avatarUrl;
        } catch {
          throw new Error('Could not upload your profile photo. Please try again.');
        }
      }

      const next = buildProfile({ ...draft, avatarUrl }, profile, patientId);

      if (isApiConfigured() && isAuthenticated) {
        // Onboarding completion is server-authoritative for authenticated users.
        await persistRemoteProfile(next, avatarUrl);
      }

      await services.profileRepository.saveProfile(next);
      setProfile(next);
      await markOnboardingComplete();

      return next;
    },
    [profile, patientId, isAuthenticated, markOnboardingComplete, persistRemoteProfile],
  );

  const updateHealthProfile = useCallback(
    async (draft: Omit<ProfileDraft, 'displayName' | 'avatarUrl' | 'email'>) => {
      if (!profile) {
        throw new Error('Profile not loaded');
      }
      return saveProfile({
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        ...draft,
      });
    },
    [profile, saveProfile],
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
      isBootstrapReady,
      hasCompletedOnboarding: Boolean(
        session?.onboardingComplete ||
          (profileMatchesSession(profile, session?.user.patientId) &&
            resolveOnboardingComplete(profile)),
      ),
      patientId,
      saveProfile,
      updateAccount,
      uploadAvatar,
      updateHealthProfile,
      resetNutritionData,
      deleteAccount,
      refreshProfile,
    }),
    [
      profile,
      isLoading,
      isBootstrapReady,
      session?.onboardingComplete,
      session?.user.patientId,
      patientId,
      saveProfile,
      updateAccount,
      uploadAvatar,
      updateHealthProfile,
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
