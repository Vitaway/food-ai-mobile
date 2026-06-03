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
import { USE_MOCK_API } from '@/constants/features';
import { services } from '@/services';
import { mockAnalyzePhoto, mockAnalyzeText, toMealSubmission } from '@/services/local/mealAnalysis';
import { resumeActiveMealPipelines, runMealPipeline } from '@/services/local/mealPipeline';
import { clearNutritionData } from '@/services/local/storage';
import type { DailyLog, MealAnalysisPreview, MealSubmission, MealSubmissionStatus } from '@/types';
import { todayKey } from '@/utils/dates';

type SubmitMealInput = {
  mealType: MealTypeId;
  imageUrl?: string;
  textInput?: string;
  note?: string;
  analysis?: MealAnalysisPreview;
};

type MealsContextValue = {
  meals: MealSubmission[];
  dailyLog: DailyLog;
  isLoading: boolean;
  refreshMeals: () => Promise<void>;
  clearAllMeals: () => Promise<void>;
  analyzeMeal: (input: { imageUri?: string; text?: string }) => Promise<MealAnalysisPreview>;
  saveMealToDiary: (input: SubmitMealInput) => Promise<MealSubmission>;
  simulatePipeline: (mealId: string, fromStatus?: MealSubmissionStatus) => Promise<void>;
  addWater: (amountMl: number, date?: string) => Promise<void>;
  getMeal: (id: string) => MealSubmission | undefined;
  updateMeal: (meal: MealSubmission) => Promise<MealSubmission>;
  deleteMeal: (id: string) => Promise<void>;
};

const MealsContext = createContext<MealsContextValue | null>(null);

function withCoachReviewStub(meal: MealSubmission, status: MealSubmissionStatus): MealSubmission {
  if (status !== 'in_review' || meal.coachReview) return meal;
  return {
    ...meal,
    coachReview: { note: 'Coach review pending (simulated)' },
  };
}

export function MealsProvider({ children }: PropsWithChildren) {
  const [meals, setMeals] = useState<MealSubmission[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({ date: todayKey(), waterMl: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const mealsRef = useRef(meals);
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

  const refreshMeals = useCallback(async () => {
    const [storedMeals, log] = await Promise.all([
      services.mealsRepository.getMeals(),
      services.mealsRepository.getDailyLog(),
    ]);
    setMeals(storedMeals);
    setDailyLog(log);
  }, []);

  const simulatePipeline = useCallback(
    async (mealId: string, fromStatus?: MealSubmissionStatus) => {
      await runMealPipeline(mealId, pipelineDeps, fromStatus);
    },
    [pipelineDeps],
  );

  const resumeActivePipelines = useCallback(async () => {
    if (USE_MOCK_API && services.mealSubmission) {
      await services.mealSubmission.resumeActivePipelines();
      await refreshMeals();
      return;
    }
    const storedMeals = await services.mealsRepository.getMeals();
    await resumeActiveMealPipelines(storedMeals, pipelineDeps);
  }, [pipelineDeps, refreshMeals]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [storedMeals] = await Promise.all([
        services.mealsRepository.getMeals(),
        services.mealsRepository.getDailyLog().then((log) => {
          if (!cancelled) setDailyLog(log);
        }),
      ]);
      if (!cancelled) {
        setMeals(storedMeals);
        await resumeActivePipelines();
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeActivePipelines]);

  const analyzeMeal = useCallback(async ({ imageUri, text }: { imageUri?: string; text?: string }) => {
    return services.mealAnalysis.analyzeMeal({ imageUri, text });
  }, []);

  const saveMealToDiary = useCallback(
    async (input: SubmitMealInput) => {
      const analysis =
        input.analysis ??
        (input.textInput ? mockAnalyzeText(input.textInput) : mockAnalyzePhoto(input.imageUrl));

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
        status: 'pending',
      });

      await services.mealsRepository.upsertMeal(meal);
      updateMealInState(meal);
      void simulatePipeline(meal.id, 'pending');
      return meal;
    },
    [simulatePipeline, updateMealInState],
  );

  const addWater = useCallback(async (amountMl: number, date = todayKey()) => {
    const log = await services.mealsRepository.addWater(date, amountMl);
    setDailyLog(log);
  }, []);

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
