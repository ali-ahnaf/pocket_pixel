import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds keyword-to-tag rules (JSON text) to Gmail watchers, snapshotted onto each
 * pending item like `guidanceHint`. Null lets the AI pick tags.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddWatcherTagKeywords1792108800000 implements MigrationInterface {
  name = 'AddWatcherTagKeywords1792108800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" ADD COLUMN "tagKeywords" text`);
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" ADD COLUMN "tagKeywords" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" DROP COLUMN "tagKeywords"`);
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" DROP COLUMN "tagKeywords"`);
  }
}
