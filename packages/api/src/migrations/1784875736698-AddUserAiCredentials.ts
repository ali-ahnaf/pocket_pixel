import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAiCredentials1784875736698 implements MigrationInterface {
  name = 'AddUserAiCredentials1784875736698';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_ai_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "salt" varchar NOT NULL, "kdfIterations" integer NOT NULL, "dekIv" varchar NOT NULL, "wrappedDek" text NOT NULL, "keyIv" varchar NOT NULL, "keyCiphertext" text NOT NULL, "selectedModel" varchar, CONSTRAINT "UQ_b5534e5647b6d9524b43d3f216d" UNIQUE ("userId"), CONSTRAINT "REL_b5534e5647b6d9524b43d3f216" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_ai_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "salt" varchar NOT NULL, "kdfIterations" integer NOT NULL, "dekIv" varchar NOT NULL, "wrappedDek" text NOT NULL, "keyIv" varchar NOT NULL, "keyCiphertext" text NOT NULL, "selectedModel" varchar, CONSTRAINT "UQ_b5534e5647b6d9524b43d3f216d" UNIQUE ("userId"), CONSTRAINT "REL_b5534e5647b6d9524b43d3f216" UNIQUE ("userId"), CONSTRAINT "FK_b5534e5647b6d9524b43d3f216d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_ai_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "salt", "kdfIterations", "dekIv", "wrappedDek", "keyIv", "keyCiphertext", "selectedModel") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "salt", "kdfIterations", "dekIv", "wrappedDek", "keyIv", "keyCiphertext", "selectedModel" FROM "user_ai_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "user_ai_credentials"`);
    await queryRunner.query(`ALTER TABLE "temporary_user_ai_credentials" RENAME TO "user_ai_credentials"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_ai_credentials" RENAME TO "temporary_user_ai_credentials"`);
    await queryRunner.query(
      `CREATE TABLE "user_ai_credentials" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "salt" varchar NOT NULL, "kdfIterations" integer NOT NULL, "dekIv" varchar NOT NULL, "wrappedDek" text NOT NULL, "keyIv" varchar NOT NULL, "keyCiphertext" text NOT NULL, "selectedModel" varchar, CONSTRAINT "UQ_b5534e5647b6d9524b43d3f216d" UNIQUE ("userId"), CONSTRAINT "REL_b5534e5647b6d9524b43d3f216" UNIQUE ("userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user_ai_credentials"("createdAt", "updatedAt", "deletedAt", "id", "userId", "salt", "kdfIterations", "dekIv", "wrappedDek", "keyIv", "keyCiphertext", "selectedModel") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "salt", "kdfIterations", "dekIv", "wrappedDek", "keyIv", "keyCiphertext", "selectedModel" FROM "temporary_user_ai_credentials"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_ai_credentials"`);
    await queryRunner.query(`DROP TABLE "user_ai_credentials"`);
  }
}
