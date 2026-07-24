import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import { mockAnalyzeMeal } from '@/services/local/mealAnalysis';
import { delay } from '@/utils/dates';

export const mockMealAnalysisService: MealAnalysisService = {
  async analyzeMeal(input) {
    await delay(1200);
    return mockAnalyzeMeal(input);
  },

  async suggestMealTitle(description: string) {
    await delay(400);
    const cleaned = description.trim() || 'Custom meal';
    // Offline mock: Title Case the first few words as a stand-in dish name.
    return cleaned
      .split(/\s+/)
      .slice(0, 6)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },
};
