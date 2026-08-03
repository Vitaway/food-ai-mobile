import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { NutritionFood } from "./nutrition-food.entity";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";
import { NutritionRecipeIngredient } from "./nutrition-recipe-ingredient.entity";
import { normalizeServingUnit } from "./serving-units.util";
import {
  calculateRecipeNutrition,
  edibleWeightG,
  pickTfctRecipeComposition,
} from "./recipe-yield.util";
import { RETENTION_PROVISIONAL, retentionForMethod } from "./retention.util";
import type { CreateRecipeDto, PreviewRecipeDto, UpdateRecipeDto, RecipeIngredientDto } from "./recipe.dto";
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

function includeLine(ing: {
  variantGroup?: string | null;
  isVariantDefault?: boolean | null;
}): boolean {
  if (!ing.variantGroup) return true;
  return Boolean(ing.isVariantDefault);
}

async function computeComposition(
  ingredients: RecipeIngredientDto[],
  cookedYieldG: number,
  servingWeightG?: number,
  cookingMethod?: string | null,
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
        ediblePortionFactor:
          food.ediblePortionFactor != null ? Number(food.ediblePortionFactor) : 1,
        includeInComposition: includeLine(ing),
      };
    }),
    cookedYieldG,
    servingWeightG,
    cookingMethod,
  });

  const inheritedAllergens = [
    ...new Set(
      ingredients
        .filter((ing) => includeLine(ing))
        .flatMap((ing) => {
          const food = byId.get(ing.ingredientFoodId)!;
          return Array.isArray(food.allergens) ? food.allergens : [];
        }),
    ),
  ];

  return {
    ...calc,
    per100g: pickTfctRecipeComposition(calc.per100g),
    retention: retentionForMethod(cookingMethod),
    retentionProvisional: RETENTION_PROVISIONAL,
    inheritedAllergens,
    ingredients: ingredients.map((ing) => {
      const food = byId.get(ing.ingredientFoodId)!;
      const epf = food.ediblePortionFactor != null ? Number(food.ediblePortionFactor) : 1;
      return {
        ingredientFoodId: food.id,
        name: food.name,
        nameRw: food.nameRw,
        rawWeightG: ing.rawWeightG,
        edibleWeightG: edibleWeightG(ing.rawWeightG, epf),
        ediblePortionFactor: epf,
        allergens: Array.isArray(food.allergens) ? food.allergens : [],
        variantGroup: ing.variantGroup ?? null,
        isVariantDefault: ing.isVariantDefault ?? true,
        compositionPer100g: food.nutritionPer100g ?? {},
      };
    }),
  };
}

