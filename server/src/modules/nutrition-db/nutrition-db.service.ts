import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { NotFoundError } from "routing-controllers";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import type { CreateNutritionFoodDto, UpdateNutritionFoodDto } from "./nutrition-db.dto";
import { SERVING_UNITS } from "./serving-units.util";
import { bestNutritionFoodMatch } from "./nutrition-lookup.util";

const foodRepo = AppDataSource.getRepository(NutritionFood);
const servingRepo = AppDataSource.getRepository(NutritionServingProfile);

function normalizeServing(serving: NutritionServingProfile) {
  return {
    id: serving.id,
    unit: serving.unit,
    amount: Number(serving.amount),
    gramsEquivalent: Number(serving.gramsEquivalent),
    isDefault: serving.isDefault,
  };
}

function mapFood(food: NutritionFood, servings: NutritionServingProfile[]) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    brand: food.brand,
    isActive: food.isActive,
    imageUrl: food.imageUrl,
    barcode: food.barcode,
    approvalStatus: food.approvalStatus ?? "approved",
    submittedByUserId: food.submittedByUserId,
    verifiedByUserId: food.verifiedByUserId,
    nutritionPer100g: food.nutritionPer100g ?? {},
    micronutrients: food.micronutrients ?? {},
    servings: servings.map(normalizeServing),
    updatedAt: food.updatedAt.toISOString(),
  };
}

export const nutritionDbService = {
  listCategories() {
    return [
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
  },

  listServingUnits() {
    return SERVING_UNITS;
  },

  async listFoods(
    query?: string,
    category?: string,
    includeInactive = false,
    approvalFilter: "approved" | "pending" | "all" = "approved",
    page?: number,
    pageSize?: number,
  ) {
    const qb = foodRepo.createQueryBuilder("food").orderBy("food.updated_at", "DESC");
    if (!includeInactive) {
      qb.andWhere("food.is_active = true");
    }
    if (approvalFilter === "approved") {
      qb.andWhere("food.approval_status = 'approved'");
    } else if (approvalFilter === "pending") {
      qb.andWhere("food.approval_status = 'pending'");
    }
    if (query?.trim()) {
      qb.andWhere("(food.name ILIKE :q OR food.brand ILIKE :q)", { q: `%${query.trim()}%` });
    }
    if (category?.trim()) {
      qb.andWhere("food.category = :category", { category: category.trim() });
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
    const food = foodRepo.create({
      name: dto.name.trim(),
      category: dto.category.trim(),
      brand: dto.brand?.trim() || null,
      isActive: coachSubmitted ? false : true,
      approvalStatus: coachSubmitted ? "pending" : "approved",
      submittedByUserId: submittedByUserId ?? null,
      nutritionPer100g: dto.nutritionPer100g ?? {},
      micronutrients: dto.micronutrients ?? {},
      barcode: dto.barcode?.trim() || null,
    });
    await foodRepo.save(food);
    if (dto.servings?.length) {
      const payload = dto.servings.map((serving, idx) =>
        servingRepo.create({
          foodId: food.id,
          unit: serving.unit.trim().toLowerCase(),
          amount: String(serving.amount ?? 1),
          gramsEquivalent: String(serving.gramsEquivalent),
          isDefault: serving.isDefault ?? idx === 0,
        }),
      );
      await servingRepo.save(payload);
    }
    const created = await this.listFoods(food.name, undefined, true, "all");
    const items = Array.isArray(created) ? created : created.items;
    return items[0];
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
    if (dto.nutritionPer100g !== undefined) food.nutritionPer100g = dto.nutritionPer100g;
    if (dto.micronutrients !== undefined) food.micronutrients = dto.micronutrients;
    if (dto.barcode !== undefined) food.barcode = dto.barcode?.trim() || null;
    await foodRepo.save(food);

    if (dto.servings) {
      await servingRepo.delete({ foodId: id });
      if (dto.servings.length) {
        await servingRepo.save(
          dto.servings.map((serving, idx) =>
            servingRepo.create({
              foodId: id,
              unit: serving.unit.trim().toLowerCase(),
              amount: String(serving.amount ?? 1),
              gramsEquivalent: String(serving.gramsEquivalent),
              isDefault: serving.isDefault ?? idx === 0,
            }),
          ),
        );
      }
    }
    const rows = await this.listFoods(food.name, undefined, true, "all");
    const items = Array.isArray(rows) ? rows : rows.items;
    return items.find((row) => row.id === id) ?? null;
  },
};
