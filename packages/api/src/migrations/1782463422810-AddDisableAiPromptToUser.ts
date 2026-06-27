import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisableAiPromptToUser1782463422810 implements MigrationInterface {
    name = 'AddDisableAiPromptToUser1782463422810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255) NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "disableAiPrompt" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "temporary_users"("id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt" FROM "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255) NOT NULL, "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "users"("id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt") SELECT "id", "name", "email", "avatar", "password", "createdAt", "updatedAt", "deletedAt" FROM "temporary_users"`);
        await queryRunner.query(`DROP TABLE "temporary_users"`);
    }

}
