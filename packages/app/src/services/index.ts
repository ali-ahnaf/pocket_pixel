import { Logger } from './logger.service';
import { TransactionsService } from './transactions.service';
import { UsersService } from './users.service';
import { TagsService } from './tags.service';
import { VaultsService } from './vaults.service';
import { DebtsService } from './debts.service';
import { AnalyticsService } from './analytics.service';
import { RecurringService } from './recurring.service';
import { PreferencesService } from './preferences.service';

export const logger = new Logger();
export const transactionsService = new TransactionsService();
export const usersService = new UsersService();
export const tagsService = new TagsService();
export const vaultsService = new VaultsService();
export const debtsService = new DebtsService();
export const analyticsService = new AnalyticsService();
export const recurringService = new RecurringService();
export const preferencesService = new PreferencesService();

export { Logger, TransactionsService, UsersService, TagsService, VaultsService, DebtsService, AnalyticsService, RecurringService, PreferencesService };
