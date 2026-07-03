import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from './users.repository';
import { TagsRepository } from './tags.repository';
import { VaultsRepository } from './vaults.repository';
import { DebtsRepository } from './debts.repository';
import { AnalyticsRepository } from './analytics.repository';
import { RecurringRepository } from './recurring.repository';
import { RefreshTokensRepository } from './refresh-token.repository';

export const transactionsRepository = new TransactionsRepository();
export const usersRepository = new UsersRepository();
export const tagsRepository = new TagsRepository();
export const vaultsRepository = new VaultsRepository();
export const debtsRepository = new DebtsRepository();
export const analyticsRepository = new AnalyticsRepository();
export const recurringRepository = new RecurringRepository();
export const refreshTokensRepository = new RefreshTokensRepository();

export { TransactionsRepository, UsersRepository, TagsRepository, VaultsRepository, DebtsRepository, AnalyticsRepository, RecurringRepository, RefreshTokensRepository };
