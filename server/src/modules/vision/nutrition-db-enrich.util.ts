import { nutritionDbService } from "../nutrition-db/nutrition-db.service";
import { readNutrient } from "../nutrition-db/tfct-nutrients";
import type { MealAnalysisItem, MealAnalysisResult } from "./meal-analysis";

function roundNutrition(n: number, maxDecimals = 2) {
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** Math.max(0, Math.min(2, maxDecimals));
  return Math.round(n * factor) / factor;
}

function nutritionFromPer100g(per100g: Record<string, number>, weightG: number) {
  const factor = weightG / 100;
  return {
    caloriesKcal: Math.max(
      0,
      Math.round(readNutrient(per100g, "energy_kcal", "caloriesKcal") * factor),
    ),
    proteinG: Math.max(0, roundNutrition(readNutrient(per100g, "protein_g", "proteinG") * factor)),
    carbsG: Math.max(0, roundNutrition(readNutrient(per100g, "carb_g", "carbsG") * factor)),
    fatG: Math.max(0, roundNutrition(readNutrient(per100g, "fat_g", "fatG") * factor)),
    fiberG: Math.max(0, roundNutrition(readNutrient(per100g, "fiber_g", "fiberG") * factor)),
    sugarG: Math.max(0, roundNutrition(readNutrient(per100g, "sugar_g", "sugarG") * factor)),
    sodiumMg: Math.max(
      0,
      Math.round(readNutrient(per100g, "sodium_mg", "sodiumMg") * factor),
    ),
  };
}

function micronutrientsFromPer100g(per100g: Record<string, number>, weightG: number) {
  const factor = weightG / 100;
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(per100g)) {
    if (Number.isFinite(value)) {
      result[key] = roundNutrition(value * factor);
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
  if (!food?.nutritionPer100g) {
    // No DB match — keep model estimate but do not invent a food id.
    return item;
  }

  const defaultServing = food.servings.find((s) => s.isDefault) ?? food.servings[0];
  const gramsPerDisplayUnit =
    defaultServing && defaultServing.amount > 0
      ? defaultServing.gramsEquivalent / defaultServing.amount
      : undefined;

  // Prefer the DB serving profile quantity when the model weight is near a profile total.
  let weightG = item.estimatedWeightG;
  let servingUnit = defaultServing?.unit ?? item.servingUnit ?? "g";
  let servingAmount =
    gramsPerDisplayUnit && gramsPerDisplayUnit > 0
      ? roundNutrition(item.estimatedWeightG / gramsPerDisplayUnit)
      : item.estimatedWeightG;

  if (defaultServing && defaultServing.gramsEquivalent > 0) {
    const profileTotal = defaultServing.gramsEquivalent;
    const ratio = item.estimatedWeightG / profileTotal;
    if (ratio > 0.7 && ratio < 1.35) {
      weightG = profileTotal;
      servingUnit = defaultServing.unit;
      servingAmount = defaultServing.amount;
    }
  }

  const nutrition = nutritionFromPer100g(
    food.nutritionPer100g as Record<string, number>,
    weightG,
  );
  const micronutrients = micronutrientsFromPer100g(
    (food.micronutrients ?? {}) as Record<string, number>,
    weightG,
  );

  return {
    ...item,
    label: food.name,
    estimatedWeightG: weightG,
    nutrition,
    nutritionFoodId: food.id,
    micronutrients,
    servingUnit,
    servingAmount,
    servingGramsEquivalent: gramsPerDisplayUnit,
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
