import { isApiConfigured } from '@/constants/api';
import { USE_MOCK_API } from '@/constants/features';
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

const mealAnalysis: MealAnalysisService = USE_MOCK_API
  ? fakeApiMealAnalysisService
  : isApiConfigured()
    ? apiMealAnalysisService
    : mockMealAnalysisService;

const mealSubmission: MealSubmissionApi | null = USE_MOCK_API ? fakeApiMealSubmissionService : null;

const plateDetection: PlateDetectionService = isApiConfigured()
  ? apiPlateDetectionService
  : mockPlateDetectionService;

export const services = {
  mealAnalysis,
  mealSubmission,
  plateDetection,
  mealsRepository: localMealsRepository,
  profileRepository: localProfileRepository,
  notificationsRepository: localNotificationsRepository,
  useMockApi: USE_MOCK_API,
} as const;
