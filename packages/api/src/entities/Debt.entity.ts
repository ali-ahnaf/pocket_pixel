import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { TransactionType } from './Expense.entity';
import { BaseEntity } from './BaseEntity';

@Entity('debts')
export class Debt extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', default: 'expense' })
  type: TransactionType;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
