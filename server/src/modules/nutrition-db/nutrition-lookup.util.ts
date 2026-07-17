export type NutritionFoodRow = {
  id: string;
  name: string;
  brand: string | null;
  nameSw?: string | null;
  nameRw?: string | null;
  nameLocalOther?: string | null;
  nutritionPer100g: Record<string, number>;
  micronutrients: Record<string, number>;
  composition?: Record<string, number>;
  servings: Array<{ unit: string; gramsEquivalent: number; isDefault: boolean }>;
};

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function scoreNameMatch(query: string, foodName: string, brand?: string | null) {
  const q = normalizeLabel(query);
  const name = normalizeLabel(foodName);
  const brandNorm = brand ? normalizeLabel(brand) : "";

  if (name === q) return 100;
  if (name.startsWith(q) || q.startsWith(name)) return 85;
  if (name.includes(q) || q.includes(name)) return 70;
  if (brandNorm && (q.includes(brandNorm) || brandNorm.includes(q))) return 60;

  const qTokens = new Set(q.split(" ").filter(Boolean));
  const nameTokens = name.split(" ").filter(Boolean);
  if (!qTokens.size || !nameTokens.length) return 0;
  const overlap = nameTokens.filter((token) => qTokens.has(token)).length;
  return Math.round((overlap / Math.max(qTokens.size, nameTokens.length)) * 55);
}

export function bestNutritionFoodMatch(query: string, foods: NutritionFoodRow[]): NutritionFoodRow | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  let best: NutritionFoodRow | null = null;
  let bestScore = 0;

  for (const food of foods) {
    const scores = [
      scoreNameMatch(trimmed, food.name, food.brand),
      food.nameSw ? scoreNameMatch(trimmed, food.nameSw, food.brand) : 0,
      food.nameRw ? scoreNameMatch(trimmed, food.nameRw, food.brand) : 0,
      food.nameLocalOther ? scoreNameMatch(trimmed, food.nameLocalOther, food.brand) : 0,
    ];
    const score = Math.max(...scores);
    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }

  return bestScore >= 45 ? best : null;
}
