import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { VaultGmailWatcher } from '../entities/VaultGmailWatcher.entity';

/**
 * Data-access layer for per-vault Gmail watchers. Follows the soft-delete pattern
 * scoped to `userId`: `softDelete` never hard-removes a row, and lookups exclude
 * soft-deleted rows by default. The TypeORM repository is resolved lazily per
 * call so the class can be built before the DataSource initializes and a
 * different DataSource can be injected in tests.
 */
export class VaultGmailWatchersRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<VaultGmailWatcher> {
    return this.dataSource.getRepository(VaultGmailWatcher);
  }

  findManyForUser(userId: string): Promise<VaultGmailWatcher[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  /**
   * Looks up a vault's watcher including soft-deleted rows. The `(userId, vaultId)`
   * unique index still counts soft-deleted rows, so callers must find and revive an
   * existing (possibly deleted) row on upsert rather than inserting a duplicate.
   */
  findByVault(userId: string, vaultId: string): Promise<VaultGmailWatcher | null> {
    return this.repo.findOne({ where: { userId, vaultId }, withDeleted: true });
  }

  createEntity(data: Partial<VaultGmailWatcher>): VaultGmailWatcher {
    return this.repo.create(data);
  }

  save(watcher: VaultGmailWatcher): Promise<VaultGmailWatcher> {
    return this.repo.save(watcher);
  }

  /** Soft-deletes the vault's watcher, scoped to its owning user. */
  softDelete(userId: string, vaultId: string): Promise<unknown> {
    return this.repo.softDelete({ userId, vaultId });
  }
}
