import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1784546344887 implements MigrationInterface {
  name = 'Migration1784546344887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // A Gmail label may now be shared across vaults and disambiguated by subject,
    // so the label index is no longer unique; add the subject-filter column.
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" ADD COLUMN "subjectFilter" varchar`);
    await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" DROP COLUMN "subjectFilter"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
  }
}
