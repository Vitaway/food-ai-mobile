import { recalculateMealPortions } from "./meal-portions.util";
import type { DetectedFoodItem } from "./nutrition.util";

const baseItems: DetectedFoodItem[] = [
  {
    id: "pr",
    label: "Sambaza",
    confidence: 1,
    estimatedWeightG: 100,
    plateGroup: "pr",
    nutrition: { caloriesKcal: 200, proteinG: 20, carbsG: 0, fatG: 12, fiberG: 0 },
  },
  {
    id: "st",
    label: "Ugali",
    confidence: 1,
    estimatedWeightG: 150,
    plateGroup: "st",
    nutrition: { caloriesKcal: 180, proteinG: 4, carbsG: 40, fatG: 1, fiberG: 2 },
  },
  {
    id: "vf",
    label: "Dodo",
    confidence: 1,
    estimatedWeightG: 120,
    plateGroup: "vf",
    nutrition: { caloriesKcal: 40, proteinG: 3, carbsG: 6, fatG: 0.5, fiberG: 3 },
  },
];

describe("recalculateMealPortions", () => {
  it("scales nutrition and refreshes plate + estimate", () => {
    const result = recalculateMealPortions({
      items: baseItems,
      updates: [{ id: "st", estimatedWeightG: 75 }],
      mealType: "lunch",
      logSource: "photo",
    });

    const ugali = result.items.find((i) => i.id === "st");
    expect(ugali?.estimatedWeightG).toBe(75);
    expect(ugali?.nutrition.caloriesKcal).toBe(90);
    expect(result.totalNutrition.caloriesKcal).toBe(200 + 90 + 40);
    expect(result.balancedPlate).not.toBeNull();
    expect(result.estimateRange?.pct).toBe(0.15);
    expect(result.estimateRange?.midKcal).toBe(result.totalNutrition.caloriesKcal);
  });

  it("omits estimate range when confirmed", () => {
    const result = recalculateMealPortions({
      items: baseItems,
      updates: [],
      mealType: "dinner",
      logSource: "photo",
      confirmed: true,
    });
    expect(result.estimateRange).toBeNull();
  });
});
