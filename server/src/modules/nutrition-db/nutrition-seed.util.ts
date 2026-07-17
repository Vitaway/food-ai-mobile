import { AppDataSource } from "../../config/database";
import { logger } from "../../config/logger";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import {
  buildFoodFromSeed,
  buildServingsFromSeed,
  REGIONAL_FOOD_SEEDS,
} from "./nutrition-seed.data";
import { composeTfctFromLegacy } from "./tfct-nutrients";
import { importTfctFoods } from "./tfct-import.util";

export async function seedNutritionFoods() {
  // Official TFCT catalog first (upsert by food_code; absorbs same-name legacy seeds)
  await importTfctFoods();

  const foodRepo = AppDataSource.getRepository(NutritionFood);
  const servingRepo = AppDataSource.getRepository(NutritionServingProfile);
  let created = 0;
  let updated = 0;

  for (const seed of REGIONAL_FOOD_SEEDS) {
    const existing = await foodRepo.findOne({ where: { name: seed.name } });
    if (!existing) {
      const food = foodRepo.create({
        ...buildFoodFromSeed(seed),
        sourceType: "custom_local",
        source: "regional_seed",
        nutritionPer100g: composeTfctFromLegacy({
          nutritionPer100g: seed.nutritionPer100g,
          micronutrients: seed.micronutrients,
        }),
        micronutrients: {},
      });
      await foodRepo.save(food);
      await servingRepo.save(
        buildServingsFromSeed(food.id, seed).map((row) => servingRepo.create(row)),
      );
      created += 1;
      continue;
    }

    // Don't overwrite TFCT-owned rows
    if (existing.foodCode || existing.sourceType === "TFCT") continue;

    let changed = false;
    if (seed.barcode && !existing.barcode) {
      existing.barcode = seed.barcode;
      changed = true;
    }
    if (seed.micronutrients && Object.keys(seed.micronutrients).length > 0) {
      const merged = composeTfctFromLegacy({
        nutritionPer100g: existing.nutritionPer100g,
        micronutrients: { ...(existing.micronutrients ?? {}), ...seed.micronutrients },
      });
      existing.nutritionPer100g = merged;
      existing.micronutrients = {};
      changed = true;
    }
    if (changed) {
      await foodRepo.save(existing);
      updated += 1;
    }
  }

  if (created > 0 || updated > 0) {
    logger.info({ created, updated }, "Seeded regional nutrition foods");
  }
}
