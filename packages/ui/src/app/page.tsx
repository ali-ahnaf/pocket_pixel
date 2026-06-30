'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, ProgressBar, LogResourceModal, AppBar, BottomNavBar, DesktopSidebar, EditTransactionModal } from '@/components';
import { iconMapper } from '@/lib/iconMapper';
import { profileApi } from '@/lib/api';
import type { ApiUser, ApiTransaction, ApiRecurringOccurrence } from '@/lib/api/ProfileApi';
import { Package, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Repeat } from 'lucide-react';

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function formatCurrency(amount: number): string {
  return `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getTransactionIconName(tx: ApiTransaction): string {
  if (tx.type === 'expense') {
    return tx.tags?.[0]?.icon || tx.vault?.icon || 'ShoppingCart';
  }
  return tx.vault?.icon || 'CircleDollarSign';
}

function getTransactionCategory(tx: ApiTransaction): string {
  return tx.tags?.[0]?.name || (tx.type === 'income' ? 'Income' : 'Expense');
}

function getTransactionTitle(tx: ApiTransaction): string {
  return tx.title || (tx.type === 'income' ? 'Unnamed Income' : 'Unnamed Expense');
}

function getOccurrenceIconName(o: ApiRecurringOccurrence): string {
  if (o.type === 'expense') return o.tags?.[0]?.icon || o.vault?.icon || 'ShoppingCart';
  return o.vault?.icon || 'CircleDollarSign';
}

function getOccurrenceCategory(o: ApiRecurringOccurrence): string {
  return o.tags?.[0]?.name || (o.type === 'income' ? 'Income' : 'Expense');
}

function getOccurrenceTitle(o: ApiRecurringOccurrence): string {
  return o.title || (o.type === 'income' ? 'Unnamed Income' : 'Unnamed Expense');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ApiTransaction | null>(null);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [occurrences, setOccurrences] = useState<ApiRecurringOccurrence[]>([]);
  const [applyingOccurrence, setApplyingOccurrence] = useState<string | null>(null);
  const [vaults, setVaults] = useState<import('@/lib/api/ProfileApi').ApiVault[]>([]);
  const [selectedVaultFilter, setSelectedVaultFilter] = useState<string[]>([]);
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const vaultDropdownRef = useRef<HTMLDivElement>(null);
  const didInitVaultFilter = useRef(false);
  const [tags, setTags] = useState<import('@/lib/api/ProfileApi').ApiTag[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([
      profileApi.getUser(userId),
      profileApi.getTransactions(userId, selectedMonth + 1, selectedYear),
      profileApi.getVaults(userId),
      profileApi.getRecurringOccurrences(userId, selectedMonth + 1, selectedYear),
      profileApi.getTags(userId),
    ])
      .then(([user, txs, vaultList, occs, tagList]) => {
        setProfile(user);
        setTransactions(txs);
        setVaults(vaultList);
        if (!didInitVaultFilter.current) {
          didInitVaultFilter.current = true;
          const primaryVault = vaultList.find((v) => v.isDefault);
          if (primaryVault) setSelectedVaultFilter([primaryVault.id]);
        }
        setOccurrences(occs);
        setTags(tagList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId, selectedMonth, selectedYear, refetchKey]);

  const handleTransactionSuccess = useCallback(() => {
    window.dispatchEvent(new CustomEvent('transaction-success'));
  }, []);

  useEffect(() => {
    const handleSuccessEvent = () => {
      setRefetchKey((k) => k + 1);
    };
    window.addEventListener('transaction-success', handleSuccessEvent);
    return () => {
      window.removeEventListener('transaction-success', handleSuccessEvent);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (vaultDropdownRef.current && !vaultDropdownRef.current.contains(e.target as Node)) {
        setVaultDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  const matchesVault = (vaultId: string | null) => selectedVaultFilter.length === 0 || selectedVaultFilter.includes(vaultId ?? '');
  const matchesTag = (txTags: { id: string }[]) => selectedTagFilter.length === 0 || txTags.some((t) => selectedTagFilter.includes(t.id));
  const filteredDrops = transactions
    .filter((t) => matchesVault(t.vaultId) && matchesTag(t.tags))
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filteredOccurrences = occurrences.filter((o) => matchesVault(o.vaultId) && matchesTag(o.tags));

  const handleApplyOccurrence = async (occ: ApiRecurringOccurrence) => {
    if (!userId) return;
    const key = `${occ.recurringId}:${occ.date}`;
    setApplyingOccurrence(key);
    try {
      await profileApi.applyRecurringOccurrence(userId, occ.recurringId, occ.date);
      setRefetchKey((k) => k + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingOccurrence(null);
    }
  };

  const handleSkipOccurrence = async (occ: ApiRecurringOccurrence) => {
    if (!userId) return;
    const key = `${occ.recurringId}:${occ.date}`;
    setOccurrences((prev) => prev.filter((o) => `${o.recurringId}:${o.date}` !== key));
    try {
      await profileApi.skipRecurringOccurrence(userId, occ.recurringId, occ.date);
    } catch (err) {
      console.error(err);
      setRefetchKey((k) => k + 1);
    }
  };
  const totalIncome = filteredDrops.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filteredDrops.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netYield = totalIncome - totalExpenses;
  const budgetProgress = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const selectedVaults = selectedVaultFilter.length === 0 ? vaults : vaults.filter((v) => selectedVaultFilter.includes(v.id));
  const selectedVaultsTotalBudget = selectedVaults.reduce((sum, v) => sum + (v.monthlyBudget || 0), 0);
  const selectedVaultsSpent = transactions
    .filter((t) => (selectedVaultFilter.length === 0 || selectedVaultFilter.includes(t.vaultId ?? '')) && t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const selectedVaultsUsagePercent = selectedVaultsTotalBudget > 0 ? Math.min((selectedVaultsSpent / selectedVaultsTotalBudget) * 100, 100) : 0;

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <AppBar />

      {/* NavigationDrawer (Web) */}
      <DesktopSidebar name={profile?.name} email={profile?.email} avatar={profile?.avatar} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-stack-md">
          {/* Month Selector */}
          <section className="flex justify-between items-center bg-surface-container border-4 border-black p-4 shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
            <Button onClick={handlePrevMonth} variant="ghost" className="p-2 w-10 h-10 text-primary bg-surface hover:bg-surface-container-highest">
              <ChevronLeft />
            </Button>
            <div className="text-center flex flex-col items-center justify-center min-h-[60px]">
              <h2 className="font-headline-md text-primary tracking-tight">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
              {(selectedMonth !== now.getMonth() || selectedYear !== now.getFullYear()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(now.getMonth());
                    setSelectedYear(now.getFullYear());
                  }}
                  className="mt-1 font-label-caps text-[10px] border-2 border-primary text-primary hover:bg-primary/10 h-6 px-2 bg-surface leading-none"
                >
                  Current Month
                </Button>
              )}
            </div>
            <Button onClick={handleNextMonth} variant="ghost" className="p-2 w-10 h-10 text-primary bg-surface hover:bg-surface-container-highest">
              <ChevronRight />
            </Button>
          </section>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-md">
            {/* Summary Card */}
            <Card className="lg:col-span-1 flex flex-col gap-4 !p-4">
              <h3 className="font-label-caps text-outline uppercase border-b-4 border-black pb-2">Status</h3>

              {isLoading ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-5 bg-surface-container-highest rounded w-3/4" />
                  <div className="h-5 bg-surface-container-highest rounded w-3/4" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-on-surface">Loot Gained</span>
                    <span className="font-label-caps text-primary">+{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-on-surface">Gold Spent</span>
                    <span className="font-label-caps text-error">-{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 border-t-4 border-black">
                <div className="flex justify-between items-end">
                  <span className="font-label-caps text-outline uppercase">Net Yield</span>
                  {isLoading ? (
                    <div className="h-7 bg-surface-container-highest rounded w-24 animate-pulse" />
                  ) : (
                    <span className={`font-headline-md ${netYield >= 0 ? 'text-primary' : 'text-error'}`}>
                      {netYield >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(netYield))}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <ProgressBar value={isLoading ? 0 : budgetProgress} max={100} variant="primary" />
                </div>

                {selectedVaultsTotalBudget > 0 && (
                  <div className="mt-4 pt-4 border-t border-black">
                    <div className="flex justify-between mb-1">
                      <span className="font-label-caps text-[10px] text-outline">Budget Usage ({formatCurrency(selectedVaultsTotalBudget)})</span>
                      <span className="font-label-caps text-[10px] text-on-surface">{selectedVaultsUsagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${selectedVaultsUsagePercent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Transactions List */}
            <Card className="lg:col-span-2 flex flex-col gap-4 !p-4 bg-surface-container">
              <div className="flex justify-between items-center border-b-4 border-black pb-2">
                <h3 className="font-label-caps text-outline uppercase">Recent Drops</h3>
                <div ref={vaultDropdownRef} className="relative">
                  <button
                    onClick={() => setVaultDropdownOpen((o) => !o)}
                    className="flex items-center gap-1.5 font-label-caps text-[10px] uppercase bg-surface border-2 border-black text-on-surface px-2 py-1 hover:bg-surface-container-highest active:translate-y-px transition-transform"
                  >
                    {selectedVaultFilter.length === 0
                      ? 'All Vaults'
                      : selectedVaultFilter.length === 1
                        ? (vaults.find((v) => v.id === selectedVaultFilter[0])?.name ?? 'All Vaults')
                        : `${selectedVaultFilter.length} Vaults`}
                    <ChevronDown size={10} className={`transition-transform ${vaultDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {vaultDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] border-2 border-black bg-surface shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
                      <button
                        onClick={() => {
                          setSelectedVaultFilter([]);
                          setVaultDropdownOpen(false);
                        }}
                        className={`font-label-caps text-[10px] uppercase text-left px-3 py-2 transition-colors border-b border-black ${selectedVaultFilter.length === 0 ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}
                      >
                        All Vaults
                      </button>
                      {vaults.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVaultFilter((prev) => (prev.includes(v.id) ? prev.filter((id) => id !== v.id) : [...prev, v.id]));
                          }}
                          className={`font-label-caps text-[10px] uppercase text-left px-3 py-2 transition-colors border-b border-black last:border-b-0 ${selectedVaultFilter.includes(v.id) ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div ref={tagDropdownRef} className="relative">
                <button
                  onClick={() => setTagDropdownOpen((o) => !o)}
                  className="flex items-center justify-between gap-1.5 w-full font-label-caps text-[10px] uppercase bg-surface border-2 border-black text-on-surface px-2 py-1.5 hover:bg-surface-container-highest active:translate-y-px transition-transform"
                >
                  <span>
                    {selectedTagFilter.length === 0
                      ? 'All Tags'
                      : selectedTagFilter.length === 1
                        ? (tags.find((t) => t.id === selectedTagFilter[0])?.name ?? 'All Tags')
                        : `${selectedTagFilter.length} Tags`}
                  </span>
                  <ChevronDown size={10} className={`transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {tagDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 border-2 border-black bg-surface shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedTagFilter([]);
                        setTagDropdownOpen(false);
                      }}
                      className={`font-label-caps text-[10px] uppercase text-left px-3 py-2 transition-colors border-b border-black ${selectedTagFilter.length === 0 ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}
                    >
                      All Tags
                    </button>
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTagFilter((prev) => (prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]));
                        }}
                        className={`font-label-caps text-[10px] uppercase text-left px-3 py-2 transition-colors border-b border-black last:border-b-0 ${selectedTagFilter.includes(t.id) ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-highest'}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 bg-surface p-3 border-4 border-black">
                      <div className="h-10 w-10 bg-surface-container-highest border-2 border-black shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 bg-surface-container-highest rounded w-2/3" />
                        <div className="h-3 bg-surface-container-highest rounded w-1/3" />
                      </div>
                      <div className="h-4 bg-surface-container-highest rounded w-16 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredDrops.length === 0 && filteredOccurrences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <Package className="text-outline opacity-40" size={48} />
                  <p className="font-label-caps text-outline uppercase">No drops this month</p>
                  <p className="font-body-sm text-on-surface-variant">Log a transaction to get started</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredDrops.map((tx) => {
                    const TxIcon = iconMapper(getTransactionIconName(tx));
                    const tagBg = tx.tags?.[0]?.backgroundColor;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
                        onClick={() => setEditingTransaction(tx)}
                      >
                        <div
                          className={`h-10 w-10 border-2 border-black flex items-center justify-center shrink-0 ${!tagBg ? (tx.type === 'income' ? 'bg-primary-container' : 'bg-error-container') : ''}`}
                          style={tagBg ? { backgroundColor: tagBg } : undefined}
                        >
                          <TxIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-sm font-bold text-on-surface truncate">{getTransactionTitle(tx)}</p>
                          <p className="text-[14px] text-on-surface-variant truncate">{getTransactionCategory(tx)}</p>
                          {tx.vault?.name && (
                            <span className="font-label-caps text-[9px] uppercase px-1 py-0.5 border border-black bg-surface-container text-outline leading-none inline-block mt-0.5">
                              {tx.vault.name}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-label-caps ${tx.type === 'income' ? 'text-primary' : 'text-error'}`}>
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="font-body-sm text-outline text-[10px]">{formatDate(tx.date)}</p>
                          <p className="font-body-sm text-outline text-[10px]">{formatTime(tx.updatedAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  {filteredOccurrences.map((occ) => {
                    const OccIcon = iconMapper(getOccurrenceIconName(occ));
                    const tagBg = occ.tags?.[0]?.backgroundColor;
                    const key = `${occ.recurringId}:${occ.date}`;
                    const isApplying = applyingOccurrence === key;
                    return (
                      <div key={key} className="flex items-center gap-4 bg-surface/40 p-3 border-4 border-dashed border-outline/60 hover:bg-surface-container-highest/50 transition-colors">
                        <div
                          className={`h-10 w-10 border-2 border-dashed border-outline/70 flex items-center justify-center shrink-0 opacity-70 ${!tagBg ? (occ.type === 'income' ? 'bg-primary-container/40' : 'bg-error-container/40') : ''}`}
                          style={tagBg ? { backgroundColor: tagBg, opacity: 0.5 } : undefined}
                        >
                          <OccIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-body-sm font-bold text-on-surface/70 truncate">{getOccurrenceTitle(occ)}</p>
                          </div>
                          <p className="text-[14px] text-on-surface-variant/70 truncate">{getOccurrenceCategory(occ)}</p>
                          {occ.vault?.name && (
                            <span className="font-label-caps text-[9px] uppercase px-1 py-0.5 border border-dashed border-outline bg-surface-container/50 text-outline leading-none inline-block mt-0.5">
                              {occ.vault.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <p className={`font-label-caps opacity-70 ${occ.type === 'income' ? 'text-primary' : 'text-error'}`}>
                            {occ.type === 'income' ? '+' : '-'}
                            {formatCurrency(occ.amount)}
                          </p>
                          <p className="font-body-sm text-outline text-[10px]">{formatDate(occ.date)}</p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApplyOccurrence(occ)}
                              disabled={isApplying}
                              className="font-label-caps text-[10px] uppercase bg-primary text-on-primary border-2 border-black px-2 py-1 hover:bg-primary/90 active:translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isApplying ? 'Applying…' : 'Apply'}
                            </button>
                            <button
                              onClick={() => handleSkipOccurrence(occ)}
                              disabled={isApplying}
                              aria-label="Discard ghost entry"
                              title="Discard"
                              className="flex items-center justify-center bg-surface text-on-surface border-2 border-black h-[26px] w-[26px] hover:bg-error hover:text-on-error active:translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Recurring Quests Management Link */}
            <Card className="lg:col-span-3 flex items-center justify-between gap-4 !p-4 bg-surface-container">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 border-2 border-black flex items-center justify-center shrink-0 bg-secondary-container">
                  <Repeat size={20} />
                </div>
                <div>
                  <h3 className="font-body-sm font-bold text-on-surface">Recurring Quests</h3>
                  <p className="text-[12px] text-on-surface-variant">Create, edit, or delete recurring transactions</p>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="primary" className="font-label-caps px-4 py-2 shrink-0">
                  Manage Recurring Quests
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavBar />

      {/* FAB - Mobile only */}
      <div className="md:hidden fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="h-16 w-16 flex items-center justify-center rounded-none relative focus:outline-none !p-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <Plus className="w-8 h-8 font-bold" />
        </Button>
      </div>

      <LogResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTransactionSuccess} userId={userId} selectedMonth={selectedMonth} selectedYear={selectedYear} />
      <EditTransactionModal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} onSuccess={handleTransactionSuccess} userId={userId} transaction={editingTransaction} />
    </div>
  );
}
