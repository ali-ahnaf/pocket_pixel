import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPushSubscriptions1784625468225 implements MigrationInterface {
    name = 'AddPushSubscriptions1784625468225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_push_subscription_user_endpoint" ON "push_subscriptions" ("userId", "endpoint") `);
        await queryRunner.query(`CREATE TABLE "temporary_user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), "pushEnabled" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user_preferences"("createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense" FROM "user_preferences"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_preferences" RENAME TO "user_preferences"`);
        await queryRunner.query(`DROP INDEX "IDX_push_subscription_user_endpoint"`);
        await queryRunner.query(`CREATE TABLE "temporary_push_subscriptions" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL, CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_push_subscriptions"("createdAt", "updatedAt", "deletedAt", "id", "userId", "endpoint", "p256dh", "auth") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "endpoint", "p256dh", "auth" FROM "push_subscriptions"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
        await queryRunner.query(`ALTER TABLE "temporary_push_subscriptions" RENAME TO "push_subscriptions"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_push_subscription_user_endpoint" ON "push_subscriptions" ("userId", "endpoint") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_push_subscription_user_endpoint"`);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" RENAME TO "temporary_push_subscriptions"`);
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "push_subscriptions"("createdAt", "updatedAt", "deletedAt", "id", "userId", "endpoint", "p256dh", "auth") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "endpoint", "p256dh", "auth" FROM "temporary_push_subscriptions"`);
        await queryRunner.query(`DROP TABLE "temporary_push_subscriptions"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_push_subscription_user_endpoint" ON "push_subscriptions" ("userId", "endpoint") `);
        await queryRunner.query(`ALTER TABLE "user_preferences" RENAME TO "temporary_user_preferences"`);
        await queryRunner.query(`CREATE TABLE "user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "user_preferences"("createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "showIncome", "showExpense" FROM "temporary_user_preferences"`);
        await queryRunner.query(`DROP TABLE "temporary_user_preferences"`);
        await queryRunner.query(`DROP INDEX "IDX_push_subscription_user_endpoint"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
    }

}
