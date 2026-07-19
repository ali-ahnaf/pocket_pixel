import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsCommittedToExpenses1784625323183 implements MigrationInterface {
    name = 'AddIsCommittedToExpenses1784625323183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "disableAiPrompt" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "temporary_users"("id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt", "disableAiPrompt") SELECT "id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt", "disableAiPrompt" FROM "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
        await queryRunner.query(`CREATE TABLE "temporary_vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "subjectFilter" varchar, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "vault_gmail_watchers"`);
        await queryRunner.query(`DROP TABLE "vault_gmail_watchers"`);
        await queryRunner.query(`ALTER TABLE "temporary_vault_gmail_watchers" RENAME TO "vault_gmail_watchers"`);
        await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
        await queryRunner.query(`CREATE TABLE "temporary_expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, "sourceRecurringId" varchar, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "isCommitted" boolean NOT NULL DEFAULT (1), CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_expenses"("id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId", "createdAt", "updatedAt") SELECT "id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId", "createdAt", "updatedAt" FROM "expenses"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`ALTER TABLE "temporary_expenses" RENAME TO "expenses"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
        await queryRunner.query(`CREATE TABLE "temporary_vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "subjectFilter" varchar, "guidanceHint" text, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "vault_gmail_watchers"`);
        await queryRunner.query(`DROP TABLE "vault_gmail_watchers"`);
        await queryRunner.query(`ALTER TABLE "temporary_vault_gmail_watchers" RENAME TO "vault_gmail_watchers"`);
        await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
        await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" RENAME TO "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`CREATE TABLE "vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "subjectFilter" varchar, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`DROP TABLE "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
        await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
        await queryRunner.query(`ALTER TABLE "expenses" RENAME TO "temporary_expenses"`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, "sourceRecurringId" varchar, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "expenses"("id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId", "createdAt", "updatedAt") SELECT "id", "userId", "title", "amount", "type", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId", "sourceRecurringId", "createdAt", "updatedAt" FROM "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "temporary_expenses"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
        await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
        await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" RENAME TO "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`CREATE TABLE "vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "parseScript" text NOT NULL, "subjectFilter" varchar, "tagIds" text, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`DROP TABLE "temporary_vault_gmail_watchers"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
        await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "disableAiPrompt" boolean NOT NULL DEFAULT (0), "googleId" varchar(255), CONSTRAINT "UQ_93124f92af3bd84a60e424644bb" UNIQUE ("googleId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "users"("id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt", "disableAiPrompt") SELECT "id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt", "disableAiPrompt" FROM "temporary_users"`);
        await queryRunner.query(`DROP TABLE "temporary_users"`);
    }

}
