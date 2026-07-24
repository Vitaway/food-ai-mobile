import fs from "fs";
import path from "path";
import { AppDataSource } from "../../config/database";
import { logger } from "../../config/logger";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import { normalizeServingUnit } from "./serving-units.util";
import { pickTfctComposition } from "./tfct-nutrients";

export type TfctServingSeed = {
  unit: string;
  amount: number;
  gramsEquivalent: number;
  isDefault?: boolean;
};

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
  /** Household measures from TFCT serving-size table (grams per 1 unit). */
  servings?: TfctServingSeed[];
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

function roundServingNumber(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeSeedServings(row: TfctFoodRow): TfctServingSeed[] {
  const raw = Array.isArray(row.servings) ? row.servings : [];
  const byUnit = new Map<string, TfctServingSeed>();

  for (const seed of raw) {
    const unit = normalizeServingUnit(String(seed.unit ?? ""));
    const amount = Number(seed.amount);
    const gramsEquivalent = Number(seed.gramsEquivalent);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (!Number.isFinite(gramsEquivalent) || gramsEquivalent <= 0) continue;
    byUnit.set(unit, {
      unit,
      amount: roundServingNumber(amount),
      gramsEquivalent: roundServingNumber(gramsEquivalent),
      isDefault: Boolean(seed.isDefault),
    });
  }

  if (!byUnit.has("g")) {
    byUnit.set("g", { unit: "g", amount: 100, gramsEquivalent: 100, isDefault: false });
  }

  const list = [...byUnit.values()];
  if (!list.some((s) => s.isDefault)) {
    const fallback = list.find((s) => s.unit === "g") ?? list[0];
    if (fallback) fallback.isDefault = true;
  } else {
    // Exactly one default
    let seen = false;
    for (const s of list) {
      if (s.isDefault && !seen) {
        seen = true;
      } else {
        s.isDefault = false;
      }
    }
  }
  return list;
}

/**
 * Append seed serving units that are not already on the food.
 * Never overwrites coach-edited gram weights for an existing unit.
 */
async function ensureServingsFromSeed(foodId: string, row: TfctFoodRow) {
  const servingRepo = AppDataSource.getRepository(NutritionServingProfile);
  const existing = await servingRepo.find({ where: { foodId } });
  const existingUnits = new Set(existing.map((s) => normalizeServingUnit(s.unit)));
  const seeds = normalizeSeedServings(row);

  const toCreate = seeds.filter((s) => !existingUnits.has(normalizeServingUnit(s.unit)));
  if (!toCreate.length) {
    if (existing.length === 0) {
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
    return;
  }

  const hasDefault = existing.some((s) => s.isDefault);
  await servingRepo.save(
    toCreate.map((seed) =>
      servingRepo.create({
        foodId,
        unit: seed.unit,
        amount: String(seed.amount),
        gramsEquivalent: String(seed.gramsEquivalent),
        // Only mark default from seed when the food has no default yet
        isDefault: !hasDefault && Boolean(seed.isDefault),
      }),
    ),
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
      await ensureServingsFromSeed(food.id, row);
      created += 1;
      continue;
    }

    applyTfctRow(food, row);
    await foodRepo.save(food);
    await ensureServingsFromSeed(food.id, row);
    updated += 1;
  }

  logger.info({ created, updated, total: rows.length }, "Imported TFCT nutrition foods");
  return { created, updated, total: rows.length };
}
