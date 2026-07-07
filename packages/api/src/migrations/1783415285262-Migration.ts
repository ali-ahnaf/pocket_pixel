import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1783415285262 implements MigrationInterface {
  name = 'Migration1783415285262';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "REL_b6202d1cacc63a0b9c8dac2abd" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "REL_b6202d1cacc63a0b9c8dac2abd" UNIQUE ("userId"), CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_preferences"("createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense" FROM "user_preferences"`,
    );
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`ALTER TABLE "temporary_user_preferences" RENAME TO "user_preferences"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_preferences" RENAME TO "temporary_user_preferences"`);
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "REL_b6202d1cacc63a0b9c8dac2abd" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user_preferences"("createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense" FROM "temporary_user_preferences"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_preferences"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);
  }
}
