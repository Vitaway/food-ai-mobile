import { createHash } from "crypto";
import { env } from "../config/env";
import { logger } from "../config/logger";

const OFF_PRODUCT_FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "brands",
  "image_front_small_url",
  "image_small_url",
  "image_url",
  "quantity",
  "product_quantity",
  "product_quantity_unit",
  "nutriscore_grade",
  "nutriscore_data",
  "ecoscore_grade",
  "serving_quantity",
  "serving_size",
  "ingredients_text",
  "nutriments",
  "categories",
].join(",");

const OFF_SEARCH_FIELDS =
  "code,product_name,product_name_en,brands,image_small_url,image_front_small_url,image_url,quantity,nutriscore_grade,ecoscore_grade,nutriments,serving_quantity,serving_size,categories";

export type PackagedProduct = {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  quantity: string | null;
  ingredientsText: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
  source: "local" | "openfoodfacts";
  nutritionPer100g: Record<string, number>;
  micronutrients: Record<string, number>;
  nutrientsUnknown?: string[];
  servings: Array<{
    id: string;
    unit: string;
    amount: number;
    gramsEquivalent: number;
    isDefault: boolean;
  }>;
};

export type OffFetchFailureKind =
  | "not_found"
  | "rate_limit"
  | "server_error"
  | "timeout"
  | "network"
  | "invalid_response";

export class OffFetchError extends Error {
  readonly kind: OffFetchFailureKind;
  readonly retryAfterSeconds?: number;

  constructor(kind: OffFetchFailureKind, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "OffFetchError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class OffLookupUnavailableError extends Error {
  constructor(message = "Product lookup temporarily unavailable. Please try again shortly.") {
    super(message);
    this.name = "OffLookupUnavailableError";
  }
}

type OffNutriments = Record<string, number | string | undefined>;

type OffNutriscoreData = {
  grade?: string;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_small_url?: string;
  image_front_small_url?: string;
  image_url?: string;
  quantity?: string;
  product_quantity?: number | string;
  product_quantity_unit?: string;
  ingredients_text?: string;
  nutriscore_grade?: string;
  nutriscore_data?: OffNutriscoreData;
  ecoscore_grade?: string;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: OffNutriments;
  categories?: string;
};

type OffV3ProductResponse = {
  status?: string;
  code?: string;
  result?: { id?: string };
  product?: OffProduct;
  errors?: unknown[];
};

function userAgent(): string {
  return `MiraFood/1.0 (${env.OFF_CONTACT_EMAIL})`;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNutriment(nutriments: OffNutriments | undefined, keys: string[]): number | null {
  if (!nutriments) return null;
  for (const key of keys) {
    const value = asNumber(nutriments[key]);
    if (value != null) return value;
  }
  return null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function grade(value: string | undefined): string | null {
  const next = value?.trim().toLowerCase();
  if (!next || next === "unknown" || next === "not-applicable") return null;
  return next;
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  const dateMs = Date.parse(header);
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.max(1, Math.ceil((dateMs - Date.now()) / 1000));
}

async function offFetch<T>(
  url: string,
  opts?: { retries?: number },
): Promise<T> {
  const retries = opts?.retries ?? 1;
  let lastError: OffFetchError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OFF_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent(),
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new OffFetchError("not_found", "Product not found on Open Food Facts");
      }

      if (response.status === 429) {
        const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));
        throw new OffFetchError(
          "rate_limit",
          "Open Food Facts rate limit reached",
          retryAfterSeconds,
        );
      }

      if (response.status >= 500) {
        throw new OffFetchError("server_error", `Open Food Facts server error (${response.status})`);
      }

