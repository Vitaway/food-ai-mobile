import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';

export function createUnavailableMealAnalysisService(message: string): MealAnalysisService {
  return {
    async analyzeMeal() {
      throw new Error(message);
    },
  };
}
