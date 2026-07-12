import type { DebtDto, RecurringDto, TagDto, TransactionDto, User, UserPreferenceDto, VaultDto } from '@expense-tracker/shared';

export const BACKUP_FILE_CONTENT_TYPE = 'application/x-pocket-pixel-backup';
export const BACKUP_FILE_EXTENSION = 'ppbk';
export const BACKUP_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

export interface BackupPayload {
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
