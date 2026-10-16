import type { TagKeywordRuleDto } from '@expense-tracker/shared';
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { Vault } from './Vault.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Per-vault Gmail bank-alert watcher. Attaches one Gmail label (plus an optional
 * subject substring and free-text guidance hint) to one vault; a vault may hold
 * several watchers, each with its own settings; a matching email
 * is enqueued as a `PendingGmailExpense` for the user to parse with AI. The set
 * of labels `GmailService.sync` polls is the union of `gmailLabelId` across the
 * user's (non-deleted) rows.
 *
 * Indexes:
 *  - `(userId, vaultId)` non-unique: lists a vault's watchers.
 *  - `(userId, gmailLabelId)` non-unique: a label may be shared across vaults and
 *    disambiguated by `subjectFilter` at match time; the index just speeds lookup.
 */
@Entity('vault_gmail_watchers')
@Index('IDX_vault_gmail_watcher_user_vault', ['userId', 'vaultId'])
@Index('IDX_vault_gmail_watcher_user_label', ['userId', 'gmailLabelId'])
export class VaultGmailWatcher extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  vaultId: string;

  @Column({ type: 'varchar' })
  gmailLabelId: string;

  @Column({ type: 'varchar', nullable: true })
  gmailLabelName: string | null;

  @Column({ type: 'varchar', nullable: true })
  subjectFilter: string | null;

  /** Optional free-text nudge appended to the AI extraction prompt. */
  @Column({ type: 'text', nullable: true })
  guidanceHint: string | null;

  /** Optional fixed day of month (1-31) the transaction is booked on instead of the email's date. */
  @Column({ type: 'integer', nullable: true })
  transactionDay: number | null;

  /** Optional keyword-to-tag rules applied before the AI tag pick. Stored as JSON text. */
  @Column({ type: 'simple-json', nullable: true })
  tagKeywords: TagKeywordRuleDto[] | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Vault, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaultId' })
  vault: Vault;
}
