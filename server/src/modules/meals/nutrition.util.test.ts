import { scaleItemNutrition, type DetectedFoodItem } from "./nutrition.util";

describe("scaleItemNutrition", () => {
  it("scales macros and micronutrients together", () => {
    const item: DetectedFoodItem = {
      id: "item-1",
      label: "Beans",
      confidence: 1,
      estimatedWeightG: 100,
      nutrition: {
        caloriesKcal: 120,
        proteinG: 8,
        carbsG: 20,
        fatG: 1,
        fiberG: 6,
      },
      micronutrients: { ironMg: 4, calciumMg: 60 },
    };

    const scaled = scaleItemNutrition(item, 50);

    expect(scaled.nutrition).toMatchObject({
      caloriesKcal: 60,
      proteinG: 4,
      carbsG: 10,
      fiberG: 3,
    });
    expect(scaled.micronutrients).toEqual({ ironMg: 2, calciumMg: 30 });
  });
});