      if (!response.ok) {
        throw new OffFetchError("invalid_response", `Open Food Facts unexpected status (${response.status})`);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof OffFetchError) {
        lastError = err;
        const shouldRetry =
          attempt < retries &&
          (err.kind === "rate_limit" || err.kind === "server_error" || err.kind === "network");
        if (shouldRetry) {
          const waitMs = (err.retryAfterSeconds ?? 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        lastError = new OffFetchError("timeout", "Open Food Facts request timed out");
      } else {
        lastError = new OffFetchError("network", "Could not reach Open Food Facts");
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new OffFetchError("network", "Open Food Facts request failed");
}

const LEGACY_MACRO_TO_TFCT: Record<string, string> = {
  caloriesKcal: "energy_kcal",
  proteinG: "protein_g",
  carbsG: "carb_g",
  fatG: "fat_g",
  fiberG: "fiber_g",
  sugarG: "sugar_g",
  sodiumMg: "sodium_mg",
};

function nutrientsUnknownFromPartial(nutritionPer100g: Record<string, number>): string[] {
  const unknown: string[] = [];
  for (const [legacyKey, tfctKey] of Object.entries(LEGACY_MACRO_TO_TFCT)) {
    if (!(legacyKey in nutritionPer100g)) {
      unknown.push(tfctKey);
    }
  }
  return unknown;
}

const OFF_UNIT_ALIASES: Record<string, { unit: string; gramsPer: number }> = {
  g: { unit: "g", gramsPer: 1 },
  gram: { unit: "g", gramsPer: 1 },
  grams: { unit: "g", gramsPer: 1 },
  kg: { unit: "kg", gramsPer: 1000 },
  ml: { unit: "ml", gramsPer: 1 },
  milliliter: { unit: "ml", gramsPer: 1 },
  millilitre: { unit: "ml", gramsPer: 1 },
  milliliters: { unit: "ml", gramsPer: 1 },
  cl: { unit: "ml", gramsPer: 10 },
  l: { unit: "l", gramsPer: 1000 },
  liter: { unit: "l", gramsPer: 1000 },
  litre: { unit: "l", gramsPer: 1000 },
  liters: { unit: "l", gramsPer: 1000 },
  tbsp: { unit: "tbsp", gramsPer: 15 },
  tbs: { unit: "tbsp", gramsPer: 15 },
  tablespoon: { unit: "tbsp", gramsPer: 15 },
  tablespoons: { unit: "tbsp", gramsPer: 15 },
  tsp: { unit: "tsp", gramsPer: 5 },
  teaspoon: { unit: "tsp", gramsPer: 5 },
  teaspoons: { unit: "tsp", gramsPer: 5 },
  cup: { unit: "cup", gramsPer: 240 },
  cups: { unit: "cup", gramsPer: 240 },
  glass: { unit: "glass", gramsPer: 240 },
  glasses: { unit: "glass", gramsPer: 240 },
  bottle: { unit: "bottle", gramsPer: 330 },
  can: { unit: "can", gramsPer: 330 },
  carton: { unit: "carton", gramsPer: 250 },
  piece: { unit: "piece", gramsPer: 85 },
  slice: { unit: "slice", gramsPer: 30 },
  serving: { unit: "serving", gramsPer: 100 },
  portion: { unit: "portion", gramsPer: 150 },
  scoop: { unit: "scoop", gramsPer: 30 },
  spoon: { unit: "tbsp", gramsPer: 15 },
  bowl: { unit: "bowl", gramsPer: 300 },
};

type ParsedOffMeasure = {
  amount: number;
  unit: string;
  gramsEquivalent: number;
};

function parseOffMeasure(raw: string | null | undefined): ParsedOffMeasure | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase().replace(",", ".");
  const match = text.match(/([\d.]+)\s*([a-zµμ]+)/i);
  if (!match) return null;
  const parsedAmount = Number(match[1]);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
  const alias = OFF_UNIT_ALIASES[match[2]];
  if (!alias) return null;
  const gramsEquivalent = Math.round(parsedAmount * alias.gramsPer * 10) / 10;
  if (gramsEquivalent <= 0 || gramsEquivalent > 5000) return null;
  const amount = match[2] === "cl" ? parsedAmount * 10 : parsedAmount;
  return { amount, unit: alias.unit, gramsEquivalent };
}

function looksLikeLiquidProduct(product: OffProduct): boolean {
  const unit = (product.product_quantity_unit ?? "").toLowerCase();
  if (/\b(ml|cl|l|litre|liter)\b/.test(unit)) return true;
  const quantity = (product.quantity ?? "").toLowerCase();
  if (/\b(ml|cl|\bl\b|litre|liter)\b/.test(quantity)) return true;
  const category = (product.categories ?? "").toLowerCase();
  return /\b(beverage|beverages|drink|drinks|juice|milk|water|soda|nectar|yoghurt drink)\b/.test(
    category,
  );
}

function uniqueOffServings(
  rows: Array<{ unit: string; amount: number; gramsEquivalent: number }>,
): PackagedProduct["servings"] {
  const seen = new Set<string>();
  const servings: PackagedProduct["servings"] = [];
  for (const [index, row] of rows.entries()) {
    const key = `${row.unit}:${row.amount}:${row.gramsEquivalent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    servings.push({
      id: `off-serving-${row.unit}-${index}`,
      unit: row.unit,
      amount: row.amount,
      gramsEquivalent: row.gramsEquivalent,
      isDefault: servings.length === 0,
    });
  }
  return servings;
}

export function inferOffServings(product: OffProduct, barcode: string): PackagedProduct["servings"] {
  const grams = inferOffServingGrams(product);
  const candidates: Array<{ unit: string; amount: number; gramsEquivalent: number }> = [];

  const fromServingSize = parseOffMeasure(product.serving_size);
  if (fromServingSize) candidates.push(fromServingSize);

  const fromQuantity = parseOffMeasure(product.quantity);
  if (fromQuantity) candidates.push(fromQuantity);

  const packageAmount = asNumber(product.product_quantity);
  const packageUnit = product.product_quantity_unit?.trim();
  if (packageAmount != null && packageUnit) {
    const fromPackage = parseOffMeasure(`${packageAmount} ${packageUnit}`);
    if (fromPackage) candidates.push(fromPackage);
  }

  if (!candidates.some((row) => Math.abs(row.gramsEquivalent - grams) < 0.6)) {
    const liquid = looksLikeLiquidProduct(product) || candidates.some((row) => row.unit === "ml" || row.unit === "l");
    candidates.unshift(
      liquid
        ? { unit: "ml", amount: grams, gramsEquivalent: grams }
        : { unit: "g", amount: grams, gramsEquivalent: grams },
    );
  }

  const servings = uniqueOffServings(candidates);
  if (servings.length) return servings;

  return [
    {
      id: `off-serving-${barcode}`,
      unit: looksLikeLiquidProduct(product) ? "ml" : "g",
      amount: grams,
      gramsEquivalent: grams,
      isDefault: true,
    },
  ];
}

/** Prefer explicit OFF serving fields, then infer from per-serving vs per-100g nutriments. */
export function inferOffServingGrams(product: OffProduct): number {
  const fromQuantity = asNumber(product.serving_quantity);
  if (fromQuantity != null && fromQuantity > 0 && fromQuantity <= 2000) {
    return Math.round(fromQuantity * 10) / 10;
  }

  const servingSize = product.serving_size?.trim() ?? "";
  const gramsMatch = servingSize.match(/([\d.,]+)\s*g\b/i);
  if (gramsMatch) {
    const parsed = asNumber(gramsMatch[1].replace(",", "."));
    if (parsed != null && parsed > 0) return Math.round(parsed * 10) / 10;
  }

  const nutriments = product.nutriments ?? {};
  for (const key of Object.keys(nutriments)) {
    if (!key.endsWith("_100g")) continue;
    const base = key.slice(0, -5);
    const per100 = asNumber(nutriments[key]);
    const perServing = asNumber(nutriments[`${base}_serving`]);
    if (per100 != null && per100 > 0 && perServing != null && perServing > 0) {
      const grams = (perServing / per100) * 100;
      if (grams > 0 && grams <= 2000) {
        return Math.round(grams * 10) / 10;
      }
    }
  }

  return 100;
}

export function mapOffProduct(product: OffProduct, fallbackCode?: string): PackagedProduct | null {
  const barcode = String(product.code ?? fallbackCode ?? "").trim();
  const name = (product.product_name || product.product_name_en || "").trim();
  if (!barcode || !name) return null;

  const nutriments = product.nutriments ?? {};
  const nutritionPer100g: Record<string, number> = {};

  const energyKcalDirect = pickNutriment(nutriments, ["energy-kcal_100g", "energy-kcal", "energy_kcal_100g"]);
  const energyKj = pickNutriment(nutriments, ["energy-kj_100g", "energy-kj"]);
  if (energyKcalDirect != null) {
    nutritionPer100g.caloriesKcal = round1(energyKcalDirect);
  } else if (energyKj != null) {
    nutritionPer100g.caloriesKcal = round1(energyKj / 4.184);
  }

  const proteinG = pickNutriment(nutriments, ["proteins_100g"]);
  if (proteinG != null) nutritionPer100g.proteinG = round1(proteinG);

  const carbsG = pickNutriment(nutriments, ["carbohydrates_100g"]);
  if (carbsG != null) nutritionPer100g.carbsG = round1(carbsG);

  const fatG = pickNutriment(nutriments, ["fat_100g"]);
  if (fatG != null) nutritionPer100g.fatG = round1(fatG);

  const fiberG = pickNutriment(nutriments, ["fiber_100g"]);
  if (fiberG != null) nutritionPer100g.fiberG = round1(fiberG);

  const sugarG = pickNutriment(nutriments, ["sugars_100g"]);
  if (sugarG != null) nutritionPer100g.sugarG = round1(sugarG);

  const sodiumG = pickNutriment(nutriments, ["sodium_100g"]);
  const saltG = pickNutriment(nutriments, ["salt_100g"]);
  if (sodiumG != null) {
    nutritionPer100g.sodiumMg = Math.round(sodiumG * 1000);
  } else if (saltG != null) {
    nutritionPer100g.sodiumMg = Math.round(saltG * 400);
  }

  const saturatedFatG = pickNutriment(nutriments, ["saturated-fat_100g"]);
  if (saturatedFatG != null) {
    nutritionPer100g.saturatedFatG = round1(saturatedFatG);
  }

  const novaGroup = pickNutriment(nutriments, ["nova-group_100g", "nova-group"]);

  const quantityLabel =
    product.quantity?.trim() ||
    (product.product_quantity && product.product_quantity_unit
      ? `${product.product_quantity}${product.product_quantity_unit}`.trim()
      : null);

  const nutriscoreGrade =
    grade(product.nutriscore_grade) ?? grade(product.nutriscore_data?.grade) ?? null;

  return {
    id: `off:${barcode}`,
    barcode,
    name,
    brand: product.brands?.split(",")[0]?.trim() || null,
    category: product.categories?.split(",")[0]?.trim() || "Packaged",
    imageUrl:
      product.image_front_small_url ||
      product.image_small_url ||
      product.image_url ||
      null,
    quantity: quantityLabel,
    ingredientsText: product.ingredients_text?.trim() || null,
    nutriscoreGrade,
    ecoscoreGrade: grade(product.ecoscore_grade),
    novaGroup: novaGroup != null ? Math.round(novaGroup) : null,
    source: "openfoodfacts",
    nutritionPer100g,
    micronutrients: {},
    nutrientsUnknown: nutrientsUnknownFromPartial(nutritionPer100g),
    servings: inferOffServings(product, barcode),
  };
}

export async function fetchOffProduct(barcode: string): Promise<PackagedProduct | null> {
  const code = barcode.trim();
  if (!code) return null;

  const url = `${env.OFF_ORIGIN}/api/v3/product/${encodeURIComponent(code)}.json?fields=${OFF_PRODUCT_FIELDS}`;
  let data: OffV3ProductResponse;
  try {
    data = await offFetch<OffV3ProductResponse>(url, { retries: env.OFF_FETCH_RETRIES });
  } catch (err) {
    if (err instanceof OffFetchError && err.kind === "not_found") {
      return null;
    }
    logger.warn({ err, barcode: code }, "Open Food Facts product fetch failed");
    throw err;
  }

  if (data.result?.id === "product_not_found" || data.status === "failure" || !data.product) {
    return null;
  }

  return mapOffProduct(data.product, code);
}

export async function searchOffProducts(query: string, limit = 20): Promise<PackagedProduct[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(Math.min(Math.max(limit, 1), 30)),
    sort_by: "unique_scans_n",
    fields: OFF_SEARCH_FIELDS,
  });

  const url = `${env.OFF_ORIGIN}/cgi/search.pl?${params.toString()}`;
  try {
    const data = await offFetch<{ products?: OffProduct[] }>(url, { retries: env.OFF_FETCH_RETRIES });
    const products = Array.isArray(data?.products) ? data.products : [];
    const mapped: PackagedProduct[] = [];
    const seen = new Set<string>();
    for (const product of products) {
      const next = mapOffProduct(product);
      if (!next || seen.has(next.id)) continue;
      seen.add(next.id);
      mapped.push(next);
    }
    return mapped;
  } catch (err) {
    logger.warn({ err, query: q }, "Open Food Facts search failed");
    throw err;
  }
}

export function searchCacheKey(query: string, limit: number): string {
  const normalized = query.trim().toLowerCase();
  const hash = createHash("sha1").update(`${normalized}:${limit}`).digest("hex");
  return `nutrition:search:${hash}`;
}

export const OFF_CACHE_MISS = { __cacheMiss: true as const };
export type OffCacheEntry = PackagedProduct | typeof OFF_CACHE_MISS;

export function isOffCacheMiss(entry: OffCacheEntry | null | undefined): entry is typeof OFF_CACHE_MISS {
  return Boolean(entry && typeof entry === "object" && "__cacheMiss" in entry);
}

export function barcodeCacheKey(barcode: string): string {
  return `nutrition:barcode:${barcode}`;
}

export function barcodeLockKey(barcode: string): string {
  return `nutrition:barcode:lock:${barcode}`;
}
