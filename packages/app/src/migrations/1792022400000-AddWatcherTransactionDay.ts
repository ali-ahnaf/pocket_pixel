import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the optional fixed booking day to Gmail watchers, snapshotted onto each
 * pending item like `guidanceHint`. Null keeps the email's own date.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddWatcherTransactionDay1792022400000 implements MigrationInterface {
  name = 'AddWatcherTransactionDay1792022400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" ADD COLUMN "transactionDay" integer`);
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" ADD COLUMN "transactionDay" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" DROP COLUMN "transactionDay"`);
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" DROP COLUMN "transactionDay"`);
  }
}
