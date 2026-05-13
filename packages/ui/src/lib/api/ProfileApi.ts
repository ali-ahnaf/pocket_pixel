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

  createTransaction(userId: string, data: { amount: number; type?: string; tagIds?: string[]; title?: string; vaultId?: string | null; date?: string }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/users/${userId}/transactions`, data);
  }

  // Recurring quests
  getRecurringQuests(userId: string): Promise<ApiRecurringQuest[]> {
    return this.get<ApiRecurringQuest[]>(`/users/${userId}/recurring`);
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
}
