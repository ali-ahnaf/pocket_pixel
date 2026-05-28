import { Between } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Expense } from "../../entities/Expense.entity";
import { TransactionTag } from "../../entities/TransactionTag.entity";

export const transactionsRepo = () => AppDataSource.getRepository(Expense);
export const transactionTagsRepo = () => AppDataSource.getRepository(TransactionTag);
export const transactionTimePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const transactionDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const transactionDateTimePattern = /^(\d{4}-\d{2}-\d{2})(?:[T\s]([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export function buildTransactionDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0);
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

  return Between(startDate, endDate);
}

export function getCurrentDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function normalizeTransactionDateInput(value?: string | null): { date?: string; time?: string } {
  if (!value) return {};
  if (transactionDatePattern.test(value)) return { date: value };

  const match = value.match(transactionDateTimePattern);
  if (!match) return {};

  const [, date, hours, minutes] = match;
  return {
    date,
    time: hours && minutes ? `${hours}:${minutes}` : undefined,
  };
}

export function compareTransactionsByMomentDesc<T extends { date: string; time?: string | null; createdAt?: Date | null }>(a: T, b: T) {
  const dateDiff = b.date.localeCompare(a.date);
  if (dateDiff !== 0) return dateDiff;

  if (a.time && b.time) {
    const timeDiff = b.time.localeCompare(a.time);
    if (timeDiff !== 0) return timeDiff;
  } else if (a.time) {
    return -1;
  } else if (b.time) {
    return 1;
  }

  if (a.createdAt && b.createdAt) {
    const createdAtDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (createdAtDiff !== 0) return createdAtDiff;
  } else if (a.createdAt) {
    return -1;
  } else if (b.createdAt) {
    return 1;
  }

  return 0;
}
