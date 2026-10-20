import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores when Gmail received each pending email, so the review list can show
 * its date. Existing rows stay null and show the time they were queued.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddPendingReceivedAt1792627200000 implements MigrationInterface {
  name = 'AddPendingReceivedAt1792627200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" ADD COLUMN "receivedAt" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" DROP COLUMN "receivedAt"`);
  }
}
