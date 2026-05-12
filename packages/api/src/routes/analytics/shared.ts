import { AppDataSource } from "../../data-source";
import { Expense } from "../../entities/Expense.entity";

export const analyticsRepo = () => AppDataSource.getRepository(Expense);
