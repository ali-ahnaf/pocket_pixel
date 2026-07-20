import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-vault Gmail watchers redesign:
 *  - Adds the `vault_gmail_watchers` table (one Gmail label + parse script per
 *    vault) with the two unique indexes that enforce the 1:1 label↔vault mapping.
 *  - Drops the now-derived `gmailLabelIds` column from `user_oauth_credentials`;
 *    the watched-label set is the union of the user's watcher rows. Existing flat
 *    watch config is discarded (users re-attach labels per vault).
 */
export class Migration1784541914604 implements MigrationInterface {
  name = 'Migration1784541914604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vault_gmail_watchers" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "vaultId" varchar NOT NULL, "gmailLabelId" varchar NOT NULL, "gmailLabelName" varchar, "parseScript" text NOT NULL, CONSTRAINT "FK_567f63d72a84d465851eec53ef2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_7e62937aa76438b27e53dbe815c" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_label" ON "vault_gmail_watchers" ("userId", "gmailLabelId") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vault_gmail_watcher_user_vault" ON "vault_gmail_watchers" ("userId", "vaultId") `);

    // Drop `gmailLabelIds` from user_oauth_credentials (SQLite: rebuild the table).
    await queryRunner.query(
      `CREATE TABLE "temporary_user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, "googleAccessTokenEncrypted" text, "googleRefreshTokenEncrypted" text, "googleTokenExpiry" datetime, "googleEmail" varchar, "gmailHistoryId" varchar, "gmailWatchExpiry" datetime, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail", "gmailHistoryId", "gmailWatchExpiry") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail", "gmailHistoryId", "gmailWatchExpiry" FROM "user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth_credentials"`);
    await queryRunner.query(`ALTER TABLE "temporary_user_oauth_credentials" RENAME TO "user_oauth_credentials"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_oauth_credentials" RENAME TO "temporary_user_oauth_credentials"`);
    await queryRunner.query(
      `CREATE TABLE "user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, "googleAccessTokenEncrypted" text, "googleRefreshTokenEncrypted" text, "googleTokenExpiry" datetime, "googleEmail" varchar, "gmailHistoryId" varchar, "gmailWatchExpiry" datetime, "gmailLabelIds" text, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail", "gmailHistoryId", "gmailWatchExpiry") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail", "gmailHistoryId", "gmailWatchExpiry" FROM "temporary_user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_oauth_credentials"`);

    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_vault"`);
    await queryRunner.query(`DROP INDEX "IDX_vault_gmail_watcher_user_label"`);
    await queryRunner.query(`DROP TABLE "vault_gmail_watchers"`);
  }
}
