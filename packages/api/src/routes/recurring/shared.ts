import { AppDataSource } from "../../data-source";
import { Expense } from "../../entities/Expense.entity";

export const expensesRepo = () => AppDataSource.getRepository(Expense);
