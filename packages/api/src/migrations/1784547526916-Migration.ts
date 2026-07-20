import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1784547526916 implements MigrationInterface {
  name = 'Migration1784547526916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" ADD COLUMN "tagIds" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" DROP COLUMN "tagIds"`);
  }
}
