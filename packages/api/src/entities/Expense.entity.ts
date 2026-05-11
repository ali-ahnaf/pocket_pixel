import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User.entity";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "health"
  | "other";

@Entity("expenses")
export class Expense {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  userId: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "varchar",
    enum: ["food", "transport", "housing", "entertainment", "health", "other"],
  })
  category: ExpenseCategory;

  @Column({ type: "date" })
  date: string;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
