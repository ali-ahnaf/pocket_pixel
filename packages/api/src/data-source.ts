import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Expense } from "./entities/Expense.entity";

import { Vault } from "./entities/Vault.entity";
import { Tag } from "./entities/Tag.entity";
import { TransactionTag } from "./entities/TransactionTag.entity";

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: "expense_tracker.sqlite",
  entities: [User, Expense, Vault, Tag, TransactionTag],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: false,
});
