import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Adventure } from '../entities/Adventure.entity';
import { AdventureItem } from '../entities/AdventureItem.entity';

/** Raw row of the adventure totals query. SQLite hands back numbers or strings depending on the driver, so callers wrap them in Number(). */
export interface AdventureTotalsRow {
  id: string;
  userId: string;
  name: string;
  flavorText: string | null;
  fund: number | string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  isComplete: number | string;
  plannedTotal: number | string;
  spent: number | string;
  itemCount: number | string;
  boughtCount: number | string;
}

/**
 * Data-access layer for adventures and their items. The TypeORM repositories are
 * resolved lazily per call so a different DataSource can be injected in tests.
 */
export class AdventuresRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Adventure> {
    return this.dataSource.getRepository(Adventure);
  }

  private get itemRepo(): Repository<AdventureItem> {
    return this.dataSource.getRepository(AdventureItem);
  }

  /** One row per adventure with its item totals. `today` is a YYYY-MM-DD string, so `<` compares dates correctly and a NULL endDate never completes. */
  private totalsQuery(userId: string, today: string): SelectQueryBuilder<Adventure> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoin(AdventureItem, 'i', 'i.adventureId = a.id AND i.deletedAt IS NULL')
      .select('a.id', 'id')
      .addSelect('a.userId', 'userId')
      .addSelect('a.name', 'name')
      .addSelect('a.flavorText', 'flavorText')
      .addSelect('a.fund', 'fund')
      .addSelect('a.startDate', 'startDate')
      .addSelect('a.endDate', 'endDate')
      .addSelect('a.completedAt', 'completedAt')
      .addSelect('CASE WHEN a.completedAt IS NOT NULL OR a.endDate < :today THEN 1 ELSE 0 END', 'isComplete')
      .addSelect('ROUND(COALESCE(SUM(i.plannedCost), 0), 2)', 'plannedTotal')
      .addSelect('ROUND(COALESCE(SUM(CASE WHEN i.isBought = 1 THEN i.actualCost END), 0), 2)', 'spent')
      .addSelect('COUNT(i.id)', 'itemCount')
      .addSelect('COALESCE(SUM(CASE WHEN i.isBought = 1 THEN 1 ELSE 0 END), 0)', 'boughtCount')
      .where('a.userId = :userId AND a.deletedAt IS NULL', { userId, today })
      .groupBy('a.id');
  }

  /** Active adventures first, then complete ones, newest created first within each. */
  findManyWithTotals(userId: string, today: string): Promise<AdventureTotalsRow[]> {
    return this.totalsQuery(userId, today).orderBy('isComplete', 'ASC').addOrderBy('a.createdAt', 'DESC').getRawMany<AdventureTotalsRow>();
  }

  async findOneWithTotals(userId: string, id: string, today: string): Promise<AdventureTotalsRow | null> {
    const row = await this.totalsQuery(userId, today).andWhere('a.id = :id', { id }).getRawOne<AdventureTotalsRow>();
    return row ?? null;
  }

  findOneForUser(userId: string, id: string): Promise<Adventure | null> {
    return this.repo.findOneBy({ userId, id });
  }

  createAdventure(data: Partial<Adventure>): Adventure {
    return this.repo.create(data);
  }

  saveAdventure(adventure: Adventure): Promise<Adventure> {
    return this.repo.save(adventure);
  }

  findItems(userId: string, adventureId: string): Promise<AdventureItem[]> {
    return this.itemRepo.find({ where: { userId, adventureId }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  findItemForUser(userId: string, id: string): Promise<AdventureItem | null> {
    return this.itemRepo.findOneBy({ userId, id });
  }

  async nextSortOrder(userId: string, adventureId: string): Promise<number> {
    return ((await this.itemRepo.maximum('sortOrder', { userId, adventureId })) ?? -1) + 1;
  }

  createItem(data: Partial<AdventureItem>): AdventureItem {
    return this.itemRepo.create(data);
  }

  saveItem(item: AdventureItem): Promise<AdventureItem> {
    return this.itemRepo.save(item);
  }

  removeItem(item: AdventureItem): Promise<AdventureItem> {
    return this.itemRepo.softRemove(item);
  }

  /** Soft-deletes an adventure and all its items in one transaction, so a crash cannot leave orphaned items. */
  softRemoveWithItems(userId: string, id: string): Promise<void> {
    return this.dataSource.transaction(async (em) => {
      await em.softDelete(AdventureItem, { userId, adventureId: id });
      await em.softDelete(Adventure, { userId, id });
    });
  }
}
