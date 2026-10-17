import type { TransactionDto, VaultDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { toIsoDate } from '../../lib/formatters';
import { analyticsService, logger, transactionsService, vaultsService } from '../../services';
import { CHART_MAX_SERIES, type ChartSeries } from './chartPalette';

export const ALL_TIME_PERIOD = 'all-time';
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const currentMonthYear = (): string => toIsoDate(new Date()).slice(0, 7);

interface AllTimeTotals {
  income: number;
  expense: number;
  /** Net (income minus expense) per YYYY-MM, from SQL aggregates. */
  netByMonth: Record<string, number>;
  /** Expense total per tag name, from SQL aggregates. Untagged expenses are not included. */
  tagTotals: Record<string, number>;
  /** Income and expense per vault id, from SQL aggregates. */
  vaultTotals: Record<string, { income: number; expense: number }>;
}

export interface Allocation {
  label: string;
  amount: number;
  percent: number;
}

export interface VaultSaving {
  vault: VaultDto;
  income: number;
  spent: number;
  savings: number;
  budget: number;
  progress: number;
  isOver: boolean;
}

export interface StatsData {
  loading: boolean;
  vaults: VaultDto[];
  /** The selected month's transactions, filtered by the selected vaults. Empty for all time. */
  transactions: TransactionDto[];
  totalIncome: number;
  totalExpenses: number;
  /** Cumulative net per day (month) or per month (all time), for the net yield sparkline. */
  netLine: number[];
  allocation: Allocation[];
  vaultSavings: VaultSaving[];
  chartLabels: string[];
  chartSeries: ChartSeries[];
  topDrains: TransactionDto[];
}

const toNumber = (value: string | number | null | undefined): number => parseFloat(String(value ?? 0)) || 0;

const cumulative = (values: number[]): number[] => {
  let sum = 0;
  return values.map((v) => (sum += v));
};

/** Every YYYY-MM from the earliest to the latest key, so months without data still get a point. */
function monthRange(keys: string[]): string[] {
  const sorted = [...keys].sort();
  if (sorted.length === 0) return [];
  const [startYear, startMonth] = sorted[0].split('-').map(Number);
  const [endYear, endMonth] = sorted[sorted.length - 1].split('-').map(Number);
  const range: string[] = [];
  for (let y = startYear, m = startMonth; y < endYear || (y === endYear && m <= endMonth); m += 1) {
    range.push(`${y}-${String(m).padStart(2, '0')}`);
    if (m === 12) {
      y += 1;
      m = 0;
    }
  }
  return range;
}

/** Empty `vaultIds` means every vault. */
async function loadAllTime(userId: string, vaultIds: string[]): Promise<AllTimeTotals> {
  const [yearly, byVault] = await Promise.all([analyticsService.yearly(userId, vaultIds), analyticsService.vaults(userId, vaultIds)]);
  const years = [...new Set(yearly.map((r) => Number(r.year)))].filter(Boolean);
  const perYear = await Promise.all(years.map((y) => Promise.all([y, analyticsService.monthly(userId, y, vaultIds), analyticsService.tags(userId, y, vaultIds)])));

  const totals: AllTimeTotals = { income: 0, expense: 0, netByMonth: {}, tagTotals: {}, vaultTotals: {} };
  byVault.forEach((r) => {
    const entry = (totals.vaultTotals[r.vaultId] ??= { income: 0, expense: 0 });
    if (r.type === 'income') entry.income += toNumber(r.total);
    if (r.type === 'expense') entry.expense += toNumber(r.total);
  });
  yearly.forEach((r) => {
    if (r.type === 'income') totals.income += toNumber(r.total);
    if (r.type === 'expense') totals.expense += toNumber(r.total);
  });
  perYear.forEach(([year, monthly, tags]) => {
    monthly.forEach((r) => {
      const key = `${year}-${r.month}`;
      const sign = r.type === 'income' ? 1 : r.type === 'expense' ? -1 : 0;
      totals.netByMonth[key] = (totals.netByMonth[key] ?? 0) + sign * toNumber(r.total);
    });
    tags
      .filter((r) => r.type === 'expense')
      .forEach((r) => {
        totals.tagTotals[r.tag] = (totals.tagTotals[r.tag] ?? 0) + toNumber(r.total);
      });
  });
  return totals;
}

/**
 * Stats for one month or all time. A month loads that month's transactions and derives the sections in JS (bounded to one
 * month). All time uses SQL aggregates only (filtered by vaults in SQL); the expense chart and top drains are unavailable
 * there. ponytail: add per-vault monthly and top-N aggregates to the analytics repository to fill them.
 */
/** Empty `vaultIds` means every vault. */
export function useStats(period: string, vaultIds: string[], lineVaultId: string): StatsData {
  const userId = useLocalUserId();
  const isAllTime = period === ALL_TIME_PERIOD;
  // A month filters by vault in memory, so only all time reloads when the selection changes. A string key keeps the effect stable across renders.
  const allTimeVaultKey = isAllTime ? [...vaultIds].sort().join(',') : '';
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [monthTxs, setMonthTxs] = useState<TransactionDto[]>([]);
  const [allTime, setAllTime] = useState<AllTimeTotals | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const [year, month] = period.split('-').map(Number);
      // loading stays false on later reloads, so refocusing the tab does not flash skeletons over data.
      Promise.all([
        vaultsService.list(userId),
        isAllTime ? Promise.resolve([]) : transactionsService.list(userId, { month, year }),
        isAllTime ? loadAllTime(userId, allTimeVaultKey ? allTimeVaultKey.split(',') : []) : null,
      ])
        .then(([vaultList, txs, totals]) => {
          if (cancelled) return;
          setVaults(vaultList);
          setMonthTxs(txs);
          setAllTime(totals);
        })
        .catch((err) => logger.error('Load stats failed', { err }))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [userId, period, isAllTime, allTimeVaultKey]),
  );

  return useMemo<StatsData>(() => {
    const transactions = vaultIds.length === 0 ? monthTxs : monthTxs.filter((t) => t.vaultId != null && vaultIds.includes(t.vaultId));
    const expenses = transactions.filter((t) => t.type === 'expense');
    const sumOf = (txs: TransactionDto[]): number => txs.reduce((s, t) => s + t.amount, 0);

    if (isAllTime) {
      const totals = allTime ?? { income: 0, expense: 0, netByMonth: {}, tagTotals: {}, vaultTotals: {} };
      // Budgets are monthly, so all time shows savings only, for the selected vaults.
      const selectedVaults = vaultIds.length === 0 ? vaults : vaults.filter((v) => vaultIds.includes(v.id));
      const vaultSavings = selectedVaults.map((vault) => {
        const { income, expense } = totals.vaultTotals[vault.id] ?? { income: 0, expense: 0 };
        return { vault, income, spent: expense, savings: income - expense, budget: 0, progress: 0, isOver: false };
      });
      const months = monthRange(Object.keys(totals.netByMonth));
      return {
        loading,
        vaults,
        transactions: [],
        totalIncome: totals.income,
        totalExpenses: totals.expense,
        netLine: cumulative(months.map((m) => totals.netByMonth[m] ?? 0)),
        allocation:
          totals.expense > 0
            ? Object.entries(totals.tagTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([label, amount]) => ({ label, amount, percent: Math.round((amount / totals.expense) * 100) }))
            : [],
        vaultSavings,
        chartLabels: [],
        chartSeries: [],
        topDrains: [],
      };
    }

    const [y, m] = period.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const dayIndex = (date: string): number => {
      const day = parseInt(date.split('-')[2], 10);
      return day >= 1 && day <= daysInMonth ? day - 1 : -1;
    };

    const daily: number[] = Array(daysInMonth).fill(0);
    transactions.forEach((t) => {
      const i = dayIndex(t.date);
      if (i >= 0) daily[i] += t.type === 'income' ? t.amount : -t.amount;
    });

    const totalExpenses = sumOf(expenses);
    const tagTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      const keys = t.tags?.length ? t.tags.map((tag) => tag.name) : ['Other'];
      keys.forEach((key) => {
        tagTotals[key] = (tagTotals[key] ?? 0) + t.amount;
      });
    });

    // Vault savings and the chart use every transaction of the month, not just the vault filter (same as the web).
    const vaultSavings = vaults.map((vault) => {
      const vaultTxs = monthTxs.filter((t) => t.vaultId === vault.id);
      const income = sumOf(vaultTxs.filter((t) => t.type === 'income'));
      const spent = sumOf(vaultTxs.filter((t) => t.type === 'expense'));
      const budget = toNumber(vault.monthlyBudget);
      return { vault, income, spent, savings: income - spent, budget, progress: budget > 0 ? Math.min((spent / budget) * 100, 100) : 0, isOver: budget > 0 && spent > budget };
    });

    const chartVaults = lineVaultId === 'all' ? vaults : vaults.filter((v) => v.id === lineVaultId);
    const vaultBuckets = chartVaults
      .map((vault) => {
        const values: number[] = Array(daysInMonth).fill(0);
        monthTxs
          .filter((t) => t.vaultId === vault.id && t.type === 'expense')
          .forEach((t) => {
            const i = dayIndex(t.date);
            if (i >= 0) values[i] += t.amount;
          });
        return { name: vault.name, values, total: values.reduce((s, v) => s + v, 0) };
      })
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total);
    const overflow = vaultBuckets.slice(CHART_MAX_SERIES);
    const chartSeries: ChartSeries[] = vaultBuckets.slice(0, CHART_MAX_SERIES);
    if (overflow.length > 0) {
      chartSeries.push({
        name: `Other (${overflow.length})`,
        values: overflow.reduce<number[]>((acc, entry) => acc.map((v, i) => v + entry.values[i]), Array(daysInMonth).fill(0)),
      });
    }

    return {
      loading,
      vaults,
      transactions,
      totalIncome: sumOf(transactions.filter((t) => t.type === 'income')),
      totalExpenses,
      netLine: cumulative(daily),
      allocation:
        totalExpenses > 0
          ? Object.entries(tagTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([label, amount]) => ({ label, amount, percent: Math.round((amount / totalExpenses) * 100) }))
          : [],
      vaultSavings,
      chartLabels: Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
      chartSeries,
      topDrains: [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3),
    };
  }, [loading, vaults, monthTxs, allTime, isAllTime, period, vaultIds, lineVaultId]);
}
