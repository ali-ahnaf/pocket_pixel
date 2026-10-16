import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the "require approval for AI-parsed emails" preference. Off by default,
 * so existing users keep logging parsed Gmail emails straight away.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddRequireAiParseApproval1792368000000 implements MigrationInterface {
  name = 'AddRequireAiParseApproval1792368000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "requireAiParseApproval" boolean NOT NULL DEFAULT (0)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_preferences" DROP COLUMN "requireAiParseApproval"`);
  }
}
