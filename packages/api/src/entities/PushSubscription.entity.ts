import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

/**
 * One browser Web Push subscription for a user. `endpoint` is unique per the
 * push service (one row per registered browser/device); the `(userId, endpoint)`
 * unique index still counts soft-deleted rows, so re-subscribing after an
 * `unsubscribe` must revive the existing row rather than insert a duplicate.
 */
@Entity('push_subscriptions')
@Index('IDX_push_subscription_user_endpoint', ['userId', 'endpoint'], { unique: true })
export class PushSubscription extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  endpoint: string;

  @Column({ type: 'varchar' })
  p256dh: string;

  @Column({ type: 'varchar' })
  auth: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
