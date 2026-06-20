import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../data-source';
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

  /** Base query shared by every aggregation: scope to the owning user. */
  private baseQuery(userId: string): SelectQueryBuilder<Expense> {
    return this.repo.createQueryBuilder('e').where('e.userId = :userId', { userId });
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

  tagsByYear(userId: string, year: number): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId)
      .select('e.tag', 'tag')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .andWhere("strftime('%Y', e.date) = :year", { year: String(year) })
      .groupBy('e.tag')
      .addGroupBy('e.type')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
}
