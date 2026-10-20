import type { TagKeywordRuleDto } from '@expense-tracker/shared';
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { Vault } from './Vault.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Gmail bank-alert review queue, filled by `GmailService.sync`. Stores only a
 * pointer to a Gmail message (`gmailMessageId` plus the matched watcher's
 * `vaultId` and `guidanceHint`) and the message `subject`, so the review list
 * can identify an item without a Gmail round-trip. The email body is re-fetched
 * from Gmail when the user opens the item and is never stored.
 *
 * The `(userId, gmailMessageId)` unique index counts soft-deleted rows too, so a
 * message that was already resolved or dismissed is never enqueued again when a
 * later sync sees it.
 *
 * No `status` column: the row is soft-deleted (`BaseEntity.deletedAt`) on
 * resolve (parsed into a transaction) or dismiss.
 */
@Entity('pending_gmail_expenses')
@Index('IDX_pending_gmail_expense_user_message', ['userId', 'gmailMessageId'], { unique: true })
export class PendingGmailExpense extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  gmailMessageId: string;

  @Column({ type: 'varchar' })
  vaultId: string;

  /** Nullable: rows enqueued before the subject was captured have none. */
  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  @Column({ type: 'varchar', nullable: true })
  guidanceHint: string | null;

  @Column({ type: 'integer', nullable: true })
  transactionDay: number | null;

  /** ISO time Gmail received the email. Nullable: rows enqueued before it was captured have none. */
  @Column({ type: 'varchar', nullable: true })
  receivedAt: string | null;

  @Column({ type: 'simple-json', nullable: true })
  tagKeywords: TagKeywordRuleDto[] | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Vault, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaultId' })
  vault: Vault;
}
