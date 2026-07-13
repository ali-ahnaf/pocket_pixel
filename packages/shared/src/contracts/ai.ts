export interface ParsedTransaction {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tagIds: string[];
  vaultId: string | null;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
}

export interface UsageReport {
  periodStart: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
  models: ModelUsage[];
}
