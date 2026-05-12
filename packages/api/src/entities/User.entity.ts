import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Expense } from "./Expense.entity";

import { Vault } from "./Vault.entity";
import { Tag } from "./Tag.entity";

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

  @OneToMany(() => Vault, (v) => v.user)
  vaults: Vault[];

  @OneToMany(() => Tag, (t) => t.user)
  tags: Tag[];
}
