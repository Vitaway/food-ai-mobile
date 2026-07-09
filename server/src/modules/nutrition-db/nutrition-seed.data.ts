import type { NutritionFood } from "./nutrition-food.entity";
import type { NutritionServingProfile } from "./nutrition-serving-profile.entity";

export type RegionalFoodSeed = {
  name: string;
  category: string;
  brand?: string;
  barcode?: string;
  nutritionPer100g: Record<string, number>;
  micronutrients?: Record<string, number>;
  servings: Array<{ unit: string; amount: number; gramsEquivalent: number; isDefault?: boolean }>;
};

export const REGIONAL_FOOD_SEEDS: RegionalFoodSeed[] = [
  {
    name: "Ugali",
    category: "Staples",
    nutritionPer100g: { caloriesKcal: 112, proteinG: 2.1, carbsG: 24, fatG: 0.4, fiberG: 1.2 },
    micronutrients: { ironMg: 0.8, calciumMg: 4, vitaminCMg: 0 },
    servings: [
      { unit: "cup", amount: 1, gramsEquivalent: 175, isDefault: true },
      { unit: "plate", amount: 1, gramsEquivalent: 250 },
    ],
  },
  {
    name: "Chapati",
    category: "Breads",
    nutritionPer100g: { caloriesKcal: 297, proteinG: 8.5, carbsG: 46, fatG: 9, fiberG: 2.5 },
    micronutrients: { ironMg: 2.1, calciumMg: 20 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 85, isDefault: true }],
  },
  {
    name: "Mandazi",
    category: "Snacks",
    nutritionPer100g: { caloriesKcal: 350, proteinG: 6, carbsG: 48, fatG: 14, fiberG: 1.5 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 60, isDefault: true }],
  },
  {
    name: "Isombe",
    category: "Traditional dishes",
    nutritionPer100g: { caloriesKcal: 95, proteinG: 4.2, carbsG: 12, fatG: 3.5, fiberG: 3.8 },
    servings: [{ unit: "bowl", amount: 1, gramsEquivalent: 300, isDefault: true }],
  },
  {
    name: "Ibitoki (Plantain)",
    category: "Staples",
    nutritionPer100g: { caloriesKcal: 122, proteinG: 1.3, carbsG: 32, fatG: 0.4, fiberG: 2.3 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 120, isDefault: true }],
  },
  {
    name: "Brochette",
    category: "Protein",
    nutritionPer100g: { caloriesKcal: 215, proteinG: 26, carbsG: 2, fatG: 11, fiberG: 0 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 120, isDefault: true }],
  },
  {
    name: "Akabenzi",
    category: "Protein",
    nutritionPer100g: { caloriesKcal: 242, proteinG: 27, carbsG: 0, fatG: 14, fiberG: 0 },
    servings: [{ unit: "g", amount: 100, gramsEquivalent: 100, isDefault: true }],
  },
  {
    name: "Cooked Rice",
    category: "Grains",
    nutritionPer100g: { caloriesKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4 },
    servings: [{ unit: "cup", amount: 1, gramsEquivalent: 175, isDefault: true }],
  },
  {
    name: "Milk (fresh)",
    category: "Dairy",
    brand: "Inyange",
    barcode: "6001068270123",
    nutritionPer100g: { caloriesKcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, fiberG: 0 },
    micronutrients: { calciumMg: 120, vitaminAMcg: 46 },
    servings: [
      { unit: "ml", amount: 250, gramsEquivalent: 250, isDefault: true },
      { unit: "carton", amount: 1, gramsEquivalent: 250 },
    ],
  },
  {
    name: "Soda",
    category: "Beverages",
    barcode: "6001068001234",
    nutritionPer100g: { caloriesKcal: 42, proteinG: 0, carbsG: 10.6, fatG: 0, fiberG: 0 },
    micronutrients: { ironMg: 0, vitaminCMg: 0 },
    servings: [
      { unit: "bottle", amount: 1, gramsEquivalent: 330, isDefault: true },
      { unit: "can", amount: 1, gramsEquivalent: 330 },
    ],
  },
  {
    name: "Brown Bread",
    category: "Breads",
    barcode: "6001068500456",
    nutritionPer100g: { caloriesKcal: 247, proteinG: 9, carbsG: 41, fatG: 3.5, fiberG: 6 },
    micronutrients: { ironMg: 2.5, calciumMg: 60 },
    servings: [{ unit: "slice", amount: 1, gramsEquivalent: 30, isDefault: true }],
  },
  {
    name: "Boiled Egg",
    category: "Protein",
    nutritionPer100g: { caloriesKcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, fiberG: 0 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 50, isDefault: true }],
  },
  {
    name: "Banana",
    category: "Fruits",
    nutritionPer100g: { caloriesKcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, fiberG: 2.6 },
    servings: [{ unit: "piece", amount: 1, gramsEquivalent: 120, isDefault: true }],
  },
  {
    name: "Peanut Sauce",
    category: "Condiments",
    nutritionPer100g: { caloriesKcal: 180, proteinG: 8, carbsG: 6, fatG: 14, fiberG: 2 },
    servings: [{ unit: "tbsp", amount: 2, gramsEquivalent: 30, isDefault: true }],
  },
];

export function buildFoodFromSeed(seed: RegionalFoodSeed): Partial<NutritionFood> {
  return {
    name: seed.name,
    category: seed.category,
    brand: seed.brand ?? null,
    barcode: seed.barcode ?? null,
    isActive: true,
    nutritionPer100g: seed.nutritionPer100g,
    micronutrients: seed.micronutrients ?? {},
  };
}

export function buildServingsFromSeed(
  foodId: string,
  seed: RegionalFoodSeed,
): Partial<NutritionServingProfile>[] {
  return seed.servings.map((serving, idx) => ({
    foodId,
    unit: serving.unit,
    amount: String(serving.amount),
    gramsEquivalent: String(serving.gramsEquivalent),
    isDefault: serving.isDefault ?? idx === 0,
  }));
}
