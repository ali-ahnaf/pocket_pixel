export interface CreateVaultInput {
  name: string;
  description?: string;
  icon?: string | null;
  backgroundColor?: string | null;
  monthlyBudget?: number | null;
}

export interface UpdateVaultInput {
  name?: string;
  description?: string;
  icon?: string | null;
  backgroundColor?: string | null;
  monthlyBudget?: number | null;
}

export interface VaultDto {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string | null;
  backgroundColor: string | null;
  isDefault: boolean;
  monthlyBudget: number | null;
}
