import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Vault } from '../entities/Vault.entity';

/**
 * Data-access layer for vaults. The TypeORM repository is resolved lazily per
 * call so a different DataSource can be injected in tests.
 */
export class VaultsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Vault> {
    return this.dataSource.getRepository(Vault);
  }

  /** Base filter shared by every vault read: scope to the owning user. */
  private baseWhere(userId: string): FindOptionsWhere<Vault> {
    return { userId };
  }

  findManyForUser(userId: string): Promise<Vault[]> {
    return this.repo.find({ where: this.baseWhere(userId), order: { name: 'ASC' } });
  }

  findOneForUser(userId: string, id: string): Promise<Vault | null> {
    return this.repo.findOneBy({ ...this.baseWhere(userId), id });
  }

  createEntity(data: Partial<Vault>): Vault {
    return this.repo.create(data);
  }

  save(vault: Vault): Promise<Vault> {
    return this.repo.save(vault);
  }

  remove(vault: Vault): Promise<Vault> {
    return this.repo.remove(vault);
  }

  /**
   * Make a single vault the user's default in one transaction: clear the flag
   * across all the user's vaults, then set it on the chosen one.
   */
  async setDefault(userId: string, id: string): Promise<void> {
    await this.dataSource.manager.transaction(async (em) => {
      await em.update(Vault, { userId }, { isDefault: false });
      await em.update(Vault, { id, userId }, { isDefault: true });
    });
  }
}
