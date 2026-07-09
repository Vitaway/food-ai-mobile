import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatMessageAttachments1730000000012 implements MigrationInterface {
  name = "ChatMessageAttachments1730000000012";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chat_messages
        ALTER COLUMN body SET DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS attachment_url text
    `);
    await queryRunner.query(`
      ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS attachment_name varchar(255)
    `);
    await queryRunner.query(`
      ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS attachment_mime varchar(128)
    `);
    await queryRunner.query(`
      ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS attachment_kind varchar(16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_kind`);
    await queryRunner.query(`ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_mime`);
    await queryRunner.query(`ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_name`);
    await queryRunner.query(`ALTER TABLE chat_messages DROP COLUMN IF EXISTS attachment_url`);
  }
}
