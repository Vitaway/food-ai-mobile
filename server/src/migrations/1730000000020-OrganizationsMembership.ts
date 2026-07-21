import type { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizationsMembership1730000000020 implements MigrationInterface {
  name = "OrganizationsMembership1730000000020";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS contact_email varchar(255) NULL,
      ADD COLUMN IF NOT EXISTS contact_phone varchar(32) NULL,
      ADD COLUMN IF NOT EXISTS notes text NULL,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS organization_id uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_organization_id'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT fk_users_organization_id
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
        END IF;
      END $$
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_organization_id
      ON users(organization_id)
    `);

    // Seed org rows from known free-text keys (coach profiles + entitlement keys).
    await queryRunner.query(`
      INSERT INTO organizations (id, name, created_at, updated_at, status)
      SELECT gen_random_uuid(), src.name, now(), now(), 'active'
      FROM (
        SELECT DISTINCT TRIM(organization) AS name
        FROM coach_profiles
        WHERE organization IS NOT NULL AND TRIM(organization) <> ''
        UNION
        SELECT DISTINCT TRIM(organization_key) AS name
        FROM organization_module_entitlements
        WHERE organization_key IS NOT NULL AND TRIM(organization_key) <> ''
      ) src
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations o
        WHERE LOWER(o.name) = LOWER(src.name)
      )
    `);

    // Link coaches to matching organizations by name.
    await queryRunner.query(`
      UPDATE users u
      SET organization_id = o.id
      FROM coach_profiles cp
      JOIN organizations o ON LOWER(o.name) = LOWER(TRIM(cp.organization))
      WHERE cp.user_id = u.id
        AND u.organization_id IS NULL
        AND cp.organization IS NOT NULL
        AND TRIM(cp.organization) <> ''
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_organization_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_organization_id`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS organization_id`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS updated_at`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS notes`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS contact_phone`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS contact_email`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN IF EXISTS status`);
  }
}
