import { apiRequest } from '@/lib/apiClient';
import type { NutritionFood } from '@/api/nutritionDbApi';

export type RecipeIngredient = {
  id?: string;
  ingredientFoodId: string;
  name: string;
  nameRw?: string | null;
  rawWeightG: number;
  edibleWeightG?: number;
  ediblePortionFactor?: number;
  allergens?: string[];
  variantGroup?: string | null;
  isVariantDefault?: boolean;
  sortOrder?: number;
};

export type NutritionRecipe = NutritionFood & {
  isRecipe?: boolean;
  cookedYieldG: number | null;
  cookingMethod?: string | null;
  recipeVersion?: number;
  ingredientCount?: number;
  defaultServing?: { unit: string; amount: number; gramsEquivalent: number } | null;
  kcalPerServing?: number | null;
  rawTotalG?: number | null;
  rawEdibleTotalG?: number | null;
  yieldFactor?: number | null;
  retention?: Record<string, number>;
  retentionProvisional?: boolean;
  inheritedAllergens?: string[];
  energyByIngredient?: Array<{ index: number; kcal: number; edibleG: number }>;
  ingredients: RecipeIngredient[];
  perServing?: Record<string, number> | null;
};

export type RecipeIngredientInput = {
  ingredientFoodId: string;
  rawWeightG: number;
  sortOrder?: number;
  variantGroup?: string;
  isVariantDefault?: boolean;
};

export type RecipeServingInput = {
  unit: string;
  amount?: number;
  gramsEquivalent: number;
  isDefault?: boolean;
};

export type UpsertRecipePayload = {
  name: string;
  nameRw?: string;
  category?: string;
  cookedYieldG: number;
  cookingMethod?: string;
  asDraft?: boolean;
  submitForReview?: boolean;
  ingredients: RecipeIngredientInput[];
  servings?: RecipeServingInput[];
};

export type RecipePreview = {
  cookedYieldG: number;
  servingWeightG: number | null;
  cookingMethod?: string;
  totalNutrients: Record<string, number>;
  per100g: Record<string, number>;
  perServing: Record<string, number> | null;
  rawEdibleTotalG?: number;
  yieldFactor?: number | null;
  retention?: Record<string, number>;
  retentionProvisional?: boolean;
  inheritedAllergens?: string[];
  energyByIngredient?: Array<{ index: number; kcal: number; edibleG: number }>;
  ingredients: Array<{
    ingredientFoodId: string;
    name: string;
    nameRw: string | null;
    rawWeightG: number;
    edibleWeightG?: number;
    allergens?: string[];
    variantGroup?: string | null;
    isVariantDefault?: boolean;
  }>;
};

export async function fetchNutritionRecipes(q?: string) {
  const search = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiRequest<NutritionRecipe[]>(`/nutrition-db/recipes${search}`);
}

export async function fetchNutritionRecipe(id: string) {
  return apiRequest<NutritionRecipe>(`/nutrition-db/recipes/${encodeURIComponent(id)}`);
}

export async function previewNutritionRecipe(payload: {
  cookedYieldG: number;
  ingredients: RecipeIngredientInput[];
  servingWeightG?: number;
  cookingMethod?: string;
}) {
  return apiRequest<RecipePreview>('/nutrition-db/recipes/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createNutritionRecipe(payload: UpsertRecipePayload) {
  return apiRequest<NutritionRecipe>('/nutrition-db/recipes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNutritionRecipe(id: string, payload: Partial<UpsertRecipePayload>) {
  return apiRequest<NutritionRecipe>(`/nutrition-db/recipes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function submitNutritionRecipe(id: string) {
  return apiRequest<NutritionRecipe>(`/nutrition-db/recipes/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
  });
}

export async function returnNutritionRecipe(id: string) {
  return apiRequest<NutritionRecipe>(`/nutrition-db/recipes/${encodeURIComponent(id)}/return`, {
    method: 'POST',
  });
}

export async function approveNutritionRecipe(id: string) {
  return apiRequest<NutritionRecipe>(`/nutrition-db/recipes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  });
}

export async function archiveNutritionRecipe(id: string) {
  return apiRequest<{ ok: true; id: string }>(
    `/nutrition-db/recipes/${encodeURIComponent(id)}/archive`,
    { method: 'PATCH' },
  );
}
