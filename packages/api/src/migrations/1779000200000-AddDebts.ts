import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDebts1779000200000 implements MigrationInterface {
    name = 'AddDebts1779000200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "debts" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(200) NOT NULL, "amount" decimal(10,2) NOT NULL DEFAULT (0), "type" varchar NOT NULL DEFAULT ('expense'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_debts_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "debts"`);
    }
}
