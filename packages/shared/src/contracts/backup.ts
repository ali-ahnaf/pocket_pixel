import { DebtDto } from './debts';
import { UserPreferenceDto } from './preferences';
import { RecurringDto } from './recurring';
import { TagDto } from './tags';
import { TransactionDto } from './transactions';
import { User } from './user';
import { VaultDto } from './vaults';

export interface BackupTransactionDto extends TransactionDto {
  sourceRecurringId: string | null;
}

export interface BackupDebtDto extends Omit<DebtDto, 'createdAt'> {
  createdAt: string;
}

export interface BackupRecurringSkipDto {
  recurringId: string;
  date: string;
  userId: string;
}

export interface ExportDataResponse {
  appVersion: string;
  exportedAt: string;
  data: {
    user: User;
    debts: BackupDebtDto[];
    vaults: VaultDto[];
    transactions: BackupTransactionDto[];
    recurrings: RecurringDto[];
    recurringSkips: BackupRecurringSkipDto[];
    preference: UserPreferenceDto;
    tags: TagDto[];
  };
}

export interface ImportDataRequest {
  appVersion: string;
  exportedAt: string;
  data: {
    user: User;
    debts: BackupDebtDto[];
    vaults: VaultDto[];
    transactions: BackupTransactionDto[];
    recurrings: RecurringDto[];
    recurringSkips: BackupRecurringSkipDto[];
    preference: UserPreferenceDto;
    tags: TagDto[];
  };
}
