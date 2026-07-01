import { CreateTransactionInput, ListTransactionsQuery, TransactionDto, UpdateTransactionInput } from '@expense-tracker/shared';
import { Expense } from '../entities/Expense.entity';
import { AppError } from '../errors/app-error';
import { TransactionsRepository, TransactionDateFilter } from '../repositories/transactions.repository';
import { transactionsRepository } from '../repositories';
import { logger } from '.';

/**
 * Business logic for one-off transactions. The repository is injected (defaults
 * to the shared singleton) so the service can be unit-tested against a mock.
 */
export class TransactionsService {
  constructor(private readonly transactions: TransactionsRepository = transactionsRepository) {}

  async list(userId: string, query: ListTransactionsQuery): Promise<TransactionDto[]> {
    const allTime = query.period === 'all';
    if (!allTime && (!query.month || !query.year)) {
      throw new AppError('month and year are required unless period=all', 400);
    }

    const filter: TransactionDateFilter = allTime ? { allTime: true } : { month: query.month, year: query.year };

    const transactions = await this.transactions.findManyForUser(userId, filter);
    logger.debug('Listed transactions', { userId, count: transactions.length, allTime });

    return transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      title: tx.title,
      amount: parseFloat(String(tx.amount)),
      type: tx.type,
      date: tx.date,
      vaultId: tx.vaultId,
      vault: tx.vault ? { id: tx.vault.id, name: tx.vault.name, icon: tx.vault.icon } : null,
      tags: tx.transactionTags?.map((tt) => tt.tag) ?? [],
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    }));
  }

  async create(userId: string, input: CreateTransactionInput): Promise<Expense> {
    const { tagIds = [], date, ...rest } = input;
    const transaction = this.transactions.createEntity({
      ...rest,
      userId,
      date: date ?? new Date().toISOString().split('T')[0],
    });

    const saved = await this.transactions.save(transaction);
    if (tagIds.length > 0) {
      await this.transactions.replaceTags(saved.id, tagIds);
    }

    logger.info('Created transaction', { userId, transactionId: saved.id });
    return saved;
  }

  async update(userId: string, id: string, input: UpdateTransactionInput): Promise<Expense> {
    const transaction = await this.transactions.findOneForUser(userId, id);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    const { tagIds, ...rest } = input;
    Object.assign(transaction, rest);
    const saved = await this.transactions.save(transaction);

    if (tagIds !== undefined) {
      await this.transactions.replaceTags(saved.id, tagIds);
    }

    logger.info('Updated transaction', { userId, transactionId: saved.id });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.transactions.findOneForUser(userId, id);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    await this.transactions.softDelete(id);
    logger.info('Deleted transaction', { userId, transactionId: id });
  }
}
