import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the 8 domain tables on the device at their current API shape, in one
 * step, instead of replaying the 29 server migrations. Server-only tables
 * (Gmail, push, OAuth, AI credentials, pending expenses) are left out.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class InitialSchema1791849600000 implements MigrationInterface {
  name = 'InitialSchema1791849600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "disableAiPrompt" boolean NOT NULL DEFAULT (0), "hasOnboarded" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "monthlyBudget" decimal(10,2), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, "sourceRecurringId" varchar, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE TABLE "transaction_tags" ("transactionId" varchar NOT NULL, "tagId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_ccbbef396290acaece98cb129b6" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_23ed9c8ca2e4b5cf639c580e50b" FOREIGN KEY ("transactionId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("transactionId", "tagId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_286c163c9bbc3c124a89e6f39d3" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_01e0cc43dc9d7c475661eb3a9e2" FOREIGN KEY ("recurringId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("recurringId", "date"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "notes" text, "completed" boolean NOT NULL DEFAULT (0), "dueDate" date, CONSTRAINT "FK_834960a509c776eb841644a9bac" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "showIncome" boolean NOT NULL DEFAULT (0), "showExpense" boolean NOT NULL DEFAULT (0), "pushEnabled" boolean NOT NULL DEFAULT (0), "aiTransactionEntryEnabled" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(`DROP TABLE "debts"`);
    await queryRunner.query(`DROP TABLE "recurring_occurrence_skips"`);
    await queryRunner.query(`DROP TABLE "transaction_tags"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "vaults"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
