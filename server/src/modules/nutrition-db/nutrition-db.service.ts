import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { NotFoundError } from "routing-controllers";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import type { CreateNutritionFoodDto, UpdateNutritionFoodDto } from "./nutrition-db.dto";
import { SERVING_UNITS, normalizeServingUnit } from "./serving-units.util";
import { bestNutritionFoodMatch, normalizeSearchLabel, scoreNutritionFood } from "./nutrition-lookup.util";
import {
  CLINICAL_NUTRIENT_PANEL,
  atwaterEnergyCheck,
  displayApprovalStatus,
  nutrientCompleteness,
  readClinicalNutrient,
} from "./clinical-nutrients.util";

const CLINICAL_KEYS = CLINICAL_NUTRIENT_PANEL.map((n) => n.key) as string[];

/** Replace curated clinical keys; strip unknowns so "?" never stores as a leftover number. */
function mergeClinicalComposition(
  existing: Record<string, number>,
  incoming: Record<string, number>,
  nutrientsUnknown?: string[],
): Record<string, number> {
  const next = { ...existing };
  for (const key of CLINICAL_KEYS) {
    delete next[key];
  }
  Object.assign(next, incoming);
  for (const key of nutrientsUnknown ?? []) {
    delete next[key];
  }
  return next;
}
import {
  composeTfctFromLegacy,
  toLegacyMicronutrients,
  toLegacyNutritionPer100g,
  toTfctComposition,
} from "./tfct-nutrients";

const foodRepo = AppDataSource.getRepository(NutritionFood);
const servingRepo = AppDataSource.getRepository(NutritionServingProfile);

const LEGACY_CATEGORIES = [
  "Staples",
  "Breads",
  "Grains",
  "Protein",
  "Traditional dishes",
  "Fruits",
  "Vegetables",
  "Dairy",
  "Beverages",
  "Snacks",
  "Condiments",
  "Packaged",
];

function normalizeServing(serving: NutritionServingProfile) {
  return {
    id: serving.id,
    unit: normalizeServingUnit(serving.unit),
    amount: Number(serving.amount),
    gramsEquivalent: Number(serving.gramsEquivalent),
    isDefault: serving.isDefault,
  };
}

function mapFood(food: NutritionFood, servings: NutritionServingProfile[]) {
  const composition = food.nutritionPer100g ?? {};
  const nutrientsUnknown = Array.isArray(food.nutrientsUnknown) ? food.nutrientsUnknown : [];
  const completeness = nutrientCompleteness(composition, nutrientsUnknown);
  const energyCheck = atwaterEnergyCheck({
    energyKcal: readClinicalNutrient(composition, "energy_kcal"),
    proteinG: readClinicalNutrient(composition, "protein_g"),
    carbG: readClinicalNutrient(composition, "carb_g"),
    fatG: readClinicalNutrient(composition, "fat_g"),
  });
  return {
    id: food.id,
    foodCode: food.foodCode,
    name: food.name,
    category: food.category,
    foodGroup: food.foodGroup,
    foodGroupName: food.foodGroupName,
    recipeNote: food.recipeNote,
    sourceType: food.sourceType,
    isRecipe: food.sourceType === "recipe",
    applicableCountries: food.applicableCountries,
    nameSw: food.nameSw,
    nameRw: food.nameRw,
    nameLocalOther: food.nameLocalOther,
    brand: food.brand,
    isActive: food.isActive,
    imageUrl: food.imageUrl,
    imageConfirmed: food.imageConfirmed,
    barcode: food.barcode,
    packageSizeG: food.packageSizeG != null ? Number(food.packageSizeG) : null,
    labelSource: food.labelSource,
    cookedYieldG: food.cookedYieldG != null ? Number(food.cookedYieldG) : null,
    preparationState: food.preparationState ?? null,
    ediblePortionFactor:
      food.ediblePortionFactor != null ? Number(food.ediblePortionFactor) : 1,
    searchSynonyms: Array.isArray(food.searchSynonyms) ? food.searchSynonyms : [],
    allergens: Array.isArray(food.allergens) ? food.allergens : [],
    nutrientsUnknown,
    source: food.source,
    sourceVersion: food.sourceVersion,
    sourceReference: food.sourceReference ?? null,
    cookingMethod: food.cookingMethod ?? null,
    recipeVersion: food.recipeVersion ?? 1,
    hasFrozenSnapshot: food.frozenSnapshot != null,
    approvalStatus: food.approvalStatus ?? "approved",
    displayStatus: displayApprovalStatus(food.approvalStatus, food.isActive),
    fieldCompleteness: completeness,
    energyCheck,
    sodiumMissing:
      !nutrientsUnknown.includes("sodium_mg") &&
      readClinicalNutrient(composition, "sodium_mg") == null,
    submittedByUserId: food.submittedByUserId,
    verifiedByUserId: food.verifiedByUserId,
    /** Full TFCT composition — snake_case keys matching the spreadsheet. */
    composition,
    /** CamelCase macros for meal analysis / existing UI. */
    nutritionPer100g: toLegacyNutritionPer100g(composition),
    /** CamelCase micros for existing UI. */
    micronutrients: toLegacyMicronutrients(composition, food.micronutrients),
    servings: servings.map(normalizeServing),
    updatedAt: food.updatedAt.toISOString(),
  };
}

