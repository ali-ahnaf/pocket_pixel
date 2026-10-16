import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the monthly recap schedule to user preferences: the day of the month it
 * arrives (null = off) and the last month it was delivered for.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddMonthlyRecap1792195200000 implements MigrationInterface {
  name = 'AddMonthlyRecap1792195200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "monthlyRecapDay" integer`);
    await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "lastRecapMonth" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_preferences" DROP COLUMN "lastRecapMonth"`);
    await queryRunner.query(`ALTER TABLE "user_preferences" DROP COLUMN "monthlyRecapDay"`);
  }
}
