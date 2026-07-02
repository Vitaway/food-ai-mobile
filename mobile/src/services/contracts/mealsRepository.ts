import type { DailyLog, MealSubmission } from '@/types';

export interface MealsRepository {
  getMeals: () => Promise<MealSubmission[]>;
  upsertMeal: (meal: MealSubmission) => Promise<MealSubmission>;
  deleteMeal: (id: string) => Promise<void>;
  getDailyLog: (date?: string) => Promise<DailyLog>;
  getDailyLogs: () => Promise<DailyLog[]>;
  addWater: (date: string, amountMl: number) => Promise<DailyLog>;
  logWaterEntry: (date: string, amountMl: number, cups: number) => Promise<DailyLog>;
  removeWaterEntry: (date: string, entryId: string) => Promise<{ log: DailyLog; removedMl: number }>;
  setWater: (date: string, waterMl: number) => Promise<DailyLog>;
}
