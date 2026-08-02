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
  sourceType?: string | null;
  isRecipe?: boolean;
};

export function isNutritionRecipe(food: Pick<NutritionFoodRow, "sourceType" | "isRecipe">) {
  return food.isRecipe === true || food.sourceType === "recipe";
}

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

/** Base lexical score only (no recipe preference). */
export function scoreNutritionFoodBase(query: string, food: NutritionFoodRow): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  return Math.max(
    scoreNameMatch(trimmed, food.name, food.brand),
    food.nameSw ? scoreNameMatch(trimmed, food.nameSw, food.brand) : 0,
    food.nameRw ? scoreNameMatch(trimmed, food.nameRw, food.brand) : 0,
    food.nameLocalOther ? scoreNameMatch(trimmed, food.nameLocalOther, food.brand) : 0,
  );
}

/**
 * Dish-name matching: recipes get a modest boost once the lexical score is
 * already plausible, so a named dish beats a loosely related ingredient
 * without stealing exact ingredient matches (e.g. "beans" → beans food).
 */
const RECIPE_BOOST = 10;
const RECIPE_BOOST_MIN_BASE = 50;

export function scoreNutritionFood(query: string, food: NutritionFoodRow): number {
  const base = scoreNutritionFoodBase(query, food);
  if (base <= 0) return 0;
  if (isNutritionRecipe(food) && base >= RECIPE_BOOST_MIN_BASE) {
    return Math.min(100, base + RECIPE_BOOST);
  }
  return base;
}

const MATCH_THRESHOLD = 55;

/** Prefer recipes when scores are within this margin (after boost). */
const RECIPE_TIE_MARGIN = 2;

function isBetterMatch(
  candidate: NutritionFoodRow,
  candidateScore: number,
  current: NutritionFoodRow,
  currentScore: number,
): boolean {
  if (candidateScore > currentScore + RECIPE_TIE_MARGIN) return true;
  if (candidateScore < currentScore - RECIPE_TIE_MARGIN) return false;
  // Close scores: prefer a recipe over a plain food, else higher score.
  if (isNutritionRecipe(candidate) !== isNutritionRecipe(current)) {
    return isNutritionRecipe(candidate);
  }
  return candidateScore > currentScore;
}

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
    if (score < minScore) continue;

    if (!best || isBetterMatch(food, score, best, bestScore)) {
      best = food;
      bestScore = score;
    }
  }

  return best;
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
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      const aRecipe = isNutritionRecipe(a) ? 1 : 0;
      const bRecipe = isNutritionRecipe(b) ? 1 : 0;
      if (bRecipe !== aRecipe) return bRecipe - aRecipe;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
