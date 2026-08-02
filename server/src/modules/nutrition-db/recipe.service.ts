import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import { NutritionRecipeIngredient } from "./nutrition-recipe-ingredient.entity";
import { normalizeServingUnit } from "./serving-units.util";
import {
  calculateRecipeNutrition,
  pickTfctRecipeComposition,
} from "./recipe-yield.util";
import type { CreateRecipeDto, PreviewRecipeDto, UpdateRecipeDto } from "./recipe.dto";
import { nutritionDbService } from "./nutrition-db.service";

const foodRepo = AppDataSource.getRepository(NutritionFood);
const servingRepo = AppDataSource.getRepository(NutritionServingProfile);
const ingredientRepo = AppDataSource.getRepository(NutritionRecipeIngredient);

const RECIPE_UNITS = new Set(["cup", "plate", "bowl", "tbsp", "spoon", "piece"]);

function normalizeRecipeUnit(unit: string): string {
  const lower = unit.trim().toLowerCase();
  if (lower === "spoon") return "tbsp";
  return normalizeServingUnit(lower);
}

async function loadIngredientFoods(ids: string[]) {
  const unique = [...new Set(ids)];
  const foods = await foodRepo.find({ where: { id: In(unique) } });
  if (foods.length !== unique.length) {
    throw new BadRequestError("One or more ingredient foods were not found");
  }
  const nestedRecipe = foods.find((f) => f.sourceType === "recipe");
  if (nestedRecipe) {
    throw new BadRequestError(
      `Cannot use a recipe ("${nestedRecipe.name}") as an ingredient. Pick a single food instead.`,
    );
  }
  return new Map(foods.map((f) => [f.id, f]));
}

