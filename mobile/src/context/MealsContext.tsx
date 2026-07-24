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

import type { MealTypeId } from '@/constants/mealTypes';
import { isApiConfigured } from '@/constants/api';
import { USE_MOCK_API, USE_OFFLINE_DEV_FALLBACKS } from '@/constants/features';
import { useAuth } from '@/context/AuthContext';
import { fetchConsumerMeals, fetchConsumerDashboard, submitConsumerMeal, logConsumerWater, backfillMealPhotos, isLocalImageUri, hasServerImageUrl } from '@/services/remote/consumerApi';
import { services } from '@/services';
import { mockAnalyzeMeal, toMealSubmission } from '@/services/local/mealAnalysis';
import { resumeActiveMealPipelines, runMealPipeline } from '@/services/local/mealPipeline';
import { clearNutritionData } from '@/services/local/storage';
import type { DailyLog, MealAnalysisPreview, MealSubmission, MealSubmissionStatus } from '@/types';
import { todayKey } from '@/utils/dates';
import { cupsToMl, WATER_CUP_ML } from '@/utils/waterUnits';

type SubmitMealInput = {
  mealType: MealTypeId;
  imageUrl?: string;
  textInput?: string;
  note?: string;
  plateDiameterCm?: number | null;
  analysis?: MealAnalysisPreview;
};

type MealsContextValue = {
  meals: MealSubmission[];
  dailyLog: DailyLog;
  isLoading: boolean;
  refreshMeals: () => Promise<void>;
  clearAllMeals: () => Promise<void>;
  analyzeMeal: (input: {
    imageUri?: string;
    text?: string;
    note?: string;
    plateDiameterCm?: number | null;
  }) => Promise<MealAnalysisPreview>;
  saveMealToDiary: (input: SubmitMealInput) => Promise<MealSubmission>;
  simulatePipeline: (mealId: string, fromStatus?: MealSubmissionStatus) => Promise<void>;
  logWaterCups: (cups: number, date?: string) => Promise<void>;
  removeWaterEntry: (entryId: string, date?: string) => Promise<void>;
  addWater: (amountMl: number, date?: string) => Promise<void>;
  getMeal: (id: string) => MealSubmission | undefined;
  updateMeal: (meal: MealSubmission) => Promise<MealSubmission>;
  deleteMeal: (id: string) => Promise<void>;
};

const MealsContext = createContext<MealsContextValue | null>(null);

function withCoachReviewStub(meal: MealSubmission, status: MealSubmissionStatus): MealSubmission {
  if (!USE_OFFLINE_DEV_FALLBACKS || status !== 'in_review' || meal.coachReview) return meal;
  return {
    ...meal,
    coachReview: { note: 'Coach review pending (dev simulation)' },
  };
}

