import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { NutritionFood } from "../nutrition-db/nutrition-food.entity";
import { toLegacyMicronutrients } from "../nutrition-db/tfct-nutrients";
import type { DetectedFoodItem } from "./nutrition.util";

function roundNutrition(n: number, maxDecimals = 2) {
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** Math.max(0, Math.min(2, maxDecimals));
  return Math.round(n * factor) / factor;
}

function scaleMicronutrients(per100g: Record<string, number>, weightG: number) {
  const factor = Math.max(0, weightG) / 100;
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(per100g)) {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) continue;
    result[key] = roundNutrition(n * factor);
  }
  return result;
}

function hasUsableMicros(micros: Record<string, number> | undefined): boolean {
  if (!micros) return false;
  return Object.values(micros).some((v) => Number.isFinite(v) && Number(v) > 0);
}

/**
 * For approved meal items linked to Food DB but missing micronutrients
 * (older reviews / coach picks that only stored macros), fill micros from
 * the food composition scaled to the confirmed weight.
 */
export async function backfillItemMicronutrients(
  items: DetectedFoodItem[],
): Promise<DetectedFoodItem[]> {
  const needsIds = Array.from(
    new Set(
      items
        .filter((item) => item.nutritionFoodId && !hasUsableMicros(item.micronutrients))
        .map((item) => item.nutritionFoodId!)
        .filter(Boolean),
    ),
  );
  if (!needsIds.length) return items;

  const foodRepo = AppDataSource.getRepository(NutritionFood);
  const foods = await foodRepo.find({ where: { id: In(needsIds) } });
  const byId = new Map(foods.map((f) => [f.id, f]));

  return items.map((item) => {
    if (!item.nutritionFoodId || hasUsableMicros(item.micronutrients)) return item;
    const food = byId.get(item.nutritionFoodId);
    if (!food?.nutritionPer100g) return item;
    const microsPer100 = toLegacyMicronutrients(
      food.nutritionPer100g as Record<string, number>,
      food.micronutrients ?? {},
    );
    const micronutrients = scaleMicronutrients(microsPer100, item.estimatedWeightG);
    if (!Object.keys(micronutrients).length) return item;
    return { ...item, micronutrients };
  });
}
