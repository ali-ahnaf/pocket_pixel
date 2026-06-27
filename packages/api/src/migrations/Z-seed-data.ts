import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcryptjs';

/**
 * Email: demo@pocketpixel.dev
 * Password: password123
 * Seeds a demo user with vaults, tags and a spread of transactions so a fresh
 * database has something to look at. Runs last (highest timestamp). Idempotent
 * via fixed UUIDs; `down` removes exactly what `up` inserts.
 */
export class SeedDummyData1782463500000 implements MigrationInterface {
  name = 'SeedDummyData1782463500000';

  // Fixed ids so the seed is idempotent and reversible.
  private static readonly USER_ID = 'a0000000-0000-4000-8000-000000000001';

  private static readonly VAULTS = {
    groceries: 'b0000000-0000-4000-8000-000000000001',
    entertainment: 'b0000000-0000-4000-8000-000000000002',
    savings: 'b0000000-0000-4000-8000-000000000003',
  };

  private static readonly TAGS = {
    food: 'c0000000-0000-4000-8000-000000000001',
    rent: 'c0000000-0000-4000-8000-000000000002',
    salary: 'c0000000-0000-4000-8000-000000000003',
    fun: 'c0000000-0000-4000-8000-000000000004',
  };

  private static readonly EXPENSES = {
    salary: 'd0000000-0000-4000-8000-000000000001',
    rent: 'd0000000-0000-4000-8000-000000000002',
    groceries1: 'd0000000-0000-4000-8000-000000000003',
    groceries2: 'd0000000-0000-4000-8000-000000000004',
    cinema: 'd0000000-0000-4000-8000-000000000005',
    transferToSavings: 'd0000000-0000-4000-8000-000000000006',
    freelance: 'd0000000-0000-4000-8000-000000000007',
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { USER_ID, VAULTS, TAGS, EXPENSES } = SeedDummyData1782463500000;

    const passwordHash = await bcrypt.hash('password123', 12);

    // Demo user
    await queryRunner.query(`INSERT INTO "users" ("id", "name", "email", "avatar", "password", "disableAiPrompt") VALUES (?, ?, ?, ?, ?, ?)`, [
      USER_ID,
      'Demo Adventurer',
      'demo@pocketpixel.dev',
      '/avatars/avatar1.jpeg',
      passwordHash,
      0,
    ]);

    // Vaults
    await queryRunner.query(
      `INSERT INTO "vaults" ("id", "userId", "name", "monthlyBudget", "description", "icon", "backgroundColor", "isDefault") VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        VAULTS.groceries,
        USER_ID,
        'Main Stash',
        500,
        'Everyday food and household',
        '🛒',
        '#22c55e',
        1,
        VAULTS.entertainment,
        USER_ID,
        'Hidden Savings',
        150,
        'Movies, games and fun',
        '🎮',
        '#a855f7',
        0,
        VAULTS.savings,
        USER_ID,
        'DPS',
        null,
        'Money set aside',
        '🏦',
        '#3b82f6',
        0,
      ],
    );

    // Tags
    await queryRunner.query(`INSERT INTO "tags" ("id", "userId", "name", "icon", "backgroundColor") VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`, [
      TAGS.food,
      USER_ID,
      'Food',
      '🍔',
      '#f97316',
      TAGS.rent,
      USER_ID,
      'Rent',
      '🏠',
      '#ef4444',
      TAGS.salary,
      USER_ID,
      'Salary',
      '💰',
      '#16a34a',
      TAGS.fun,
      USER_ID,
      'Fun',
      '🎉',
      '#ec4899',
    ]);

    // Transactions (mix of income and expense, spread across June 2026)
    await queryRunner.query(
      `INSERT INTO "expenses" ("id", "userId", "title", "amount", "type", "date", "vaultId") VALUES ` +
        `(?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)`,
      [
        EXPENSES.salary,
        USER_ID,
        'Monthly salary',
        4200,
        'income',
        '2026-06-01',
        null,
        EXPENSES.rent,
        USER_ID,
        'Apartment rent',
        1300,
        'expense',
        '2026-06-02',
        null,
        EXPENSES.groceries1,
        USER_ID,
        'Weekly groceries',
        86.5,
        'expense',
        '2026-06-05',
        VAULTS.groceries,
        EXPENSES.groceries2,
        USER_ID,
        'Supermarket run',
        54.2,
        'expense',
        '2026-06-12',
        VAULTS.groceries,
        EXPENSES.cinema,
        USER_ID,
        'Cinema night',
        32,
        'expense',
        '2026-06-14',
        VAULTS.entertainment,
        EXPENSES.transferToSavings,
        USER_ID,
        'Transfer to savings',
        600,
        'expense',
        '2026-06-15',
        VAULTS.savings,
        EXPENSES.freelance,
        USER_ID,
        'Freelance gig',
        750,
        'income',
        '2026-06-20',
        null,
      ],
    );

    // Link transactions to tags
    await queryRunner.query(`INSERT INTO "transaction_tags" ("transactionId", "tagId") VALUES (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)`, [
      EXPENSES.salary,
      TAGS.salary,
      EXPENSES.rent,
      TAGS.rent,
      EXPENSES.groceries1,
      TAGS.food,
      EXPENSES.groceries2,
      TAGS.food,
      EXPENSES.cinema,
      TAGS.fun,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { USER_ID, VAULTS, TAGS, EXPENSES } = SeedDummyData1782463500000;

    const expenseIds = Object.values(EXPENSES);
    const tagIds = Object.values(TAGS);
    const vaultIds = Object.values(VAULTS);

    await queryRunner.query(`DELETE FROM "transaction_tags" WHERE "transactionId" IN (${expenseIds.map(() => '?').join(', ')})`, expenseIds);
    await queryRunner.query(`DELETE FROM "expenses" WHERE "id" IN (${expenseIds.map(() => '?').join(', ')})`, expenseIds);
    await queryRunner.query(`DELETE FROM "tags" WHERE "id" IN (${tagIds.map(() => '?').join(', ')})`, tagIds);
    await queryRunner.query(`DELETE FROM "vaults" WHERE "id" IN (${vaultIds.map(() => '?').join(', ')})`, vaultIds);
    await queryRunner.query(`DELETE FROM "users" WHERE "id" = ?`, [USER_ID]);
  }
}
