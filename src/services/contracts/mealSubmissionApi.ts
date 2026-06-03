import type { MealTypeId } from '@/constants/mealTypes';
import type { MealAnalysisPreview, MealSubmissionStatus } from '@/types';

export type MealSubmitInput = {
  mealType: MealTypeId;
  imageUrl?: string;
  textInput?: string;
  note?: string;
  analysis: MealAnalysisPreview;
};

export type MealSubmissionStatusResponse = {
  mealId: string;
  status: MealSubmissionStatus;
  updatedAt: string;
};

export interface MealSubmissionApi {
  submitMeal: (input: MealSubmitInput) => Promise<{ mealId: string }>;
  getStatus: (mealId: string) => Promise<MealSubmissionStatusResponse>;
  getResults: (mealId: string) => Promise<MealAnalysisPreview | null>;
  resumeActivePipelines: () => Promise<void>;
}
