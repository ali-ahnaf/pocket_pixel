import { TagDto } from './tags';

export type TransactionType = 'expense' | 'income';

export interface ListTransactionsQuery {
  month?: number;
  year?: number;
  period?: 'all';
}

export interface CreateTransactionInput {
  amount: number;
  type?: TransactionType;
  tagIds?: string[];
  title?: string | null;
  vaultId?: string | null;
  date?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  tagIds?: string[];
  title?: string | null;
  vaultId?: string | null;
  date?: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  title: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  vaultId: string | null;
  vault: { id: string; name: string; icon: string | null } | null;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}
