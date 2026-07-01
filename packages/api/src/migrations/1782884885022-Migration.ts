import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782884885022 implements MigrationInterface {
    name = 'Migration1782884885022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "notes" text, CONSTRAINT "FK_834960a509c776eb841644a9bac" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_834960a509c776eb841644a9bac" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt") SELECT "id", "userId", "title", "amount", "type", "createdAt", "updatedAt", "deletedAt" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
    }

}
