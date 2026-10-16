import { CreateDebtInput, UpdateDebtInput, ApplyDebtInput, DebtDto, DebtStatus } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { debtNotifier, type DebtNotifier } from '../lib/notifications/debt-notifier';
import { DebtsRepository } from '../repositories/debts.repository';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { debtsRepository, transactionsRepository } from '../repositories';
import type { Debt } from '../entities/Debt.entity';
import { logger } from '.';

export type { CreateDebtInput, UpdateDebtInput, ApplyDebtInput, DebtDto, DebtStatus };

// Local time on the due date when the nudge goes off.
const NUDGE_HOUR = 9;

/**
 * Words the due-date nudge. For money owed to the user (`income`) it also drafts a polite
 * message the user can send to the other person; tapping the notification shares it.
 */
export function draftDebtNudge(debt: Pick<Debt, 'title' | 'amount' | 'type'>): { title: string; body: string; draft: string | null } {
  const amount = Number(debt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (debt.type === 'income') {
    const draft = `Hi! Just a friendly reminder about ${debt.title} (${amount}), which is due today. Whenever it suits you is fine. Thank you!`;
    return { title: `${debt.title} is due today`, body: `Tap to send a reminder: "${draft}"`, draft };
  }
  return { title: `${debt.title} is due today`, body: `A gentle nudge: you planned to pay ${amount} today.`, draft: null };
}

/**
 * Business logic for debts (dues). Repositories are injected (default to the
 * shared singletons) so the service can be unit-tested against mocks.
 */
export class DebtsService {
  constructor(
    private readonly debts: DebtsRepository = debtsRepository,
    private readonly transactions: TransactionsRepository = transactionsRepository,
    private readonly notifier: DebtNotifier = debtNotifier,
  ) {}

  /**
   * Schedules the due-date nudge, or cancels it when there is no future due date. A failure
   * is only logged: the debt is already saved and must not be lost over a notification.
   */
  private async syncNudge(debt: Debt): Promise<void> {
    const [year, month, day] = (debt.dueDate ?? '').split('-').map(Number);
    const at = debt.dueDate ? new Date(year, month - 1, day, NUDGE_HOUR) : null;
    try {
      if (!at || at <= new Date()) {
        await this.notifier.cancel(debt.id);
        return;
      }
      const { title, body, draft } = draftDebtNudge(debt);
      await this.notifier.schedule(debt.id, at, title, body, draft);
    } catch (err) {
      logger.warn('Debt nudge not scheduled', { debtId: debt.id, err });
    }
  }

  async list(userId: string, status: DebtStatus = 'incomplete'): Promise<DebtDto[]> {
    const debts = await this.debts.findManyForUser(userId, status);
    return debts.map((debt) => ({
      id: debt.id,
      userId: debt.userId,
      title: debt.title,
      amount: Number(debt.amount),
      type: debt.type,
      notes: debt.notes ?? null,
      dueDate: debt.dueDate ?? null,
      createdAt: debt.createdAt,
      completed: debt.completed,
      // A soft-deleted due that was never applied was discarded by the user.
      discarded: debt.deletedAt != null && !debt.completed,
    }));
  }

  async create(userId: string, input: CreateDebtInput): Promise<DebtDto> {
    const debt = this.debts.createEntity({
      userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      notes: input.notes ?? null,
      dueDate: input.dueDate ?? null,
    });
    const saved = await this.debts.save(debt);
    await this.syncNudge(saved);
    logger.info('Created debt', { userId, debtId: saved.id });
    return {
      id: saved.id,
      userId: saved.userId,
      title: saved.title,
      amount: Number(saved.amount),
      type: saved.type,
      notes: saved.notes ?? null,
      dueDate: saved.dueDate ?? null,
      createdAt: saved.createdAt,
    };
  }

  async update(userId: string, id: string, input: UpdateDebtInput): Promise<DebtDto> {
    const debt = await this.debts.findOneForUser(userId, id);
    if (!debt) {
      throw new AppError('Due not found', 404);
    }

    if (input.title !== undefined) debt.title = input.title;
    if (input.amount !== undefined) debt.amount = input.amount;
    if (input.type !== undefined) debt.type = input.type;
    if (input.notes !== undefined) debt.notes = input.notes;
    if (input.dueDate !== undefined) debt.dueDate = input.dueDate;

    const saved = await this.debts.save(debt);
    await this.syncNudge(saved);
    logger.info('Updated debt', { userId, debtId: id });
    return {
      id: saved.id,
      userId: saved.userId,
      title: saved.title,
      amount: Number(saved.amount),
      type: saved.type,
      notes: saved.notes ?? null,
      dueDate: saved.dueDate ?? null,
      createdAt: saved.createdAt,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const debt = await this.debts.findOneForUser(userId, id);
    if (!debt) {
      throw new AppError('Due not found', 404);
    }

    await this.debts.remove(debt);
    await this.notifier.cancel(id).catch((err) => logger.warn('Debt nudge not cancelled', { debtId: id, err }));
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

    // Persist the completed flag first: softRemove only writes deletedAt, so it
    // would drop this in-memory change and the settled due would look discarded.
    debt.completed = true;
    await this.debts.save(debt);
    await this.notifier.cancel(id).catch((err) => logger.warn('Debt nudge not cancelled', { debtId: id, err }));

    if (input.skipTransaction) {
      await this.debts.remove(debt);

      logger.info('Applied debt without transaction', {
        userId,
        debtId: id,
      });

      return { id: debt.id };
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
}
