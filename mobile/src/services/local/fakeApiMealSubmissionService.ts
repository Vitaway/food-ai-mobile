import type { MealSubmissionApi } from '@/services/contracts/mealSubmissionApi';
import { localMealsRepository } from '@/services/local/localMealsRepository';
import { mealSubmissionToAnalysisPreview, toMealSubmission } from '@/services/local/mealAnalysis';
import { resumeActiveMealPipelines, runMealPipeline } from '@/services/local/mealPipeline';

const pipelineDeps = {
  getMeal: async (mealId: string) => {
    const meals = await localMealsRepository.getMeals();
    return meals.find((entry) => entry.id === mealId) ?? null;
  },
  persistStatus: async (mealId: string, status: Parameters<typeof localMealsRepository.upsertMeal>[0]['status']) => {
    const meals = await localMealsRepository.getMeals();
    const existing = meals.find((entry) => entry.id === mealId);
    if (!existing) return null;
    const updated = {
      ...existing,
      status,
      modelVersion: existing.modelVersion ?? 'mock-api-v1',
      fraudCheckResult: existing.fraudCheckResult ?? 'pass',
      mealClassification: existing.mealClassification ?? 'meal',
      ...(status === 'in_review' && !existing.coachReview
        ? { coachReview: { note: 'Coach review pending (simulated)' } }
        : {}),
      ...(status === 'approved' ? { autoApproved: existing.autoApproved ?? false } : {}),
    };
    return localMealsRepository.upsertMeal(updated);
  },
};

export const fakeApiMealSubmissionService: MealSubmissionApi = {
  async submitMeal(input) {
    const meal = toMealSubmission(input.analysis, {
      mealType: input.mealType,
      imageUrl: input.imageUrl,
      textInput: input.textInput,
      note: input.note,
      status: 'pending',
      modelVersion: 'mock-api-v1',
      fraudCheckResult: 'pass',
      mealClassification: 'meal',
      autoApproved: false,
    });

    await localMealsRepository.upsertMeal(meal);
    void runMealPipeline(meal.id, pipelineDeps, 'pending');
    return { mealId: meal.id };
  },

  async getStatus(mealId) {
    const meal = await pipelineDeps.getMeal(mealId);
    if (!meal) throw new Error(`Meal not found: ${mealId}`);
    return {
      mealId: meal.id,
      status: meal.status,
      updatedAt: meal.submittedAt,
    };
  },

  async getResults(mealId) {
    const meal = await pipelineDeps.getMeal(mealId);
    if (!meal || meal.status !== 'approved') return null;
    return mealSubmissionToAnalysisPreview(meal);
  },

  async resumeActivePipelines() {
    const meals = await localMealsRepository.getMeals();
    await resumeActiveMealPipelines(meals, pipelineDeps);
  },
};
