import { mapOffProduct } from "./open-food-facts.client";

describe("mapOffProduct", () => {
  it("maps present nutriments and omits missing macros", () => {
    const mapped = mapOffProduct(
      {
        code: "5449000054227",
        product_name: "Coca-Cola",
        brands: "Coca-Cola",
        categories: "Beverages",
        nutriscore_grade: "e",
        nutriments: {
          "energy-kcal_100g": 42,
          proteins_100g: 0,
          carbohydrates_100g: 10.6,
          fat_100g: 0,
          sugars_100g: 10.6,
          sodium_100g: 0.004,
        },
        serving_quantity: 250,
      },
      "5449000054227",
    );

    expect(mapped).not.toBeNull();
    expect(mapped?.barcode).toBe("5449000054227");
    expect(mapped?.nutritionPer100g.caloriesKcal).toBe(42);
    expect(mapped?.nutritionPer100g.proteinG).toBe(0);
    expect(mapped?.nutritionPer100g.fiberG).toBeUndefined();
    expect(mapped?.nutrientsUnknown).toContain("fiber_g");
  });

  it("returns null when product name is missing", () => {
    expect(mapOffProduct({ code: "123" })).toBeNull();
  });

  it("derives sodium from salt when sodium is absent", () => {
    const mapped = mapOffProduct({
      code: "999",
      product_name: "Salt snack",
      nutriments: { salt_100g: 1.5 },
    });
    expect(mapped?.nutritionPer100g.sodiumMg).toBe(600);
  });

  it("uses serving size and nutriscore_data for packaged chocolate", () => {
    const mapped = mapOffProduct({
      code: "3046920022651",
      product_name: "Noir Intense",
      brands: "Lindt",
      serving_quantity: 10,
      serving_size: "10 g",
      ingredients_text: "Pâte de cacao, sucre, beurre de cacao, vanille.",
      nutriscore_data: { grade: "e" },
      nutriments: {
        "energy-kcal_100g": 566,
        "energy-kcal_serving": 56.6,
        proteins_100g: 9.5,
        carbohydrates_100g: 35,
        fat_100g: 41,
        sugars_100g: 30,
        fiber_100g: 12.2,
        "saturated-fat_100g": 24,
        sodium_100g: 0.008,
        "nova-group_100g": 3,
      },
    });

    expect(mapped?.servings[0]?.gramsEquivalent).toBe(10);
    expect(mapped?.nutritionPer100g.caloriesKcal).toBe(566);
    expect(mapped?.nutriscoreGrade).toBe("e");
    expect(mapped?.ingredientsText).toContain("cacao");
  });
});
