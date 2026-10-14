import { Logger } from './logger.service';
import { TransactionsService } from './transactions.service';
import { UsersService } from './users.service';
import { TagsService } from './tags.service';
import { VaultsService } from './vaults.service';
import { DebtsService } from './debts.service';
import { AnalyticsService } from './analytics.service';
import { RecurringService } from './recurring.service';
import { PreferencesService } from './preferences.service';
import { AiService } from './ai.service';
import { AuthService } from './auth.service';
import { GmailService } from './gmail.service';
import { VaultWatchersService } from './vault-watchers.service';
import { PendingGmailExpenseService } from './pending-gmail-expense.service';
import { BackupService } from './backup.service';

export const logger = new Logger();
export const transactionsService = new TransactionsService();
export const usersService = new UsersService();
export const tagsService = new TagsService();
export const vaultsService = new VaultsService();
export const debtsService = new DebtsService();
export const analyticsService = new AnalyticsService();
export const recurringService = new RecurringService();
export const preferencesService = new PreferencesService();
export const aiService = new AiService();
export const authService = new AuthService();
export const gmailService = new GmailService();
export const vaultWatchersService = new VaultWatchersService();
// Built last: its defaults read gmailService, aiService and transactionsService above.
export const pendingGmailExpenseService = new PendingGmailExpenseService();
export const backupService = new BackupService();

export {
  Logger,
  TransactionsService,
  UsersService,
  TagsService,
  VaultsService,
  DebtsService,
  AnalyticsService,
  RecurringService,
  PreferencesService,
  AiService,
  AuthService,
  GmailService,
  VaultWatchersService,
  PendingGmailExpenseService,
  BackupService,
};
