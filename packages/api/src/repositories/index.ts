import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from './users.repository';
import { TagsRepository } from './tags.repository';
import { VaultsRepository } from './vaults.repository';
import { DebtsRepository } from './debts.repository';
import { AnalyticsRepository } from './analytics.repository';
import { RecurringRepository } from './recurring.repository';
import { PreferencesRepository } from './preferences.repository';
import { UserOAuthCredentialRepository } from './user-oauth-credential.repository';
import { ProcessedGmailMessageRepository } from './processed-gmail-message.repository';
import { VaultGmailWatchersRepository } from './vault-gmail-watchers.repository';

export const transactionsRepository = new TransactionsRepository();
export const usersRepository = new UsersRepository();
export const tagsRepository = new TagsRepository();
export const vaultsRepository = new VaultsRepository();
export const debtsRepository = new DebtsRepository();
export const analyticsRepository = new AnalyticsRepository();
export const recurringRepository = new RecurringRepository();
export const preferencesRepository = new PreferencesRepository();
export const userOAuthCredentialRepository = new UserOAuthCredentialRepository();
export const processedGmailMessageRepository = new ProcessedGmailMessageRepository();
export const vaultGmailWatchersRepository = new VaultGmailWatchersRepository();

export {
  TransactionsRepository,
  UsersRepository,
  TagsRepository,
  VaultsRepository,
  DebtsRepository,
  AnalyticsRepository,
  RecurringRepository,
  PreferencesRepository,
  UserOAuthCredentialRepository,
  ProcessedGmailMessageRepository,
  VaultGmailWatchersRepository,
};
