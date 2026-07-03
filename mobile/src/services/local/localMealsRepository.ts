import type { MealsRepository } from '@/services/contracts/mealsRepository';
import {
  addWater,
  deleteMeal,
  getDailyLog,
  getStoredDailyLogs,
  getStoredMeals,
  logWaterEntry,
  removeWaterEntry,
  saveMeals,
  setWater,
  upsertMeal,
} from '@/services/local/storage';

export const localMealsRepository: MealsRepository = {
  getMeals: getStoredMeals,
  upsertMeal,
  replaceMeals: saveMeals,
  deleteMeal,
  getDailyLog,
  getDailyLogs: getStoredDailyLogs,
  addWater,
  logWaterEntry,
  removeWaterEntry,
  setWater,
};
