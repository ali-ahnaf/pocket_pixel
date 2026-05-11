import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";
import { TransactionType } from "./Expense.entity";

export type RecurrenceInterval = "weekly" | "monthly";

@Entity("recurring_transactions")
export class RecurringTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  userId: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "varchar", default: "expense" })
  type: TransactionType;

  @Column({ type: "varchar", nullable: true })
  tag: string | null;

  @Column({ type: "varchar" })
  interval: RecurrenceInterval;

  @Column({ type: "date" })
  startDate: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
