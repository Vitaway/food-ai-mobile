import type { MigrationInterface, QueryRunner } from "typeorm";

export class RichNutritionDb1730000000024 implements MigrationInterface {
  name = "RichNutritionDb1730000000024";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        ADD COLUMN IF NOT EXISTS preparation_state varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS edible_portion_factor numeric(6, 4) NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS search_synonyms jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS allergens jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS nutrients_unknown jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS source_reference varchar(160) NULL,
        ADD COLUMN IF NOT EXISTS cooking_method varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS recipe_version int NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS frozen_snapshot jsonb NULL
    `);

    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        ALTER COLUMN approval_status TYPE varchar(16)
    `);

    await queryRunner.query(`
      ALTER TABLE nutrition_recipe_ingredients
        ADD COLUMN IF NOT EXISTS variant_group varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS is_variant_default boolean NOT NULL DEFAULT true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE nutrition_recipe_ingredients
        DROP COLUMN IF EXISTS variant_group,
        DROP COLUMN IF EXISTS is_variant_default
    `);
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        DROP COLUMN IF EXISTS preparation_state,
        DROP COLUMN IF EXISTS edible_portion_factor,
        DROP COLUMN IF EXISTS search_synonyms,
        DROP COLUMN IF EXISTS allergens,
        DROP COLUMN IF EXISTS nutrients_unknown,
        DROP COLUMN IF EXISTS source_reference,
        DROP COLUMN IF EXISTS cooking_method,
        DROP COLUMN IF EXISTS recipe_version,
        DROP COLUMN IF EXISTS frozen_snapshot
    `);
  }
}
