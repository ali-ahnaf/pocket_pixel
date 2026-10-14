import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Expense } from '../entities/Expense.entity';

export interface AnalyticsRow {
  type: string;
  total: string;
  count: string;
  [key: string]: string;
}

/**
 * Read-only aggregation queries over expenses. The TypeORM repository is
 * resolved lazily per call so a different DataSource can be injected in tests.
 */
export class AnalyticsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Expense> {
    return this.dataSource.getRepository(Expense);
  }

  /**
   * Base query shared by every aggregation: scope to the owning user. App copy
   * also drops recurring templates (`interval` set, `date` NULL); the API's
   * yearly() leaks them as a NULL-year group.
   */
  private baseQuery(userId: string): SelectQueryBuilder<Expense> {
    return this.repo.createQueryBuilder('e').where('e.userId = :userId', { userId }).andWhere('e.interval IS NULL');
  }

  monthlyByYear(userId: string, year: number): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId)
      .select("strftime('%m', e.date)", 'month')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .andWhere("strftime('%Y', e.date) = :year", { year: String(year) })
      .groupBy('month')
      .addGroupBy('e.type')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  yearly(userId: string): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId)
      .select("strftime('%Y', e.date)", 'year')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('year')
      .addGroupBy('e.type')
      .orderBy('year', 'DESC')
      .getRawMany();
  }

  /** App copy: joins through transaction_tags. The API version reads a non-existent `e.tag` column and fails. */
  tagsByYear(userId: string, year: number): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId)
      .innerJoin('e.transactionTags', 'tt')
      .innerJoin('tt.tag', 't')
      .select('t.id', 'tagId')
      .addSelect('t.name', 'tag')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .andWhere("strftime('%Y', e.date) = :year", { year: String(year) })
      .groupBy('t.id')
      .addGroupBy('e.type')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
}
