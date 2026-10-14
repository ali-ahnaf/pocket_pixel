import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Expense } from '../entities/Expense.entity';
import { Vault } from '../entities/Vault.entity';
import { Tag } from '../entities/Tag.entity';
import { TransactionTag } from '../entities/TransactionTag.entity';
import { RecurringOccurrenceSkip } from '../entities/RecurringOccurrenceSkip.entity';
import { Debt } from '../entities/Debt.entity';
import { UserPreference } from '../entities/UserPreference.entity';
import { VaultGmailWatcher } from '../entities/VaultGmailWatcher.entity';
import { PendingGmailExpense } from '../entities/PendingGmailExpense.entity';
import { InitialSchema1791849600000 } from '../migrations/1791849600000-InitialSchema';
import { AddGmailWatchers1791936000000 } from '../migrations/1791936000000-AddGmailWatchers';

// Stands in for src/db/data-source.ts under Jest (see moduleNameMapper). Each test file gets its own in-memory DB.
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: ':memory:',
  entities: [User, Expense, Vault, Tag, TransactionTag, RecurringOccurrenceSkip, Debt, UserPreference, VaultGmailWatcher, PendingGmailExpense],
  migrations: [InitialSchema1791849600000, AddGmailWatchers1791936000000],
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
