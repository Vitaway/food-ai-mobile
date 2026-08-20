import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { NutritionFood } from "../modules/nutrition-db/nutrition-food.entity";
import { NutritionServingProfile } from "../modules/nutrition-db/nutrition-serving-profile.entity";
import { normalizeServingUnit } from "../modules/nutrition-db/serving-units.util";
import { composeTfctFromLegacy, toLegacyMicronutrients, toLegacyNutritionPer100g } from "../modules/nutrition-db/tfct-nutrients";
import { barcodeLookupVariants, canonicalBarcode, isLikelyBarcodeQuery } from "../utils/barcode.util";
import {
  OFF_CACHE_MISS,
  OffFetchError,
  OffLookupUnavailableError,
  barcodeCacheKey,
  barcodeLockKey,
  fetchOffProduct,
  isOffCacheMiss,
  searchCacheKey,
  searchOffProducts,
  type OffCacheEntry,
  type PackagedProduct,
} from "./open-food-facts.client";
import { redisService } from "./redis.service";

const foodRepo = AppDataSource.getRepository(NutritionFood);
const servingRepo = AppDataSource.getRepository(NutritionServingProfile);

function toPackagedFromEntity(
  food: NutritionFood,
  servings: NutritionServingProfile[],
  extras?: Partial<Pick<PackagedProduct, "source" | "nutriscoreGrade" | "ecoscoreGrade" | "quantity">>,
): PackagedProduct {
  const composition = food.nutritionPer100g ?? {};
  return {
    id: food.id,
    barcode: food.barcode ?? null,
    name: food.name,
    brand: food.brand ?? null,
    category: food.category || "Packaged",
    imageUrl: food.imageUrl ?? null,
    quantity: extras?.quantity ?? (food.packageSizeG != null ? `${food.packageSizeG}g` : null),
    ingredientsText: food.recipeNote?.startsWith("Ingredients:") ? food.recipeNote.replace(/^Ingredients:\s*/, "") : null,
    nutriscoreGrade: extras?.nutriscoreGrade ?? null,
    ecoscoreGrade: extras?.ecoscoreGrade ?? null,
    novaGroup: null,
    source: extras?.source ?? (food.source === "openfoodfacts" ? "openfoodfacts" : "local"),
    nutritionPer100g: toLegacyNutritionPer100g(composition),
    micronutrients: toLegacyMicronutrients(composition, food.micronutrients),
    nutrientsUnknown: Array.isArray(food.nutrientsUnknown) ? food.nutrientsUnknown : [],
    servings: servings.map((serving) => ({
      id: serving.id,
      unit: normalizeServingUnit(serving.unit),
      amount: Number(serving.amount),
      gramsEquivalent: Number(serving.gramsEquivalent),
      isDefault: serving.isDefault,
    })),
  };
}

async function findLocalByBarcodeVariants(variants: string[]): Promise<PackagedProduct | null> {
  if (!variants.length) return null;
  const food = await foodRepo.findOne({
    where: { barcode: In(variants), isActive: true, approvalStatus: "approved" },
  });
  if (!food) return null;
  const servings = await servingRepo.find({ where: { foodId: food.id }, order: { isDefault: "DESC" } });
  return toPackagedFromEntity(food, servings);
}

async function readBarcodeCache(canonical: string): Promise<OffCacheEntry | null> {
  return redisService.getJson<OffCacheEntry>(barcodeCacheKey(canonical));
}

async function writeBarcodeCache(canonical: string, entry: OffCacheEntry): Promise<void> {
  const ttl = isOffCacheMiss(entry) ? env.OFF_MISS_CACHE_TTL_SECONDS : env.OFF_CACHE_TTL_SECONDS;
  await redisService.setJson(barcodeCacheKey(canonical), entry, ttl);
}

