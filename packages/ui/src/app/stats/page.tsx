'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppBar, Card, ProgressBar, Button, BottomNavBar } from '@/components';
import { Package, Award, BarChart, Settings, HelpCircle, ChevronDown, TrendingUp, TrendingDown, CircleDollarSign, Flame, Gem, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { iconMapper } from '@/lib/iconMapper';
import { profileApi } from '@/lib/api';
import type { ApiUser, ApiTransaction, ApiVault } from '@/lib/api/ProfileApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_MONTH_YEAR = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

const NAV_ITEMS = [
  { label: 'Inventory', icon: Package, href: '/', active: false },
  { label: 'Quests', icon: Award, href: '#', active: false },
  { label: 'Stats', icon: BarChart, href: '/stats', active: true },
  { label: 'Settings', icon: Settings, href: '#', active: false },
];

const TAG_COLORS = ['bg-error', 'bg-tertiary', 'bg-secondary', 'bg-outline', 'bg-primary'];

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [vaults, setVaults] = useState<ApiVault[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedVaultId, setSelectedVaultId] = useState<string>('all');
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(CURRENT_MONTH_YEAR);
  const [monthYearOpen, setMonthYearOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const isCurrentMonth = selectedMonthYear === CURRENT_MONTH_YEAR;

  useEffect(() => {
    const stored = localStorage.getItem('pixel_pocket_profile');
    if (!stored) { router.push('/signin'); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.id) { router.push('/signin'); return; }
      setUserId(parsed.id);
    } catch {
      router.push('/signin');
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const [y, m] = selectedMonthYear.split('-').map(Number);
    setIsLoading(true);
    Promise.all([
      profileApi.getUser(userId),
      profileApi.getTransactions(userId, m, y),
      profileApi.getVaults(userId),
    ])
      .then(([user, txs, vaultList]) => {
        setProfile(user);
        setTransactions(txs);
        setVaults(vaultList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId, selectedMonthYear]);

  const filteredTransactions = useMemo(() => {
    if (selectedVaultId === 'all') return transactions;
    return transactions.filter((t) => t.vaultId === selectedVaultId);
  }, [transactions, selectedVaultId]);

  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const totalExpenses = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const netYield = totalIncome - totalExpenses;

  const { points } = useMemo(() => {
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
    const data = dailyValues.map((val) => { cumulative += val; return cumulative; });

    if (data.length < 2) return { points: '' };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const pts = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const yCoord = 100 - ((val - min) / range) * 100;
        return `${x.toFixed(1)},${yCoord.toFixed(1)}`;
      })
      .join(' ');

    return { points: pts };
  }, [filteredTransactions, selectedMonthYear]);

  const resourceAllocation = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    if (totalExp === 0) return [];

    const tagTotals: Record<string, { label: string; total: number }> = {};
    expenses.forEach((t) => {
      const key = t.tags?.[0]?.name ?? 'Other';
      tagTotals[key] = tagTotals[key] ?? { label: key, total: 0 };
      tagTotals[key].total += t.amount;
    });

    return Object.values(tagTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((entry, i) => ({
        label: entry.label,
        percent: Math.round((entry.total / totalExp) * 100),
        colorClass: TAG_COLORS[i % TAG_COLORS.length],
      }));
  }, [filteredTransactions]);

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
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const selectedVaultName = selectedVaultId === 'all' ? 'All Vaults' : (vaults.find((v) => v.id === selectedVaultId)?.name ?? 'All Vaults');

  return (
    <div className="bg-background px-3 text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) */}
      <AppBar />

      {/* NavigationDrawer (Desktop) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-low">
          <div className="h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img alt="Player Avatar" className="object-cover w-full h-full [image-rendering:pixelated]" src={profile?.avatar || '/avatars/avatar1.jpeg'} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">{profile?.name ?? '...'}</h2>
            <p className="font-body-sm text-on-surface-variant truncate">{profile?.email ?? ''}</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, href, active }) =>
            active ? (
              <a key={label} className="flex items-center gap-3 p-3 bg-primary text-on-primary border-r-4 border-primary-container btn" href={href}>
                <Icon />
                <span className="font-label-caps tracking-wider uppercase">{label}</span>
              </a>
            ) : (
              <a
                key={label}
                className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
                href={href}
              >
                <Icon />
                <span className="font-label-caps tracking-wider uppercase">{label}</span>
              </a>
            ),
          )}

          <div className="mt-auto pt-4 border-t-4 border-black">
            <a
              className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
              href="#"
            >
              <HelpCircle />
              <span className="font-label-caps tracking-wider uppercase">Help</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full relative pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
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
                        {/* Year Selector */}
                        <div className="flex justify-between items-center bg-surface-dim border-2 border-black p-1">
                          <button
                            className="p-1 hover:bg-primary hover:text-on-primary transition-colors"
                            onClick={() => setPickerYear((y) => y - 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-headline-sm text-on-surface">{pickerYear}</span>
                          <button
                            className="p-1 hover:bg-primary hover:text-on-primary transition-colors"
                            onClick={() => setPickerYear((y) => y + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, i) => {
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
                  {netYield >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netYield))}
                </div>
              )}
              {/* Line chart */}
              {!isLoading && points && (
                <div className="h-16 mt-2 w-full max-w-[200px]">
                  <svg viewBox="0 -5 100 110" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#000"
                      strokeWidth="6"
                      strokeLinejoin="miter"
                      strokeLinecap="square"
                      transform="translate(0, 4)"
                      points={points}
                    />
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinejoin="miter"
                      strokeLinecap="square"
                      className="text-secondary"
                      points={points}
                    />
                  </svg>
                </div>
              )}
            </Card>

            {/* Resource Allocation */}
            <Card className="flex flex-col gap-4 !p-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Resource Allocation</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">Where your gold is going this cycle.</p>
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
                  {resourceAllocation.map(({ label, percent, colorClass }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <div className="flex justify-between font-body-sm text-body-sm">
                        <span className="text-on-surface flex items-center gap-2">
                          <span className={`w-3 h-3 ${colorClass} border-2 border-black inline-block`} />
                          {label}
                        </span>
                        <span className="text-on-surface-variant">{percent}%</span>
                      </div>
                      <div className="h-6 w-full bg-surface-dim border-4 border-black overflow-hidden">
                        <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  ))}
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
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