async function replaceIngredients(recipeFoodId: string, ingredients: RecipeIngredientDto[]) {
  await ingredientRepo.delete({ recipeFoodId });
  const rows = ingredients.map((ing, idx) =>
    ingredientRepo.create({
      recipeFoodId,
      ingredientFoodId: ing.ingredientFoodId,
      rawWeightG: String(ing.rawWeightG),
      sortOrder: ing.sortOrder ?? idx,
      variantGroup: ing.variantGroup?.trim() || null,
      isVariantDefault: ing.isVariantDefault ?? true,
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
    void RECIPE_UNITS;
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

function freezeSnapshot(
  food: NutritionFood,
  computed: Awaited<ReturnType<typeof computeComposition>>,
  ingredients: RecipeIngredientDto[],
) {
  return {
    version: food.recipeVersion ?? 1,
    frozenAt: new Date().toISOString(),
    cookingMethod: food.cookingMethod,
    cookedYieldG: food.cookedYieldG != null ? Number(food.cookedYieldG) : null,
    per100g: computed.per100g,
    ingredients: ingredients.map((ing) => ({
      ingredientFoodId: ing.ingredientFoodId,
      rawWeightG: ing.rawWeightG,
      variantGroup: ing.variantGroup ?? null,
      isVariantDefault: ing.isVariantDefault ?? true,
    })),
    inheritedAllergens: computed.inheritedAllergens,
  };
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
  const dtoLines: RecipeIngredientDto[] = ingredientRows.map((r) => ({
    ingredientFoodId: r.ingredientFoodId,
    rawWeightG: Number(r.rawWeightG),
    sortOrder: r.sortOrder,
    variantGroup: r.variantGroup ?? undefined,
    isVariantDefault: r.isVariantDefault,
  }));

  let preview: Awaited<ReturnType<typeof computeComposition>> | null = null;
  if (cookedYieldG && cookedYieldG > 0 && ingredientRows.length) {
    preview = await computeComposition(
      dtoLines,
      cookedYieldG,
      servingWeightG,
      food.cookingMethod,
    );
  }

  const perServing = preview?.perServing ?? null;
  const kcalPerServing =
    perServing != null
      ? Number(perServing.energy_kcal ?? perServing.caloriesKcal ?? 0) || null
      : servingWeightG
        ? Math.round((kcalFromComposition(food.nutritionPer100g) * servingWeightG) / 100)
        : null;

  return {
    ...base,
    cookedYieldG,
    cookingMethod: food.cookingMethod ?? "Raw",
    recipeVersion: food.recipeVersion ?? 1,
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
    rawEdibleTotalG: preview?.rawEdibleTotalG ?? null,
    yieldFactor: preview?.yieldFactor ?? null,
    retention: preview?.retention ?? retentionForMethod(food.cookingMethod),
    retentionProvisional: RETENTION_PROVISIONAL,
    inheritedAllergens: preview?.inheritedAllergens ?? [],
    energyByIngredient: preview?.energyByIngredient ?? [],
    ingredients: ingredientRows.map((row) => {
      const ing = byId.get(row.ingredientFoodId);
      const epf = ing?.ediblePortionFactor != null ? Number(ing.ediblePortionFactor) : 1;
      const raw = Number(row.rawWeightG);
      return {
        id: row.id,
        ingredientFoodId: row.ingredientFoodId,
        name: ing?.name ?? "Unknown",
        nameRw: ing?.nameRw ?? null,
        rawWeightG: raw,
        edibleWeightG: edibleWeightG(raw, epf),
        ediblePortionFactor: epf,
        allergens: Array.isArray(ing?.allergens) ? ing!.allergens : [],
        variantGroup: row.variantGroup,
        isVariantDefault: row.isVariantDefault,
        sortOrder: row.sortOrder,
      };
    }),
    perServing,
  };
}

export const recipeService = {
  async listRecipes(query?: string, approval?: "approved" | "pending" | "draft" | "all") {
    const qb = foodRepo
      .createQueryBuilder("food")
      .where("food.source_type = :source", { source: "recipe" })
      .orderBy("food.name", "ASC");
    if (approval === "all" || approval == null) {
      // coach/admin see active + drafts/pending when listing; default active approved-ish
      qb.andWhere("(food.is_active = true OR food.approval_status IN ('draft','pending'))");
    } else if (approval === "approved") {
      qb.andWhere("food.is_active = true").andWhere("food.approval_status = 'approved'");
    } else {
      qb.andWhere("food.approval_status = :approval", { approval });
    }
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

  async listPendingRecipes() {
    const foods = await foodRepo.find({
      where: { sourceType: "recipe", approvalStatus: "pending" },
      order: { updatedAt: "DESC" },
    });
    return Promise.all(foods.map((f) => mapRecipe(f)));
  },

  async getRecipe(id: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    return mapRecipe(food);
  },

  async preview(dto: PreviewRecipeDto) {
    const result = await computeComposition(
      dto.ingredients,
      dto.cookedYieldG,
      dto.servingWeightG,
      dto.cookingMethod,
    );
    return {
      cookedYieldG: dto.cookedYieldG,
      servingWeightG: dto.servingWeightG ?? null,
      cookingMethod: dto.cookingMethod ?? "Raw",
      totalNutrients: result.totalNutrients,
      per100g: result.per100g,
      perServing: result.perServing,
      rawEdibleTotalG: result.rawEdibleTotalG,
      yieldFactor: result.yieldFactor,
      retention: result.retention,
      retentionProvisional: result.retentionProvisional,
      inheritedAllergens: result.inheritedAllergens,
      energyByIngredient: result.energyByIngredient,
      ingredients: result.ingredients.map(
        ({
          ingredientFoodId,
          name,
          nameRw,
          rawWeightG,
          edibleWeightG: edibleG,
          allergens,
          variantGroup,
          isVariantDefault,
        }) => ({
          ingredientFoodId,
          name,
          nameRw,
          rawWeightG,
          edibleWeightG: edibleG,
          allergens,
          variantGroup,
          isVariantDefault,
        }),
      ),
    };
  },

  async createRecipe(dto: CreateRecipeDto, submittedByUserId?: string) {
    const computed = await computeComposition(
      dto.ingredients,
      dto.cookedYieldG,
      undefined,
      dto.cookingMethod,
    );
    const submit = dto.submitForReview === true;
    const draft = dto.asDraft === true || !submit;
    const food = foodRepo.create({
      name: dto.name.trim(),
      nameRw: dto.nameRw?.trim() || null,
      category: (dto.category?.trim() || "Traditional dishes").trim(),
      brand: null,
      isActive: !draft && !submit ? true : false,
      approvalStatus: submit ? "pending" : draft ? "draft" : "approved",
      submittedByUserId: submittedByUserId ?? null,
      sourceType: "recipe",
      nutritionPer100g: computed.per100g,
      micronutrients: {},
      cookedYieldG: String(dto.cookedYieldG),
      cookingMethod: dto.cookingMethod?.trim() || "Raw",
      allergens: computed.inheritedAllergens,
      recipeVersion: 1,
      barcode: null,
    });
    // Admin path: neither asDraft nor submitForReview → publish immediately
    if (dto.asDraft !== true && dto.submitForReview !== true) {
      food.isActive = true;
      food.approvalStatus = "approved";
      food.frozenSnapshot = freezeSnapshot(food, computed, dto.ingredients);
      food.recipeVersion = 1;
    } else if (submit) {
      // Freeze once on submit-for-review create (caller must not also call /submit).
      food.frozenSnapshot = freezeSnapshot(food, computed, dto.ingredients);
      food.recipeVersion = 1;
    }
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
    if (dto.cookingMethod !== undefined) {
      food.cookingMethod = dto.cookingMethod?.trim() || "Raw";
    }

    const existingIngredients = await ingredientRepo.find({
      where: { recipeFoodId: id },
      order: { sortOrder: "ASC" },
    });
    const ingredients: RecipeIngredientDto[] =
      dto.ingredients ??
      existingIngredients.map((r) => ({
        ingredientFoodId: r.ingredientFoodId,
        rawWeightG: Number(r.rawWeightG),
        sortOrder: r.sortOrder,
        variantGroup: r.variantGroup ?? undefined,
        isVariantDefault: r.isVariantDefault,
      }));
    const cookedYieldG =
      dto.cookedYieldG != null ? dto.cookedYieldG : Number(food.cookedYieldG ?? 0);

    const computed = await computeComposition(
      ingredients,
      cookedYieldG,
      undefined,
      food.cookingMethod,
    );
    food.cookedYieldG = String(cookedYieldG);
    food.nutritionPer100g = computed.per100g;
    food.allergens = computed.inheritedAllergens;

    if (dto.asDraft === true) {
      food.approvalStatus = "draft";
      food.isActive = false;
    } else if (dto.submitForReview === true) {
      food.approvalStatus = "pending";
      food.isActive = false;
      // Bump only on re-submit after a prior freeze; first submit stays v1.
      if (food.frozenSnapshot) {
        food.recipeVersion = (food.recipeVersion ?? 1) + 1;
      } else {
        food.recipeVersion = food.recipeVersion || 1;
      }
      food.frozenSnapshot = freezeSnapshot(food, computed, ingredients);
    }

    await foodRepo.save(food);

    if (dto.ingredients) {
      await replaceIngredients(id, dto.ingredients);
    }
    if (dto.servings) {
      await replaceServings(id, dto.servings);
    }
    return this.getRecipe(id);
  },

  async submitRecipe(id: string, userId: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    const ingredients = await ingredientRepo.find({
      where: { recipeFoodId: id },
      order: { sortOrder: "ASC" },
    });
    const dtoLines: RecipeIngredientDto[] = ingredients.map((r) => ({
      ingredientFoodId: r.ingredientFoodId,
      rawWeightG: Number(r.rawWeightG),
      sortOrder: r.sortOrder,
      variantGroup: r.variantGroup ?? undefined,
      isVariantDefault: r.isVariantDefault,
    }));
    const cooked = Number(food.cookedYieldG ?? 0);
    const computed = await computeComposition(dtoLines, cooked, undefined, food.cookingMethod);
    food.approvalStatus = "pending";
    food.isActive = false;
    food.submittedByUserId = userId;
    if (food.frozenSnapshot) {
      food.recipeVersion = (food.recipeVersion ?? 1) + 1;
    } else {
      food.recipeVersion = food.recipeVersion || 1;
    }
    food.frozenSnapshot = freezeSnapshot(food, computed, dtoLines);
    food.nutritionPer100g = computed.per100g;
    food.allergens = computed.inheritedAllergens;
    await foodRepo.save(food);
    return this.getRecipe(id);
  },

  async returnRecipeToDraft(id: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    food.approvalStatus = "draft";
    food.isActive = false;
    await foodRepo.save(food);
    return this.getRecipe(id);
  },

  async approveRecipe(id: string, adminUserId: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    food.approvalStatus = "approved";
    food.isActive = true;
    food.verifiedByUserId = adminUserId;
    await foodRepo.save(food);
    return this.getRecipe(id);
  },

  async archiveRecipe(id: string) {
    const food = await foodRepo.findOne({ where: { id, sourceType: "recipe" } });
    if (!food) throw new NotFoundError("Recipe not found");
    food.isActive = false;
    await foodRepo.save(food);
    return { ok: true as const, id: food.id };
  },

  async reviewQueue() {
    const [pendingFoods, pendingRecipes] = await Promise.all([
      nutritionDbService.listPendingFoods(),
      this.listPendingRecipes(),
    ]);
    return {
      foods: pendingFoods,
      recipes: pendingRecipes,
      total: pendingFoods.length + pendingRecipes.length,
    };
  },
};
