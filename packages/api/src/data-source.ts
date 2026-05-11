import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Expense } from "./entities/Expense.entity";
import { RecurringTransaction } from "./entities/RecurringTransaction.entity";
import { Vault } from "./entities/Vault.entity";

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: "expense_tracker.sqlite",
  entities: [User, Expense, RecurringTransaction, Vault],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
});
