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
    expect(mapped?.servings[0]?.unit).toBe("ml");
    expect(mapped?.servings[0]?.amount).toBe(250);
    expect(mapped?.servings[0]?.gramsEquivalent).toBe(250);
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
    expect(mapped?.servings[0]?.unit).toBe("g");
    expect(mapped?.nutritionPer100g.caloriesKcal).toBe(566);
    expect(mapped?.nutriscoreGrade).toBe("e");
    expect(mapped?.ingredientsText).toContain("cacao");
  });

  it("keeps liquid package and serving units from Open Food Facts labels", () => {
    const mapped = mapOffProduct({
      code: "6001068001234",
      product_name: "Inyange Whole Milk",
      brands: "Inyange",
      categories: "Dairies, Milks",
      quantity: "1 L",
      product_quantity: 1,
      product_quantity_unit: "L",
      serving_quantity: 250,
      serving_size: "250 ml",
      nutriments: {
        "energy-kcal_100g": 64,
        proteins_100g: 3.2,
        carbohydrates_100g: 4.8,
        fat_100g: 3.5,
      },
    });

    expect(mapped?.servings.map((row) => `${row.amount} ${row.unit}`)).toEqual(["250 ml", "1 l"]);
    expect(mapped?.servings[0]?.isDefault).toBe(true);
    expect(mapped?.servings[1]?.gramsEquivalent).toBe(1000);
  });
});
