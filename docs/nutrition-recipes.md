# Nutrition DB recipes (Phase 1)

Recipes are first-class entries in the nutrition database: a dish is stored as a `nutrition_foods` row with `source_type = 'recipe'`, plus ingredient links and cooked-yield composition.

## Model

```
nutrition_foods (source_type='recipe', cooked_yield_g, nutrition_per100g)
  ├── nutrition_serving_profiles (cup / plate / bowl / …)
  └── nutrition_recipe_ingredients
         └── ingredient_food_id → nutrition_foods (TFCT / packaged / custom; not recipes)
```

**Composition pipeline** (see `server/.../recipe-yield.util.ts`):

1. Sum nutrients from each ingredient’s per-100g × raw weight (g)
2. Divide by cooked yield weight → per-gram of cooked dish
3. ×100 → store as recipe `nutrition_per100g`
4. × default serving grams → per-serving preview

## Surfaces

| Surface | Behavior |
|---------|----------|
| Coach **Nutrition DB → Foods** | Lists non-recipe foods only (`excludeSourceTypes=recipe`) |
| Coach **Nutrition DB → Recipes** | Create / edit / archive dishes; multi-servings; yield strip |
| Coach meal review **Food DB picker** | Can select a recipe as a meal line; shows **Recipe** badge |
| Recipe ingredient picker | Excludes recipes (no nesting) |
| Admin Food DB | **Foods \| Recipes** tabs (recipes are not buried in TFCT pagination) |
| Vision / mobile log | `lookupByName` merges general + recipe candidates (active/approved only), then recipe-aware scoring prefers dishes when labels match |

## API (coach / admin / data entry)

- `GET /nutrition-db/recipes?q=`
- `GET /nutrition-db/recipes/:id`
- `POST /nutrition-db/recipes/preview`
- `POST /nutrition-db/recipes`
- `PATCH /nutrition-db/recipes/:id`
- `PATCH /nutrition-db/recipes/:id/archive`
- `GET /nutrition-db/foods?excludeSourceTypes=recipe` (Foods tab)

## Verification checklist

1. Create a recipe (e.g. Isombe) from TFCT ingredients → preview kcal/serving → save.
2. Recipe appears on **Recipes** tab only; Foods tab has no recipe rows.
3. In meal review, pick the recipe from Food DB → **Recipe** badge shows; nutrition scales with serving.
4. In New recipe modal, Food DB search does not list other recipes as ingredients.
5. Archive recipe → disappears from Recipes list and active pickers (and no longer matches vision lookup).
6. Admin Food DB → filter Source = Recipes → recipe rows with badge.
7. Log a meal whose AI label matches a recipe name (e.g. Isombe) → enriched item uses the recipe `nutritionFoodId` and cooked composition, not a loose ingredient.

## Detection matching notes

- Archived / inactive / non-approved foods are excluded from `lookupByName`.
- A parallel `sourceType=recipe` search ensures dishes are not crowded out of the TFCT candidate window.
- Recipes get a modest score boost once the lexical match is already plausible; exact ingredient queries still win over loosely related recipes.

## Rich clinical layer (Phases A–C)

- Foods: prep state, EPF, synonyms, allergens, unknown nutrients (`?`), Atwater check, draft → submit → verified.
- Recipes: edible = raw × EPF, cooking-method retention (provisional), energy strip, salt gate, allergen inheritance, version freeze on submit.
- **Nutrition review** queue at `/coach/nutrition-review` and `/admin/nutrition-review`.

## Meal plans

See [meal-plans-design.md](./meal-plans-design.md) (Phase D; after the food DB is trustworthy).
