import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1783059032789 implements MigrationInterface {
    name = 'Migration1783059032789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "token" varchar(255) NOT NULL, "userId" varchar NOT NULL, "expiresAt" datetime NOT NULL, "revokedAt" datetime)`);
        await queryRunner.query(`CREATE TABLE "temporary_refresh_tokens" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "token" varchar(255) NOT NULL, "userId" varchar NOT NULL, "expiresAt" datetime NOT NULL, "revokedAt" datetime, CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_refresh_tokens"("createdAt", "updatedAt", "deletedAt", "id", "token", "userId", "expiresAt", "revokedAt") SELECT "createdAt", "updatedAt", "deletedAt", "id", "token", "userId", "expiresAt", "revokedAt" FROM "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`ALTER TABLE "temporary_refresh_tokens" RENAME TO "refresh_tokens"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME TO "temporary_refresh_tokens"`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "token" varchar(255) NOT NULL, "userId" varchar NOT NULL, "expiresAt" datetime NOT NULL, "revokedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "refresh_tokens"("createdAt", "updatedAt", "deletedAt", "id", "token", "userId", "expiresAt", "revokedAt") SELECT "createdAt", "updatedAt", "deletedAt", "id", "token", "userId", "expiresAt", "revokedAt" FROM "temporary_refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "temporary_refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
