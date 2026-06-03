import type { MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import { mockAnalyzePhoto, mockAnalyzeText } from '@/services/local/mealAnalysis';
import { delay } from '@/utils/dates';

export const mockMealAnalysisService: MealAnalysisService = {
  async analyzeMeal({ imageUri, text }) {
    await delay(1200);
    if (text?.trim()) return mockAnalyzeText(text);
    return mockAnalyzePhoto(imageUri);
  },
};