async function persistOffProduct(product: PackagedProduct): Promise<PackagedProduct> {
  if (!product.barcode) return product;

  const canonical = canonicalBarcode(product.barcode);
  let food = await foodRepo.findOne({ where: { barcode: canonical } });

  const composition = composeTfctFromLegacy({
    nutritionPer100g: product.nutritionPer100g,
    micronutrients: product.micronutrients,
  });
  const nutrientsUnknown = product.nutrientsUnknown ?? [];

  if (!food) {
    food = foodRepo.create({
      name: product.name,
      category: product.category || "Packaged",
      brand: product.brand,
      barcode: canonical,
      isActive: true,
      approvalStatus: "approved",
      sourceType: "packaged",
      source: "openfoodfacts",
      labelSource: "Open Food Facts",
      imageUrl: product.imageUrl,
      recipeNote: product.ingredientsText
        ? `Ingredients: ${product.ingredientsText.slice(0, 240)}`
        : null,
      nutritionPer100g: composition,
      micronutrients: product.micronutrients ?? {},
      nutrientsUnknown,
    });
    await foodRepo.save(food);

    const grams = product.servings[0]?.gramsEquivalent ?? 100;
    await servingRepo.save(
      servingRepo.create({
        foodId: food.id,
        unit: "g",
        amount: String(grams),
        gramsEquivalent: String(grams),
        isDefault: true,
      }),
    );
  } else {
    food.name = product.name;
    food.brand = product.brand;
    food.category = product.category || food.category;
    food.imageUrl = product.imageUrl ?? food.imageUrl;
    food.nutritionPer100g = composition;
    food.micronutrients = product.micronutrients ?? {};
    food.nutrientsUnknown = nutrientsUnknown;
    food.source = food.source ?? "openfoodfacts";
    food.sourceType = food.sourceType || "packaged";
    food.labelSource = food.labelSource ?? "Open Food Facts";
    if (product.ingredientsText) {
      food.recipeNote = `Ingredients: ${product.ingredientsText.slice(0, 240)}`;
    }
    food.isActive = true;
    food.approvalStatus = "approved";
    await foodRepo.save(food);
  }

  const servings = await servingRepo.find({ where: { foodId: food.id }, order: { isDefault: "DESC" } });
  return toPackagedFromEntity(food, servings, {
    source: "openfoodfacts",
    nutriscoreGrade: product.nutriscoreGrade,
    ecoscoreGrade: product.ecoscoreGrade,
    quantity: product.quantity,
  });
}

async function fetchOffWithVariants(variants: string[]): Promise<PackagedProduct | null> {
  for (const variant of variants) {
    try {
      const product = await fetchOffProduct(variant);
      if (product) {
        return { ...product, barcode: canonicalBarcode(product.barcode ?? variant) };
      }
    } catch (err) {
      if (err instanceof OffFetchError && err.kind === "not_found") {
        continue;
      }
      throw err;
    }
  }
  return null;
}

async function lookupBarcodeWithSingleFlight(canonical: string, variants: string[]): Promise<PackagedProduct | null> {
  const lockKey = barcodeLockKey(canonical);
  const lockToken = await redisService.acquireLock(lockKey, env.OFF_LOCK_TTL_SECONDS);

  if (!lockToken) {
    const waited = await redisService.waitForValue(barcodeCacheKey(canonical), env.OFF_LOCK_WAIT_MS);
    if (waited) {
      try {
        const entry = JSON.parse(waited) as OffCacheEntry;
        return isOffCacheMiss(entry) ? null : entry;
      } catch {
        /* fall through */
      }
    }
    const afterWait = await readBarcodeCache(canonical);
    if (afterWait) {
      return isOffCacheMiss(afterWait) ? null : afterWait;
    }
  }

  try {
    const offProduct = await fetchOffWithVariants(variants);
    if (!offProduct) {
      await writeBarcodeCache(canonical, OFF_CACHE_MISS);
      return null;
    }

    const persisted = await persistOffProduct(offProduct);
    await writeBarcodeCache(canonical, persisted);
    return persisted;
  } catch (err) {
    if (err instanceof OffFetchError) {
      logger.warn({ err, canonical }, "OFF lookup failed after local miss");
      throw new OffLookupUnavailableError();
    }
    throw err;
  } finally {
    if (lockToken) {
      await redisService.releaseLock(lockKey, lockToken);
    }
  }
}

