import {
  bestNutritionFoodMatch,
  isNutritionRecipe,
  rankNutritionFoods,
  scoreNameMatch,
  scoreNutritionFood,
  scoreNutritionFoodBase,
  type NutritionFoodRow,
} from "./nutrition-lookup.util";

function food(
  partial: Partial<NutritionFoodRow> & Pick<NutritionFoodRow, "id" | "name">,
): NutritionFoodRow {
  return {
    brand: null,
    nutritionPer100g: {},
    micronutrients: {},
    servings: [],
    ...partial,
  };
}

describe("nutrition-lookup.util", () => {
  describe("scoreNameMatch", () => {
    it("scores exact names highest", () => {
      expect(scoreNameMatch("Isombe", "Isombe")).toBe(100);
    });

    it("normalizes accents and case", () => {
      expect(scoreNameMatch("isombé", "Isombe")).toBe(100);
    });
  });

  describe("recipe scoring", () => {
    const recipe = food({
      id: "r1",
      name: "Cassava leaf stew",
      sourceType: "recipe",
      isRecipe: true,
    });
    const ingredient = food({
      id: "i1",
      name: "Cassava leaves",
      sourceType: "tfct",
    });

    it("detects recipe rows", () => {
      expect(isNutritionRecipe(recipe)).toBe(true);
      expect(isNutritionRecipe(ingredient)).toBe(false);
      expect(isNutritionRecipe({ sourceType: "recipe" })).toBe(true);
    });

    it("boosts recipes when lexical score is already plausible", () => {
      const base = scoreNutritionFoodBase("Cassava leaf stew", recipe);
      const boosted = scoreNutritionFood("Cassava leaf stew", recipe);
      expect(base).toBeGreaterThanOrEqual(50);
      expect(boosted).toBe(Math.min(100, base + 10));
    });

    it("does not boost weak recipe matches", () => {
      const weak = food({
        id: "r2",
        name: "Bean stew",
        sourceType: "recipe",
        isRecipe: true,
      });
      // Single shared token "stew" should stay below boost floor for most cases;
      // if base is below 50, boost must not apply.
      const base = scoreNutritionFoodBase("cassava", weak);
      const scored = scoreNutritionFood("cassava", weak);
      if (base < 50) {
        expect(scored).toBe(base);
      } else {
        expect(scored).toBe(Math.min(100, base + 10));
      }
    });

    it("prefers a named dish recipe over a related ingredient", () => {
      const match = bestNutritionFoodMatch("Cassava leaf stew", [ingredient, recipe]);
      expect(match?.id).toBe("r1");
    });

    it("keeps an exact ingredient match when the query is the ingredient", () => {
      const match = bestNutritionFoodMatch("Cassava leaves", [ingredient, recipe]);
      expect(match?.id).toBe("i1");
    });

    it("prefers recipe on near-tie scores", () => {
      const dish = food({
        id: "r3",
        name: "Isombe",
        sourceType: "recipe",
        isRecipe: true,
        nameRw: "Isombe",
      });
      const near = food({
        id: "i2",
        name: "Isombe leaves",
        sourceType: "tfct",
      });
      // Query matches recipe exactly (100 + not boosted past 100) vs ingredient prefix/include.
      const match = bestNutritionFoodMatch("Isombe", [near, dish]);
      expect(match?.id).toBe("r3");
    });
  });

  describe("rankNutritionFoods", () => {
    it("ranks recipes ahead of equal-score non-recipes", () => {
      const recipe = food({
        id: "r1",
        name: "Ugali",
        sourceType: "recipe",
        isRecipe: true,
      });
      const plain = food({
        id: "f1",
        name: "Ugali",
        sourceType: "custom_local",
      });
      const ranked = rankNutritionFoods("Ugali", [plain, recipe]);
      expect(ranked[0]?.id).toBe("r1");
      expect(ranked[0]?.matchScore).toBeGreaterThanOrEqual(ranked[1]?.matchScore ?? 0);
    });
  });

  describe("bestNutritionFoodMatch threshold", () => {
    it("returns null when nothing clears the threshold", () => {
      const match = bestNutritionFoodMatch("xyzzy", [
        food({ id: "f1", name: "Rice", sourceType: "tfct" }),
      ]);
      expect(match).toBeNull();
    });
  });
});
