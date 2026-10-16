import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets a vault hold several Gmail watchers, each with its own label, subject
 * filter, guidance, transaction day and tag keywords: the `(userId, vaultId)`
 * index stops being unique. Existing rows are unchanged.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AllowManyWatchersPerVault1792281600000 implements MigrationInterface {
  name = 'AllowManyWatchersPerVault1792281600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
  }

  // Fails if any vault already has more than one watcher row; remove the extras first.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
  }
}
