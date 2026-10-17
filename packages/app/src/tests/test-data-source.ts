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
import { Adventure } from '../entities/Adventure.entity';
import { AdventureItem } from '../entities/AdventureItem.entity';
import { InitialSchema1791849600000 } from '../migrations/1791849600000-InitialSchema';
import { AddGmailWatchers1791936000000 } from '../migrations/1791936000000-AddGmailWatchers';
import { AddWatcherTransactionDay1792022400000 } from '../migrations/1792022400000-AddWatcherTransactionDay';
import { AddWatcherTagKeywords1792108800000 } from '../migrations/1792108800000-AddWatcherTagKeywords';
import { AddMonthlyRecap1792195200000 } from '../migrations/1792195200000-AddMonthlyRecap';
import { AllowManyWatchersPerVault1792281600000 } from '../migrations/1792281600000-AllowManyWatchersPerVault';
import { AddRequireAiParseApproval1792368000000 } from '../migrations/1792368000000-AddRequireAiParseApproval';
import { AddAdventures1792454400000 } from '../migrations/1792454400000-AddAdventures';

// Stands in for src/db/data-source.ts under Jest (see moduleNameMapper). Each test file gets its own in-memory DB.
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: ':memory:',
  entities: [User, Expense, Vault, Tag, TransactionTag, RecurringOccurrenceSkip, Debt, UserPreference, VaultGmailWatcher, PendingGmailExpense, Adventure, AdventureItem],
  migrations: [
    InitialSchema1791849600000,
    AddGmailWatchers1791936000000,
    AddWatcherTransactionDay1792022400000,
    AddWatcherTagKeywords1792108800000,
    AddMonthlyRecap1792195200000,
    AllowManyWatchersPerVault1792281600000,
    AddRequireAiParseApproval1792368000000,
    AddAdventures1792454400000,
  ],
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
