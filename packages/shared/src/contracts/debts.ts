import { TransactionType } from './transactions';

export interface CreateDebtInput {
  title: string;
  amount: number;
  type: TransactionType;
  notes?: string | null;
}

export interface UpdateDebtInput {
  title?: string;
  amount?: number;
  type?: TransactionType;
  notes?: string | null;
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
  createdAt: Date;
  completed?: boolean;
}
