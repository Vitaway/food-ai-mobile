import { isPipelineActive, PIPELINE_STEP_DELAYS_MS, PIPELINE_STEPS } from '@/constants/mealStatus';
import type { MealSubmission, MealSubmissionStatus } from '@/types';

const runningPipelines = new Set<string>();

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function shouldSimulateRejection() {
  return __DEV__ && Math.random() < 0.08;
}

export type MealPipelineDeps = {
  getMeal: (mealId: string) => Promise<MealSubmission | null>;
  persistStatus: (mealId: string, status: MealSubmissionStatus) => Promise<MealSubmission | null>;
};

export async function runMealPipeline(
  mealId: string,
  deps: MealPipelineDeps,
  fromStatus?: MealSubmissionStatus,
) {
  if (runningPipelines.has(mealId)) return;
  runningPipelines.add(mealId);

  try {
    let startIndex = 0;
    if (fromStatus) {
      const idx = PIPELINE_STEPS.indexOf(fromStatus);
      startIndex = idx >= 0 ? idx : 0;
    } else {
      const current = await deps.getMeal(mealId);
      if (current) {
        const idx = PIPELINE_STEPS.indexOf(current.status);
        startIndex = idx >= 0 ? idx : 0;
      }
    }

    for (let index = startIndex; index < PIPELINE_STEPS.length; index += 1) {
      const status = PIPELINE_STEPS[index];

      if (status === 'in_review' && shouldSimulateRejection()) {
        await deps.persistStatus(mealId, 'rejected');
        return;
      }

      await deps.persistStatus(mealId, status);

      await delay(PIPELINE_STEP_DELAYS_MS[status]);
    }
  } finally {
    runningPipelines.delete(mealId);
  }
}

export async function resumeActiveMealPipelines(
  meals: MealSubmission[],
  deps: MealPipelineDeps,
) {
  const active = meals.filter((meal) => isPipelineActive(meal.status));
  await Promise.all(active.map((meal) => runMealPipeline(meal.id, deps, meal.status)));
}
