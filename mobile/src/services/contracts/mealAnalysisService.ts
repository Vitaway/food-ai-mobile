import type { MealAnalysisPreview } from '@/types';

export type AnalyzeMealInput = {
  imageUri?: string;
  /** Text-only path — describe meal without a photo. */
  text?: string;
  /** Extra context sent with a photo (portion, prep, sauces). */
  note?: string;
  plateDiameterCm?: number | null;
};

export interface MealAnalysisService {
  analyzeMeal: (input: AnalyzeMealInput) => Promise<MealAnalysisPreview>;
}
