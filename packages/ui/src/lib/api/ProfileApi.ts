import ApiClient from './ApiClient';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ApiVault {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string | null;
  backgroundColor: string | null;
  isDefault: boolean;
  monthlyBudget: number | null;
}

export interface ApiTag {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  backgroundColor: string | null;
}

export interface ApiTransaction {
  id: string;
  userId: string;
  title: string | null;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  vaultId: string | null;
  vault: { id: string; name: string; icon: string | null } | null;
  tags: ApiTag[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiRecurringOccurrence {
  recurringId: string;
  date: string;
  title: string | null;
  amount: number;
  type: 'expense' | 'income';
  vaultId: string | null;
  vault: { id: string; name: string; icon: string | null } | null;
  tags: ApiTag[];
}

export interface ApiRecurringQuest {
  id: string;
  userId: string;
  title: string | null;
  amount: number;
  type: 'expense' | 'income';
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string | null;
  endDate: string | null;
  tagIds: string[];
  tags: ApiTag[];
  vaultId: string | null;
}

export interface ApiPromptResult {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  tagIds: string[];
}

export interface ApiTokenUsageModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
}

export interface ApiTokenUsage {
  periodStart: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
  models: ApiTokenUsageModel[];
}

export interface ApiDebt {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  notes: string | null;
  createdAt: string;

  completed: boolean;
}

export default class ProfileApi extends ApiClient {
  constructor(baseURL: string) {
    super(baseURL);
  }

  getUser(userId: string): Promise<ApiUser> {
    return this.get<ApiUser>(`/users/${userId}`);
  }

  updateUser(userId: string, data: { name?: string; email?: string; avatar?: string }): Promise<ApiUser> {
    return this.put<ApiUser>(`/users/${userId}`, data);
  }

  // Vaults
  getVaults(userId: string): Promise<ApiVault[]> {
    return this.get<ApiVault[]>(`/users/${userId}/vaults`);
  }

  createVault(userId: string, data: { name: string; description: string; icon?: string; backgroundColor?: string }): Promise<ApiVault> {
    return this.post<ApiVault>(`/users/${userId}/vaults`, data);
  }

  updateVault(userId: string, vaultId: string, data: { name?: string; description?: string; icon?: string | null; backgroundColor?: string | null }): Promise<ApiVault> {
    return this.put<ApiVault>(`/users/${userId}/vaults/${vaultId}`, data);
  }

  deleteVault(userId: string, vaultId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}/vaults/${vaultId}`);
  }

  setDefaultVault(userId: string, vaultId: string): Promise<ApiVault> {
    return this.put<ApiVault>(`/users/${userId}/vaults/${vaultId}/set-default`);
  }

  // AI prompt
  sendPrompt(userId: string, prompt: string): Promise<ApiPromptResult> {
    return this.post<ApiPromptResult>(`/users/${userId}/prompt`, { prompt });
  }

  getTokenUsage(userId: string): Promise<ApiTokenUsage> {
    return this.get<ApiTokenUsage>(`/users/${userId}/prompt/usage`);
  }

  // Tags
  getTags(userId: string): Promise<ApiTag[]> {
    return this.get<ApiTag[]>(`/users/${userId}/tags`);
  }

  createTag(userId: string, data: { name: string; icon?: string; backgroundColor?: string }): Promise<ApiTag> {
    return this.post<ApiTag>(`/users/${userId}/tags`, data);
  }

  updateTag(userId: string, tagId: string, data: { name?: string; icon?: string | null; backgroundColor?: string | null }): Promise<ApiTag> {
    return this.put<ApiTag>(`/users/${userId}/tags/${tagId}`, data);
  }

  deleteTag(userId: string, tagId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}/tags/${tagId}`);
  }

  // Transactions
  getTransactions(userId: string, month: number, year: number): Promise<ApiTransaction[]> {
    return this.get<ApiTransaction[]>(`/users/${userId}/transactions?month=${month}&year=${year}`);
  }

  getAllTransactions(userId: string): Promise<ApiTransaction[]> {
    return this.get<ApiTransaction[]>(`/users/${userId}/transactions?period=all`);
  }

  createTransaction(userId: string, data: { amount: number; type?: string; tagIds?: string[]; title?: string; vaultId?: string | null; date?: string }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/users/${userId}/transactions`, data);
  }

  updateTransaction(
    userId: string,
    transactionId: string,
    data: { amount?: number; type?: string; tagIds?: string[]; title?: string | null; vaultId?: string | null; date?: string },
  ): Promise<ApiTransaction> {
    return this.put<ApiTransaction>(`/users/${userId}/transactions/${transactionId}`, data);
  }

  deleteTransaction(userId: string, transactionId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}/transactions/${transactionId}`);
  }

  // Recurring quests
  getRecurringQuests(userId: string): Promise<ApiRecurringQuest[]> {
    return this.get<ApiRecurringQuest[]>(`/users/${userId}/recurring`);
  }

  getRecurringOccurrences(userId: string, month: number, year: number): Promise<ApiRecurringOccurrence[]> {
    return this.get<ApiRecurringOccurrence[]>(`/users/${userId}/recurring/occurrences?month=${month}&year=${year}`);
  }

  applyRecurringOccurrence(userId: string, questId: string, date: string): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/users/${userId}/recurring/${questId}/apply`, { date });
  }

  skipRecurringOccurrence(userId: string, questId: string, date: string): Promise<void> {
    return this.post<void>(`/users/${userId}/recurring/${questId}/skip`, { date });
  }

  createRecurringQuest(
    userId: string,
    data: { title: string; amount: number; type: string; interval: string; startDate?: string | null; endDate?: string | null; tagIds?: string[]; vaultId?: string | null },
  ): Promise<ApiRecurringQuest> {
    return this.post<ApiRecurringQuest>(`/users/${userId}/recurring`, data);
  }

  updateRecurringQuest(
    userId: string,
    questId: string,
    data: { title?: string; amount?: number; type?: string; interval?: string; startDate?: string | null; endDate?: string | null; tagIds?: string[]; vaultId?: string | null },
  ): Promise<ApiRecurringQuest> {
    return this.put<ApiRecurringQuest>(`/users/${userId}/recurring/${questId}`, data);
  }

  deleteRecurringQuest(userId: string, questId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}/recurring/${questId}`);
  }

  // Debts (dues)
  getDebts(userId: string, status: 'incomplete' | 'completed' | 'all' = 'incomplete'): Promise<ApiDebt[]> {
    return this.get<ApiDebt[]>(`/users/${userId}/debts?status=${status}`);
  }

  createDebt(userId: string, data: { title: string; amount: number; type: 'expense' | 'income'; notes?: string | null }): Promise<ApiDebt> {
    return this.post<ApiDebt>(`/users/${userId}/debts`, data);
  }

  updateDebt(userId: string, debtId: string, data: { title?: string; amount?: number; type?: 'expense' | 'income'; notes?: string | null }): Promise<ApiDebt> {
    return this.put<ApiDebt>(`/users/${userId}/debts/${debtId}`, data);
  }

  deleteDebt(userId: string, debtId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}/debts/${debtId}`);
  }

  applyDebt(userId: string, debtId: string, vaultId: string | null, skipTransaction?: boolean): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/users/${userId}/debts/${debtId}/apply`, skipTransaction === undefined ? { vaultId } : { vaultId, skipTransaction });
  }
}
