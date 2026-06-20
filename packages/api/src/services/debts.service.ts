import { Debt } from '../entities/Debt.entity';
import { TransactionType } from '../entities/Expense.entity';
import { AppError } from '../errors/app-error';
import { DebtsRepository } from '../repositories/debts.repository';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { debtsRepository, transactionsRepository } from '../repositories';
import { logger } from '.';

export interface CreateDebtInput {
  title: string;
  amount: number;
  type: TransactionType;
}

export interface ApplyDebtInput {
  vaultId?: string | null;
}

export interface DebtDto {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  createdAt: Date;
}

/**
 * Business logic for debts (dues). Repositories are injected (default to the
 * shared singletons) so the service can be unit-tested against mocks.
 */
export class DebtsService {
  constructor(
    private readonly debts: DebtsRepository = debtsRepository,
    private readonly transactions: TransactionsRepository = transactionsRepository,
  ) {}

  async list(userId: string): Promise<DebtDto[]> {
    const debts = await this.debts.findManyForUser(userId);
    return debts.map((debt) => this.toDto(debt));
  }

  async create(userId: string, input: CreateDebtInput): Promise<DebtDto> {
    const debt = this.debts.createEntity({
      userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
    });
    const saved = await this.debts.save(debt);
    logger.info('Created debt', { userId, debtId: saved.id });
    return this.toDto(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const debt = await this.debts.findOneForUser(userId, id);
    if (!debt) {
      throw new AppError('Due not found', 404);
    }

    await this.debts.remove(debt);
    logger.info('Deleted debt', { userId, debtId: id });
  }

  /**
   * Settle a debt: record it as a one-off transaction for today and delete the
   * debt. Returns the id of the created transaction.
   */
  async apply(userId: string, id: string, input: ApplyDebtInput): Promise<{ id: string }> {
    const debt = await this.debts.findOneForUser(userId, id);
    if (!debt) {
      throw new AppError('Due not found', 404);
    }

    const date = new Date().toISOString().split('T')[0];
    const expense = this.transactions.createEntity({
      userId,
      title: debt.title,
      amount: debt.amount,
      type: debt.type,
      date,
      vaultId: input.vaultId ?? null,
    });
    const saved = await this.transactions.save(expense);

    await this.debts.remove(debt);
    logger.info('Applied debt', { userId, debtId: id, transactionId: saved.id });
    return { id: saved.id };
  }

  private toDto(debt: Debt): DebtDto {
    return {
      id: debt.id,
      userId: debt.userId,
      title: debt.title,
      amount: Number(debt.amount),
      type: debt.type,
      createdAt: debt.createdAt,
    };
  }
}
