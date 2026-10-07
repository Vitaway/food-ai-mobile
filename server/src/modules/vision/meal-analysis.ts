import type { BalancedPlateScore, EstimateRange, MealLogSource } from "../meals/balanced-plate";

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
  /** Balanced Plate group (Phase 1 fills this). */
  plateGroup?: "vf" | "pr" | "st" | "other" | null;
  /** Normalized pin on plate image 0–1 (Phase 3). */
  pin?: { x: number; y: number } | null;
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
  modelVersion: string;
  logSource?: MealLogSource;
  balancedPlate?: BalancedPlateScore | null;
  estimateRange?: EstimateRange | null;
};

import { isNegligibleCalorieLabel, ZERO_NUTRITION } from "./negligible-food";

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

function clamp01(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function normalizePin(raw: Record<string, unknown>): { x: number; y: number } | null {
  const pinRaw = raw.pin;
  if (pinRaw && typeof pinRaw === "object") {
    const pin = pinRaw as { x?: unknown; y?: unknown };
    const x = clamp01(pin.x);
    const y = clamp01(pin.y);
    if (x != null && y != null) return { x, y };
  }

  const box = raw.bbox ?? raw.boundingBox;
  if (box && typeof box === "object") {
    const b = box as { x?: unknown; y?: unknown; width?: unknown; height?: unknown; w?: unknown; h?: unknown };
    const x = typeof b.x === "number" ? b.x : null;
    const y = typeof b.y === "number" ? b.y : null;
    const w = typeof b.width === "number" ? b.width : typeof b.w === "number" ? b.w : null;
    const h = typeof b.height === "number" ? b.height : typeof b.h === "number" ? b.h : null;
    if (x != null && y != null && w != null && h != null) {
      const cx = clamp01(x + w / 2);
      const cy = clamp01(y + h / 2);
      if (cx != null && cy != null) return { x: cx, y: cy };
    }
  }

  return null;
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
    pin: normalizePin(row),
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
          ? "No meaningful nutrition detected; empty container or zero-calorie item."
          : "Analysis complete; review portions before submitting.",
    modelVersion,
  };
}
