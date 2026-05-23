import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { MealTypeId } from '@/constants/mealTypes';
import { mockAnalyzePhoto, mockAnalyzeText, toMealSubmission } from '@/services/local/mealAnalysis';
import {
  addWater as persistWater,
  getDailyLog,
  getStoredMeals,
  upsertMeal,
} from '@/services/local/storage';
import type { DailyLog, MealAnalysisPreview, MealSubmission, MealSubmissionStatus } from '@/types';
import { delay, todayKey } from '@/utils/dates';

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
  analyzeMeal: (input: { imageUri?: string; text?: string }) => Promise<MealAnalysisPreview>;
  saveMealToDiary: (input: SubmitMealInput) => Promise<MealSubmission>;
  simulatePipeline: (mealId: string) => Promise<void>;
  addWater: (amountMl: number, date?: string) => Promise<void>;
  getMeal: (id: string) => MealSubmission | undefined;
};

const MealsContext = createContext<MealsContextValue | null>(null);

export function MealsProvider({ children }: PropsWithChildren) {
  const [meals, setMeals] = useState<MealSubmission[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({ date: todayKey(), waterMl: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refreshMeals = useCallback(async () => {
    const [storedMeals, log] = await Promise.all([getStoredMeals(), getDailyLog()]);
    setMeals(storedMeals);
    setDailyLog(log);
  }, []);

  useEffect(() => {
    refreshMeals().finally(() => setIsLoading(false));
  }, [refreshMeals]);

  const analyzeMeal = useCallback(async ({ imageUri, text }: { imageUri?: string; text?: string }) => {
    await delay(1200);
    if (text?.trim()) return mockAnalyzeText(text);
    return mockAnalyzePhoto(imageUri);
  }, []);

  const saveMealToDiary = useCallback(async (input: SubmitMealInput) => {
    const analysis = input.analysis ?? (input.textInput ? mockAnalyzeText(input.textInput) : mockAnalyzePhoto(input.imageUrl));
    const meal = toMealSubmission(analysis, {
      mealType: input.mealType,
      imageUrl: input.imageUrl,
      textInput: input.textInput,
      note: input.note,
      status: 'approved',
    });

    await upsertMeal(meal);
    setMeals((current) => [meal, ...current.filter((entry) => entry.id !== meal.id)]);
    return meal;
  }, []);

  const simulatePipeline = useCallback(async (mealId: string) => {
    const statuses: MealSubmissionStatus[] = ['pending', 'analyzing', 'in_review', 'approved'];

    for (const status of statuses) {
      setMeals((current) =>
        current.map((meal) => (meal.id === mealId ? { ...meal, status } : meal)),
      );
      await delay(status === 'analyzing' ? 900 : 500);
    }

    const mealsList = await getStoredMeals();
    const meal = mealsList.find((entry) => entry.id === mealId);
    if (meal) {
      const approved = { ...meal, status: 'approved' as const };
      await upsertMeal(approved);
      setMeals((current) => current.map((entry) => (entry.id === mealId ? approved : entry)));
    }
  }, []);

  const addWater = useCallback(async (amountMl: number, date = todayKey()) => {
    const log = await persistWater(date, amountMl);
    setDailyLog(log);
  }, []);

  const getMeal = useCallback((id: string) => meals.find((meal) => meal.id === id), [meals]);

  const value = useMemo(
    () => ({
      meals,
      dailyLog,
      isLoading,
      refreshMeals,
      analyzeMeal,
      saveMealToDiary,
      simulatePipeline,
      addWater,
      getMeal,
    }),
    [meals, dailyLog, isLoading, refreshMeals, analyzeMeal, saveMealToDiary, simulatePipeline, addWater, getMeal],
  );

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (!context) throw new Error('useMeals must be used within MealsProvider');
  return context;
}
