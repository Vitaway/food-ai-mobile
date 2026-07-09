import { nutritionDbService } from "../nutrition-db/nutrition-db.service";
import type { MealAnalysisItem, MealAnalysisResult } from "./meal-analysis";

function nutritionFromPer100g(per100g: Record<string, number>, weightG: number) {
  const factor = weightG / 100;
  return {
    caloriesKcal: Math.max(0, Math.round((per100g.caloriesKcal ?? 0) * factor)),
    proteinG: Math.max(0, Math.round((per100g.proteinG ?? 0) * factor * 10) / 10),
    carbsG: Math.max(0, Math.round((per100g.carbsG ?? 0) * factor * 10) / 10),
    fatG: Math.max(0, Math.round((per100g.fatG ?? 0) * factor * 10) / 10),
    fiberG: Math.max(0, Math.round((per100g.fiberG ?? 0) * factor * 10) / 10),
    sugarG: Math.max(0, Math.round((per100g.sugarG ?? 0) * factor * 10) / 10),
    sodiumMg: Math.max(0, Math.round((per100g.sodiumMg ?? 0) * factor)),
  };
}

function micronutrientsFromPer100g(per100g: Record<string, number>, weightG: number) {
  const factor = weightG / 100;
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(per100g)) {
    if (Number.isFinite(value)) {
      result[key] = Math.round(value * factor * 10) / 10;
    }
  }
  return result;
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

async function enrichItem(item: MealAnalysisItem): Promise<MealAnalysisItem> {
  if (item.estimatedWeightG <= 0) return item;

  const food = await nutritionDbService.lookupByName(item.label);
  if (!food?.nutritionPer100g) return item;

  const defaultServing = food.servings.find((s) => s.isDefault) ?? food.servings[0];
  const nutrition = nutritionFromPer100g(food.nutritionPer100g as Record<string, number>, item.estimatedWeightG);
  const micronutrients = micronutrientsFromPer100g(
    (food.micronutrients ?? {}) as Record<string, number>,
    item.estimatedWeightG,
  );

  return {
    ...item,
    nutrition,
    nutritionFoodId: food.id,
    micronutrients,
    servingUnit: defaultServing?.unit ?? "g",
    servingAmount:
      defaultServing && defaultServing.gramsEquivalent > 0
        ? Math.round((item.estimatedWeightG / defaultServing.gramsEquivalent) * 10) / 10
        : item.estimatedWeightG,
    servingGramsEquivalent: defaultServing?.gramsEquivalent,
  };
}

export async function enrichMealAnalysisWithNutritionDb(
  analysis: MealAnalysisResult,
): Promise<MealAnalysisResult> {
  const items = await Promise.all(analysis.items.map((item) => enrichItem(item)));
  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const totalNutrition = sumNutrition(items);
  const petals = items.map((item) => ({
    label: item.label,
    percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 0,
    color: "#50af73",
  }));

  return {
    ...analysis,
    items,
    totalNutrition,
    totalWeightG,
    petals,
  };
}
