import { MigrationInterface, QueryRunner } from "typeorm";

export class TfctNutritionFoodColumns1730000000014 implements MigrationInterface {
  name = "TfctNutritionFoodColumns1730000000014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        ADD COLUMN IF NOT EXISTS food_code varchar(32),
        ADD COLUMN IF NOT EXISTS food_group varchar(16),
        ADD COLUMN IF NOT EXISTS food_group_name varchar(80),
        ADD COLUMN IF NOT EXISTS recipe_note varchar(255),
        ADD COLUMN IF NOT EXISTS source_type varchar(32) NOT NULL DEFAULT 'custom_local',
        ADD COLUMN IF NOT EXISTS applicable_countries varchar(64),
        ADD COLUMN IF NOT EXISTS name_sw varchar(160),
        ADD COLUMN IF NOT EXISTS name_rw varchar(160),
        ADD COLUMN IF NOT EXISTS name_local_other varchar(160),
        ADD COLUMN IF NOT EXISTS image_confirmed boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS package_size_g numeric(10,2),
        ADD COLUMN IF NOT EXISTS label_source varchar(160),
        ADD COLUMN IF NOT EXISTS source varchar(80),
        ADD COLUMN IF NOT EXISTS source_version varchar(80)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_nutrition_foods_food_code
        ON nutrition_foods (food_code)
        WHERE food_code IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_nutrition_foods_food_group
        ON nutrition_foods (food_group)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_nutrition_foods_source_type
        ON nutrition_foods (source_type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_nutrition_foods_name_sw
        ON nutrition_foods (name_sw)
        WHERE name_sw IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_nutrition_foods_name_rw
        ON nutrition_foods (name_rw)
        WHERE name_rw IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nutrition_foods_name_rw`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nutrition_foods_name_sw`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nutrition_foods_source_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nutrition_foods_food_group`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_nutrition_foods_food_code`);
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
        DROP COLUMN IF EXISTS food_code,
        DROP COLUMN IF EXISTS food_group,
        DROP COLUMN IF EXISTS food_group_name,
        DROP COLUMN IF EXISTS recipe_note,
        DROP COLUMN IF EXISTS source_type,
        DROP COLUMN IF EXISTS applicable_countries,
        DROP COLUMN IF EXISTS name_sw,
        DROP COLUMN IF EXISTS name_rw,
        DROP COLUMN IF EXISTS name_local_other,
        DROP COLUMN IF EXISTS image_confirmed,
        DROP COLUMN IF EXISTS package_size_g,
        DROP COLUMN IF EXISTS label_source,
        DROP COLUMN IF EXISTS source,
        DROP COLUMN IF EXISTS source_version
    `);
  }
}
