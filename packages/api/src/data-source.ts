import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Expense } from "./entities/Expense.entity";

import { Vault } from "./entities/Vault.entity";
import { Tag } from "./entities/Tag.entity";
import { TransactionTag } from "./entities/TransactionTag.entity";

const isTsNode = !!(process as any)[Symbol.for("ts-node.register.instance")];

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database:
    process.env.NODE_ENV === "production"
      ? "/var/www/pocket_pixel/pocket_pixel.sqlite"
      : "pocket_pixel.sqlite",
  entities: [User, Expense, Vault, Tag, TransactionTag],
  migrations: [isTsNode ? "src/migrations/*.ts" : "dist/migrations/*.js"],
  synchronize: false,
  logging: false,
});