export function MealsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [meals, setMeals] = useState<MealSubmission[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({ date: todayKey(), waterMl: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const mealsRef = useRef(meals);
  const mealsInflightRef = useRef<Promise<void> | null>(null);
  mealsRef.current = meals;

  const updateMealInState = useCallback((meal: MealSubmission) => {
    setMeals((current) => {
      const exists = current.some((entry) => entry.id === meal.id);
      if (!exists) return [meal, ...current];
      return current.map((entry) => (entry.id === meal.id ? meal : entry));
    });
  }, []);

  const pipelineDeps = useMemo(
    () => ({
      getMeal: async (mealId: string) => {
        const fromState = mealsRef.current.find((entry) => entry.id === mealId);
        if (fromState) return fromState;
        const stored = await services.mealsRepository.getMeals();
        return stored.find((entry) => entry.id === mealId) ?? null;
      },
      persistStatus: async (mealId: string, status: MealSubmissionStatus) => {
        const list = mealsRef.current;
        const existing = list.find((entry) => entry.id === mealId);
        const base =
          existing ??
          (await services.mealsRepository.getMeals()).find((entry) => entry.id === mealId);
        if (!base) return null;

        const updated = withCoachReviewStub({ ...base, status }, status);
        await services.mealsRepository.upsertMeal(updated);
        updateMealInState(updated);
        return updated;
      },
    }),
    [updateMealInState],
  );

  const syncRemoteWater = useCallback(async () => {
    if (!isApiConfigured() || !isAuthenticated) return;
    try {
      const dashboard = await fetchConsumerDashboard();
      const local = await services.mealsRepository.getDailyLog(dashboard.date);
      // Keep optimistic local total when the server hasn't caught up yet.
      if (local.waterMl !== dashboard.waterMl && local.date === dashboard.date) {
        const pending = (local.waterEntries ?? []).length > 0 && local.waterMl > dashboard.waterMl;
        if (pending) {
          setDailyLog(local);
          return;
        }
      }
      const log = await services.mealsRepository.setWater(dashboard.date, dashboard.waterMl);
      setDailyLog({ ...log, waterEntries: local.waterEntries });
    } catch {
      /* keep local value */
    }
  }, [isAuthenticated]);

  const refreshMeals = useCallback(async () => {
    if (mealsInflightRef.current) {
      return mealsInflightRef.current;
    }

    mealsInflightRef.current = (async () => {
      try {
        if (isApiConfigured() && isAuthenticated) {
          const localMeals = await services.mealsRepository.getMeals();
          let remoteMeals = await fetchConsumerMeals();
          await backfillMealPhotos(remoteMeals, localMeals);
          remoteMeals = await fetchConsumerMeals();

          const merged = remoteMeals.map((remote) => {
            const local = localMeals.find((entry) => entry.id === remote.id);
            const imageUrl = hasServerImageUrl(remote.imageUrl)
              ? remote.imageUrl
              : local?.imageUrl;
            return imageUrl && imageUrl !== remote.imageUrl ? { ...remote, imageUrl } : remote;
          });

          setMeals(merged);
          await services.mealsRepository.replaceMeals(merged);
          // Water is updated via logWaterCups / bootstrap — avoid clobbering optimistic logs.
          return;
        }
        const [storedMeals, log] = await Promise.all([
          services.mealsRepository.getMeals(),
          services.mealsRepository.getDailyLog(),
        ]);
        setMeals(storedMeals);
        setDailyLog(log);
      } catch {
        /* keep local cache on transient API failures */
      } finally {
        mealsInflightRef.current = null;
      }
    })();

    return mealsInflightRef.current;
  }, [isAuthenticated]);

  const simulatePipeline = useCallback(
    async (mealId: string, fromStatus?: MealSubmissionStatus) => {
      if (!USE_OFFLINE_DEV_FALLBACKS || isApiConfigured()) return;
      await runMealPipeline(mealId, pipelineDeps, fromStatus);
    },
    [pipelineDeps],
  );

  const resumeActivePipelines = useCallback(async () => {
    if (!USE_OFFLINE_DEV_FALLBACKS && !USE_MOCK_API) return;
    if (isApiConfigured() && isAuthenticated) return;

    if (USE_MOCK_API && services.mealSubmission) {
      await services.mealSubmission.resumeActivePipelines();
      await refreshMeals();
      return;
    }
    const storedMeals = await services.mealsRepository.getMeals();
    await resumeActiveMealPipelines(storedMeals, pipelineDeps);
  }, [pipelineDeps, refreshMeals, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const useRemote = isApiConfigured() && isAuthenticated;

      if (useRemote) {
        try {
          await refreshMeals();
          await syncRemoteWater();
        } finally {
          if (!cancelled) setIsLoading(false);
        }
        return;
      }

      const [storedMeals, log] = await Promise.all([
        services.mealsRepository.getMeals(),
        services.mealsRepository.getDailyLog(),
      ]);

      if (!cancelled) {
        setMeals(storedMeals);
        setDailyLog(log);
        setIsLoading(false);
      }

      if (!cancelled) {
        await resumeActivePipelines();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshMeals, resumeActivePipelines, syncRemoteWater]);

  const analyzeMeal = useCallback(
    async ({
      imageUri,
      text,
      note,
      plateDiameterCm,
    }: {
      imageUri?: string;
      text?: string;
      note?: string;
      plateDiameterCm?: number | null;
    }) => {
      return services.mealAnalysis.analyzeMeal({ imageUri, text, note, plateDiameterCm });
    },
    [],
  );

  const saveMealToDiary = useCallback(
    async (input: SubmitMealInput) => {
      let analysis = input.analysis;
      if (!analysis) {
        if (isApiConfigured() || !USE_OFFLINE_DEV_FALLBACKS) {
          throw new Error('Run AI analysis before submitting this meal.');
        }
        analysis = mockAnalyzeMeal({
          imageUri: input.imageUrl,
          text: input.textInput,
          note: input.note,
          plateDiameterCm: input.plateDiameterCm,
        });
      }

      if (USE_MOCK_API && services.mealSubmission) {
        const { mealId } = await services.mealSubmission.submitMeal({
          mealType: input.mealType,
          imageUrl: input.imageUrl,
          textInput: input.textInput,
          note: input.note,
          analysis,
        });
        const stored = await services.mealsRepository.getMeals();
        const meal = stored.find((entry) => entry.id === mealId);
        if (!meal) throw new Error('Saved meal not found');
        updateMealInState(meal);
        return meal;
      }

      const meal = toMealSubmission(analysis, {
        mealType: input.mealType,
        imageUrl: input.imageUrl,
        textInput: input.textInput,
        note: input.note,
        plateDiameterCm: input.plateDiameterCm ?? analysis.plateDiameterCm,
        status: isApiConfigured() && isAuthenticated ? 'in_review' : 'pending',
      });

      if (isApiConfigured() && isAuthenticated) {
        const localImage =
          input.imageUrl && isLocalImageUri(input.imageUrl) ? input.imageUrl : undefined;
        const saved = await submitConsumerMeal(meal, localImage);
        await services.mealsRepository.upsertMeal(saved);
        updateMealInState(saved);
        return saved;
      }

      if (!USE_OFFLINE_DEV_FALLBACKS) {
        throw new Error('Sign in to save meals to your diary.');
      }

      await services.mealsRepository.upsertMeal(meal);
      updateMealInState(meal);
      void simulatePipeline(meal.id, 'pending');
      return meal;
    },
    [simulatePipeline, updateMealInState, isAuthenticated],
  );

  const syncWaterDelta = useCallback(
    async (amountMl: number, date: string) => {
      if (!isApiConfigured() || !isAuthenticated || date !== todayKey()) return;
      try {
        const remote = await logConsumerWater(amountMl, date);
        const local = await services.mealsRepository.getDailyLog(date);
        local.waterMl = remote.waterMl;
        await services.mealsRepository.setWater(date, remote.waterMl);
        const updated = await services.mealsRepository.getDailyLog(date);
        setDailyLog({ ...updated, waterEntries: local.waterEntries });
      } catch {
        /* keep local entry history */
      }
    },
    [isAuthenticated],
  );

  const logWaterCups = useCallback(
    async (cups: number, date = todayKey()) => {
      const amountMl = cupsToMl(cups);
      if (amountMl === 0) return;
      const log = await services.mealsRepository.logWaterEntry(date, amountMl, cups);
      setDailyLog(log);
      await syncWaterDelta(amountMl, date);
    },
    [syncWaterDelta],
  );

  const removeWaterEntry = useCallback(
    async (entryId: string, date = todayKey()) => {
      const { log, removedMl } = await services.mealsRepository.removeWaterEntry(date, entryId);
      setDailyLog(log);
      if (removedMl !== 0) {
        await syncWaterDelta(-removedMl, date);
      }
    },
    [syncWaterDelta],
  );

  const addWater = useCallback(
    async (amountMl: number, date = todayKey()) => {
      await logWaterCups(amountMl / WATER_CUP_ML, date);
    },
    [logWaterCups],
  );

  const getMeal = useCallback((id: string) => meals.find((meal) => meal.id === id), [meals]);

  const updateMeal = useCallback(
    async (meal: MealSubmission) => {
      const saved = await services.mealsRepository.upsertMeal(meal);
      updateMealInState(saved);
      return saved;
    },
    [updateMealInState],
  );

  const deleteMeal = useCallback(
    async (mealId: string) => {
      await services.mealsRepository.deleteMeal(mealId);
      setMeals((current) => current.filter((entry) => entry.id !== mealId));
    },
    [],
  );

  const clearAllMeals = useCallback(async () => {
    await clearNutritionData();
    setMeals([]);
    setDailyLog({ date: todayKey(), waterMl: 0 });
  }, []);

  const value = useMemo(
    () => ({
      meals,
      dailyLog,
      isLoading,
      refreshMeals,
      clearAllMeals,
      analyzeMeal,
      saveMealToDiary,
      simulatePipeline,
      logWaterCups,
      removeWaterEntry,
      addWater,
      getMeal,
      updateMeal,
      deleteMeal,
    }),
    [
      meals,
      dailyLog,
      isLoading,
      refreshMeals,
      clearAllMeals,
      analyzeMeal,
      saveMealToDiary,
      simulatePipeline,
      logWaterCups,
      removeWaterEntry,
      addWater,
      getMeal,
      updateMeal,
      deleteMeal,
    ],
  );

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (!context) throw new Error('useMeals must be used within MealsProvider');
  return context;
}
