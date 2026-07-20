import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceParseScriptWithGuidanceHint1784568283905 implements MigrationInterface {
  name = 'ReplaceParseScriptWithGuidanceHint1784568283905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "subjectFilter" varchar, "guidanceHint" text, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "vault_gmail_watchers"`,
    );
    await queryRunner.query(`DROP TABLE "vault_gmail_watchers"`);
    await queryRunner.query(`ALTER TABLE "temporary_vault_gmail_watchers" RENAME TO "vault_gmail_watchers"`);
    await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`ALTER TABLE "vault_gmail_watchers" RENAME TO "temporary_vault_gmail_watchers"`);
    await queryRunner.query(
      `CREATE TABLE "vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "parseScript" text NOT NULL, "subjectFilter" varchar, "tagIds" text, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "vault_gmail_watchers"("createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "vaultId", "gmailLabelId", "gmailLabelName", "subjectFilter" FROM "temporary_vault_gmail_watchers"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_vault_gmail_watchers"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);
    await queryRunner.query(`CREATE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
  }
}
