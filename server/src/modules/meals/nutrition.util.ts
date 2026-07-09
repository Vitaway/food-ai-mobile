export type NutritionFacts = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG?: number;
  sodiumMg?: number;
};

export type DetectedFoodItem = {
  id: string;
  label: string;
  confidence: number;
  estimatedWeightG: number;
  servingUnit?: string;
  servingAmount?: number;
  servingGramsEquivalent?: number;
  nutritionFoodId?: string;
  micronutrients?: Record<string, number>;
  emoji?: string;
  nutrition: NutritionFacts;
};

const DEFAULT_GRAMS_PER_UNIT: Record<string, number> = {
  piece: 85,
  slice: 30,
  cup: 175,
  tbsp: 15,
  tsp: 5,
  g: 1,
  ml: 1,
  bottle: 330,
  can: 330,
  carton: 250,
  bowl: 300,
  plate: 400,
};

function normalizeServingUnit(unit: string) {
  const lower = unit.trim().toLowerCase();
  return lower in DEFAULT_GRAMS_PER_UNIT ? lower : "g";
}

export function normalizeDetectedItem(item: DetectedFoodItem): DetectedFoodItem {
  const servingUnit = normalizeServingUnit(item.servingUnit ?? "g");
  const servingAmount =
    typeof item.servingAmount === "number" && item.servingAmount > 0 ? item.servingAmount : 1;
  const servingGramsEquivalent =
    typeof item.servingGramsEquivalent === "number" && item.servingGramsEquivalent > 0
      ? item.servingGramsEquivalent
      : item.estimatedWeightG > 0 && servingAmount > 0
        ? Math.round((item.estimatedWeightG / servingAmount) * 100) / 100
        : DEFAULT_GRAMS_PER_UNIT[servingUnit] ?? 1;

  return {
    ...item,
    servingUnit,
    servingAmount,
    servingGramsEquivalent,
  };
}

export function normalizeMealItems(raw: unknown): DetectedFoodItem[] {
  return asDetectedItems(raw).map(normalizeDetectedItem);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function scaleItemNutrition(
  item: DetectedFoodItem,
  newWeightG: number,
): DetectedFoodItem {
  const oldWeight = item.estimatedWeightG > 0 ? item.estimatedWeightG : 1;
  const ratio = newWeightG / oldWeight;
  const n = item.nutrition;
  return {
    ...item,
    estimatedWeightG: newWeightG,
    nutrition: {
      caloriesKcal: Math.round((n.caloriesKcal ?? 0) * ratio),
      proteinG: round1((n.proteinG ?? 0) * ratio),
      carbsG: round1((n.carbsG ?? 0) * ratio),
      fatG: round1((n.fatG ?? 0) * ratio),
      fiberG: round1((n.fiberG ?? 0) * ratio),
      sugarG: n.sugarG != null ? round1(n.sugarG * ratio) : undefined,
      sodiumMg: n.sodiumMg != null ? Math.round(n.sodiumMg * ratio) : undefined,
    },
  };
}

export function sumNutrition(items: DetectedFoodItem[]): NutritionFacts {
  const total: NutritionFacts = {
    caloriesKcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };
  for (const item of items) {
    const n = item.nutrition;
    total.caloriesKcal += n.caloriesKcal ?? 0;
    total.proteinG += n.proteinG ?? 0;
    total.carbsG += n.carbsG ?? 0;
    total.fatG += n.fatG ?? 0;
    total.fiberG += n.fiberG ?? 0;
  }
  return {
    caloriesKcal: Math.round(total.caloriesKcal),
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

export function asDetectedItems(raw: unknown): DetectedFoodItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const nutrition = (item.nutrition ?? {}) as Record<string, unknown>;
      return {
        id: String(item.id ?? ""),
        label: String(item.label ?? "Item"),
        confidence: typeof item.confidence === "number" ? item.confidence : 0.5,
        estimatedWeightG:
          typeof item.estimatedWeightG === "number" && item.estimatedWeightG >= 0
            ? item.estimatedWeightG
            : 0,
        servingUnit: typeof item.servingUnit === "string" ? item.servingUnit : undefined,
        servingAmount: typeof item.servingAmount === "number" ? item.servingAmount : undefined,
        servingGramsEquivalent:
          typeof item.servingGramsEquivalent === "number" ? item.servingGramsEquivalent : undefined,
        nutritionFoodId: typeof item.nutritionFoodId === "string" ? item.nutritionFoodId : undefined,
        micronutrients:
          item.micronutrients && typeof item.micronutrients === "object"
            ? (item.micronutrients as Record<string, number>)
            : undefined,
        emoji: typeof item.emoji === "string" ? item.emoji : undefined,
        nutrition: {
          caloriesKcal: Number(nutrition.caloriesKcal ?? 0),
          proteinG: Number(nutrition.proteinG ?? 0),
          carbsG: Number(nutrition.carbsG ?? 0),
          fatG: Number(nutrition.fatG ?? 0),
          fiberG: Number(nutrition.fiberG ?? 0),
          sugarG: nutrition.sugarG != null ? Number(nutrition.sugarG) : undefined,
          sodiumMg: nutrition.sodiumMg != null ? Number(nutrition.sodiumMg) : undefined,
        },
      } satisfies DetectedFoodItem;
    })
    .filter((item) => item.id && item.label);
}
