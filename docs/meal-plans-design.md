# Meal plans (Phase D) — product design

Meal plans were **out of scope** in the nutrition DB HTML prototype (`Clients` / `Meal plans` nav stubs). This note defines how we build them **after** foods and recipes are clinically trustworthy (Phases A–C).

## Goal

Let coaches assemble **verified** foods and recipes into day/week plans that hit clinical targets (energy, protein, sodium, allergens) for a client or cohort — without inventing nutrition on the fly.

## Principles

1. **Verified only** — plan lines may only reference `approval_status = approved` + `is_active` foods/recipes.
2. **Compose, don’t recalculate** — use frozen recipe snapshots / food per-100g + serving grams; never re-open draft math inside a published plan.
3. **Allergen-safe** — inherit food/recipe allergens; block or warn when a client allergy matches.
4. **EPF + retention already baked in** — plans consume cooked dish profiles from the recipe engine; they do not re-apply cooking methods.
5. **Version the plan** — editing a published plan bumps version; assigned clients keep the version they were given until reassigned.

## Proposed model

```
meal_plans
  id, name, name_rw, owner_coach_id, status (draft|published|archived)
  version, clinical_notes, target_kcal_day, target_sodium_mg_day
  created_at, updated_at

meal_plan_days
  id, plan_id, day_index (0–6 or absolute date for client instances)

meal_plan_slots
  id, day_id, meal_label (breakfast|lunch|dinner|snack)
  sort_order

meal_plan_items
  id, slot_id, nutrition_food_id (food or recipe)
  serving_unit, serving_amount, grams
  frozen_nutrition_per_serving jsonb  -- snapshot at add/publish time
```

Client assignment (later):

```
meal_plan_assignments
  id, plan_id, plan_version, consumer_profile_id
  starts_on, ends_on, status
```

## Coach UX (v1)

1. **Meal plans** nav → list of drafts / published plans.
2. **Builder** — pick day → meal slot → Food DB picker (same as meal review; Recipe badge).
3. Live strip: day totals (kcal, protein, sodium) vs targets; allergen chips.
4. **Publish** freezes item nutrition snapshots; further edits create a new version.
5. **Assign** to client(s) (v1.1) — shows on mobile as “Today’s plan” read-only cards.

## Mobile / consumer (v1.1)

- Read-only day view with photo optional, macros, and “Log this meal” deep-link that pre-fills from the plan item’s `nutrition_food_id` + grams.

## Explicit non-goals for v1

- Auto-generating plans from AI alone without coach review.
- Nested recipes as ingredients (already blocked).
- Replacing the clinical Food DB review workflow.

## Dependencies

| Dependency | Status |
|---|---|
| Rich food metadata (EPF, allergens, unknowns) | Phase A |
| Recipe retention + version freeze | Phase B |
| Nutrition review queue | Phase C |
| Meal plans product | **This phase** |

## Suggested build order

1. Schema + CRUD for draft plans (coach only).
2. Builder UI reusing `FoodDbPicker` + serving profiles.
3. Publish + snapshot + version bump.
4. Assignment + consumer read view.
5. Reports: adherence (logged meals vs plan) — later.

## Success criteria

- A coach can publish a 7-day plan from verified Isombe + staples with sodium/allergen warnings.
- Changing a recipe after plan publish does **not** silently change assigned clients’ snapshots.
- Meal plans never appear until Phases A–C are live in the environment.
