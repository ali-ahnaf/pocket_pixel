import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceRecurringId1779000000000 implements MigrationInterface {
    name = 'AddSourceRecurringId1779000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "sourceRecurringId" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "sourceRecurringId"`);
    }
}
