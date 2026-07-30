import type { MigrationInterface, QueryRunner } from "typeorm";

export class NutritionRecipes1730000000022 implements MigrationInterface {
  name = "NutritionRecipes1730000000022";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        ADD COLUMN IF NOT EXISTS cooked_yield_g numeric(10, 2) NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nutrition_recipe_ingredients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_food_id uuid NOT NULL REFERENCES nutrition_foods(id) ON DELETE CASCADE,
        ingredient_food_id uuid NOT NULL REFERENCES nutrition_foods(id) ON DELETE RESTRICT,
        raw_weight_g numeric(10, 2) NOT NULL,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
        ON nutrition_recipe_ingredients(recipe_food_id, sort_order)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient
        ON nutrition_recipe_ingredients(ingredient_food_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS nutrition_recipe_ingredients`);
    await queryRunner.query(`
      ALTER TABLE nutrition_foods DROP COLUMN IF EXISTS cooked_yield_g
    `);
  }
}
