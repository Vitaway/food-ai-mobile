import type { MealsRepository } from '@/services/contracts/mealsRepository';
import {
  addWater,
  deleteMeal,
  getDailyLog,
  getStoredDailyLogs,
  getStoredMeals,
  logWaterEntry,
  removeWaterEntry,
  setWater,
  upsertMeal,
} from '@/services/local/storage';

export const localMealsRepository: MealsRepository = {
  getMeals: getStoredMeals,
  upsertMeal,
  deleteMeal,
  getDailyLog,
  getDailyLogs: getStoredDailyLogs,
  addWater,
  logWaterEntry,
  removeWaterEntry,
  setWater,
};
