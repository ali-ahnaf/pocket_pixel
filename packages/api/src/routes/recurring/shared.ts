import { In } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Expense, RecurrenceInterval } from "../../entities/Expense.entity";
import { Tag } from "../../entities/Tag.entity";
import { TransactionTag } from "../../entities/TransactionTag.entity";
import { RecurringOccurrenceSkip } from "../../entities/RecurringOccurrenceSkip.entity";

export const expensesRepo = () => AppDataSource.getRepository(Expense);
export const tagsRepo = () => AppDataSource.getRepository(Tag);
export const transactionTagsRepo = () => AppDataSource.getRepository(TransactionTag);
export const occurrenceSkipsRepo = () => AppDataSource.getRepository(RecurringOccurrenceSkip);

export const recurringRelations = ["transactionTags", "transactionTags.tag", "vault"] as const;

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateOnly(s: string): Date {
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

export function computeOccurrencesInMonth(
  interval: RecurrenceInterval,
  startDate: string,
  endDate: string | null,
  year: number,
  month: number,
): string[] {
  if (!interval || !startDate) return [];

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = new Date(Date.UTC(year, month - 1, lastDayOfMonth));

  const start = parseDateOnly(startDate);
  const end = endDate ? parseDateOnly(endDate) : null;

  const rangeStart = start > monthStart ? start : monthStart;
  const rangeEnd = end && end < monthEnd ? end : monthEnd;

  if (rangeStart > rangeEnd) return [];

  const dates: string[] = [];

  switch (interval) {
    case "daily": {
      const cur = new Date(rangeStart);
      while (cur <= rangeEnd) {
        dates.push(formatDate(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      break;
    }
    case "weekly": {
      const cur = new Date(start);
      while (cur < rangeStart) cur.setUTCDate(cur.getUTCDate() + 7);
      while (cur <= rangeEnd) {
        dates.push(formatDate(cur));
        cur.setUTCDate(cur.getUTCDate() + 7);
      }
      break;
    }
    case "monthly": {
      const dom = start.getUTCDate();
      if (dom <= lastDayOfMonth) {
        const candidate = new Date(Date.UTC(year, month - 1, dom));
        if (candidate >= rangeStart && candidate <= rangeEnd) {
          dates.push(formatDate(candidate));
        }
      }
      break;
    }
    case "yearly": {
      if (start.getUTCMonth() === month - 1) {
        const dom = start.getUTCDate();
        if (dom <= lastDayOfMonth) {
          const candidate = new Date(Date.UTC(year, month - 1, dom));
          if (candidate >= rangeStart && candidate <= rangeEnd) {
            dates.push(formatDate(candidate));
          }
        }
      }
      break;
    }
  }

  return dates;
}

export function normalizeTagIds(tagIds?: string[] | null) {
  if (Array.isArray(tagIds)) {
    return [...new Set(tagIds.filter(Boolean))];
  }

  return [];
}

export async function ensureUserTagsExist(userId: string, tagIds: string[]) {
  if (tagIds.length === 0) return true;

  const count = await tagsRepo().count({
    where: {
      id: In(tagIds),
      userId,
    },
  });

  return count === tagIds.length;
}

export async function replaceTransactionTags(transactionId: string, tagIds: string[]) {
  await transactionTagsRepo().delete({ transactionId });

  if (tagIds.length === 0) return;

  await transactionTagsRepo().save(
    tagIds.map((tagId) => transactionTagsRepo().create({ transactionId, tagId })),
  );
}

export async function findRecurringExpense(id: string, userId: string) {
  return expensesRepo().findOne({
    where: { id, userId },
    relations: [...recurringRelations],
  });
}

export function serializeRecurringExpense(expense: Expense & { transactionTags?: TransactionTag[] }) {
  const transactionTags = expense.transactionTags ?? [];
  const tags = transactionTags
    .map((transactionTag) => transactionTag.tag)
    .filter((tag): tag is Tag => Boolean(tag));
  const tagIds = transactionTags.map((transactionTag) => transactionTag.tagId);

  return {
    ...expense,
    tagIds,
    tags,
  };
}
