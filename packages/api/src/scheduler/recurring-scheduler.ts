import cron, { ScheduledTask } from 'node-cron';
import { AppDataSource } from '../data-source';
import { Expense, RecurrenceInterval } from '../entities/Expense.entity';
import { TransactionTag } from '../entities/TransactionTag.entity';
import { IsNull, Not } from 'typeorm';

const activeJobs = new Map<string, ScheduledTask>();

function buildCronExpression(interval: RecurrenceInterval, startDate: string): string {
  const d = new Date(startDate);
  const dom = d.getDate();
  const month = d.getMonth() + 1;
  const dow = d.getDay();

  switch (interval) {
    case 'daily':
      return '0 0 * * *';
    case 'weekly':
      return `0 0 * * ${dow}`;
    case 'monthly':
      return `0 0 ${dom} * *`;
    case 'yearly':
      return `0 0 ${dom} ${month} *`;
  }
}

async function fireRecurringTransaction(expenseId: string): Promise<void> {
  const repo = AppDataSource.getRepository(Expense);
  const tagsRepo = AppDataSource.getRepository(TransactionTag);

  const recurring = await repo.findOne({
    where: { id: expenseId, deletedAt: IsNull() },
    relations: ['transactionTags'],
  });

  if (!recurring) {
    cancelRecurring(expenseId);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today < recurring.startDate) return;

  if (today > recurring.endDate) {
    cancelRecurring(expenseId);
    return;
  }

  const transaction = repo.create({
    userId: recurring.userId,
    title: recurring.title,
    amount: recurring.amount,
    type: recurring.type,
    date: today,
    vaultId: recurring.vaultId,
  });

  const saved = await repo.save(transaction) as unknown as Expense;

  const tagIds = (recurring.transactionTags ?? []).map((tt) => tt.tagId);
  if (tagIds.length > 0) {
    await tagsRepo.save(tagIds.map((tagId) => tagsRepo.create({ transactionId: saved.id, tagId })));
  }
}

export function scheduleRecurring(expense: Expense): void {
  cancelRecurring(expense.id);

  const expression = buildCronExpression(expense.interval, expense.startDate);

  const task = cron.schedule(expression, () => {
    fireRecurringTransaction(expense.id).catch((err) =>
      console.error(`Recurring job ${expense.id} failed:`, err),
    );
  });

  activeJobs.set(expense.id, task);
}

export function cancelRecurring(expenseId: string): void {
  const task = activeJobs.get(expenseId);
  if (task) {
    task.stop();
    activeJobs.delete(expenseId);
  }
}

export async function restoreAllRecurringJobs(): Promise<void> {
  const repo = AppDataSource.getRepository(Expense);
  const today = new Date().toISOString().slice(0, 10);

  const active = await repo.find({
    where: { deletedAt: IsNull(), interval: Not(IsNull()) },
  });

  let scheduled = 0;
  for (const expense of active) {
    if (!expense.interval || !expense.startDate) continue;
    if (expense.endDate && today > expense.endDate) continue;
    scheduleRecurring(expense);
    scheduled++;
  }

  console.log(`Restored ${scheduled} recurring job(s)`);
}
