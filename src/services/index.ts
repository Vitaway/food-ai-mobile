import { USE_MOCK_API } from '@/constants/features';
import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import type { MealSubmissionApi } from '@/services/contracts/mealSubmissionApi';
import { fakeApiMealAnalysisService } from '@/services/local/fakeApiMealAnalysisService';
import { fakeApiMealSubmissionService } from '@/services/local/fakeApiMealSubmissionService';
import { localMealsRepository } from '@/services/local/localMealsRepository';
import { localNotificationsRepository } from '@/services/local/localNotificationsRepository';
import { localProfileRepository } from '@/services/local/localProfileRepository';
import { mockMealAnalysisService } from '@/services/local/mockMealAnalysisService';

const mealAnalysis: MealAnalysisService = USE_MOCK_API
  ? fakeApiMealAnalysisService
  : mockMealAnalysisService;

const mealSubmission: MealSubmissionApi | null = USE_MOCK_API ? fakeApiMealSubmissionService : null;

export const services = {
  mealAnalysis,
  mealSubmission,
  mealsRepository: localMealsRepository,
  profileRepository: localProfileRepository,
  notificationsRepository: localNotificationsRepository,
  useMockApi: USE_MOCK_API,
} as const;