function kcalFromComposition(composition: Record<string, number> | null | undefined): number {
  if (!composition) return 0;
  const n = Number(composition.energy_kcal ?? composition.caloriesKcal ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function computeComposition(
  ingredients: Array<{ ingredientFoodId: string; rawWeightG: number }>,
  cookedYieldG: number,
  servingWeightG?: number,
) {
  if (cookedYieldG <= 0) throw new BadRequestError("Cooked yield weight must be greater than zero");
  if (!ingredients.length) throw new BadRequestError("Add at least one ingredient");

  const byId = await loadIngredientFoods(ingredients.map((i) => i.ingredientFoodId));
  const calc = calculateRecipeNutrition({
    ingredients: ingredients.map((ing) => {
      const food = byId.get(ing.ingredientFoodId)!;
      return {
        compositionPer100g: food.nutritionPer100g ?? {},
        rawWeightG: ing.rawWeightG,
      };
    }),
    cookedYieldG,
    servingWeightG,
  });

  return {
    ...calc,
    per100g: pickTfctRecipeComposition(calc.per100g),
    ingredients: ingredients.map((ing) => {
      const food = byId.get(ing.ingredientFoodId)!;
      return {
        ingredientFoodId: food.id,
        name: food.name,
        nameRw: food.nameRw,
        rawWeightG: ing.rawWeightG,
        compositionPer100g: food.nutritionPer100g ?? {},
      };
    }),
  };
}

async function replaceIngredients(
  recipeFoodId: string,
  ingredients: Array<{ ingredientFoodId: string; rawWeightG: number; sortOrder?: number }>,
) {
  await ingredientRepo.delete({ recipeFoodId });
  const rows = ingredients.map((ing, idx) =>
    ingredientRepo.create({
      recipeFoodId,
      ingredientFoodId: ing.ingredientFoodId,
      rawWeightG: String(ing.rawWeightG),
      sortOrder: ing.sortOrder ?? idx,
    }),
  );
  await ingredientRepo.save(rows);
}

async function replaceServings(
  foodId: string,
  servings: Array<{ unit: string; amount?: number; gramsEquivalent: number; isDefault?: boolean }>,
) {
  await servingRepo.delete({ foodId });
  if (!servings.length) return;
  const payload = servings.map((serving, idx) => {
    const unit = normalizeRecipeUnit(serving.unit);
    if (!RECIPE_UNITS.has(unit) && unit !== "serving" && unit !== "portion" && unit !== "g") {
      // Allow cup/plate/bowl/tbsp/piece primarily; still accept normalized household units.
    }
    return servingRepo.create({
      foodId,
      unit,
      amount: String(serving.amount ?? 1),
      gramsEquivalent: String(serving.gramsEquivalent),
      isDefault: serving.isDefault ?? idx === 0,
    });
  });
  await servingRepo.save(payload);
}

async function mapRecipe(food: NutritionFood) {
  const base = await nutritionDbService.getFood(food.id);
  const ingredientRows = await ingredientRepo.find({
    where: { recipeFoodId: food.id },
    order: { sortOrder: "ASC" },
  });
  const ingredientFoods = ingredientRows.length
    ? await foodRepo.find({
        where: { id: In(ingredientRows.map((r) => r.ingredientFoodId)) },
      })
    : [];
  const byId = new Map(ingredientFoods.map((f) => [f.id, f]));

  const cookedYieldG = food.cookedYieldG != null ? Number(food.cookedYieldG) : null;
  const defaultServing = base.servings.find((s) => s.isDefault) ?? base.servings[0];
  const servingWeightG = defaultServing?.gramsEquivalent ?? undefined;

  let perServing: Record<string, number> | null = null;
  if (cookedYieldG && cookedYieldG > 0 && ingredientRows.length) {
    const preview = await computeComposition(
      ingredientRows.map((r) => ({
        ingredientFoodId: r.ingredientFoodId,
        rawWeightG: Number(r.rawWeightG),
      })),
      cookedYieldG,
      servingWeightG,
    );
    perServing = preview.perServing;
  }

  const kcalPer100 =
    perServing != null && servingWeightG
      ? null
      : kcalFromComposition(food.nutritionPer100g);
  const kcalPerServing =
    perServing != null
      ? Number(perServing.energy_kcal ?? perServing.caloriesKcal ?? 0) ||
        (servingWeightG
          ? Math.round((kcalFromComposition(food.nutritionPer100g) * servingWeightG) / 100)
          : null)
      : servingWeightG
        ? Math.round((kcalFromComposition(food.nutritionPer100g) * servingWeightG) / 100)
        : kcalPer100;

  const rawTotalG = ingredientRows.reduce((sum, row) => sum + Number(row.rawWeightG || 0), 0);
  const yieldFactor =
    cookedYieldG && cookedYieldG > 0 && rawTotalG > 0
      ? Math.round((cookedYieldG / rawTotalG) * 1000) / 1000
      : null;

  return {
    ...base,
    cookedYieldG,
    isRecipe: true,
    ingredientCount: ingredientRows.length,
    defaultServing: defaultServing
      ? {
          unit: defaultServing.unit,
          amount: defaultServing.amount,
          gramsEquivalent: defaultServing.gramsEquivalent,
        }
      : null,
    kcalPerServing: kcalPerServing != null && Number.isFinite(kcalPerServing) ? kcalPerServing : null,
    rawTotalG: Math.round(rawTotalG * 100) / 100,
    yieldFactor,
    ingredients: ingredientRows.map((row) => {
      const ing = byId.get(row.ingredientFoodId);
      return {
        id: row.id,
        ingredientFoodId: row.ingredientFoodId,
        name: ing?.name ?? "Unknown",
        nameRw: ing?.nameRw ?? null,
        rawWeightG: Number(row.rawWeightG),
        sortOrder: row.sortOrder,
      };
    }),
    perServing,
  };
}

export const recipeService = {
  async listRecipes(query?: string) {
    const qb = foodRepo
      .createQueryBuilder("food")
      .where("food.source_type = :source", { source: "recipe" })
      .andWhere("food.is_active = true")
      .orderBy("food.name", "ASC");
    if (query?.trim()) {
      const q = `%${query.trim().toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(food.name) LIKE :q OR LOWER(COALESCE(food.name_rw, '')) LIKE :q)",
        { q },
      );
    }
    const foods = await qb.getMany();
    return Promise.all(foods.map((f) => mapRecipe(f)));
  },

  async getRecipe(id: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    return mapRecipe(food);
  },

  async preview(dto: PreviewRecipeDto) {
    const result = await computeComposition(dto.ingredients, dto.cookedYieldG, dto.servingWeightG);
    return {
      cookedYieldG: dto.cookedYieldG,
      servingWeightG: dto.servingWeightG ?? null,
      totalNutrients: result.totalNutrients,
      per100g: result.per100g,
      perServing: result.perServing,
      ingredients: result.ingredients.map(({ ingredientFoodId, name, nameRw, rawWeightG }) => ({
        ingredientFoodId,
        name,
        nameRw,
        rawWeightG,
      })),
    };
  },

  async createRecipe(dto: CreateRecipeDto, submittedByUserId?: string) {
    const computed = await computeComposition(dto.ingredients, dto.cookedYieldG);
    const food = foodRepo.create({
      name: dto.name.trim(),
      nameRw: dto.nameRw?.trim() || null,
      category: (dto.category?.trim() || "Traditional dishes").trim(),
      brand: null,
      isActive: true,
      approvalStatus: "approved",
      submittedByUserId: submittedByUserId ?? null,
      sourceType: "recipe",
      nutritionPer100g: computed.per100g,
      micronutrients: {},
      cookedYieldG: String(dto.cookedYieldG),
      barcode: null,
    });
    await foodRepo.save(food);
    await replaceIngredients(food.id, dto.ingredients);
    if (dto.servings?.length) {
      await replaceServings(food.id, dto.servings);
    } else {
      await replaceServings(food.id, [
        { unit: "cup", amount: 1, gramsEquivalent: 250, isDefault: true },
      ]);
    }
    return this.getRecipe(food.id);
  },

  async updateRecipe(id: string, dto: UpdateRecipeDto) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");

    if (dto.name != null) food.name = dto.name.trim();
    if (dto.nameRw !== undefined) food.nameRw = dto.nameRw?.trim() || null;
    if (dto.category != null) food.category = dto.category.trim();

    const existingIngredients = await ingredientRepo.find({
      where: { recipeFoodId: id },
      order: { sortOrder: "ASC" },
    });
    const ingredients =
      dto.ingredients ??
      existingIngredients.map((r) => ({
        ingredientFoodId: r.ingredientFoodId,
        rawWeightG: Number(r.rawWeightG),
        sortOrder: r.sortOrder,
      }));
    const cookedYieldG =
      dto.cookedYieldG != null ? dto.cookedYieldG : Number(food.cookedYieldG ?? 0);

    const computed = await computeComposition(ingredients, cookedYieldG);
    food.cookedYieldG = String(cookedYieldG);
    food.nutritionPer100g = computed.per100g;
    await foodRepo.save(food);

    if (dto.ingredients) {
      await replaceIngredients(id, dto.ingredients);
    }
    if (dto.servings) {
      await replaceServings(id, dto.servings);
    }
    return this.getRecipe(id);
  },

  async archiveRecipe(id: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    food.isActive = false;
    await foodRepo.save(food);
    return { ok: true as const, id: food.id };
  },
};
