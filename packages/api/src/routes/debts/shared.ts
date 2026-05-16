import { AppDataSource } from "../../data-source";
import { Debt } from "../../entities/Debt.entity";
import { Expense } from "../../entities/Expense.entity";

export const debtsRepo = () => AppDataSource.getRepository(Debt);
export const expensesRepo = () => AppDataSource.getRepository(Expense);

export function serializeDebt(debt: Debt) {
  return {
    id: debt.id,
    userId: debt.userId,
    title: debt.title,
    amount: Number(debt.amount),
    type: debt.type,
    createdAt: debt.createdAt,
  };
}
