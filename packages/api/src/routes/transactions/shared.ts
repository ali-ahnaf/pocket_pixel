import { Between } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Expense } from "../../entities/Expense.entity";
import { TransactionTag } from "../../entities/TransactionTag.entity";

export const transactionsRepo = () => AppDataSource.getRepository(Expense);
export const transactionTagsRepo = () => AppDataSource.getRepository(TransactionTag);

export function buildTransactionDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0);
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

  return Between(startDate, endDate);
}
