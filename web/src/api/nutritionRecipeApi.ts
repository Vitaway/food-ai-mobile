import { apiRequest } from '@/lib/apiClient';
import type { NutritionFood } from '@/api/nutritionDbApi';

export type RecipeIngredient = {
  id?: string;
  ingredientFoodId: string;
  name: string;
  nameRw?: string | null;
  rawWeightG: number;
  sortOrder?: number;
};

export type NutritionRecipe = NutritionFood & {
  isRecipe?: boolean;
  cookedYieldG: number | null;
  ingredients: RecipeIngredient[];
  perServing?: Record<string, number> | null;
};

export type RecipeIngredientInput = {
  ingredientFoodId: string;
  rawWeightG: number;
  sortOrder?: number;
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
  ingredients: RecipeIngredientInput[];
  servings?: RecipeServingInput[];
};

export type RecipePreview = {
  cookedYieldG: number;
  servingWeightG: number | null;
  totalNutrients: Record<string, number>;
  per100g: Record<string, number>;
  perServing: Record<string, number> | null;
  ingredients: Array<{
    ingredientFoodId: string;
    name: string;
    nameRw: string | null;
    rawWeightG: number;
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
