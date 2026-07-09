import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import { mockAnalyzeMeal } from '@/services/local/mealAnalysis';
import { delay } from '@/utils/dates';

export const mockMealAnalysisService: MealAnalysisService = {
  async analyzeMeal(input) {
    await delay(1200);
    return mockAnalyzeMeal(input);
  },
};
