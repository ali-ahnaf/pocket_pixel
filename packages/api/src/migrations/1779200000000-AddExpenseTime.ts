import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenseTime1779200000000 implements MigrationInterface {
    name = 'AddExpenseTime1779200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "time" varchar(5) DEFAULT NULL`);
        await queryRunner.query(`
          UPDATE "expenses"
          SET "time" = substr("createdAt", 12, 5)
          WHERE "time" IS NULL
            AND "createdAt" IS NOT NULL
            AND length("createdAt") >= 16
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "time"`);
    }
}
