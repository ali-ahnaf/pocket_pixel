import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `adventures` and `adventure_items` tables for one-off trip and event
 * planning. Purely additive: no existing table is touched.
 *
 * This runs on users' phones and cannot be un-written there. Never edit it once
 * shipped; add a new migration for any schema change.
 */
export class AddAdventures1792454400000 implements MigrationInterface {
  name = 'AddAdventures1792454400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "adventures" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "flavorText" varchar(255), "fund" decimal(10,2), "startDate" date, "endDate" date, "completedAt" datetime, CONSTRAINT "FK_e744bb588bcc9e882914ce98aff" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE TABLE "adventure_items" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "adventureId" varchar NOT NULL, "name" varchar(100) NOT NULL, "plannedCost" decimal(10,2) NOT NULL DEFAULT (0), "actualCost" decimal(10,2), "isBought" boolean NOT NULL DEFAULT (0), "sortOrder" integer NOT NULL DEFAULT (0), CONSTRAINT "FK_7b5f445a3570d19eb735abd1a9d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_0165d1aaa42f35d4c46a83b1e92" FOREIGN KEY ("adventureId") REFERENCES "adventures" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "adventure_items"`);
    await queryRunner.query(`DROP TABLE "adventures"`);
  }
}
