import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Expense } from "./Expense.entity";
import { RecurringTransaction } from "./RecurringTransaction.entity";
import { Vault } from "./Vault.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => RecurringTransaction, (r) => r.user)
  recurringTransactions: RecurringTransaction[];

  @OneToMany(() => Vault, (v) => v.user)
  vaults: Vault[];
}
