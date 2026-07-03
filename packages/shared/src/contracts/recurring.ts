import { TransactionType } from './transactions';
import { TagDto } from './tags';

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CreateRecurringInput {
  title: string;
  amount: number;
  type: TransactionType;
  interval: RecurrenceInterval;
  startDate: string;
  endDate?: string | null;
  tagIds?: string[] | null;
  vaultId?: string | null;
}

export interface UpdateRecurringInput {
  title?: string;
  amount?: number;
  type?: TransactionType;
  interval?: RecurrenceInterval;
  startDate?: string | null;
  endDate?: string | null;
  tagIds?: string[] | null;
  vaultId?: string | null;
}

export interface RecurringDto {
  id: string;
  userId: string;
  title: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  interval: RecurrenceInterval;
  startDate: string;
  endDate: string | null;
  vaultId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tagIds: string[];
  tags: TagDto[];
}

export interface OccurrenceDto {
  recurringId: string;
  date: string;
  title: string | null;
  amount: number;
  type: TransactionType;
  vaultId: string | null;
  vault: { id: string; name: string; icon: string | null } | null;
  tags: TagDto[];
}
