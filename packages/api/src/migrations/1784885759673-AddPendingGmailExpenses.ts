import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingGmailExpenses1784885759673 implements MigrationInterface {
  name = 'AddPendingGmailExpenses1784885759673';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pending_gmail_expenses" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "gmailMessageId" varchar NOT NULL, "vaultId" varchar NOT NULL, "guidanceHint" varchar)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pending_gmail_expense_user_message" ON "pending_gmail_expenses" ("userId", "gmailMessageId") `);
    await queryRunner.query(`DROP INDEX "IDX_pending_gmail_expense_user_message"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_pending_gmail_expenses" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "gmailMessageId" varchar NOT NULL, "vaultId" varchar NOT NULL, "guidanceHint" varchar, CONSTRAINT "FK_29a22dba6353508d809eb685bd8" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_d2e80eba39aa32b5c0649d348bc" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_pending_gmail_expenses"("createdAt", "updatedAt", "deletedAt", "id", "userId", "gmailMessageId", "vaultId", "guidanceHint") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "gmailMessageId", "vaultId", "guidanceHint" FROM "pending_gmail_expenses"`,
    );
    await queryRunner.query(`DROP TABLE "pending_gmail_expenses"`);
    await queryRunner.query(`ALTER TABLE "temporary_pending_gmail_expenses" RENAME TO "pending_gmail_expenses"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pending_gmail_expense_user_message" ON "pending_gmail_expenses" ("userId", "gmailMessageId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pending_gmail_expense_user_message"`);
    await queryRunner.query(`ALTER TABLE "pending_gmail_expenses" RENAME TO "temporary_pending_gmail_expenses"`);
    await queryRunner.query(
      `CREATE TABLE "pending_gmail_expenses" ("createdAt" datetime DEFAULT (datetime('now')), "updatedAt" datetime DEFAULT (datetime('now')), "deletedAt" datetime, "id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "gmailMessageId" varchar NOT NULL, "vaultId" varchar NOT NULL, "guidanceHint" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "pending_gmail_expenses"("createdAt", "updatedAt", "deletedAt", "id", "userId", "gmailMessageId", "vaultId", "guidanceHint") SELECT "createdAt", "updatedAt", "deletedAt", "id", "userId", "gmailMessageId", "vaultId", "guidanceHint" FROM "temporary_pending_gmail_expenses"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_pending_gmail_expenses"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pending_gmail_expense_user_message" ON "pending_gmail_expenses" ("userId", "gmailMessageId") `);
    await queryRunner.query(`DROP INDEX "IDX_pending_gmail_expense_user_message"`);
    await queryRunner.query(`DROP TABLE "pending_gmail_expenses"`);
  }
}
