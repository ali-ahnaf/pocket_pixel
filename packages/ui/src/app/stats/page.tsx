'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppBar, Card, ProgressBar, Button, BottomNavBar, DesktopSidebar, WizardFab, WizardChatSheet } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { Package, ChevronDown, TrendingUp, TrendingDown, CircleDollarSign, Flame, Gem, Calendar, ChevronLeft, ChevronRight, Vault, LineChart, Cpu } from 'lucide-react';
import { iconMapper } from '@/lib/iconMapper';
import { profileApi } from '@/lib/api';
import type { User, VaultDto, UsageReport, TransactionDto } from '@expense-tracker/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_MONTH_YEAR = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

const ALL_TIME_PERIOD = 'all-time';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TAG_COLORS = ['bg-error', 'bg-tertiary', 'bg-secondary', 'bg-outline', 'bg-primary'];

function formatCurrency(amount: number): string {
  return `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatTokens(count: number | null | undefined): string {
  const n = Number.isFinite(count) ? (count as number) : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-US');
}

function getMonthKey(date: string): string | null {
  const [year, month] = date.split('-');
  if (!year || !month) return null;
  return `${year}-${month}`;
}

function getMonthRange(transactions: TransactionDto[]): string[] {
  const months = transactions
    .map((t) => getMonthKey(t.date))
    .filter((month): month is string => Boolean(month))
    .sort();

  if (months.length === 0) return [];

  const [startYear, startMonth] = months[0].split('-').map(Number);
  const [endYear, endMonth] = months[months.length - 1].split('-').map(Number);
  const range: string[] = [];

  for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); month += 1) {
    range.push(`${year}-${String(month).padStart(2, '0')}`);
    if (month === 12) {
      year += 1;
      month = 0;
    }
  }

  return range;
}

function valuesToPolyline(values: number[]): string {
  if (values.length === 0) return '';
  if (values.length === 1) return `0,50 100,50`;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const yCoord = 100 - ((value - min) / range) * 100;
      return `${x.toFixed(1)},${yCoord.toFixed(1)}`;
    })
    .join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [tokenUsage, setTokenUsage] = useState<UsageReport | null>(null);
  const [tokenUsageLoading, setTokenUsageLoading] = useState(false);
  const [tokenUsageError, setTokenUsageError] = useState<string | null>(null);

  const [selectedVaultId, setSelectedVaultId] = useState<string>('all');
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(CURRENT_MONTH_YEAR);
  const [monthYearOpen, setMonthYearOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const isAllTime = selectedMonthYear === ALL_TIME_PERIOD;
  const isCurrentMonth = selectedMonthYear === CURRENT_MONTH_YEAR;

  useEffect(() => {
    if (!userId) return;
    const [y, m] = isAllTime ? [null, null] : selectedMonthYear.split('-').map(Number);
    setIsLoading(true);
    Promise.all([profileApi.getUser(userId), isAllTime ? profileApi.getAllTransactions(userId) : profileApi.getTransactions(userId, m as number, y as number), profileApi.getVaults(userId)])
      .then(([user, txs, vaultList]) => {
        setProfile(user);
        setTransactions(txs);
        setVaults(vaultList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId, selectedMonthYear, isAllTime]);

  useEffect(() => {
    if (!userId) return;
    setTokenUsageLoading(true);
    setTokenUsageError(null);
    profileApi
      .getTokenUsage(userId)
      .then(setTokenUsage)
      .catch((err) => {
        console.error(err);
        setTokenUsageError('Token usage is unavailable. Check that OPENAI_ADMIN_KEY is configured.');
      })
      .finally(() => setTokenUsageLoading(false));
  }, [userId]);

  const filteredTransactions = useMemo(() => {
    if (selectedVaultId === 'all') return transactions;
    return transactions.filter((t) => t.vaultId === selectedVaultId);
  }, [transactions, selectedVaultId]);

  const totalIncome = useMemo(() => filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filteredTransactions]);
  const totalExpenses = useMemo(() => filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filteredTransactions]);
  const netYield = totalIncome - totalExpenses;

  const { points } = useMemo(() => {
    if (isAllTime) {
      const monthRange = getMonthRange(filteredTransactions);
      const monthlyValues = monthRange.map((month) => filteredTransactions.filter((t) => getMonthKey(t.date) === month).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0));

      let cumulative = 0;
      const data = monthlyValues.map((val) => {
        cumulative += val;
        return cumulative;
      });

      return { points: valuesToPolyline(data) };
    }

    const [y, m] = selectedMonthYear.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const dailyValues = Array(daysInMonth).fill(0);

    filteredTransactions.forEach((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      if (day >= 1 && day <= daysInMonth) {
        dailyValues[day - 1] += t.type === 'income' ? t.amount : -t.amount;
      }
    });

    let cumulative = 0;
    const data = dailyValues.map((val) => {
      cumulative += val;
      return cumulative;
    });

    return { points: valuesToPolyline(data) };
  }, [filteredTransactions, selectedMonthYear, isAllTime]);

  const resourceAllocation = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    if (totalExp === 0) return [];

    const tagTotals: Record<string, { label: string; total: number }> = {};
    expenses.forEach((t) => {
      const keys = t.tags?.length ? t.tags.map((tag) => tag.name) : ['Other'];
      keys.forEach((key) => {
        tagTotals[key] = tagTotals[key] ?? { label: key, total: 0 };
        tagTotals[key].total += t.amount;
      });
    });

    return Object.values(tagTotals)
      .sort((a, b) => b.total - a.total)
      .map((entry, i) => ({
        label: entry.label,
        amount: entry.total,
        percent: Math.round((entry.total / totalExp) * 100),
        colorClass: TAG_COLORS[i % TAG_COLORS.length],
      }));
  }, [filteredTransactions]);

  const vaultSavings = useMemo(() => {
    return vaults.map((vault) => {
      const vaultTxs = transactions.filter((t) => t.vaultId === vault.id);

      const income = vaultTxs.filter((t) => t.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);

      const spent = vaultTxs.filter((t) => t.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0);

      const budget = vault.monthlyBudget ?? 0;
      const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const isOver = budget > 0 && spent > budget;

      return {
        vault,
        income,
        spent,
        savings: income - spent,
        budget,
        progress,
        isOver,
      };
    });
  }, [transactions, vaults]);
  const [selectedLineVaultId, setSelectedLineVaultId] = useState<string>('all');
  const [wizardOpen, setWizardOpen] = useState(false);

  const lineChartPoints = useMemo(() => {
    const vaultIds = selectedLineVaultId === 'all' ? vaults.map((v) => v.id) : [selectedLineVaultId];

    return vaultIds
      .map((vaultId) => {
        const vault = vaults.find((v) => v.id === vaultId);
        const vaultTxs = transactions.filter((t) => t.vaultId === vaultId && t.type === 'expense');

        if (isAllTime) {
          const monthRange = getMonthRange(transactions);
          const monthly = Array(monthRange.length).fill(0);
          vaultTxs.forEach((t) => {
            const monthIndex = monthRange.indexOf(getMonthKey(t.date) ?? '');
            if (monthIndex >= 0) monthly[monthIndex] += t.amount;
          });

          if (monthly.every((v) => v === 0)) return { vault, points: '' };

          return { vault, points: valuesToPolyline(monthly) };
        }

        const [y, m] = selectedMonthYear.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const daily = Array(daysInMonth).fill(0);
        vaultTxs.forEach((t) => {
          const day = parseInt(t.date.split('-')[2], 10);
          if (day >= 1 && day <= daysInMonth) daily[day - 1] += t.amount;
        });

        if (daily.every((v) => v === 0)) return { vault, points: '' };

        return { vault, points: valuesToPolyline(daily) };
      })
      .filter((d) => d.points !== '');
  }, [transactions, vaults, selectedLineVaultId, selectedMonthYear, isAllTime]);

  const topDrains = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          label: t.title || t.tags?.[0]?.name || 'Expense',
          amount: `-${formatCurrency(t.amount)}`,
          icon: t.tags?.[0]?.icon || t.vault?.icon || 'ShoppingCart',
          iconBg: t.tags?.[0]?.backgroundColor || '#FFDAD6',
        })),
    [filteredTransactions],
  );

  const displayMonthYear = (yyyyMm: string) => {
    if (yyyyMm === ALL_TIME_PERIOD) return 'ALL TIME';
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const selectedVaultName = selectedVaultId === 'all' ? 'All Vaults' : (vaults.find((v) => v.id === selectedVaultId)?.name ?? 'All Vaults');

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) */}
      <AppBar />

      {/* NavigationDrawer (Desktop) */}
      <DesktopSidebar name={profile?.name} email={profile?.email} avatar={profile?.avatar} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-stack-md">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-surface-container-highest pb-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Analytics</h2>
              <p className="font-body-sm text-on-surface-variant">Track your loot and resource consumption.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 z-50">
              {/* Vault Selector */}
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-outline uppercase ml-1">Source Vault</span>
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="bg-surface-container text-on-surface font-body-sm py-2 px-4 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)] hover:bg-surface-container-highest flex items-center gap-3 min-w-[160px]"
                    onClick={() => setVaultOpen((v) => !v)}
                  >
                    <Package className="text-primary w-4 h-4 shrink-0" />
                    <span className="flex-grow text-left">{selectedVaultName}</span>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </Button>
                  {vaultOpen && (
                    <div className="absolute top-full left-0 w-full bg-surface-container-high border-4 border-black border-t-0 z-50">
                      {[{ id: 'all', name: 'All Vaults' }, ...vaults].map((vault) => (
                        <div
                          key={vault.id}
                          className="p-2 hover:bg-primary hover:text-on-primary cursor-pointer font-body-sm"
                          onClick={() => {
                            setSelectedVaultId(vault.id);
                            setVaultOpen(false);
                          }}
                        >
                          {vault.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Month/Year Selector */}
              <div className="flex flex-col gap-1">
                <span className="font-label-caps text-[10px] text-outline uppercase ml-1">Period</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="bg-surface-container text-on-surface font-body-sm py-2 px-4 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)] hover:bg-surface-container-highest flex items-center gap-3 min-w-[160px]"
                      onClick={() => {
                        setMonthYearOpen((v) => !v);
                        setVaultOpen(false);
                      }}
                    >
                      <Calendar className="text-primary w-4 h-4 shrink-0" />
                      <span className="flex-grow text-left">{displayMonthYear(selectedMonthYear)}</span>
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    </Button>

                    {monthYearOpen && (
                      <div className="absolute top-full mt-1 left-0 w-[240px] bg-surface-container-high border-4 border-black z-50 p-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setSelectedMonthYear(ALL_TIME_PERIOD);
                            setMonthYearOpen(false);
                          }}
                          className={`p-2 text-center font-label-caps uppercase border-2 transition-colors ${
                            isAllTime
                              ? 'bg-primary text-on-primary border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]'
                              : 'bg-surface hover:bg-surface-container-highest border-black text-on-surface'
                          }`}
                        >
                          ALL TIME
                        </button>

                        {/* Year Selector */}
                        <div className="flex justify-between items-center bg-surface-dim border-2 border-black p-1">
                          <button className="p-1 hover:bg-primary hover:text-on-primary transition-colors" onClick={() => setPickerYear((y) => y - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-headline-sm text-on-surface">{pickerYear}</span>
                          <button className="p-1 hover:bg-primary hover:text-on-primary transition-colors" onClick={() => setPickerYear((y) => y + 1)}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {MONTH_NAMES.map((mon, i) => {
                            const monthValue = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                            const isActive = selectedMonthYear === monthValue;
                            return (
                              <button
                                key={mon}
                                onClick={() => {
                                  setSelectedMonthYear(monthValue);
                                  setMonthYearOpen(false);
                                }}
                                className={`p-2 text-center font-body-sm border-2 transition-colors ${
                                  isActive
                                    ? 'bg-primary text-on-primary border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]'
                                    : 'bg-surface hover:bg-surface-container-highest border-transparent hover:border-black text-on-surface'
                                }`}
                              >
                                {mon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCurrentMonth && (
                    <Button variant="ghost" size="sm" className="border-primary text-primary hover:bg-primary/10 whitespace-nowrap" onClick={() => setSelectedMonthYear(CURRENT_MONTH_YEAR)}>
                      Current
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="flex flex-col gap-stack-md">
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-2 gap-stack-md">
              {/* Total Income */}
              <Card className="relative overflow-hidden flex flex-col gap-3 !p-3">
                <CircleDollarSign className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-primary" />
                <h3 className="font-label-caps text-label-caps text-outline uppercase">Total Hoard</h3>
                {isLoading ? (
                  <div className="h-8 bg-surface-container-highest rounded w-24 animate-pulse" />
                ) : (
                  <div className="font-headline-lg text-headline-md text-primary">{formatCurrency(totalIncome)}</div>
                )}
                <div className="flex items-center gap-2 text-primary font-body-sm text-body-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Income this period</span>
                </div>
              </Card>

              {/* Total Expenses */}
              <Card className="relative overflow-hidden flex flex-col gap-3 !p-3">
                <Flame className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-error" />
                <h3 className="font-label-caps text-label-caps text-outline uppercase">Resources Burned</h3>
                {isLoading ? (
                  <div className="h-8 bg-surface-container-highest rounded w-24 animate-pulse" />
                ) : (
                  <div className="font-headline-lg text-headline-md text-error">{formatCurrency(totalExpenses)}</div>
                )}
                <div className="flex items-center gap-2 text-error font-body-sm text-body-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>Expenses this period</span>
                </div>
              </Card>
            </div>

            {/* Net Yield — Full Width */}
            <Card className="relative overflow-hidden flex flex-col gap-3 !p-3">
              <Gem className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-secondary" />
              <h3 className="font-label-caps text-label-caps text-outline uppercase">Net Yield</h3>
              {isLoading ? (
                <div className="h-8 bg-surface-container-highest rounded w-24 animate-pulse" />
              ) : (
                <div className={`font-headline-lg text-headline-lg ${netYield >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {netYield >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(netYield))}
                </div>
              )}
              {/* Line chart */}
              {!isLoading && points && (
                <div className="h-16 mt-2 w-full max-w-[200px]">
                  <svg viewBox="0 -5 100 110" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <polyline fill="none" stroke="#000" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" transform="translate(0, 4)" points={points} />
                    <polyline fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="miter" strokeLinecap="square" className="text-secondary" points={points} />
                  </svg>
                </div>
              )}
            </Card>

            {/* Resource Allocation */}
            <Card className="flex flex-col gap-4 !p-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Resource Allocation</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">Where your gold is going {isAllTime ? 'across all time' : 'this cycle'}.</p>
              </div>
              {isLoading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="h-4 bg-surface-container-highest rounded w-1/2" />
                      <div className="h-6 bg-surface-container-highest border-4 border-black" />
                    </div>
                  ))}
                </div>
              ) : resourceAllocation.length === 0 ? (
                <p className="font-body-sm text-on-surface-variant py-4 text-center">No expense data for this period.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {resourceAllocation.map(({ label, amount, percent, colorClass }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <div className="flex justify-between font-body-sm text-body-sm">
                        <span className="text-on-surface flex items-center gap-2">
                          <span className={`w-3 h-3 ${colorClass} border-2 border-black inline-block`} />
                          {label}
                        </span>
                        <span className="text-on-surface-variant">
                          {formatCurrency(amount)} · {percent}%
                        </span>
                      </div>
                      <div className="h-6 w-full bg-surface-dim border-4 border-black overflow-hidden">
                        <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Vault Savings */}
            <Card className="flex flex-col gap-4 !p-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Vault Savings</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">{isAllTime ? 'All-time' : 'Current'} savings (income − expense) per vault.</p>
              </div>
              {isLoading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 bg-surface-container-highest border-4 border-black" />
                  ))}
                </div>
              ) : vaultSavings.length === 0 ? (
                <p className="font-body-sm text-on-surface-variant py-4 text-center">No vaults found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {vaultSavings.map(({ vault, income, spent, savings, budget, progress, isOver }) => (
                    <div key={vault.id} className="flex flex-col gap-3 bg-surface-dim p-3 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-label-caps text-on-surface uppercase">{vault.name}</span>

                          <span className="font-body-sm text-on-surface-variant text-[11px]">
                            {formatCurrency(income)} in · {formatCurrency(spent)} out
                          </span>
                        </div>

                        <div className={`font-headline-sm ${savings >= 0 ? 'text-secondary' : 'text-error'}`}>
                          {savings >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(savings))}
                        </div>
                      </div>

                      {vault.monthlyBudget != null && (
                        <div className="flex flex-col gap-1">
                          <ProgressBar value={progress} variant={isOver ? 'error' : 'primary'} label={`${formatCurrency(spent)} / ${formatCurrency(budget)}`} />

                          {isOver && <span className="font-label-caps text-error text-[11px] uppercase">Over budget by {formatCurrency(spent - budget)}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Daily Expenses by Vault — Line Graph */}
            <Card className="flex flex-col gap-4 !p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    {isAllTime ? 'Monthly Expenses' : 'Daily Expenses'}
                  </h3>
                  <p className="font-body-sm text-on-surface-variant mt-1">Expense burn per {isAllTime ? 'month' : 'day'}, by vault.</p>
                </div>
                {/* Vault tabs */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedLineVaultId('all')}
                    className={`px-3 py-1 font-body-sm border-2 border-black transition-colors ${selectedLineVaultId === 'all' ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-highest text-on-surface'}`}
                  >
                    All
                  </button>
                  {vaults.map((vault) => (
                    <button
                      key={vault.id}
                      onClick={() => setSelectedLineVaultId(vault.id)}
                      className={`px-3 py-1 font-body-sm border-2 border-black transition-colors ${selectedLineVaultId === vault.id ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-highest text-on-surface'}`}
                    >
                      {vault.name}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="h-28 bg-surface-container-highest border-4 border-black animate-pulse" />
              ) : lineChartPoints.length === 0 ? (
                <p className="font-body-sm text-on-surface-variant py-4 text-center">No expense data for this period.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {lineChartPoints.map(({ vault, points }, idx) => {
                    const STROKE_COLORS = ['text-primary', 'text-secondary', 'text-tertiary', 'text-error'];
                    const colorClass = STROKE_COLORS[idx % STROKE_COLORS.length];
                    return (
                      <div key={vault?.id ?? idx} className="flex flex-col gap-1">
                        {selectedLineVaultId === 'all' && <span className={`font-label-caps text-[10px] uppercase ${colorClass}`}>{vault?.name}</span>}
                        <div className="h-20 w-full">
                          <svg viewBox="0 -5 100 110" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            <polyline fill="none" stroke="#000" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" transform="translate(0, 4)" points={points} />
                            <polyline fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="miter" strokeLinecap="square" className={colorClass} points={points} />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Top Drains */}
            <Card className="flex flex-col gap-4 !p-3">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b-4 border-black pb-2">Top Drains</h3>
              {isLoading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 bg-surface-dim p-3 border-4 border-black">
                      <div className="w-10 h-10 bg-surface-container-highest border-4 border-black shrink-0" />
                      <div className="flex-1 h-4 bg-surface-container-highest rounded" />
                      <div className="h-4 w-16 bg-surface-container-highest rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ) : topDrains.length === 0 ? (
                <p className="font-body-sm text-on-surface-variant py-4 text-center">No expenses recorded this period.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {topDrains.map(({ id, label, amount, icon, iconBg }) => {
                    const Icon = iconMapper(icon);
                    return (
                      <div
                        key={id}
                        className="flex justify-between items-center bg-surface-dim p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 border-4 border-black" style={{ backgroundColor: iconBg }}>
                            <Icon className="w-5 h-5 text-on-error-container" />
                          </div>
                          <span className="font-body-sm text-on-surface">{label}</span>
                        </div>
                        <span className="font-label-caps text-error">{amount}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* AI Token Usage */}
            <Card className="flex flex-col gap-4 !p-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  AI Token Usage
                </h3>
                <p className="font-body-sm text-on-surface-variant mt-1">OpenAI tokens consumed this month by the expense parser.</p>
              </div>

              {tokenUsageLoading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="grid grid-cols-3 gap-stack-md">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-surface-container-highest border-4 border-black" />
                    ))}
                  </div>
                  <div className="h-14 bg-surface-container-highest border-4 border-black" />
                </div>
              ) : tokenUsageError ? (
                <p className="font-body-sm text-error py-4 text-center">{tokenUsageError}</p>
              ) : !tokenUsage || tokenUsage.totalTokens === 0 ? (
                <p className="font-body-sm text-on-surface-variant py-4 text-center">No AI usage recorded this month.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Headline totals */}
                  <div className="grid grid-cols-3 gap-stack-md">
                    <div className="flex flex-col gap-1 bg-surface-dim p-3 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                      <span className="font-label-caps text-[10px] text-outline uppercase">Input</span>
                      <span className="font-headline-sm text-on-surface">{formatTokens(tokenUsage.inputTokens)}</span>
                    </div>
                    <div className="flex flex-col gap-1 bg-surface-dim p-3 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                      <span className="font-label-caps text-[10px] text-outline uppercase">Output</span>
                      <span className="font-headline-sm text-secondary">{formatTokens(tokenUsage.outputTokens)}</span>
                    </div>
                    <div className="flex flex-col gap-1 bg-surface-dim p-3 border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                      <span className="font-label-caps text-[10px] text-outline uppercase">Total</span>
                      <span className="font-headline-sm text-primary">{formatTokens(tokenUsage.totalTokens)}</span>
                    </div>
                  </div>

                  <p className="font-body-sm text-on-surface-variant text-[11px]">
                    {(tokenUsage.requests ?? 0).toLocaleString('en-US')} model {tokenUsage.requests === 1 ? 'request' : 'requests'} this month.
                  </p>

                  {/* Per-model breakdown */}
                  {(tokenUsage.models?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-2 border-t-4 border-black pt-3">
                      {tokenUsage.models.map((m) => {
                        const percent = tokenUsage.totalTokens > 0 ? Math.round((m.totalTokens / tokenUsage.totalTokens) * 100) : 0;
                        return (
                          <div key={m.model} className="flex flex-col gap-1">
                            <div className="flex justify-between font-body-sm text-body-sm">
                              <span className="text-on-surface truncate">{m.model}</span>
                              <span className="text-on-surface-variant whitespace-nowrap">
                                {formatTokens(m.totalTokens)} · {percent}%
                              </span>
                            </div>
                            <div className="h-4 w-full bg-surface-dim border-4 border-black overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <WizardFab onClick={() => setWizardOpen(true)} />
      <WizardChatSheet isOpen={wizardOpen} onClose={() => setWizardOpen(false)} userId={userId} />

      <BottomNavBar />
    </div>
  );
}
