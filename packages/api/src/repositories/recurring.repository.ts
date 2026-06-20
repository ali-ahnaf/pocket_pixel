import { DataSource, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Expense } from '../entities/Expense.entity';
import { TransactionTag } from '../entities/TransactionTag.entity';
import { RecurringOccurrenceSkip } from '../entities/RecurringOccurrenceSkip.entity';

export const RECURRING_RELATIONS = ['transactionTags', 'transactionTags.tag', 'vault'] as const;

/**
 * Data-access layer for recurring expenses ("quests"), their tag links and the
 * per-occurrence skip records. TypeORM repositories are resolved lazily per
 * call so a different DataSource can be injected in tests.
 */
export class RecurringRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Expense> {
    return this.dataSource.getRepository(Expense);
  }

  private get tagLinkRepo(): Repository<TransactionTag> {
    return this.dataSource.getRepository(TransactionTag);
  }

  private get skipRepo(): Repository<RecurringOccurrenceSkip> {
    return this.dataSource.getRepository(RecurringOccurrenceSkip);
  }

  /**
   * Base filter shared by every recurring read: scope to the user and keep only
   * templates (those that carry an `interval`).
   */
  private baseWhere(userId: string): FindOptionsWhere<Expense> {
    return { userId, interval: Not(IsNull()) };
  }

  findManyForUser(userId: string): Promise<Expense[]> {
    return this.repo.find({
      where: this.baseWhere(userId),
      relations: [...RECURRING_RELATIONS],
      order: { title: 'ASC' },
      withDeleted: false,
    });
  }

  findActiveForUser(userId: string): Promise<Expense[]> {
    return this.repo.find({
      where: { ...this.baseWhere(userId), deletedAt: IsNull() },
      relations: [...RECURRING_RELATIONS],
    });
  }

  findOneWithRelations(userId: string, id: string): Promise<Expense | null> {
    return this.repo.findOne({ where: { id, userId }, relations: [...RECURRING_RELATIONS] });
  }

  findOneForUser(userId: string, id: string): Promise<Expense | null> {
    return this.repo.findOneBy({ id, userId });
  }

  createEntity(data: Partial<Expense>): Expense {
    return this.repo.create(data);
  }

  save(expense: Expense): Promise<Expense> {
    return this.repo.save(expense);
  }

  remove(expense: Expense): Promise<Expense> {
    return this.repo.remove(expense);
  }

  /** Applied occurrences (concrete transactions generated from the templates). */
  findAppliedOccurrences(userId: string, recurringIds: string[]): Promise<Expense[]> {
    return this.repo.find({
      where: { userId, sourceRecurringId: In(recurringIds), date: Not(IsNull()) },
      select: ['sourceRecurringId', 'date'],
    });
  }

  findAppliedOccurrence(userId: string, recurringId: string, date: string): Promise<Expense | null> {
    return this.repo.findOne({ where: { userId, sourceRecurringId: recurringId, date } });
  }

  findSkips(userId: string, recurringIds: string[]): Promise<RecurringOccurrenceSkip[]> {
    return this.skipRepo.find({ where: { userId, recurringId: In(recurringIds) } });
  }

  findSkip(recurringId: string, date: string): Promise<RecurringOccurrenceSkip | null> {
    return this.skipRepo.findOne({ where: { recurringId, date } });
  }

  async saveSkip(userId: string, recurringId: string, date: string): Promise<void> {
    await this.skipRepo.save(this.skipRepo.create({ recurringId, date, userId }));
  }

  /** Replace the tag links for a recurring template (or applied transaction). */
  async replaceTags(transactionId: string, tagIds: string[]): Promise<void> {
    await this.tagLinkRepo.delete({ transactionId });
    if (tagIds.length === 0) return;
    await this.tagLinkRepo.save(tagIds.map((tagId) => this.tagLinkRepo.create({ transactionId, tagId })));
  }

  async addTags(transactionId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    await this.tagLinkRepo.save(tagIds.map((tagId) => this.tagLinkRepo.create({ transactionId, tagId })));
  }
}
