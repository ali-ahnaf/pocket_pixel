import { Vault } from '../entities/Vault.entity';
import { AppError } from '../errors/app-error';
import { VaultsRepository } from '../repositories/vaults.repository';
import { UsersRepository } from '../repositories/users.repository';
import { vaultsRepository, usersRepository } from '../repositories';
import { logger } from '.';

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

/**
 * Business logic for vaults. Repositories are injected (default to the shared
 * singletons) so the service can be unit-tested against mocks.
 */
export class VaultsService {
  constructor(
    private readonly vaults: VaultsRepository = vaultsRepository,
    private readonly users: UsersRepository = usersRepository,
  ) {}

  list(userId: string): Promise<Vault[]> {
    return this.vaults.findManyForUser(userId);
  }

  async create(userId: string, input: CreateVaultInput): Promise<Vault> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const vault = this.vaults.createEntity({
      userId,
      name: input.name,
      description: input.description ?? '',
      icon: input.icon ?? null,
      backgroundColor: input.backgroundColor ?? null,
      isDefault: false,
      monthlyBudget: input.monthlyBudget ?? null,
    });
    const saved = await this.vaults.save(vault);
    logger.info('Created vault', { userId, vaultId: saved.id });
    return saved;
  }

  async update(userId: string, id: string, input: UpdateVaultInput): Promise<Vault> {
    const vault = await this.vaults.findOneForUser(userId, id);
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    if (input.name !== undefined) vault.name = input.name;
    if (input.description !== undefined) vault.description = input.description;
    if (input.icon !== undefined) vault.icon = input.icon;
    if (input.backgroundColor !== undefined) vault.backgroundColor = input.backgroundColor;
    if (input.monthlyBudget !== undefined) vault.monthlyBudget = input.monthlyBudget;

    const saved = await this.vaults.save(vault);
    logger.info('Updated vault', { userId, vaultId: saved.id });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const vault = await this.vaults.findOneForUser(userId, id);
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    await this.vaults.remove(vault);
    logger.info('Deleted vault', { userId, vaultId: id });
  }

  async setDefault(userId: string, id: string): Promise<Vault> {
    const vault = await this.vaults.findOneForUser(userId, id);
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    await this.vaults.setDefault(userId, id);
    logger.info('Set default vault', { userId, vaultId: id });
    return { ...vault, isDefault: true };
  }
}
