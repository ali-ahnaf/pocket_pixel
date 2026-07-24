import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { Vault } from './Vault.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Per-vault Gmail bank-alert watcher. Attaches one Gmail label (plus an optional
 * subject substring and free-text guidance hint) to one vault; a matching email
 * is enqueued as a `PendingGmailExpense` for the user to parse client-side,
 * not a user-supplied script. The set of watched labels for a user is derived as
 * the union of `gmailLabelId` across their (non-deleted) rows; `UserOAuthCredential`
 * keeps only the single-mailbox watch bookkeeping.
 *
 * Indexes:
 *  - `(userId, vaultId)` unique: at most one watcher per vault.
 *  - `(userId, gmailLabelId)` non-unique: a label may be shared across vaults and
 *    disambiguated by `subjectFilter` at match time; the index just speeds lookup.
 */
@Entity('vault_gmail_watchers')
@Index('IDX_vault_gmail_watcher_user_vault', ['userId', 'vaultId'], { unique: true })
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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Vault, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaultId' })
  vault: Vault;
}
