import type { MealAnalysisPreview } from '@/types';

export type AnalyzeMealInput = {
  imageUri?: string;
  text?: string;
};

export interface MealAnalysisService {
  analyzeMeal: (input: AnalyzeMealInput) => Promise<MealAnalysisPreview>;
}