export const nutritionDbService = {
  async listCategories() {
    const rows = await foodRepo
      .createQueryBuilder("food")
      .select("DISTINCT food.category", "category")
      .where("food.category IS NOT NULL")
      .andWhere("food.category <> ''")
      .orderBy("food.category", "ASC")
      .getRawMany<{ category: string }>();
    const fromDb = rows.map((r) => r.category).filter(Boolean);
    if (!fromDb.length) return LEGACY_CATEGORIES;
    const merged = new Set([...fromDb, ...LEGACY_CATEGORIES]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  },

  listServingUnits() {
    return SERVING_UNITS;
  },

  async listFoods(
    query?: string,
    category?: string,
    includeInactive = false,
    approvalFilter: "approved" | "pending" | "rejected" | "draft" | "all" = "approved",
    page?: number,
    pageSize?: number,
    sourceType?: string,
    excludeSourceTypes?: string[],
  ) {
    const qb = foodRepo.createQueryBuilder("food").orderBy("food.name", "ASC");
    if (!includeInactive) {
      qb.andWhere("food.is_active = true");
    }
    if (approvalFilter === "approved") {
      qb.andWhere("food.approval_status = 'approved'");
    } else if (approvalFilter === "pending") {
      qb.andWhere("food.approval_status = 'pending'");
    } else if (approvalFilter === "rejected") {
      qb.andWhere("food.approval_status = 'rejected'");
    } else if (approvalFilter === "draft") {
      qb.andWhere("food.approval_status = 'draft'");
    }

    const trimmedQuery = query?.trim() ?? "";
    const tokens = trimmedQuery
      ? normalizeSearchLabel(trimmedQuery).split(" ").filter((token) => token.length >= 2)
      : [];

    if (trimmedQuery) {
      const ors: string[] = [
        "food.name ILIKE :full",
        "food.brand ILIKE :full",
        "food.name_sw ILIKE :full",
        "food.name_rw ILIKE :full",
        "food.name_local_other ILIKE :full",
        "food.food_code ILIKE :full",
        "food.barcode ILIKE :full",
        "EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(food.search_synonyms, '[]'::jsonb)) syn WHERE syn ILIKE :full)",
      ];
      const params: Record<string, string> = { full: `%${trimmedQuery}%` };
      tokens.forEach((token, index) => {
        const key = `t${index}`;
        params[key] = `%${token}%`;
        ors.push(
          `food.name ILIKE :${key}`,
          `food.brand ILIKE :${key}`,
          `food.name_sw ILIKE :${key}`,
          `food.name_rw ILIKE :${key}`,
          `food.name_local_other ILIKE :${key}`,
          `EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(food.search_synonyms, '[]'::jsonb)) syn WHERE syn ILIKE :${key})`,
        );
      });
      qb.andWhere(`(${ors.join(" OR ")})`, params);
    }

    if (category?.trim()) {
      qb.andWhere("(food.category = :category OR food.food_group_name = :category)", {
        category: category.trim(),
      });
    }
    if (sourceType?.trim()) {
      qb.andWhere("food.source_type = :sourceType", { sourceType: sourceType.trim() });
    }
    const excluded = (excludeSourceTypes ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (excluded.length) {
      qb.andWhere("food.source_type NOT IN (:...excludeSourceTypes)", {
        excludeSourceTypes: excluded,
      });
    }

    const paginate = page != null || pageSize != null;
    const safePage = Math.max(1, page ?? 1);
    const safePageSize = Math.min(100, Math.max(1, pageSize ?? 20));

    // When searching, pull a wider candidate set then rank in memory for better relevance.
    const candidateLimit = trimmedQuery ? Math.min(400, Math.max(safePageSize * 8, 80)) : undefined;
    if (!paginate) {
      qb.take(trimmedQuery ? candidateLimit ?? 200 : 200);
    } else if (trimmedQuery) {
      qb.take(candidateLimit);
    } else {
      qb.skip((safePage - 1) * safePageSize).take(safePageSize);
    }

    const totalBeforeRank = await qb.clone().getCount();
    const foods = await qb.getMany();
    const foodIds = foods.map((food) => food.id);
    const servings = foodIds.length
      ? await servingRepo.find({
          where: { foodId: In(foodIds) },
          order: { isDefault: "DESC", unit: "ASC" },
        })
      : [];
    const servingsByFood = new Map<string, NutritionServingProfile[]>();
    for (const serving of servings) {
      const rows = servingsByFood.get(serving.foodId) ?? [];
      rows.push(serving);
      servingsByFood.set(serving.foodId, rows);
    }

    let items = foods.map((food) => mapFood(food, servingsByFood.get(food.id) ?? []));
    if (trimmedQuery) {
      items = items
        .map((food) => ({ food, score: scoreNutritionFood(trimmedQuery, food) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aRecipe = a.food.isRecipe || a.food.sourceType === "recipe" ? 1 : 0;
          const bRecipe = b.food.isRecipe || b.food.sourceType === "recipe" ? 1 : 0;
          if (bRecipe !== aRecipe) return bRecipe - aRecipe;
          return a.food.name.localeCompare(b.food.name);
        })
        .map((row) => row.food);
    }

    if (!paginate) {
      return items.slice(0, 200);
    }

    if (trimmedQuery) {
      const total = items.length;
      const start = (safePage - 1) * safePageSize;
      return {
        items: items.slice(start, start + safePageSize),
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    }

    return {
      items,
      total: totalBeforeRank,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(totalBeforeRank / safePageSize)),
    };
  },

  async getFood(id: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    const servings = await servingRepo.find({ where: { foodId: id }, order: { isDefault: "DESC" } });
    return mapFood(food, servings);
  },

  /**
   * Resolve a vision/meal label to the best approved active food.
   * Merges a general search with a recipe-only search so dishes are not
   * crowded out of the candidate window by TFCT ingredient noise, then
   * applies recipe-aware ranking (see nutrition-lookup.util).
   */
  async lookupByName(name: string) {
    const q = name.trim();
    if (!q) return null;

    const [general, recipesOnly] = await Promise.all([
      this.listFoods(q, undefined, false, "approved"),
      this.listFoods(q, undefined, false, "approved", undefined, undefined, "recipe"),
    ]);

    const generalItems = Array.isArray(general) ? general : general.items;
    const recipeItems = Array.isArray(recipesOnly) ? recipesOnly : recipesOnly.items;

    const byId = new Map<string, (typeof generalItems)[number]>();
    for (const food of generalItems) byId.set(food.id, food);
    for (const food of recipeItems) byId.set(food.id, food);

    return bestNutritionFoodMatch(q, [...byId.values()]);
  },

  async lookupByBarcode(barcode: string) {
    const code = barcode.trim();
    if (!code) return null;
    const food = await foodRepo.findOne({
      where: { barcode: code, isActive: true, approvalStatus: "approved" },
    });
    if (!food) return null;
    const servings = await servingRepo.find({ where: { foodId: food.id }, order: { isDefault: "DESC" } });
    return mapFood(food, servings);
  },

  async setFoodImage(id: string, imageUrl: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    food.imageUrl = imageUrl;
    await foodRepo.save(food);
    return this.getFood(id);
  },

  async createFood(dto: CreateNutritionFoodDto, submittedByUserId?: string, coachSubmitted = false) {
    const composition = composeTfctFromLegacy({
      nutritionPer100g: dto.nutritionPer100g,
      micronutrients: dto.micronutrients,
    });
    // Allow explicit composition (snake_case) to override
    const fromComposition = toTfctComposition(dto.composition);
    const unknowns = Array.isArray(dto.nutrientsUnknown)
      ? dto.nutrientsUnknown.map((s) => s.trim()).filter(Boolean)
      : [];
    const merged = mergeClinicalComposition({}, { ...composition, ...fromComposition }, unknowns);

    // Coach: asDraft → draft; otherwise pending. Admin/staff: approved + active.
    let approvalStatus: NutritionFood["approvalStatus"] = "approved";
    let isActive = true;
    if (coachSubmitted) {
      approvalStatus = dto.asDraft === true ? "draft" : "pending";
      isActive = false;
    }

    const food = foodRepo.create({
      name: dto.name.trim(),
      category: dto.category.trim(),
      brand: dto.brand?.trim() || null,
      isActive,
      approvalStatus,
      submittedByUserId: submittedByUserId ?? null,
      nutritionPer100g: merged,
      micronutrients: {},
      barcode: dto.barcode?.trim() || null,
      sourceType: dto.sourceType?.trim() || "custom_local",
      applicableCountries: dto.applicableCountries?.trim() || null,
      nameSw: dto.nameSw?.trim() || null,
      nameRw: dto.nameRw?.trim() || null,
      nameLocalOther: dto.nameLocalOther?.trim() || null,
      foodGroupName: dto.foodGroupName?.trim() || null,
      packageSizeG:
        dto.packageSizeG != null && Number.isFinite(dto.packageSizeG)
          ? String(dto.packageSizeG)
          : null,
      labelSource: dto.labelSource?.trim() || null,
      preparationState: dto.preparationState?.trim() || null,
      ediblePortionFactor:
        dto.ediblePortionFactor != null && Number.isFinite(dto.ediblePortionFactor)
          ? String(dto.ediblePortionFactor)
          : "1",
      searchSynonyms: Array.isArray(dto.searchSynonyms)
        ? dto.searchSynonyms.map((s) => s.trim()).filter(Boolean)
        : [],
      allergens: Array.isArray(dto.allergens)
        ? dto.allergens.map((s) => s.trim()).filter(Boolean)
        : [],
      nutrientsUnknown: unknowns,
      source: dto.source?.trim() || null,
      sourceVersion: dto.sourceVersion?.trim() || null,
      sourceReference: dto.sourceReference?.trim() || null,
    });
    await foodRepo.save(food);
    if (dto.servings?.length) {
      const payload = dto.servings.map((serving, idx) =>
        servingRepo.create({
          foodId: food.id,
          unit: normalizeServingUnit(serving.unit),
          amount: String(serving.amount ?? 1),
          gramsEquivalent: String(serving.gramsEquivalent),
          isDefault: serving.isDefault ?? idx === 0,
        }),
      );
      await servingRepo.save(payload);
    }
    return this.getFood(food.id);
  },

  async listPendingFoods() {
    const result = await this.listFoods(undefined, undefined, true, "pending");
    return Array.isArray(result) ? result : result.items;
  },

  async approveFood(id: string, adminUserId: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    food.approvalStatus = "approved";
    food.isActive = true;
    food.verifiedByUserId = adminUserId;
    await foodRepo.save(food);
    return this.getFood(id);
  },

  async rejectFood(id: string, adminUserId: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    food.approvalStatus = "rejected";
    food.isActive = false;
    food.verifiedByUserId = adminUserId;
    await foodRepo.save(food);
    return this.getFood(id);
  },

  async submitFoodForReview(id: string, userId: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    food.approvalStatus = "pending";
    food.isActive = false;
    food.submittedByUserId = userId;
    await foodRepo.save(food);
    return this.getFood(id);
  },

  async returnFoodToDraft(id: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    food.approvalStatus = "draft";
    food.isActive = false;
    await foodRepo.save(food);
    return this.getFood(id);
  },

  async updateFood(id: string, dto: UpdateNutritionFoodDto) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    if (dto.name !== undefined) food.name = dto.name.trim();
    if (dto.category !== undefined) food.category = dto.category.trim();
    if (dto.brand !== undefined) food.brand = dto.brand?.trim() || null;
    if (dto.isActive !== undefined) food.isActive = dto.isActive;
    if (dto.barcode !== undefined) food.barcode = dto.barcode?.trim() || null;
    if (dto.sourceType !== undefined) food.sourceType = dto.sourceType.trim() || food.sourceType;
    if (dto.applicableCountries !== undefined) {
      food.applicableCountries = dto.applicableCountries?.trim() || null;
    }
    if (dto.nameSw !== undefined) food.nameSw = dto.nameSw?.trim() || null;
    if (dto.nameRw !== undefined) food.nameRw = dto.nameRw?.trim() || null;
    if (dto.nameLocalOther !== undefined) food.nameLocalOther = dto.nameLocalOther?.trim() || null;
    if (dto.foodGroupName !== undefined) food.foodGroupName = dto.foodGroupName?.trim() || null;
    if (dto.packageSizeG !== undefined) {
      food.packageSizeG =
        dto.packageSizeG != null && Number.isFinite(dto.packageSizeG)
          ? String(dto.packageSizeG)
          : null;
    }
    if (dto.labelSource !== undefined) food.labelSource = dto.labelSource?.trim() || null;
    if (dto.imageConfirmed !== undefined) food.imageConfirmed = dto.imageConfirmed;
    if (dto.preparationState !== undefined) {
      food.preparationState = dto.preparationState?.trim() || null;
    }
    if (dto.ediblePortionFactor !== undefined) {
      food.ediblePortionFactor =
        dto.ediblePortionFactor != null && Number.isFinite(dto.ediblePortionFactor)
          ? String(dto.ediblePortionFactor)
          : "1";
    }
    if (dto.searchSynonyms !== undefined) {
      food.searchSynonyms = dto.searchSynonyms.map((s) => s.trim()).filter(Boolean);
    }
    if (dto.allergens !== undefined) {
      food.allergens = dto.allergens.map((s) => s.trim()).filter(Boolean);
    }
    if (dto.nutrientsUnknown !== undefined) {
      food.nutrientsUnknown = dto.nutrientsUnknown.map((s) => s.trim()).filter(Boolean);
    }
    if (dto.source !== undefined) food.source = dto.source?.trim() || null;
    if (dto.sourceVersion !== undefined) food.sourceVersion = dto.sourceVersion?.trim() || null;
    if (dto.sourceReference !== undefined) {
      food.sourceReference = dto.sourceReference?.trim() || null;
    }
    if (dto.asDraft === true) {
      food.approvalStatus = "draft";
      food.isActive = false;
    } else if (dto.submitForReview === true) {
      food.approvalStatus = "pending";
      food.isActive = false;
    }

    if (
      dto.nutritionPer100g !== undefined ||
      dto.micronutrients !== undefined ||
      dto.composition !== undefined
    ) {
      const fromLegacy = composeTfctFromLegacy({
        nutritionPer100g: dto.nutritionPer100g,
        micronutrients: dto.micronutrients,
      });
      const fromComposition = toTfctComposition(dto.composition);
      food.nutritionPer100g = mergeClinicalComposition(
        food.nutritionPer100g ?? {},
        { ...fromLegacy, ...fromComposition },
        Array.isArray(food.nutrientsUnknown) ? food.nutrientsUnknown : [],
      );
      food.micronutrients = {};
    } else if (dto.nutrientsUnknown !== undefined) {
      // Unknown toggled without a full composition rewrite — still strip those keys.
      const next = { ...(food.nutritionPer100g ?? {}) };
      for (const key of food.nutrientsUnknown) delete next[key];
      food.nutritionPer100g = next;
    }

    await foodRepo.save(food);

    if (dto.servings) {
      await servingRepo.delete({ foodId: id });
      if (dto.servings.length) {
        await servingRepo.save(
          dto.servings.map((serving, idx) =>
            servingRepo.create({
              foodId: id,
              unit: normalizeServingUnit(serving.unit),
              amount: String(serving.amount ?? 1),
              gramsEquivalent: String(serving.gramsEquivalent),
              isDefault: serving.isDefault ?? idx === 0,
            }),
          ),
        );
      }
    }
    return this.getFood(id);
  },
};
