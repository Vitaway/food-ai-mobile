import fs from "fs";
import path from "path";
import { AppDataSource } from "../../config/database";
import { logger } from "../../config/logger";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import { pickTfctComposition } from "./tfct-nutrients";

export type TfctFoodRow = {
  food_code: string;
  name: string;
  food_group?: string | null;
  food_group_name?: string | null;
  recipe_note?: string | null;
  source_type?: string | null;
  applicable_countries?: string | null;
  name_sw?: string | null;
  name_rw?: string | null;
  name_local_other?: string | null;
  image_url?: string | null;
  image_confirmed?: boolean;
  brand?: string | null;
  barcode?: string | null;
  package_size_g?: number | null;
  label_source?: string | null;
  source?: string | null;
  source_version?: string | null;
  composition: Record<string, number>;
};

function resolveTfctJsonPath() {
  const candidates = [
    path.resolve(__dirname, "../../../data/tfct-food-composition.json"),
    path.resolve(process.cwd(), "data/tfct-food-composition.json"),
    path.resolve(process.cwd(), "server/data/tfct-food-composition.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadTfctFoodRows(): TfctFoodRow[] {
  const filePath = resolveTfctJsonPath();
  if (!filePath) {
    logger.warn("TFCT food composition JSON not found — skipping import");
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as TfctFoodRow[];
  if (!Array.isArray(raw)) {
    throw new Error("TFCT JSON must be an array of food rows");
  }
  return raw;
}

function applyTfctRow(food: NutritionFood, row: TfctFoodRow) {
  const composition = pickTfctComposition(row.composition ?? (row as unknown as Record<string, unknown>));
  food.foodCode = String(row.food_code);
  food.name = row.name.trim();
  food.category = (row.food_group_name ?? food.category ?? "Miscellaneous").trim();
  food.foodGroup = row.food_group?.trim() || null;
  food.foodGroupName = row.food_group_name?.trim() || null;
  food.recipeNote = row.recipe_note?.trim() || null;
  food.sourceType = (row.source_type ?? "TFCT").trim() || "TFCT";
  food.applicableCountries = row.applicable_countries?.trim() || null;
  food.nameSw = row.name_sw?.trim() || null;
  food.nameRw = row.name_rw?.trim() || null;
  food.nameLocalOther = row.name_local_other?.trim() || null;
  food.imageUrl = row.image_url?.trim() || food.imageUrl;
  food.imageConfirmed = Boolean(row.image_confirmed);
  food.brand = row.brand?.trim() || null;
  food.barcode = row.barcode ? String(row.barcode).trim() : null;
  food.packageSizeG =
    row.package_size_g != null && Number.isFinite(row.package_size_g)
      ? String(row.package_size_g)
      : null;
  food.labelSource = row.label_source?.trim() || null;
  food.source = row.source?.trim() || "TFCT";
  food.sourceVersion = row.source_version?.trim() || null;
  food.nutritionPer100g = composition;
  food.micronutrients = {};
  food.isActive = true;
  food.approvalStatus = "approved";
}

async function ensureDefaultServing(foodId: string) {
  const servingRepo = AppDataSource.getRepository(NutritionServingProfile);
  const existing = await servingRepo.count({ where: { foodId } });
  if (existing > 0) return;
  await servingRepo.save(
    servingRepo.create({
      foodId,
      unit: "g",
      amount: "100",
      gramsEquivalent: "100",
      isDefault: true,
    }),
  );
}

/**
 * Upsert all TFCT rows by food_code. Does not touch coach/packaged rows that
 * lack a matching food_code (or have a different source_type without a code clash).
 */
export async function importTfctFoods() {
  const rows = loadTfctFoodRows();
  if (!rows.length) return { created: 0, updated: 0, total: 0 };

  const foodRepo = AppDataSource.getRepository(NutritionFood);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const code = String(row.food_code ?? "").trim();
    if (!code || !row.name?.trim()) continue;

    let food = await foodRepo.findOne({ where: { foodCode: code } });
    if (!food) {
      // Prefer TFCT over a same-name regional seed without a food_code
      const byName = await foodRepo.findOne({ where: { name: row.name.trim() } });
      if (byName && !byName.foodCode) {
        food = byName;
      }
    }

    if (!food) {
      food = foodRepo.create({
        name: row.name.trim(),
        category: (row.food_group_name ?? "Miscellaneous").trim(),
        sourceType: "TFCT",
        isActive: true,
        approvalStatus: "approved",
        nutritionPer100g: {},
        micronutrients: {},
      });
      applyTfctRow(food, row);
      await foodRepo.save(food);
      await ensureDefaultServing(food.id);
      created += 1;
      continue;
    }

    applyTfctRow(food, row);
    await foodRepo.save(food);
    await ensureDefaultServing(food.id);
    updated += 1;
  }

  logger.info({ created, updated, total: rows.length }, "Imported TFCT nutrition foods");
  return { created, updated, total: rows.length };
}
