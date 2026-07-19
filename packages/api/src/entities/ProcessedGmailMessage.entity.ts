import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Idempotency ledger for the Gmail push pipeline. One row per Gmail message id we
 * have already handled for a user, recorded regardless of whether the message
 * produced a transaction (a non-bank message is still "processed"). Pub/Sub
 * redelivers on any non-2xx, so the history diff checks this table before acting
 * to guarantee a replayed `messageId` never double-inserts a transaction.
 *
 * Scoped by `userId` because Gmail message ids are only unique within a mailbox.
 */
@Entity('processed_gmail_messages')
@Index('IDX_processed_gmail_user_message', ['userId', 'gmailMessageId'], { unique: true })
export class ProcessedGmailMessage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  gmailMessageId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
