import { UtilService } from './util.service';
import { Logger } from './logger.service';
import { TransactionsService } from './transactions.service';
import { UsersService } from './users.service';
import { TagsService } from './tags.service';
import { VaultsService } from './vaults.service';
import { DebtsService } from './debts.service';
import { AnalyticsService } from './analytics.service';
import { RecurringService } from './recurring.service';
import { AuthService } from './auth.service';
import { PromptService } from './prompt.service';
import { WizardService } from './wizard.service';
import { PreferencesService } from './preferences.service';
import { BackupService } from './backup.service';

export const utilService = new UtilService();
export const logger = new Logger();
export const transactionsService = new TransactionsService();
export const usersService = new UsersService();
export const tagsService = new TagsService();
export const vaultsService = new VaultsService();
export const debtsService = new DebtsService();
export const analyticsService = new AnalyticsService();
export const recurringService = new RecurringService();
export const authService = new AuthService();
export const promptService = new PromptService();
export const wizardService = new WizardService();
export const preferencesService = new PreferencesService();
export const backupService = new BackupService();

export {
  UtilService,
  Logger,
  TransactionsService,
  UsersService,
  TagsService,
  VaultsService,
  DebtsService,
  AnalyticsService,
  RecurringService,
  AuthService,
  PromptService,
  WizardService,
  PreferencesService,
  BackupService,
};
