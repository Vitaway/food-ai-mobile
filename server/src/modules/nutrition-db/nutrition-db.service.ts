import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { NotFoundError } from "routing-controllers";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import type { CreateNutritionFoodDto, UpdateNutritionFoodDto } from "./nutrition-db.dto";
import { SERVING_UNITS, normalizeServingUnit } from "./serving-units.util";
import { bestNutritionFoodMatch } from "./nutrition-lookup.util";
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
  return {
    id: food.id,
    foodCode: food.foodCode,
    name: food.name,
    category: food.category,
    foodGroup: food.foodGroup,
    foodGroupName: food.foodGroupName,
    recipeNote: food.recipeNote,
    sourceType: food.sourceType,
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
    source: food.source,
    sourceVersion: food.sourceVersion,
    approvalStatus: food.approvalStatus ?? "approved",
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
    approvalFilter: "approved" | "pending" | "rejected" | "all" = "approved",
    page?: number,
    pageSize?: number,
    sourceType?: string,
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
    }
    if (query?.trim()) {
      qb.andWhere(
        `(food.name ILIKE :q OR food.brand ILIKE :q OR food.name_sw ILIKE :q
          OR food.name_rw ILIKE :q OR food.name_local_other ILIKE :q
          OR food.food_code ILIKE :q OR food.barcode ILIKE :q)`,
        { q: `%${query.trim()}%` },
      );
    }
    if (category?.trim()) {
      qb.andWhere("(food.category = :category OR food.food_group_name = :category)", {
        category: category.trim(),
      });
    }
    if (sourceType?.trim()) {
      qb.andWhere("food.source_type = :sourceType", { sourceType: sourceType.trim() });
    }

    const paginate = page != null || pageSize != null;
    const safePage = Math.max(1, page ?? 1);
    const safePageSize = Math.min(100, Math.max(1, pageSize ?? 20));

    const total = await qb.getCount();

    if (paginate) {
      qb.skip((safePage - 1) * safePageSize).take(safePageSize);
    } else {
      qb.take(200);
    }

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
    const items = foods.map((food) => mapFood(food, servingsByFood.get(food.id) ?? []));

    if (!paginate) {
      return items;
    }

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  },

  async getFood(id: string) {
    const food = await foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundError("Nutrition food not found");
    const servings = await servingRepo.find({ where: { foodId: id }, order: { isDefault: "DESC" } });
    return mapFood(food, servings);
  },

  async lookupByName(name: string) {
    const foods = await this.listFoods(name.trim(), undefined, true);
    const items = Array.isArray(foods) ? foods : foods.items;
    return bestNutritionFoodMatch(name, items);
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
    const merged = { ...composition, ...fromComposition };

    const food = foodRepo.create({
      name: dto.name.trim(),
      category: dto.category.trim(),
      brand: dto.brand?.trim() || null,
      isActive: coachSubmitted ? false : true,
      approvalStatus: coachSubmitted ? "pending" : "approved",
      submittedByUserId: submittedByUserId ?? null,
      nutritionPer100g: merged,
      micronutrients: {},
      barcode: dto.barcode?.trim() || null,
      sourceType: dto.sourceType?.trim() || (coachSubmitted ? "custom_local" : "custom_local"),
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

    if (
      dto.nutritionPer100g !== undefined ||
      dto.micronutrients !== undefined ||
      dto.composition !== undefined
    ) {
      const base = { ...(food.nutritionPer100g ?? {}) };
      const fromLegacy = composeTfctFromLegacy({
        nutritionPer100g: dto.nutritionPer100g,
        micronutrients: dto.micronutrients,
      });
      const fromComposition = toTfctComposition(dto.composition);
      food.nutritionPer100g = { ...base, ...fromLegacy, ...fromComposition };
      food.micronutrients = {};
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
