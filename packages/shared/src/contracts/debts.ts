import { TransactionType } from './transactions';

export type DebtStatus = 'incomplete' | 'completed' | 'all';

export interface CreateDebtInput {
  title: string;
  amount: number;
  type: TransactionType;
  notes?: string | null;
  dueDate?: string | null;
}

export interface UpdateDebtInput {
  title?: string;
  amount?: number;
  type?: TransactionType;
  notes?: string | null;
  dueDate?: string | null;
}

export interface ApplyDebtInput {
  vaultId?: string | null;
  skipTransaction?: boolean;
}

export interface DebtDto {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  notes: string | null;
  dueDate: string | null;
  createdAt: Date;
  completed?: boolean;
  discarded?: boolean;
}
