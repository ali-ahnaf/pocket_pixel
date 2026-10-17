import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Expense, TransactionType } from '../entities/Expense.entity';
import { Vault } from '../entities/Vault.entity';
import { Debt } from '../entities/Debt.entity';
import { Adventure } from '../entities/Adventure.entity';
import { AdventureItem } from '../entities/AdventureItem.entity';

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
   * yearly() leaks them as a NULL-year group. `vaultIds` narrows to those vaults; empty or omitted means every vault.
   */
  private baseQuery(userId: string, vaultIds: string[] = []): SelectQueryBuilder<Expense> {
    const query = this.repo.createQueryBuilder('e').where('e.userId = :userId', { userId }).andWhere('e.interval IS NULL');
    return vaultIds.length > 0 ? query.andWhere('e.vaultId IN (:...vaultIds)', { vaultIds }) : query;
  }

  monthlyByYear(userId: string, year: number, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId, vaultIds)
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

  yearly(userId: string, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId, vaultIds)
      .select("strftime('%Y', e.date)", 'year')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('year')
      .addGroupBy('e.type')
      .orderBy('year', 'DESC')
      .getRawMany();
  }

  /** All-time income and expense totals per vault. Transactions without a vault are left out. */
  byVault(userId: string, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId, vaultIds)
      .select('e.vaultId', 'vaultId')
      .addSelect('e.type', 'type')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .andWhere('e.vaultId IS NOT NULL')
      .groupBy('e.vaultId')
      .addGroupBy('e.type')
      .getRawMany();
  }

  /** App copy: joins through transaction_tags. The API version reads a non-existent `e.tag` column and fails. */
  tagsByYear(userId: string, year: number, vaultIds?: string[]): Promise<AnalyticsRow[]> {
    return this.baseQuery(userId, vaultIds)
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

  /** Unsettled debts, soonest due first. Applied and discarded debts are soft-deleted, so they drop out. */
  openDebts(userId: string, limit: number): Promise<{ title: string; amount: number; type: string; dueDate: string | null }[]> {
    return this.dataSource
      .getRepository(Debt)
      .createQueryBuilder('d')
      .select('d.title', 'title')
      .addSelect('d.amount', 'amount')
      .addSelect('d.type', 'type')
      .addSelect('d.dueDate', 'dueDate')
      .where('d.userId = :userId', { userId })
      .orderBy('d.dueDate IS NULL')
      .addOrderBy('d.dueDate', 'ASC')
      .limit(limit)
      .getRawMany();
  }

  /** Every vault with its all-time income, expense and balance (income minus expense). */
  vaultBalances(userId: string): Promise<{ vault: string; description: string; isDefault: number; monthlyBudget: number | null; income: number; expense: number; balance: number }[]> {
    return this.dataSource
      .getRepository(Vault)
      .createQueryBuilder('v')
      .leftJoin(Expense, 'e', 'e.vaultId = v.id AND e.interval IS NULL AND e.deletedAt IS NULL')
      .select('v.name', 'vault')
      .addSelect('v.description', 'description')
      .addSelect('v.isDefault', 'isDefault')
      .addSelect('v.monthlyBudget', 'monthlyBudget')
      .addSelect("ROUND(COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount END), 0), 2)", 'income')
      .addSelect("ROUND(COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount END), 0), 2)", 'expense')
      .addSelect("ROUND(COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE -e.amount END), 0), 2)", 'balance')
      .where('v.userId = :userId', { userId })
      .groupBy('v.id')
      .orderBy('v.name', 'ASC')
      .getRawMany();
  }

  /** Recurring templates (`interval` set) with their vault and comma-joined tag names. */
  recurringTemplates(
    userId: string,
  ): Promise<{ title: string | null; amount: number; type: string; interval: string; startDate: string | null; endDate: string | null; vault: string | null; tags: string | null }[]> {
    return this.repo
      .createQueryBuilder('e')
      .leftJoin('e.vault', 'v')
      .leftJoin('e.transactionTags', 'tt')
      .leftJoin('tt.tag', 't')
      .select('e.title', 'title')
      .addSelect('e.amount', 'amount')
      .addSelect('e.type', 'type')
      .addSelect('e.interval', 'interval')
      .addSelect('e.startDate', 'startDate')
      .addSelect('e.endDate', 'endDate')
      .addSelect('v.name', 'vault')
      .addSelect("GROUP_CONCAT(t.name, ', ')", 'tags')
      .where('e.userId = :userId AND e.interval IS NOT NULL', { userId })
      .groupBy('e.id')
      .orderBy('e.amount', 'DESC')
      .getRawMany();
  }

  /** Adventures (planned trips or events with a fund) and their items, one row per item. An adventure with no items comes back once with a null item. */
  adventureItems(
    userId: string,
  ): Promise<
    {
      adventure: string;
      fund: number | null;
      startDate: string | null;
      endDate: string | null;
      completedAt: string | null;
      item: string | null;
      plannedCost: number | null;
      actualCost: number | null;
      isBought: number | null;
    }[]
  > {
    return this.dataSource
      .getRepository(Adventure)
      .createQueryBuilder('a')
      .leftJoin(AdventureItem, 'i', 'i.adventureId = a.id AND i.deletedAt IS NULL')
      .select('a.name', 'adventure')
      .addSelect('a.fund', 'fund')
      .addSelect('a.startDate', 'startDate')
      .addSelect('a.endDate', 'endDate')
      .addSelect('a.completedAt', 'completedAt')
      .addSelect('i.name', 'item')
      .addSelect('i.plannedCost', 'plannedCost')
      .addSelect('i.actualCost', 'actualCost')
      .addSelect('i.isBought', 'isBought')
      .where('a.userId = :userId', { userId })
      .orderBy('a.name', 'ASC')
      .addOrderBy('i.sortOrder', 'ASC')
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
