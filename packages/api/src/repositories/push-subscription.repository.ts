import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { PushSubscription } from '../entities/PushSubscription.entity';

/**
 * Data-access layer for Web Push subscriptions. Follows the same revive-on-upsert
 * pattern as vault Gmail watchers: the `(userId, endpoint)` unique index still
 * counts soft-deleted rows, so callers must find and revive an existing
 * (possibly deleted) row rather than inserting a duplicate. The TypeORM
 * repository is resolved lazily per call so the class can be built before the
 * DataSource initializes and a different DataSource can be injected in tests.
 */
export class PushSubscriptionRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<PushSubscription> {
    return this.dataSource.getRepository(PushSubscription);
  }

  findManyForUser(userId: string): Promise<PushSubscription[]> {
    return this.repo.find({ where: { userId } });
  }

  /** Looks up a subscription by endpoint including soft-deleted rows, for upsert. */
  findByEndpoint(userId: string, endpoint: string): Promise<PushSubscription | null> {
    return this.repo.findOne({ where: { userId, endpoint }, withDeleted: true });
  }

  createEntity(data: Partial<PushSubscription>): PushSubscription {
    return this.repo.create(data);
  }

  save(subscription: PushSubscription): Promise<PushSubscription> {
    return this.repo.save(subscription);
  }

  /** Soft-deletes a subscription by endpoint, scoped to its owning user. */
  softDeleteByEndpoint(userId: string, endpoint: string): Promise<unknown> {
    return this.repo.softDelete({ userId, endpoint });
  }

  /** Soft-deletes a subscription by id — used to prune dead subscriptions on push failure. */
  softDelete(id: string): Promise<unknown> {
    return this.repo.softDelete({ id });
  }
}
