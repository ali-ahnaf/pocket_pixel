'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, ProgressBar, LogResourceModal, AppBar, BottomNavBar } from '@/components';
import { iconMapper } from '@/lib/iconMapper';
import { profileApi } from '@/lib/api';
import type { ApiUser, ApiTransaction } from '@/lib/api/ProfileApi';
import { Package, Award, Settings, HelpCircle, ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react';

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function formatCurrency(amount: number): string {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [vaults, setVaults] = useState<import('@/lib/api/ProfileApi').ApiVault[]>([]);
  const [selectedVaultFilter, setSelectedVaultFilter] = useState<string>('all');
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const vaultDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([profileApi.getUser(userId), profileApi.getTransactions(userId, selectedMonth + 1, selectedYear), profileApi.getVaults(userId)])
      .then(([user, txs, vaultList]) => {
        setProfile(user);
        setTransactions(txs);
        setVaults(vaultList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId, selectedMonth, selectedYear, refetchKey]);

  const handleTransactionSuccess = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (vaultDropdownRef.current && !vaultDropdownRef.current.contains(e.target as Node)) {
        setVaultDropdownOpen(false);
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

  const filteredDrops = selectedVaultFilter === 'all' ? transactions : transactions.filter((t) => t.vaultId === selectedVaultFilter);
  const totalIncome = filteredDrops.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filteredDrops.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netYield = totalIncome - totalExpenses;
  const budgetProgress = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;

  return (
    <div className="bg-background text-on-background px-3 font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <AppBar />

      {/* NavigationDrawer (Web) */}
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
          <a className="flex items-center gap-3 p-3 bg-primary text-on-primary border-r-4 border-primary-container btn" href="#">
            <Package />
            <span className="font-label-caps tracking-wider uppercase">Inventory</span>
          </a>
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
            href="#"
          >
            <Award />
            <span className="font-label-caps tracking-wider uppercase">Quests</span>
          </a>
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
            href="#"
          >
            <Settings />
            <span className="font-label-caps tracking-wider uppercase">Settings</span>
          </a>
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
                    {selectedVaultFilter === 'all' ? 'All Vaults' : (vaults.find((v) => v.id === selectedVaultFilter)?.name ?? 'All Vaults')}
                    <ChevronDown size={10} className={`transition-transform ${vaultDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {vaultDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] border-2 border-black bg-surface shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
                      {[{ id: 'all', name: 'All Vaults' }, ...vaults].map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVaultFilter(v.id);
                            setVaultDropdownOpen(false);
                          }}
                          className={`font-label-caps text-[10px] uppercase text-left px-3 py-2 hover:bg-primary hover:text-on-primary transition-colors border-b border-black last:border-b-0 ${selectedVaultFilter === v.id ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
              ) : filteredDrops.length === 0 ? (
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
                      >
                        <div
                          className={`h-10 w-10 border-2 border-black flex items-center justify-center shrink-0 ${!tagBg ? (tx.type === 'income' ? 'bg-primary-container' : 'bg-error-container') : ''}`}
                          style={tagBg ? { backgroundColor: tagBg } : undefined}
                        >
                          <TxIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-lg font-bold text-on-surface truncate">{getTransactionTitle(tx)}</p>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-body-sm text-on-surface-variant truncate">{getTransactionCategory(tx)}</p>
                            {tx.vault?.name && (
                              <span className="font-label-caps text-[9px] uppercase px-1 py-0.5 border border-black bg-surface-container text-outline shrink-0 leading-none">{tx.vault.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-label-caps ${tx.type === 'income' ? 'text-primary' : 'text-error'}`}>
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="font-body-sm text-outline text-[10px]">{formatDate(tx.date)}</p>
                        </div>
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

      {/* FAB */}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="h-16 w-16 flex items-center justify-center rounded-none relative focus:outline-none !p-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <Plus className="w-8 h-8 font-bold" />
        </Button>
      </div>

      <LogResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTransactionSuccess} userId={userId} selectedMonth={selectedMonth} selectedYear={selectedYear} />
    </div>
  );
}
