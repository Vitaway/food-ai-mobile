import { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizationModuleEntitlements1730000000013 implements MigrationInterface {
  name = "OrganizationModuleEntitlements1730000000013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organization_module_entitlements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_key varchar(255) NOT NULL,
        module_key varchar(64) NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_org_module_entitlement
        ON organization_module_entitlements (LOWER(organization_key), module_key)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_org_module_entitlement_org
        ON organization_module_entitlements (organization_key)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS organization_module_entitlements`);
  }
}
