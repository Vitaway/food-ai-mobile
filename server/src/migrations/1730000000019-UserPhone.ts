import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPhone1730000000019 implements MigrationInterface {
  name = "UserPhone1730000000019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS phone varchar(32)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS phone`);
  }
}
