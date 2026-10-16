import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Expense, TransactionType } from '../entities/Expense.entity';
import { Vault } from '../entities/Vault.entity';

export interface AnalyticsRow {
  type: string;
  total: string;
  count: string;
  [key: string]: string;
}

/** Inclusive `YYYY-MM-DD` range. */
export interface DateRange {
  from: string;
  to: string;
}

export interface TransactionSearch extends DateRange {
  type?: TransactionType;
  tag?: string;
  vault?: string;
  search?: string;
  sortBy: 'amount' | 'date';
  limit: number;
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

  // The queries below back the wizard's tools. They return small, pre-aggregated rows so the model reads totals, not raw tables.

  tagTotals(userId: string, range: DateRange, type: TransactionType, limit: number): Promise<{ tag: string; total: number; count: number }[]> {
    return this.baseQuery(userId)
      .innerJoin('e.transactionTags', 'tt')
      .innerJoin('tt.tag', 't')
      .select('t.name', 'tag')
      .addSelect('ROUND(SUM(e.amount), 2)', 'total')
      .addSelect('COUNT(*)', 'count')
      .andWhere('e.date BETWEEN :from AND :to', range)
      .andWhere('e.type = :type', { type })
      .groupBy('t.id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  monthTotals(userId: string, range: DateRange): Promise<{ month: string; expense: number; income: number; count: number }[]> {
    return this.baseQuery(userId)
      .select("strftime('%Y-%m', e.date)", 'month')
      .addSelect("ROUND(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 2)", 'expense')
      .addSelect("ROUND(SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END), 2)", 'income')
      .addSelect('COUNT(*)', 'count')
      .andWhere('e.date BETWEEN :from AND :to', range)
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  /** Expense total per vault in the range, next to its monthly budget. Vaults with no spend are included with 0. */
  vaultSpend(userId: string, range: DateRange): Promise<{ vault: string; monthlyBudget: number | null; spent: number }[]> {
    return this.dataSource
      .getRepository(Vault)
      .createQueryBuilder('v')
      .leftJoin(Expense, 'e', "e.vaultId = v.id AND e.type = 'expense' AND e.interval IS NULL AND e.deletedAt IS NULL AND e.date BETWEEN :from AND :to", range)
      .select('v.name', 'vault')
      .addSelect('v.monthlyBudget', 'monthlyBudget')
      .addSelect('ROUND(COALESCE(SUM(e.amount), 0), 2)', 'spent')
      .where('v.userId = :userId', { userId })
      .groupBy('v.id')
      .orderBy('spent', 'DESC')
      .getRawMany();
  }

  /** Individual transactions with their vault and comma-joined tag names. Tag and vault names match case-insensitively. */
  findTransactions(userId: string, filter: TransactionSearch): Promise<{ date: string; title: string | null; amount: number; type: string; vault: string | null; tags: string | null }[]> {
    const query = this.baseQuery(userId)
      .leftJoin('e.vault', 'v')
      .leftJoin('e.transactionTags', 'tt')
      .leftJoin('tt.tag', 't')
      .select('e.date', 'date')
      .addSelect('e.title', 'title')
      .addSelect('e.amount', 'amount')
      .addSelect('e.type', 'type')
      .addSelect('v.name', 'vault')
      .addSelect("GROUP_CONCAT(t.name, ', ')", 'tags')
      .andWhere('e.date BETWEEN :from AND :to', { from: filter.from, to: filter.to })
      .groupBy('e.id')
      .orderBy(filter.sortBy === 'amount' ? 'e.amount' : 'e.date', 'DESC')
      .limit(filter.limit);

    if (filter.type) query.andWhere('e.type = :type', { type: filter.type });
    if (filter.vault) query.andWhere('LOWER(v.name) = LOWER(:vault)', { vault: filter.vault });
    if (filter.search) query.andWhere('LOWER(e.title) LIKE LOWER(:search)', { search: `%${filter.search}%` });
    // HAVING keeps every tag in the GROUP_CONCAT while still filtering to rows that carry the requested one.
    if (filter.tag) query.having('SUM(LOWER(t.name) = LOWER(:tag)) > 0', { tag: filter.tag });

    return query.getRawMany();
  }
}
