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
  servings: Array<{ unit: string; amount: number; gramsEquivalent: number; isDefault: boolean }>;
};

export function normalizeSearchLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function tokenize(value: string) {
  return normalizeSearchLabel(value).split(" ").filter(Boolean);
}

/** Higher is better. Exact/prefix/token overlap across names and brand. */
export function scoreNameMatch(query: string, foodName: string, brand?: string | null) {
  const q = normalizeSearchLabel(query);
  const name = normalizeSearchLabel(foodName);
  const brandNorm = brand ? normalizeSearchLabel(brand) : "";
  if (!q || !name) return 0;

  if (name === q) return 100;
  if (name.startsWith(q) || q.startsWith(name)) return 90;
  if (name.includes(q)) return 78;
  if (q.includes(name) && name.length >= 3) return 72;
  if (brandNorm && (brandNorm === q || brandNorm.includes(q) || q.includes(brandNorm))) return 65;

  const qTokens = tokenize(query);
  const nameTokens = tokenize(foodName);
  if (!qTokens.length || !nameTokens.length) return 0;

  const nameSet = new Set(nameTokens);
  const exactHits = qTokens.filter((token) => nameSet.has(token)).length;
  const prefixHits = qTokens.filter((token) =>
    nameTokens.some((nt) => nt.startsWith(token) || token.startsWith(nt)),
  ).length;
  const coverage = exactHits / qTokens.length;
  const density = exactHits / nameTokens.length;

  let score = Math.round(coverage * 50 + density * 20 + (prefixHits > exactHits ? 8 : 0));
  if (exactHits === qTokens.length && qTokens.length > 1) score = Math.max(score, 82);
  return Math.min(95, score);
}

export function scoreNutritionFood(query: string, food: NutritionFoodRow): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  return Math.max(
    scoreNameMatch(trimmed, food.name, food.brand),
    food.nameSw ? scoreNameMatch(trimmed, food.nameSw, food.brand) : 0,
    food.nameRw ? scoreNameMatch(trimmed, food.nameRw, food.brand) : 0,
    food.nameLocalOther ? scoreNameMatch(trimmed, food.nameLocalOther, food.brand) : 0,
  );
}

const MATCH_THRESHOLD = 55;

export function bestNutritionFoodMatch(
  query: string,
  foods: NutritionFoodRow[],
  minScore = MATCH_THRESHOLD,
): NutritionFoodRow | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  let best: NutritionFoodRow | null = null;
  let bestScore = 0;

  for (const food of foods) {
    const score = scoreNutritionFood(trimmed, food);
    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }

  return bestScore >= minScore ? best : null;
}

export function rankNutritionFoods(
  query: string,
  foods: NutritionFoodRow[],
  limit = 20,
): Array<NutritionFoodRow & { matchScore: number }> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return foods
    .map((food) => ({ ...food, matchScore: scoreNutritionFood(trimmed, food) }))
    .filter((food) => food.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
    .slice(0, limit);
}
