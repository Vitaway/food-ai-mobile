import { isApiConfigured } from '@/constants/api';
import { USE_MOCK_API, USE_OFFLINE_DEV_FALLBACKS } from '@/constants/features';
import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import type { MealSubmissionApi } from '@/services/contracts/mealSubmissionApi';
import type { PlateDetectionService } from '@/services/contracts/plateDetectionService';
import { fakeApiMealAnalysisService } from '@/services/local/fakeApiMealAnalysisService';
import { fakeApiMealSubmissionService } from '@/services/local/fakeApiMealSubmissionService';
import { localMealsRepository } from '@/services/local/localMealsRepository';
import { localNotificationsRepository } from '@/services/local/localNotificationsRepository';
import { localProfileRepository } from '@/services/local/localProfileRepository';
import { mockMealAnalysisService } from '@/services/local/mockMealAnalysisService';
import { mockPlateDetectionService } from '@/services/local/mockPlateDetectionService';
import { apiMealAnalysisService } from '@/services/remote/apiMealAnalysisService';
import { apiPlateDetectionService } from '@/services/remote/apiPlateDetectionService';
import { createUnavailableMealAnalysisService } from '@/services/unavailableService';

const PRODUCTION_API_MESSAGE =
  'MiraFood could not reach the server. Check your connection and try again.';

function resolveMealAnalysisService(): MealAnalysisService {
  if (USE_MOCK_API) return fakeApiMealAnalysisService;
  if (isApiConfigured()) return apiMealAnalysisService;
  if (USE_OFFLINE_DEV_FALLBACKS) return mockMealAnalysisService;
  return createUnavailableMealAnalysisService(PRODUCTION_API_MESSAGE);
}

function resolvePlateDetectionService(): PlateDetectionService {
  if (isApiConfigured()) return apiPlateDetectionService;
  if (USE_OFFLINE_DEV_FALLBACKS) return mockPlateDetectionService;
  return {
    async detectPlate() {
      throw new Error(PRODUCTION_API_MESSAGE);
    },
  };
}

const mealAnalysis = resolveMealAnalysisService();
const mealSubmission: MealSubmissionApi | null = USE_MOCK_API ? fakeApiMealSubmissionService : null;
const plateDetection = resolvePlateDetectionService();

export const services = {
  mealAnalysis,
  mealSubmission,
  plateDetection,
  mealsRepository: localMealsRepository,
  profileRepository: localProfileRepository,
  notificationsRepository: localNotificationsRepository,
  useMockApi: USE_MOCK_API,
} as const;
