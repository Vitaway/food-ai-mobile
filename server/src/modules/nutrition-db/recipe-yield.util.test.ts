import {
  calculateRecipeNutrition,
  edibleWeightG,
  nutrientsForRawWeight,
  sumNutrientMaps,
} from "./recipe-yield.util";
import { applyRetention } from "./retention.util";

describe("recipe-yield.util", () => {
  const cassava = { energy_kcal: 100, protein_g: 10, iron_mg: 2, vitamin_c_mg: 100 };
  const oil = { energy_kcal: 900, fat_g: 100 };

  it("scales per-100g by raw weight", () => {
    expect(nutrientsForRawWeight(cassava, 200)).toEqual({
      energy_kcal: 200,
      protein_g: 20,
      iron_mg: 4,
      vitamin_c_mg: 200,
    });
  });

  it("applies edible portion factor", () => {
    expect(edibleWeightG(200, 0.5)).toBe(100);
    expect(nutrientsForRawWeight(cassava, 200, 0.5).energy_kcal).toBe(100);
  });

  it("sums ingredient nutrient maps", () => {
    const total = sumNutrientMaps([
      nutrientsForRawWeight(cassava, 100),
      nutrientsForRawWeight(oil, 10),
    ]);
    expect(total.energy_kcal).toBe(190);
    expect(total.protein_g).toBe(10);
    expect(total.fat_g).toBe(10);
    expect(total.iron_mg).toBe(2);
  });

  it("applies cooked yield then serving weight", () => {
    const result = calculateRecipeNutrition({
      ingredients: [
        { compositionPer100g: cassava, rawWeightG: 100 },
        { compositionPer100g: oil, rawWeightG: 10 },
      ],
      cookedYieldG: 80,
      servingWeightG: 250,
    });

    expect(result.totalNutrients.energy_kcal).toBe(190);
    expect(result.per100g.energy_kcal).toBe(237.5);
    expect(result.perServing?.energy_kcal).toBe(593.75);
    expect(result.perServing?.fat_g).toBe(31.25);
    expect(result.rawEdibleTotalG).toBe(110);
    expect(result.yieldFactor).toBeCloseTo(80 / 110, 5);
  });

  it("applies retention for boiled water discarded", () => {
    const retained = applyRetention({ vitamin_c_mg: 100, protein_g: 10 }, "Boiled, water discarded");
    expect(retained.vitamin_c_mg).toBe(45);
    expect(retained.protein_g).toBe(10);
  });

  it("skips non-default variant lines", () => {
    const result = calculateRecipeNutrition({
      ingredients: [
        { compositionPer100g: cassava, rawWeightG: 100, includeInComposition: true },
        { compositionPer100g: oil, rawWeightG: 50, includeInComposition: false },
      ],
      cookedYieldG: 100,
    });
    expect(result.totalNutrients.energy_kcal).toBe(100);
    expect(result.totalNutrients.fat_g).toBeUndefined();
  });

  it("returns empty per-100g when cooked yield is zero", () => {
    const result = calculateRecipeNutrition({
      ingredients: [{ compositionPer100g: cassava, rawWeightG: 100 }],
      cookedYieldG: 0,
      servingWeightG: 100,
    });
    expect(result.per100g).toEqual({});
    expect(result.perServing).toBeNull();
  });
});
