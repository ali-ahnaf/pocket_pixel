import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781174119467 implements MigrationInterface {
    name = 'Migration1781174119467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "temporary_recurring_occurrence_skips"("recurringId", "date", "userId") SELECT "recurringId", "date", "userId" FROM "recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "recurring_occurrence_skips"`);
        await queryRunner.query(`ALTER TABLE "temporary_recurring_occurrence_skips" RENAME TO "recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "userId", "title", "amount", "type", "createdAt") SELECT "id", "userId", "title", "amount", "type", "createdAt" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
        await queryRunner.query(`CREATE TABLE "temporary_vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault" FROM "vaults"`);
        await queryRunner.query(`DROP TABLE "vaults"`);
        await queryRunner.query(`ALTER TABLE "temporary_vaults" RENAME TO "vaults"`);
        await queryRunner.query(`CREATE TABLE "temporary_tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_tags"("id", "userId", "name", "icon", "backgroundColor") SELECT "id", "userId", "name", "icon", "backgroundColor" FROM "tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`ALTER TABLE "temporary_tags" RENAME TO "tags"`);
        await queryRunner.query(`CREATE TABLE "temporary_transaction_tags" ("transactionId" varchar NOT NULL, "tagId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_ccbbef396290acaece98cb129b6" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_23ed9c8ca2e4b5cf639c580e50b" FOREIGN KEY ("transactionId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("transactionId", "tagId"))`);
        await queryRunner.query(`INSERT INTO "temporary_transaction_tags"("transactionId", "tagId") SELECT "transactionId", "tagId" FROM "transaction_tags"`);
        await queryRunner.query(`DROP TABLE "transaction_tags"`);
        await queryRunner.query(`ALTER TABLE "temporary_transaction_tags" RENAME TO "transaction_tags"`);
        await queryRunner.query(`CREATE TABLE "temporary_expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, "sourceRecurringId" varchar, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_expenses"("id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId") SELECT "id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId" FROM "expenses"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`ALTER TABLE "temporary_expenses" RENAME TO "expenses"`);
        await queryRunner.query(`CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255) NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "temporary_users"("id", "name", "email", "avatar", "password") SELECT "id", "name", "email", "avatar", "password" FROM "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
        await queryRunner.query(`CREATE TABLE "temporary_recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "temporary_recurring_occurrence_skips"("recurringId", "date", "userId") SELECT "recurringId", "date", "userId" FROM "recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "recurring_occurrence_skips"`);
        await queryRunner.query(`ALTER TABLE "temporary_recurring_occurrence_skips" RENAME TO "recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "userId", "title", "amount", "type", "createdAt") SELECT "id", "userId", "title", "amount", "type", "createdAt" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
        await queryRunner.query(`CREATE TABLE "temporary_recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_286c163c9bbc3c124a89e6f39d3" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_01e0cc43dc9d7c475661eb3a9e2" FOREIGN KEY ("recurringId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "temporary_recurring_occurrence_skips"("recurringId", "date", "userId", "createdAt", "updatedAt", "deletedAt") SELECT "recurringId", "date", "userId", "createdAt", "updatedAt", "deletedAt" FROM "recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "recurring_occurrence_skips"`);
        await queryRunner.query(`ALTER TABLE "temporary_recurring_occurrence_skips" RENAME TO "recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_834960a509c776eb841644a9bac" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`ALTER TABLE "recurring_occurrence_skips" RENAME TO "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "recurring_occurrence_skips"("recurringId", "date", "userId", "createdAt", "updatedAt", "deletedAt") SELECT "recurringId", "date", "userId", "createdAt", "updatedAt", "deletedAt" FROM "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "debts"("id", "userId", "title", "amount", "type", "createdAt") SELECT "id", "userId", "title", "amount", "type", "createdAt" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`ALTER TABLE "recurring_occurrence_skips" RENAME TO "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "recurring_occurrence_skips"("recurringId", "date", "userId") SELECT "recurringId", "date", "userId" FROM "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "users"("id", "name", "email", "avatar", "password") SELECT "id", "name", "email", "avatar", "password" FROM "temporary_users"`);
        await queryRunner.query(`DROP TABLE "temporary_users"`);
        await queryRunner.query(`ALTER TABLE "expenses" RENAME TO "temporary_expenses"`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, "sourceRecurringId" varchar, CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "expenses"("id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId") SELECT "id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId" FROM "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "temporary_expenses"`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" RENAME TO "temporary_transaction_tags"`);
        await queryRunner.query(`CREATE TABLE "transaction_tags" ("transactionId" varchar NOT NULL, "tagId" varchar NOT NULL, CONSTRAINT "FK_ccbbef396290acaece98cb129b6" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_23ed9c8ca2e4b5cf639c580e50b" FOREIGN KEY ("transactionId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("transactionId", "tagId"))`);
        await queryRunner.query(`INSERT INTO "transaction_tags"("transactionId", "tagId") SELECT "transactionId", "tagId" FROM "temporary_transaction_tags"`);
        await queryRunner.query(`DROP TABLE "temporary_transaction_tags"`);
        await queryRunner.query(`ALTER TABLE "tags" RENAME TO "temporary_tags"`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50), CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "tags"("id", "userId", "name", "icon", "backgroundColor") SELECT "id", "userId", "name", "icon", "backgroundColor" FROM "temporary_tags"`);
        await queryRunner.query(`DROP TABLE "temporary_tags"`);
        await queryRunner.query(`ALTER TABLE "vaults" RENAME TO "temporary_vaults"`);
        await queryRunner.query(`CREATE TABLE "vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault" FROM "temporary_vaults"`);
        await queryRunner.query(`DROP TABLE "temporary_vaults"`);
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_debts_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "userId", "title", "amount", "type", "createdAt") SELECT "id", "userId", "title", "amount", "type", "createdAt" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`ALTER TABLE "recurring_occurrence_skips" RENAME TO "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`CREATE TABLE "recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "FK_ros_recurring" FOREIGN KEY ("recurringId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ros_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("recurringId", "date"))`);
        await queryRunner.query(`INSERT INTO "recurring_occurrence_skips"("recurringId", "date", "userId") SELECT "recurringId", "date", "userId" FROM "temporary_recurring_occurrence_skips"`);
        await queryRunner.query(`DROP TABLE "temporary_recurring_occurrence_skips"`);
    }

}
