import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1778586339022 implements MigrationInterface {
    name = 'Migration1778586339022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50))`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "tagId" varchar, "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar)`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, "avatar" varchar(255) NOT NULL DEFAULT (''), "password" varchar(255) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "temporary_vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault" FROM "vaults"`);
        await queryRunner.query(`DROP TABLE "vaults"`);
        await queryRunner.query(`ALTER TABLE "temporary_vaults" RENAME TO "vaults"`);
        await queryRunner.query(`CREATE TABLE "temporary_tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50), CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_tags"("id", "userId", "name", "icon", "backgroundColor") SELECT "id", "userId", "name", "icon", "backgroundColor" FROM "tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`ALTER TABLE "temporary_tags" RENAME TO "tags"`);
        await queryRunner.query(`CREATE TABLE "temporary_expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "tagId" varchar, "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar, CONSTRAINT "FK_c086e6a9fe032013ec207ef9e96" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_e0d76d9858620c98a05e7785ef7" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_expenses"("id", "userId", "title", "amount", "type", "tagId", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId") SELECT "id", "userId", "title", "amount", "type", "tagId", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId" FROM "expenses"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`ALTER TABLE "temporary_expenses" RENAME TO "expenses"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" RENAME TO "temporary_expenses"`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200), "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "tagId" varchar, "date" date, "interval" varchar, "startDate" date, "endDate" date, "deletedAt" datetime, "vaultId" varchar)`);
        await queryRunner.query(`INSERT INTO "expenses"("id", "userId", "title", "amount", "type", "tagId", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId") SELECT "id", "userId", "title", "amount", "type", "tagId", "date", "interval", "startDate", "endDate", "deletedAt", "vaultId" FROM "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "temporary_expenses"`);
        await queryRunner.query(`ALTER TABLE "tags" RENAME TO "temporary_tags"`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "icon" varchar(100), "backgroundColor" varchar(50))`);
        await queryRunner.query(`INSERT INTO "tags"("id", "userId", "name", "icon", "backgroundColor") SELECT "id", "userId", "name", "icon", "backgroundColor" FROM "temporary_tags"`);
        await queryRunner.query(`DROP TABLE "temporary_tags"`);
        await queryRunner.query(`ALTER TABLE "vaults" RENAME TO "temporary_vaults"`);
        await queryRunner.query(`CREATE TABLE "vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`INSERT INTO "vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault" FROM "temporary_vaults"`);
        await queryRunner.query(`DROP TABLE "temporary_vaults"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "vaults"`);
    }

}
