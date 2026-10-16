import * as SQLite from 'expo-sqlite';
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
import { AddWatcherTransactionDay1792022400000 } from '../migrations/1792022400000-AddWatcherTransactionDay';
import { AddWatcherTagKeywords1792108800000 } from '../migrations/1792108800000-AddWatcherTagKeywords';
import { AddMonthlyRecap1792195200000 } from '../migrations/1792195200000-AddMonthlyRecap';
import { getRandomValues } from 'expo-crypto';

// TypeORM generates uuid primary keys with `uuid`, which needs crypto.getRandomValues. Hermes does not provide it.
globalThis.crypto ??= { getRandomValues } as unknown as Crypto;

export const AppDataSource = new DataSource({
  type: 'expo',
  driver: SQLite,
  database: 'pocket_pixel.db',
  entities: [User, Expense, Vault, Tag, TransactionTag, RecurringOccurrenceSkip, Debt, UserPreference, VaultGmailWatcher, PendingGmailExpense],
  migrations: [InitialSchema1791849600000, AddGmailWatchers1791936000000, AddWatcherTransactionDay1792022400000, AddWatcherTagKeywords1792108800000, AddMonthlyRecap1792195200000],
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
