import { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../db/data-source';

/** Tables copied from a backup, parents first so foreign keys resolve. Deletes run in reverse. */
const RESTORED_TABLES = ['vaults', 'tags', 'expenses', 'transaction_tags', 'recurring_occurrence_skips', 'debts', 'user_preferences', 'vault_gmail_watchers', 'pending_gmail_expenses'] as const;
type RestoredTable = (typeof RESTORED_TABLES)[number];

export type RestoreCounts = Record<RestoredTable, number>;

interface ColumnInfo {
  name: string;
}

/**
 * Restores one user's rows from a SQLite backup file (the API's database or an app
 * database) by attaching it next to the device DB. Only columns that exist in both
 * schemas are copied, so an older backup restores into a newer schema with defaults
 * for the missing columns. The backup's `users` table is never copied: rows are
 * re-owned by the signed-in local user.
 */
export class BackupRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  /** Returns null when the backup has no user with this email. */
  async restoreUser(filePath: string, email: string, userId: string): Promise<RestoreCounts | null> {
    const runner = this.dataSource.createQueryRunner();
    // ATTACH is not allowed inside a transaction, so it wraps the transaction instead.
    await runner.query(`ATTACH DATABASE ? AS backup`, [filePath]);
    try {
      const [backupUser] = await runner.query(`SELECT id FROM backup.users WHERE lower(email) = ? AND deletedAt IS NULL`, [email]);
      if (!backupUser) return null;

      await runner.startTransaction();
      try {
        for (const table of [...RESTORED_TABLES].reverse()) {
          await runner.query(this.deleteSql(table), [userId]);
        }
        const counts = {} as RestoreCounts;
        for (const table of RESTORED_TABLES) {
          counts[table] = await this.copyTable(runner, table, backupUser.id, userId);
        }
        await runner.commitTransaction();
        return counts;
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
    } finally {
      await runner.query(`DETACH DATABASE backup`);
      await runner.release();
    }
  }

  private deleteSql(table: RestoredTable): string {
    // transaction_tags has no userId; it is owned through its transaction.
    if (table === 'transaction_tags') return `DELETE FROM main.transaction_tags WHERE transactionId IN (SELECT id FROM main.expenses WHERE userId = ?)`;
    return `DELETE FROM main.${table} WHERE userId = ?`;
  }

  private async copyTable(runner: QueryRunner, table: RestoredTable, backupUserId: string, userId: string): Promise<number> {
    const local: ColumnInfo[] = await runner.query(`PRAGMA main.table_info(${table})`);
    const backup: ColumnInfo[] = await runner.query(`PRAGMA backup.table_info(${table})`);
    if (backup.length === 0) return 0;

    const backupNames = new Set(backup.map((c) => c.name));
    const columns = local.map((c) => c.name).filter((name) => backupNames.has(name));
    const select = columns.map((name) => (name === 'userId' ? '? AS "userId"' : `b."${name}"`)).join(', ');
    const params = columns.includes('userId') ? [userId, backupUserId] : [backupUserId];
    const where = table === 'transaction_tags' ? `b.transactionId IN (SELECT id FROM backup.expenses WHERE userId = ?)` : `b.userId = ?`;

    await runner.query(`INSERT INTO main.${table} (${columns.map((name) => `"${name}"`).join(', ')}) SELECT ${select} FROM backup.${table} b WHERE ${where}`, params);
    const [{ count }] = await runner.query(`SELECT changes() AS count`);
    return Number(count);
  }
}
