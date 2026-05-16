import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringOccurrenceSkip1779000100000 implements MigrationInterface {
    name = 'AddRecurringOccurrenceSkip1779000100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recurring_occurrence_skips" ("recurringId" varchar NOT NULL, "date" date NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "FK_ros_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ros_recurring" FOREIGN KEY ("recurringId") REFERENCES "expenses" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("recurringId", "date"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "recurring_occurrence_skips"`);
    }
}
