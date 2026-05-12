import ApiClient, { ForwardResponse } from './ApiClient';

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

export interface ApiRecurringQuest {
  id: string;
  userId: string;
  title: string | null;
  amount: number;
  type: 'expense' | 'income';
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string | null;
  endDate: string | null;
  tagId: string | null;
  tag: ApiTag | null;
  vaultId: string | null;
}

export default class ProfileApi extends ApiClient {
  constructor(baseURL: string) {
    super(baseURL);
  }

  getUser(userId: string): Promise<ForwardResponse<ApiUser>> {
    return this.get<ApiUser>(`/users/${userId}`);
  }

  updateUser(userId: string, data: { name?: string; email?: string; avatar?: string }): Promise<ForwardResponse<ApiUser>> {
    return this.put<ApiUser>(`/users/${userId}`, data);
  }

  // Vaults
  getVaults(userId: string): Promise<ForwardResponse<ApiVault[]>> {
    return this.get<ApiVault[]>(`/users/${userId}/vaults`);
  }

  createVault(userId: string, data: { name: string; description: string; icon?: string; backgroundColor?: string }): Promise<ForwardResponse<ApiVault>> {
    return this.post<ApiVault>(`/users/${userId}/vaults`, data);
  }

  updateVault(userId: string, vaultId: string, data: { name?: string; description?: string; icon?: string | null; backgroundColor?: string | null }): Promise<ForwardResponse<ApiVault>> {
    return this.put<ApiVault>(`/users/${userId}/vaults/${vaultId}`, data);
  }

  deleteVault(userId: string, vaultId: string): Promise<ForwardResponse<void>> {
    return this.delete<void>(`/users/${userId}/vaults/${vaultId}`);
  }

  setDefaultVault(userId: string, vaultId: string): Promise<ForwardResponse<ApiVault>> {
    return this.put<ApiVault>(`/users/${userId}/vaults/${vaultId}/set-default`);
  }

  // Tags
  getTags(userId: string): Promise<ForwardResponse<ApiTag[]>> {
    return this.get<ApiTag[]>(`/users/${userId}/tags`);
  }

  createTag(userId: string, data: { name: string; icon?: string; backgroundColor?: string }): Promise<ForwardResponse<ApiTag>> {
    return this.post<ApiTag>(`/users/${userId}/tags`, data);
  }

  updateTag(userId: string, tagId: string, data: { name?: string; icon?: string | null; backgroundColor?: string | null }): Promise<ForwardResponse<ApiTag>> {
    return this.put<ApiTag>(`/users/${userId}/tags/${tagId}`, data);
  }

  deleteTag(userId: string, tagId: string): Promise<ForwardResponse<void>> {
    return this.delete<void>(`/users/${userId}/tags/${tagId}`);
  }

  // Recurring quests
  getRecurringQuests(userId: string): Promise<ForwardResponse<ApiRecurringQuest[]>> {
    return this.get<ApiRecurringQuest[]>(`/users/${userId}/recurring`);
  }

  createRecurringQuest(
    userId: string,
    data: { title: string; amount: number; type: string; interval: string; startDate?: string | null; endDate?: string | null; tagId?: string | null; vaultId?: string | null },
  ): Promise<ForwardResponse<ApiRecurringQuest>> {
    return this.post<ApiRecurringQuest>(`/users/${userId}/recurring`, data);
  }

  updateRecurringQuest(
    userId: string,
    questId: string,
    data: { title?: string; amount?: number; type?: string; interval?: string; startDate?: string | null; endDate?: string | null; tagId?: string | null; vaultId?: string | null },
  ): Promise<ForwardResponse<ApiRecurringQuest>> {
    return this.put<ApiRecurringQuest>(`/users/${userId}/recurring/${questId}`, data);
  }

  deleteRecurringQuest(userId: string, questId: string): Promise<ForwardResponse<void>> {
    return this.delete<void>(`/users/${userId}/recurring/${questId}`);
  }
}
