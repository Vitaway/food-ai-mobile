import {
  calculateRecipeNutrition,
  nutrientsForRawWeight,
  sumNutrientMaps,
} from "./recipe-yield.util";

describe("recipe-yield.util", () => {
  const cassava = { energy_kcal: 100, protein_g: 10, iron_mg: 2 };
  const oil = { energy_kcal: 900, fat_g: 100 };

  it("scales per-100g by raw weight", () => {
    expect(nutrientsForRawWeight(cassava, 200)).toEqual({
      energy_kcal: 200,
      protein_g: 20,
      iron_mg: 4,
    });
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
    // Raw: 100g cassava + 10g oil → 190 kcal total
    // Cooked yield 80g → 190/80 per gram → ×100 = 237.5 kcal/100g
    // Serving 250g cup → 190/80 * 250 = 593.75 kcal
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