async function searchLocalProducts(query: string, limit: number): Promise<PackagedProduct[]> {
  const q = query.trim();
  const foods = await foodRepo
    .createQueryBuilder("food")
    .where("food.is_active = true")
    .andWhere("food.approval_status = 'approved'")
    .andWhere(
      "(food.name ILIKE :q OR food.brand ILIKE :q OR food.barcode ILIKE :q OR food.category ILIKE :q)",
      { q: `%${q}%` },
    )
    .orderBy("food.name", "ASC")
    .take(Math.min(limit, 20))
    .getMany();

  const products: PackagedProduct[] = [];
  for (const food of foods) {
    const servings = await servingRepo.find({ where: { foodId: food.id }, order: { isDefault: "DESC" } });
    products.push(toPackagedFromEntity(food, servings));
  }
  return products;
}

export const offProductCacheService = {
  async lookupBarcode(rawBarcode: string): Promise<PackagedProduct | null> {
    const variants = barcodeLookupVariants(rawBarcode);
    if (!variants.length) return null;

    const canonical = canonicalBarcode(rawBarcode);
    if (!canonical) return null;

    const cached = await readBarcodeCache(canonical);
    if (cached) {
      return isOffCacheMiss(cached) ? null : cached;
    }

    const local = await findLocalByBarcodeVariants(variants);
    if (local) {
      await writeBarcodeCache(canonical, local);
      return local;
    }

    try {
      return await lookupBarcodeWithSingleFlight(canonical, variants);
    } catch (err) {
      if (err instanceof OffLookupUnavailableError) {
        throw err;
      }
      logger.error({ err, canonical }, "Barcode lookup failed unexpectedly");
      throw new OffLookupUnavailableError();
    }
  },

  async searchProducts(query: string, limit = 20): Promise<PackagedProduct[]> {
    const q = query.trim();
    if (!q) return [];

    if (isLikelyBarcodeQuery(q)) {
      const byBarcode = await this.lookupBarcode(q);
      return byBarcode ? [byBarcode] : [];
    }

    const cacheKey = searchCacheKey(q, limit);
    const cached = await redisService.getJson<PackagedProduct[]>(cacheKey);
    if (cached) return cached;

    const lockKey = `${cacheKey}:lock`;
    const lockToken = await redisService.acquireLock(lockKey, env.OFF_LOCK_TTL_SECONDS);

    if (!lockToken) {
      const waited = await redisService.waitForValue(cacheKey, env.OFF_LOCK_WAIT_MS);
      if (waited) {
        try {
          return JSON.parse(waited) as PackagedProduct[];
        } catch {
          /* continue */
        }
      }
    }

    try {
      const localProducts = await searchLocalProducts(q, limit);

      let offProducts: PackagedProduct[] = [];
      try {
        offProducts = await searchOffProducts(q, limit);
      } catch (err) {
        if (localProducts.length) {
          await redisService.setJson(cacheKey, localProducts, env.OFF_SEARCH_CACHE_TTL_SECONDS);
          return localProducts.slice(0, limit);
        }
        throw new OffLookupUnavailableError();
      }

      const seen = new Set(
        localProducts.map((item) => item.barcode).filter((code): code is string => Boolean(code)),
      );
      const merged = [...localProducts];
      for (const product of offProducts) {
        if (product.barcode && seen.has(product.barcode)) continue;
        if (product.barcode) seen.add(product.barcode);
        merged.push(product);
        if (merged.length >= limit) break;
      }

      const result = merged.slice(0, limit);
      await redisService.setJson(cacheKey, result, env.OFF_SEARCH_CACHE_TTL_SECONDS);
      return result;
    } finally {
      if (lockToken) {
        await redisService.releaseLock(lockKey, lockToken);
      }
    }
  },
};
