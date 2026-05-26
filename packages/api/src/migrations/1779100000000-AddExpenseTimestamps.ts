import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenseTimestamps1779100000000 implements MigrationInterface {
    name = 'AddExpenseTimestamps1779100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "createdAt" datetime DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "updatedAt" datetime DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "createdAt"`);
    }
}
