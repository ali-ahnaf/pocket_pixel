export interface ParsedTransaction {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tagIds: string[];
  vaultId: string | null;
}
