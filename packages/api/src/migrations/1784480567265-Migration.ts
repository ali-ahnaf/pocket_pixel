import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gmail push/watch schema:
 *  - new `processed_gmail_messages` idempotency ledger (one row per handled Gmail
 *    message id, unique per user), and
 *  - three watch-bookkeeping columns on `user_oauth_credentials`
 *    (`gmailHistoryId`, `gmailWatchExpiry`, `gmailLabelIds`), all nullable so
 *    existing rows are untouched and read as "not watching".
 *
 * SQLite can't ADD COLUMN mid-table, so the credentials change follows TypeORM's
 * rebuild-via-temporary-table pattern (scoped to this one table).
 */
export class Migration1784480567265 implements MigrationInterface {
  name = 'Migration1784480567265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "processed_gmail_messages" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "gmailMessageId" varchar NOT NULL, CONSTRAINT "FK_c98af1b65f76bc4700f74eda93f" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_processed_gmail_user_message" ON "processed_gmail_messages" ("userId", "gmailMessageId") `);
    await queryRunner.query(
      `CREATE TABLE "temporary_user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, "googleAccessTokenEncrypted" text, "googleRefreshTokenEncrypted" text, "googleTokenExpiry" datetime, "googleEmail" varchar, "gmailHistoryId" varchar, "gmailWatchExpiry" datetime, "gmailLabelIds" text, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail" FROM "user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth_credentials"`);
    await queryRunner.query(`ALTER TABLE "temporary_user_oauth_credentials" RENAME TO "user_oauth_credentials"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_oauth_credentials" RENAME TO "temporary_user_oauth_credentials"`);
    await queryRunner.query(
      `CREATE TABLE "user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, "googleAccessTokenEncrypted" text, "googleRefreshTokenEncrypted" text, "googleTokenExpiry" datetime, "googleEmail" varchar, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted", "googleAccessTokenEncrypted", "googleRefreshTokenEncrypted", "googleTokenExpiry", "googleEmail" FROM "temporary_user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_oauth_credentials"`);
    await queryRunner.query(`DROP INDEX "IDX_processed_gmail_user_message"`);
    await queryRunner.query(`DROP TABLE "processed_gmail_messages"`);
  }
}
