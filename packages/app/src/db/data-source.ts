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
import { InitialSchema1791849600000 } from '../migrations/1791849600000-InitialSchema';
import { getRandomValues } from 'expo-crypto';

// TypeORM generates uuid primary keys with `uuid`, which needs crypto.getRandomValues. Hermes does not provide it.
globalThis.crypto ??= { getRandomValues } as unknown as Crypto;

export const AppDataSource = new DataSource({
  type: 'expo',
  driver: SQLite,
  database: 'pocket_pixel.db',
  entities: [User, Expense, Vault, Tag, TransactionTag, RecurringOccurrenceSkip, Debt, UserPreference],
  migrations: [InitialSchema1791849600000],
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
