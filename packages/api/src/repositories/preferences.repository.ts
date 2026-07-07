import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { UserPreference } from '../entities/UserPreference.entity';

/**
 * Data-access layer for user preferences. The TypeORM repository is resolved
 * lazily per call so the class can be constructed before the DataSource is
 * initialized, and so a different DataSource can be injected in tests.
 */
export class PreferencesRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<UserPreference> {
    return this.dataSource.getRepository(UserPreference);
  }

  findByUserId(userId: string): Promise<UserPreference | null> {
    return this.repo.findOneBy({ userId });
  }

  createEntity(data: Partial<UserPreference>): UserPreference {
    return this.repo.create(data);
  }

  save(preference: UserPreference): Promise<UserPreference> {
    return this.repo.save(preference);
  }
}
