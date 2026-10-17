import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Flags the expense and income legs created by a vault-to-vault transfer, so
 * the list can label them. Existing rows default to not a transfer.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddTransferFlag1792540800000 implements MigrationInterface {
  name = 'AddTransferFlag1792540800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "isTransfer" boolean NOT NULL DEFAULT (0)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "isTransfer"`);
  }
}
