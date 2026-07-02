import * as SecureStore from 'expo-secure-store';

import { APP_LOCK_ENABLED_KEY, BIOMETRICS_ENABLED_KEY, LEGACY_PASSCODE_KEY, STORAGE_KEYS } from '@/constants/storageKeys';
import { localNotificationsRepository } from '@/services/local/localNotificationsRepository';
import type { DailyLog, MealSubmission, UserProfile } from '@/types';
import { WATER_CUP_ML } from '@/utils/waterUnits';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';
import { todayKey } from '@/utils/dates';

export async function getStoredProfile(): Promise<UserProfile | null> {
  return getStorageItem<UserProfile | null>(STORAGE_KEYS.profile, null);
}

export async function saveProfile(profile: UserProfile) {
  await setStorageItem(STORAGE_KEYS.profile, profile);
}

export async function getStoredMeals(): Promise<MealSubmission[]> {
  return getStorageItem<MealSubmission[]>(STORAGE_KEYS.meals, []);
}

export async function saveMeals(meals: MealSubmission[]) {
  await setStorageItem(STORAGE_KEYS.meals, meals);
}

export async function upsertMeal(meal: MealSubmission) {
  const meals = await getStoredMeals();
  const index = meals.findIndex((entry) => entry.id === meal.id);
  if (index >= 0) meals[index] = meal;
  else meals.unshift(meal);
  await saveMeals(meals);
  return meal;
}

export async function deleteMeal(id: string) {
  const meals = await getStoredMeals();
  const next = meals.filter((entry) => entry.id !== id);
  await saveMeals(next);
}

export async function getMealById(id: string) {
  const meals = await getStoredMeals();
  return meals.find((meal) => meal.id === id) ?? null;
}

export async function getStoredDailyLogs(): Promise<DailyLog[]> {
  return getStorageItem<DailyLog[]>(STORAGE_KEYS.dailyLogs, []);
}

export async function getDailyLog(date = todayKey()): Promise<DailyLog> {
  const logs = await getStoredDailyLogs();
  return (
    logs.find((log) => log.date === date) ?? {
      date,
      waterMl: 0,
    }
  );
}

export async function saveDailyLog(log: DailyLog) {
  const logs = await getStoredDailyLogs();
  const index = logs.findIndex((entry) => entry.date === log.date);
  if (index >= 0) logs[index] = log;
  else logs.unshift(log);
  await setStorageItem(STORAGE_KEYS.dailyLogs, logs);
}

export async function addWater(date: string, amountMl: number) {
  const log = await getDailyLog(date);
  log.waterMl = Math.max(0, log.waterMl + amountMl);
  await saveDailyLog(log);
  return log;
}

function sumWaterEntries(entries: { amountMl: number }[]) {
  return Math.max(0, entries.reduce((total, entry) => total + entry.amountMl, 0));
}

function createWaterEntryId() {
  return `water-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function logWaterEntry(date: string, amountMl: number, cups: number) {
  const log = await getDailyLog(date);
  const entries = [...(log.waterEntries ?? [])];

  if (!entries.length && log.waterMl > 0) {
    entries.push({
      id: createWaterEntryId(),
      amountMl: log.waterMl,
      cups: log.waterMl / WATER_CUP_ML,
      loggedAt: new Date().toISOString(),
    });
  }

  entries.unshift({
    id: createWaterEntryId(),
    amountMl,
    cups,
    loggedAt: new Date().toISOString(),
  });

  const next: DailyLog = {
    ...log,
    waterEntries: entries,
    waterMl: sumWaterEntries(entries),
  };
  await saveDailyLog(next);
  return next;
}

export async function removeWaterEntry(date: string, entryId: string) {
  const log = await getDailyLog(date);
  const entries = (log.waterEntries ?? []).filter((entry) => entry.id !== entryId);
  const next: DailyLog = {
    ...log,
    waterEntries: entries,
    waterMl: sumWaterEntries(entries),
  };
  await saveDailyLog(next);
  return { log: next, removedMl: log.waterMl - next.waterMl };
}

export async function setWater(date: string, waterMl: number) {
  const log = await getDailyLog(date);
  log.waterMl = waterMl;
  await saveDailyLog(log);
  return log;
}

export async function clearNutritionData() {
  await Promise.all([
    removeStorageItem(STORAGE_KEYS.meals),
    removeStorageItem(STORAGE_KEYS.dailyLogs),
    localNotificationsRepository.clearReads(),
  ]);
}

export async function clearProfileData() {
  await removeStorageItem(STORAGE_KEYS.profile);
}

export async function clearAllLocalData() {
  await clearNutritionData();
  await clearProfileData();
  await removeStorageItem(APP_LOCK_ENABLED_KEY);
  await removeStorageItem(BIOMETRICS_ENABLED_KEY);
  await SecureStore.deleteItemAsync(LEGACY_PASSCODE_KEY);
}
