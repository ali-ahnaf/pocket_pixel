import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Expense } from './Expense.entity';
import { Tag } from './Tag.entity';

@Entity('transaction_tags')
export class TransactionTag {
  @PrimaryColumn({ type: 'varchar' })
  transactionId: string;

  @PrimaryColumn({ type: 'varchar' })
  tagId: string;

  @ManyToOne(() => Expense, (expense) => expense.transactionTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Expense;

  @ManyToOne(() => Tag, (tag) => tag.transactionTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}
