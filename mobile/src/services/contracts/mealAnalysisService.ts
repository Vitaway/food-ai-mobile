import type { MealAnalysisPreview } from '@/types';

export type AnalyzeMealInput = {
  imageUri?: string;
  text?: string;
  plateDiameterCm?: number | null;
};

export interface MealAnalysisService {
  analyzeMeal: (input: AnalyzeMealInput) => Promise<MealAnalysisPreview>;
}
