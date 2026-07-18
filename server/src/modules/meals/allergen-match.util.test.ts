import {
  assessMealAllergens,
  type AllergenAssessment,
} from "./allergen-match.util";

describe("assessMealAllergens", () => {
  it("returns no match when profile has no allergies", () => {
    const result = assessMealAllergens([], [{ id: "1", label: "Peanut stew" }]);
    expect(result).toMatchObject({
      clientHasAllergies: false,
      allergenMatch: false,
      possibleAllergenMatch: false,
    });
  });

  it("matches peanut allergy against item label", () => {
    const result = assessMealAllergens(["Peanuts"], [
      { id: "a", label: "Chicken peanut stew" },
    ]);
    expect(result.allergenMatch).toBe(true);
    expect(result.matchedAllergens).toContain("peanut");
    expect(result.matchedItemIds).toContain("a");
  });

  it("uses allergen tags when present", () => {
    const result = assessMealAllergens(["milk"], [
      { id: "b", label: "Mystery sauce", allergens: ["dairy"] },
    ]);
    expect(result.allergenMatch).toBe(true);
    expect(result.matchedAllergens).toContain("milk");
  });

  it("flags may-contain separately", () => {
    const result = assessMealAllergens(["sesame"], [
      { id: "c", label: "Bread roll", mayContainAllergens: ["sesame"] },
    ]);
    expect(result.allergenMatch).toBe(false);
    expect(result.possibleAllergenMatch).toBe(true);
    expect(result.possibleAllergens).toContain("sesame");
  });

  it("does not false-positive on unrelated foods", () => {
    const result: AllergenAssessment = assessMealAllergens(["shellfish"], [
      { id: "d", label: "Rice and beans" },
    ]);
    expect(result.allergenMatch).toBe(false);
    expect(result.possibleAllergenMatch).toBe(false);
    expect(result.clientHasAllergies).toBe(true);
  });
});
