import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonthlyBudgetToVault1782350046906 implements MigrationInterface {
    name = 'AddMonthlyBudgetToVault1782350046906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "monthlyBudget" decimal(10,2), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault", "createdAt", "updatedAt") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault", "createdAt", "updatedAt" FROM "vaults"`);
        await queryRunner.query(`DROP TABLE "vaults"`);
        await queryRunner.query(`ALTER TABLE "temporary_vaults" RENAME TO "vaults"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vaults" RENAME TO "temporary_vaults"`);
        await queryRunner.query(`CREATE TABLE "vaults" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "description" varchar(255) NOT NULL, "deletedAt" datetime, "icon" varchar(100), "backgroundColor" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), CONSTRAINT "FK_1cfbcd8c3d3df510873ee00e12c" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "vaults"("id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault", "createdAt", "updatedAt") SELECT "id", "userId", "name", "description", "deletedAt", "icon", "backgroundColor", "isDefault", "createdAt", "updatedAt" FROM "temporary_vaults"`);
        await queryRunner.query(`DROP TABLE "temporary_vaults"`);
    }

}
