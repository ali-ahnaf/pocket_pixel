import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { Expense } from './Expense.entity';

@Entity('recurring_occurrence_skips')
export class RecurringOccurrenceSkip {
  @PrimaryColumn({ type: 'varchar' })
  recurringId: string;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Expense, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurringId' })
  recurring: Expense;
}
