import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds encrypted Gmail OAuth token storage to user_oauth_credentials:
 * access/refresh token ciphertext, the access-token expiry, and the connected
 * Google email. All nullable — existing rows (client id/secret only) are
 * untouched and simply read as "not connected" until the user runs the flow.
 *
 * SQLite can't ALTER TABLE ADD COLUMN with these mid-table, so this follows
 * TypeORM's rebuild-via-temporary-table pattern (scoped to this one table).
 */
export class AddGmailTokensToUserOAuthCredential1784459811702 implements MigrationInterface {
  name = 'AddGmailTokensToUserOAuthCredential1784459811702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, "googleAccessTokenEncrypted" text, "googleRefreshTokenEncrypted" text, "googleTokenExpiry" datetime, "googleEmail" varchar, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted" FROM "user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth_credentials"`);
    await queryRunner.query(`ALTER TABLE "temporary_user_oauth_credentials" RENAME TO "user_oauth_credentials"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_oauth_credentials" RENAME TO "temporary_user_oauth_credentials"`);
    await queryRunner.query(
      `CREATE TABLE "user_oauth_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "googleClientIdEncrypted" text NOT NULL, "googleClientSecretEncrypted" text NOT NULL, CONSTRAINT "UQ_ad7506c318b5101c6f6f272168e" UNIQUE ("userId"), CONSTRAINT "FK_ad7506c318b5101c6f6f272168e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "user_oauth_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "googleClientIdEncrypted", "googleClientSecretEncrypted" FROM "temporary_user_oauth_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_oauth_credentials"`);
  }
}
