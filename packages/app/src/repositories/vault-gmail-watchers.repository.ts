import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
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

  findOneForUser(userId: string, id: string): Promise<VaultGmailWatcher | null> {
    return this.repo.findOne({ where: { userId, id } });
  }

  createEntity(data: Partial<VaultGmailWatcher>): VaultGmailWatcher {
    return this.repo.create(data);
  }

  save(watcher: VaultGmailWatcher): Promise<VaultGmailWatcher> {
    return this.repo.save(watcher);
  }

  /** Soft-deletes one watcher, scoped to its owning user. */
  softDelete(userId: string, id: string): Promise<unknown> {
    return this.repo.softDelete({ userId, id });
  }
}
