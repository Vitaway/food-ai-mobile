import { apiRequest, getApiBaseUrl } from '@/lib/apiClient';
import { useAuthStore } from '@/features/auth/stores/authStore';

export type NutritionFood = {
  id: string;
  foodCode?: string | null;
  name: string;
  category: string;
  foodGroup?: string | null;
  foodGroupName?: string | null;
  recipeNote?: string | null;
  sourceType?: string | null;
  applicableCountries?: string | null;
  nameSw?: string | null;
  nameRw?: string | null;
  nameLocalOther?: string | null;
  brand: string | null;
  isActive: boolean;
  imageUrl: string | null;
  imageConfirmed?: boolean;
  barcode: string | null;
  packageSizeG?: number | null;
  labelSource?: string | null;
  source?: string | null;
  sourceVersion?: string | null;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  submittedByUserId?: string | null;
  verifiedByUserId?: string | null;
  /** Full TFCT per-100g panel — snake_case keys matching the spreadsheet. */
  composition?: Record<string, number>;
  /** CamelCase macros for forms / meal UI. */
  nutritionPer100g: Record<string, number>;
  /** CamelCase micros for forms. */
  micronutrients: Record<string, number>;
  servings: Array<{ id: string; unit: string; amount: number; gramsEquivalent: number; isDefault: boolean }>;
  updatedAt: string;
};

export type NutritionFoodsPage = {
  items: NutritionFood[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const NUTRITION_FOODS_PAGE_SIZE = 20;

export type UpsertNutritionFoodPayload = {
  name: string;
  category: string;
  brand?: string;
  isActive?: boolean;
  nutritionPer100g?: Record<string, number>;
  micronutrients?: Record<string, number>;
  barcode?: string;
  servings?: Array<{ unit: string; amount?: number; gramsEquivalent: number; isDefault?: boolean }>;
};

export async function fetchNutritionFoods(params?: {
  q?: string;
  category?: string;
  includeInactive?: boolean;
  approval?: 'approved' | 'pending' | 'all' | 'rejected';
  sourceType?: string;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.includeInactive) search.set('includeInactive', 'true');
  if (params?.approval) search.set('approval', params.approval);
  else if (params?.includeInactive) search.set('approval', 'all');
  if (params?.sourceType) search.set('sourceType', params.sourceType);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize));
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiRequest<NutritionFoodsPage | NutritionFood[]>(`/nutrition-db/foods${suffix}`);
}

export async function fetchNutritionFoodsPage(params?: {
  q?: string;
  category?: string;
  includeInactive?: boolean;
  approval?: 'approved' | 'pending' | 'all' | 'rejected';
  sourceType?: string;
  page?: number;
  pageSize?: number;
}): Promise<NutritionFoodsPage> {
  const result = await fetchNutritionFoods({
    ...params,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? NUTRITION_FOODS_PAGE_SIZE,
  });
  if (Array.isArray(result)) {
    return {
      items: result,
      total: result.length,
      page: 1,
      pageSize: result.length || NUTRITION_FOODS_PAGE_SIZE,
      totalPages: 1,
    };
  }
  return result;
}

export async function fetchNutritionCategories() {
  return apiRequest<string[]>('/nutrition-db/categories');
}

export async function fetchNutritionServingUnits() {
  return apiRequest<string[]>('/nutrition-db/serving-units');
}

export async function lookupNutritionBarcode(code: string) {
  return apiRequest<NutritionFood | null>(`/nutrition-db/barcode/${encodeURIComponent(code.trim())}`);
}

export async function createNutritionFood(payload: UpsertNutritionFoodPayload) {
  return apiRequest<NutritionFood>('/nutrition-db/foods', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNutritionFood(id: string, payload: Partial<UpsertNutritionFoodPayload>) {
  return apiRequest<NutritionFood>(`/nutrition-db/foods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function uploadNutritionFoodImage(foodId: string, file: File) {
  const token = useAuthStore.getState().session?.token;
  const formData = new FormData();
  formData.append('image', file);

  const base = getApiBaseUrl();
  const response = await fetch(`${base}/nutrition-db/foods/${foodId}/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: NutritionFood;
    error?: string;
  };

  if (!response.ok || body.success === false) {
    throw new Error(body.error ?? `Upload failed (${response.status})`);
  }

  return (body.data ?? body) as NutritionFood;
}
