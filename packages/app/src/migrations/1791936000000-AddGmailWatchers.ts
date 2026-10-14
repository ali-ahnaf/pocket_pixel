import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the per-vault Gmail watchers and the pending review queue, at their
 * current API shape. Gmail OAuth tokens and the sync cursor are not stored in
 * SQLite; they live in the OS secure store (see `lib/gmail/connection-store.ts`).
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddGmailWatchers1791936000000 implements MigrationInterface {
  name = 'AddGmailWatchers1791936000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "subjectFilter" varchar, "guidanceHint" text, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
    await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
    await queryRunner.query(
      `CREATE TABLE "pending_gmail_expenses" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "gmailMessageId" varchar NOT NULL, "vaultId" varchar NOT NULL, "subject" varchar, "guidanceHint" varchar, CONSTRAINT "FK_29a22dba6353508d809eb685bd8" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_d2e80eba39aa32b5c0649d348bc" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pending_gmail_expense_user_message" ON "pending_gmail_expenses" ("userId", "gmailMessageId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pending_gmail_expense_user_message"`);
    await queryRunner.query(`DROP TABLE "pending_gmail_expenses"`);
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(`DROP TABLE "vault_gmail_watchers"`);
  }
}
