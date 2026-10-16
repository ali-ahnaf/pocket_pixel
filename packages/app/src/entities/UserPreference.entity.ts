import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

@Entity('user_preferences')
export class UserPreference extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  userId: string;

  @Column({ type: 'boolean', default: false })
  showIncome: boolean;

  @Column({ type: 'boolean', default: false })
  showExpense: boolean;

  @Column({ type: 'boolean', default: false })
  pushEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  aiTransactionEntryEnabled: boolean;

  // Day of the month (1-28) the monthly recap arrives; null turns it off.
  @Column({ type: 'integer', nullable: true })
  monthlyRecapDay: number | null;

  // `YYYY-MM` of the last month a recap was delivered for, so each month is recapped once.
  @Column({ type: 'varchar', nullable: true })
  lastRecapMonth: string | null;

  // When on, an AI-parsed Gmail email is shown in the add-transaction form for the user to approve before it is logged.
  @Column({ type: 'boolean', default: false })
  requireAiParseApproval: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
