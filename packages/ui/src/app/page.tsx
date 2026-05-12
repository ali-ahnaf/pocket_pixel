'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Window, Input, ProgressBar, LogResourceModal, AppBar, BottomNavBar } from '@/components';
import { iconMapper } from '@/lib/iconMapper';
import { Package, Award, Settings, HelpCircle, ChevronLeft, ChevronRight, Home, User, BarChart, Plus, ChevronDown } from 'lucide-react';

const MOCK_DATA = {
  player: {
    name: 'Steve Tracker',
    subtitle: 'Level 42 Budgeter',
    tier: 'Diamond Tier',
    avatar: '/avatars/avatar1.jpeg',
  },
  summary: {
    lootGained: '+$4,250.00',
    goldSpent: '-$2,140.50',
    netYield: '+$2,109.50',
    budgetProgress: 60,
  },
  transactions: [
    {
      icon: { name: 'Utensils', bg: 'bg-error-container' },
      name: 'Tavern Provisions',
      category: 'Food & Drink',
      amount: '-$45.00',
      date: 'Oct 12',
      type: 'expense' as const,
    },
    {
      icon: { name: 'CircleDollarSign', bg: 'bg-primary-container' },
      name: 'Bounty Reward',
      category: 'Salary',
      amount: '+$2,500.00',
      date: 'Oct 01',
      type: 'income' as const,
    },
    {
      icon: { name: 'ShoppingCart', bg: 'bg-secondary-container' },
      name: 'Market Tools',
      category: 'Supplies',
      amount: '-$120.75',
      date: 'Oct 05',
      type: 'expense' as const,
    },
    {
      icon: { name: 'Car', bg: 'bg-tertiary-container' },
      name: 'Mount Upkeep',
      category: 'Transport',
      amount: '-$60.00',
      date: 'Oct 10',
      type: 'expense' as const,
    },
  ],
};

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    const stored = localStorage.getItem('pixel_pocket_profile');
    if (stored) {
      try { setUserId(JSON.parse(stored).id); } catch { /* ignore */ }
    }
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

  return (
    <div className="bg-background text-on-background px-3 font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) / Top Row (Web) */}
      <AppBar />

      {/* NavigationDrawer (Web) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-low">
          <div className="h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img alt="Player Avatar" className="object-cover w-full h-full [image-rendering:pixelated]" src={MOCK_DATA.player.avatar} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">{MOCK_DATA.player.name}</h2>
            <p className="font-body-sm text-on-surface-variant truncate">{MOCK_DATA.player.subtitle}</p>
            <p className="font-label-caps text-secondary text-[10px] mt-1">{MOCK_DATA.player.tier}</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {/* Active State Navigation Item */}
          <a className="flex items-center gap-3 p-3 bg-primary text-on-primary border-r-4 border-primary-container btn" href="#">
            <Package />
            <span className="font-label-caps tracking-wider uppercase">Inventory</span>
          </a>

          {/* Inactive Navigation Items */}
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

      {/* Main Content Canvas */}
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

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-on-surface">Loot Gained</span>
                  <span className="font-label-caps text-primary">{MOCK_DATA.summary.lootGained}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-on-surface">Gold Spent</span>
                  <span className="font-label-caps text-error">{MOCK_DATA.summary.goldSpent}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t-4 border-black">
                <div className="flex justify-between items-end">
                  <span className="font-label-caps text-outline uppercase">Net Yield</span>
                  <span className="font-headline-md text-primary">{MOCK_DATA.summary.netYield}</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={MOCK_DATA.summary.budgetProgress} max={100} variant="primary" />
                </div>
              </div>
            </Card>

            {/* Transactions List */}
            <Card className="lg:col-span-2 flex flex-col gap-4 !p-4 bg-surface-container">
              <div className="flex justify-between items-center border-b-4 border-black pb-2">
                <h3 className="font-label-caps text-outline uppercase">Recent Drops</h3>
                {/* <button className="text-xs font-label-caps text-primary hover:underline">View All</button> */}
              </div>

              <div className="flex flex-col gap-3">
                {MOCK_DATA.transactions.map((tx) => {
                  const TxIcon = iconMapper(tx.icon.name);
                  return (
                    <div
                      key={tx.name}
                      className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer group shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
                    >
                      <div className={`h-10 w-10 ${tx.icon.bg} border-2 border-black flex items-center justify-center shrink-0`}>
                        <TxIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body-lg font-bold text-on-surface truncate">{tx.name}</p>
                        <p className="font-body-sm text-on-surface-variant truncate">{tx.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-label-caps ${tx.type === 'income' ? 'text-primary' : 'text-error'}`}>{tx.amount}</p>
                        <p className="font-body-sm text-outline text-[10px]">{tx.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
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

      <LogResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={userId} />
    </div>
  );
}
