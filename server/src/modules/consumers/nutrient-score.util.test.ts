import { computeNutrientAdequacy } from "./nutrient-score.util";

describe("computeNutrientAdequacy", () => {
  it("reports low data coverage instead of treating missing micronutrients as perfect", () => {
    const result = computeNutrientAdequacy(25, 25, []);

    expect(result.dataCoverage).toBe(17);
    expect(result.score).toBeLessThan(60);
  });

  it("uses all measured micronutrients when coverage is complete", () => {
    const result = computeNutrientAdequacy(25, 25, [
      {
        id: "food",
        label: "Measured meal",
        confidence: 1,
        estimatedWeightG: 100,
        nutrition: {
          caloriesKcal: 100,
          proteinG: 5,
          carbsG: 10,
          fatG: 2,
          fiberG: 25,
        },
        micronutrients: {
          ironMg: 18,
          vitaminCMg: 90,
          calciumMg: 1000,
          vitaminDIu: 600,
          potassiumMg: 3500,
        },
      },
    ]);

    expect(result.dataCoverage).toBe(100);
    expect(result.score).toBe(100);
  });
});
