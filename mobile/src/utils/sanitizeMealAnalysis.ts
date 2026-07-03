import type { MealAnalysisPreview, NutritionFacts } from '@/types';
import { isNegligibleCalorieLabel, ZERO_NUTRITION } from '@/utils/negligibleFoodItems';

/** Retired server fallback — must never be shown to users. */
export function isLegacyPlaceholderNutrition(
  nutrition: NutritionFacts,
  estimatedWeightG: number,
): boolean {
  return (
    estimatedWeightG === 200 &&
    nutrition.caloriesKcal === 240 &&
    nutrition.proteinG === 12 &&
    nutrition.carbsG === 28 &&
    nutrition.fatG === 8
  );
}

/** Dishware / packaging with no edible food. */
export function isDishwareOnlyLabel(label: string): boolean {
  const cleaned = label.trim();
  if (!cleaned) return true;
  if (isNegligibleCalorieLabel(cleaned)) return true;
  return /^(an?\s+)?(empty\s+)?(plastic\s+|paper\s+)?(cup|mug|glass|tumbler|bowl|plate|container|bottle|utensil)s?$/i.test(
    cleaned,
  );
}

export function shouldTreatMealAsNonFood(analysis: Pick<MealAnalysisPreview, 'mealName' | 'items'>): boolean {
  if (isNegligibleCalorieLabel(analysis.mealName)) return true;
  if (!analysis.items.length) return isDishwareOnlyLabel(analysis.mealName);

  return analysis.items.every(
    (item) => isNegligibleCalorieLabel(item.label) || isDishwareOnlyLabel(item.label),
  );
}

function sumItemNutrition(items: MealAnalysisPreview['items']): NutritionFacts {
  return items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + item.nutrition.caloriesKcal,
      proteinG: acc.proteinG + item.nutrition.proteinG,
      carbsG: acc.carbsG + item.nutrition.carbsG,
      fatG: acc.fatG + item.nutrition.fatG,
      fiberG: acc.fiberG + item.nutrition.fiberG,
      sugarG: (acc.sugarG ?? 0) + (item.nutrition.sugarG ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (item.nutrition.sodiumMg ?? 0),
    }),
    { ...ZERO_NUTRITION },
  );
}

/** Strip invented macros for empty cups, dishware, and legacy placeholder rows. */
export function sanitizeMealAnalysis(analysis: MealAnalysisPreview): MealAnalysisPreview {
  const nonFood = shouldTreatMealAsNonFood(analysis);
  const hasLegacyPlaceholder = analysis.items.some((item) =>
    isLegacyPlaceholderNutrition(item.nutrition, item.estimatedWeightG),
  );

  if (!nonFood && !hasLegacyPlaceholder) {
    return analysis;
  }

  const items = analysis.items.map((item) => {
    const zeroItem =
      isNegligibleCalorieLabel(item.label) ||
      isDishwareOnlyLabel(item.label) ||
      isLegacyPlaceholderNutrition(item.nutrition, item.estimatedWeightG) ||
      nonFood;

    if (!zeroItem) return item;

    return {
      ...item,
      estimatedWeightG: 0,
      confidence: Math.min(item.confidence, 0.35),
      nutrition: { ...ZERO_NUTRITION },
      emoji: '🥤',
    };
  });

  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const totalNutrition = sumItemNutrition(items);

  return {
    ...analysis,
    items,
    totalWeightG,
    totalNutrition,
    confidenceAvg: Math.min(analysis.confidenceAvg, 0.35),
    healthFlag: 'yellow',
    healthMessage:
      'No food detected — dishware and empty containers have no nutrition. Add a description or send to your coach.',
    petals: items.map((item) => ({
      label: item.label,
      percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 100,
      color: '#9ca3af',
    })),
  };
}
