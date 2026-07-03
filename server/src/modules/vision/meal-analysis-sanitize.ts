import type { MealAnalysisItem, MealAnalysisResult } from "./meal-analysis";
import { isNegligibleCalorieLabel, ZERO_NUTRITION } from "./negligible-food";

export function isLegacyPlaceholderNutrition(
  nutrition: MealAnalysisItem["nutrition"],
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

export function isDishwareOnlyLabel(label: string): boolean {
  const cleaned = label.trim();
  if (!cleaned) return true;
  if (isNegligibleCalorieLabel(cleaned)) return true;
  return /^(an?\s+)?(empty\s+)?(plastic\s+|paper\s+)?(cup|mug|glass|tumbler|bowl|plate|container|bottle|utensil)s?$/i.test(
    cleaned,
  );
}

function shouldTreatAsNonFood(mealName: string, items: MealAnalysisItem[]): boolean {
  if (isNegligibleCalorieLabel(mealName)) return true;
  if (!items.length) return isDishwareOnlyLabel(mealName);
  return items.every(
    (item) => isNegligibleCalorieLabel(item.label) || isDishwareOnlyLabel(item.label),
  );
}

function sumNutrition(items: MealAnalysisItem[]) {
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
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 },
  );
}

export function sanitizeMealAnalysisResult(analysis: MealAnalysisResult): MealAnalysisResult {
  const nonFood = shouldTreatAsNonFood(analysis.mealName, analysis.items);
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
      emoji: "🥤",
      nutrition: { ...ZERO_NUTRITION },
    };
  });

  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);

  return {
    ...analysis,
    items,
    totalWeightG,
    totalNutrition: sumNutrition(items),
    confidenceAvg: Math.min(analysis.confidenceAvg, 0.35),
    healthFlag: "yellow",
    healthMessage:
      "No food detected — dishware and empty containers have no nutrition. The client can add a description or send this to you for review.",
    petals: items.map((item) => ({
      label: item.label,
      percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 100,
      color: "#9ca3af",
    })),
  };
}
