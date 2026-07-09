import { AppDataSource } from "../../config/database";
import { logger } from "../../config/logger";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import {
  buildFoodFromSeed,
  buildServingsFromSeed,
  REGIONAL_FOOD_SEEDS,
} from "./nutrition-seed.data";

export async function seedNutritionFoods() {
  const foodRepo = AppDataSource.getRepository(NutritionFood);
  const servingRepo = AppDataSource.getRepository(NutritionServingProfile);
  let created = 0;
  let updated = 0;

  for (const seed of REGIONAL_FOOD_SEEDS) {
    const existing = await foodRepo.findOne({ where: { name: seed.name } });
    if (!existing) {
      const food = foodRepo.create(buildFoodFromSeed(seed));
      await foodRepo.save(food);
      await servingRepo.save(
        buildServingsFromSeed(food.id, seed).map((row) => servingRepo.create(row)),
      );
      created += 1;
      continue;
    }

    let changed = false;
    if (seed.barcode && !existing.barcode) {
      existing.barcode = seed.barcode;
      changed = true;
    }
    if (seed.micronutrients && Object.keys(seed.micronutrients).length > 0) {
      const current = existing.micronutrients ?? {};
      const merged = { ...current };
      for (const [key, value] of Object.entries(seed.micronutrients)) {
        if (merged[key] == null) {
          merged[key] = value;
          changed = true;
        }
      }
      if (changed) existing.micronutrients = merged;
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
