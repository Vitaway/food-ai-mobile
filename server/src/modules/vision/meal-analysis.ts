export type MealAnalysisItem = {
  id: string;
  label: string;
  confidence: number;
  estimatedWeightG: number;
  emoji?: string;
  nutrition: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG?: number;
    sodiumMg?: number;
  };
  nutritionFoodId?: string;
  micronutrients?: Record<string, number>;
  servingUnit?: string;
  servingAmount?: number;
  servingGramsEquivalent?: number;
};

export type MealAnalysisResult = {
  mealName: string;
  items: MealAnalysisItem[];
  totalNutrition: MealAnalysisItem["nutrition"];
  totalWeightG: number;
  confidenceAvg: number;
  petals: Array<{ label: string; percent: number; color: string }>;
  healthFlag: "green" | "yellow" | "orange" | "red";
  healthMessage: string;
  plateDiameterCm?: number | null;
  portionScaleFactor?: number | null;
  portionNote?: string | null;
  modelVersion: string;
};

import { isNegligibleCalorieLabel, ZERO_NUTRITION } from "./negligible-food";

const REFERENCE_PLATE_DIAMETER_CM = 26;
const PETAL_COLOR = "#50af73";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeNutrition(raw: Record<string, unknown>) {
  return {
    caloriesKcal: Math.max(0, Math.round(clampNumber(raw.caloriesKcal))),
    proteinG: Math.max(0, Math.round(clampNumber(raw.proteinG) * 10) / 10),
    carbsG: Math.max(0, Math.round(clampNumber(raw.carbsG) * 10) / 10),
    fatG: Math.max(0, Math.round(clampNumber(raw.fatG) * 10) / 10),
    fiberG: Math.max(0, Math.round(clampNumber(raw.fiberG) * 10) / 10),
    sugarG: Math.max(0, Math.round(clampNumber(raw.sugarG) * 10) / 10),
    sodiumMg: Math.max(0, Math.round(clampNumber(raw.sodiumMg))),
  };
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

function portionScaleForPlate(plateDiameterCm: number | null | undefined) {
  if (plateDiameterCm == null || plateDiameterCm <= 0) return 1;
  const ratio = plateDiameterCm / REFERENCE_PLATE_DIAMETER_CM;
  return Math.min(2, Math.max(0.55, ratio ** 2));
}

function portionNoteForPlate(plateDiameterCm: number) {
  const scale = portionScaleForPlate(plateDiameterCm);
  if (Math.abs(scale - 1) < 0.08) {
    return `Portions estimated for a ${plateDiameterCm} cm plate (near standard size).`;
  }
  const direction = scale > 1 ? "larger" : "smaller";
  const pct = Math.round(Math.abs(scale - 1) * 100);
  return `Plate is ${plateDiameterCm} cm — portions scaled ${pct}% ${direction} vs a standard dinner plate.`;
}

function normalizeItem(row: Record<string, unknown>, fallbackLabel: string): MealAnalysisItem {
  const label =
    typeof row.label === "string" && row.label.trim() ? row.label.trim() : fallbackLabel;
  const negligible = isNegligibleCalorieLabel(label) || isNegligibleCalorieLabel(fallbackLabel);
  const nutritionRaw = (row.nutrition ?? {}) as Record<string, unknown>;
  const weightDefault = negligible ? 0 : 100;

  return {
    id: createId("item"),
    label,
    confidence: Math.max(
      0,
      Math.min(1, clampNumber(row.confidence, negligible ? 0.35 : 0.75)),
    ),
    estimatedWeightG: negligible
      ? 0
      : Math.max(1, Math.round(clampNumber(row.estimatedWeightG, weightDefault))),
    emoji: typeof row.emoji === "string" ? row.emoji : negligible ? "🥤" : "🍽️",
    nutrition: negligible ? { ...ZERO_NUTRITION } : normalizeNutrition(nutritionRaw),
  };
}

export function normalizeMealAnalysisRaw(raw: Record<string, unknown>, modelVersion: string): MealAnalysisResult {
  const mealName =
    typeof raw.mealName === "string" && raw.mealName.trim() ? raw.mealName.trim() : "Meal";
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const mealNegligible = isNegligibleCalorieLabel(mealName);

  const items: MealAnalysisItem[] = itemsRaw
    .slice(0, 8)
    .map((entry) => normalizeItem((entry ?? {}) as Record<string, unknown>, mealName));

  const safeItems =
    items.length > 0
      ? items
      : [
          normalizeItem(
            {
              label: mealName,
              confidence: mealNegligible ? 0.35 : 0.5,
              estimatedWeightG: mealNegligible ? 0 : 100,
              nutrition: mealNegligible ? ZERO_NUTRITION : undefined,
            },
            mealName,
          ),
        ];

  const totalWeightG = safeItems.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const totalNutrition = sumNutrition(safeItems);
  const petals = safeItems.map((item) => ({
    label: item.label,
    percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 0,
    color: PETAL_COLOR,
  }));

  const healthFlagRaw = raw.healthFlag;
  const healthFlag =
    healthFlagRaw === "green" ||
    healthFlagRaw === "yellow" ||
    healthFlagRaw === "orange" ||
    healthFlagRaw === "red"
      ? healthFlagRaw
      : "yellow";

  const confidenceAvg = Math.max(
    0,
    Math.min(1, clampNumber(raw.confidenceAvg, safeItems.reduce((s, i) => s + i.confidence, 0) / safeItems.length)),
  );

  return {
    mealName,
    items: safeItems,
    totalNutrition,
    totalWeightG,
    confidenceAvg,
    petals,
    healthFlag,
    healthMessage:
      typeof raw.healthMessage === "string" && raw.healthMessage.trim()
        ? raw.healthMessage.trim()
        : mealNegligible || safeItems.every((item) => item.nutrition.caloriesKcal === 0)
          ? "No meaningful nutrition detected — empty container or zero-calorie item."
          : "Analysis complete — review portions before submitting.",
    modelVersion,
  };
}

export function applyPlatePortionScale(
  analysis: MealAnalysisResult,
  plateDiameterCm: number | null | undefined,
): MealAnalysisResult {
  if (plateDiameterCm == null || plateDiameterCm <= 0) return analysis;

  const scale = portionScaleForPlate(plateDiameterCm);
  if (Math.abs(scale - 1) < 0.02) {
    return {
      ...analysis,
      plateDiameterCm,
      portionScaleFactor: 1,
      portionNote: portionNoteForPlate(plateDiameterCm),
    };
  }

  const items = analysis.items.map((item) => {
    const negligible = isNegligibleCalorieLabel(item.label);
    if (negligible || item.estimatedWeightG <= 0) {
      return item;
    }

    const weightG = Math.max(1, Math.round(item.estimatedWeightG * scale));
    const factor = weightG / item.estimatedWeightG;
    return {
      ...item,
      estimatedWeightG: weightG,
      nutrition: {
        ...item.nutrition,
        caloriesKcal: Math.round(item.nutrition.caloriesKcal * factor),
        proteinG: Math.round(item.nutrition.proteinG * factor * 10) / 10,
        carbsG: Math.round(item.nutrition.carbsG * factor * 10) / 10,
        fatG: Math.round(item.nutrition.fatG * factor * 10) / 10,
        fiberG: Math.round(item.nutrition.fiberG * factor * 10) / 10,
        sugarG: item.nutrition.sugarG
          ? Math.round(item.nutrition.sugarG * factor * 10) / 10
          : undefined,
        sodiumMg: item.nutrition.sodiumMg
          ? Math.round(item.nutrition.sodiumMg * factor)
          : undefined,
      },
    };
  });

  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const totalNutrition = sumNutrition(items);
  const petals = items.map((item) => ({
    label: item.label,
    percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 0,
    color: PETAL_COLOR,
  }));

  return {
    ...analysis,
    items,
    totalNutrition,
    totalWeightG,
    petals,
    plateDiameterCm,
    portionScaleFactor: scale,
    portionNote: portionNoteForPlate(plateDiameterCm),
  };
}
