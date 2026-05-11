import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1778500924265 implements MigrationInterface {
    name = 'Migration1778500924265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL, "category" varchar CHECK( "category" IN ('food','transport','housing','entertainment','health','other') ) NOT NULL, "date" date NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(255) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "temporary_expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL, "category" varchar CHECK( "category" IN ('food','transport','housing','entertainment','health','other') ) NOT NULL, "date" date NOT NULL, CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_expenses"("id", "userId", "title", "amount", "category", "date") SELECT "id", "userId", "title", "amount", "category", "date" FROM "expenses"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`ALTER TABLE "temporary_expenses" RENAME TO "expenses"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" RENAME TO "temporary_expenses"`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL, "category" varchar CHECK( "category" IN ('food','transport','housing','entertainment','health','other') ) NOT NULL, "date" date NOT NULL)`);
        await queryRunner.query(`INSERT INTO "expenses"("id", "userId", "title", "amount", "category", "date") SELECT "id", "userId", "title", "amount", "category", "date" FROM "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "temporary_expenses"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
    }

}
