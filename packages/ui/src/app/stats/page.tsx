'use client';

import { useState, useMemo } from 'react';
import { AppBar, Card, ProgressBar, Button, BottomNavBar } from '@/components';
import { Package, Award, BarChart, Settings, HelpCircle, ChevronDown, TrendingUp, TrendingDown, CircleDollarSign, Flame, Gem, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { iconMapper } from '@/lib/iconMapper';

// ─── Page Data ────────────────────────────────────────────────────────────────

const PLAYER = {
  name: 'Steve Tracker',
  level: 'Level 42 Budgeter',
  tier: 'Diamond Tier',
  avatarUrl: '/avatars/avatar1.jpeg',
};

const VAULTS = ['Main Stash', 'Hidden Cache', 'Guild Bank'] as const;

const CURRENT_MONTH_YEAR = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

const SUMMARY_METRICS = [
  {
    label: 'Total Hoard',
    value: '8,450g',
    delta: '+12% vs last cycle',
    trend: 'up' as const,
    colorClass: 'text-primary',
    BgIcon: CircleDollarSign,
    bgIconColor: 'text-primary',
  },
  {
    label: 'Resources Burned',
    value: '3,210g',
    delta: '-5% vs last cycle',
    trend: 'up' as const,
    colorClass: 'text-error',
    BgIcon: Flame,
    bgIconColor: 'text-error',
  },
];

const NET_YIELD = {
  label: 'Net Yield',
  value: '5,240g',
  colorClass: 'text-secondary',
  BgIcon: Gem,
  sparkBars: [40, 60, 30, 80, 100] as number[],
};

const RESOURCE_ALLOCATION = [
  { label: 'Potions & Food', percent: 45, colorClass: 'bg-error' },
  { label: 'Gear Repairs', percent: 30, colorClass: 'bg-tertiary' },
  { label: 'Inn Stays', percent: 15, colorClass: 'bg-secondary' },
  { label: 'Misc Loot', percent: 10, colorClass: 'bg-outline' },
];

const TOP_DRAINS = [
  {
    id: 1,
    label: 'Tavern Ale',
    amount: '-150g',
    icon: 'Utensils',
    iconBg: '#FFDAD6',
  },
  {
    id: 2,
    label: 'Iron Sword Repair',
    amount: '-320g',
    icon: 'Sword',
    iconBg: '#FFD8E4',
  },
  {
    id: 3,
    label: 'Prancing Pony Inn',
    amount: '-50g',
    icon: 'BedDouble',
    iconBg: '#CCE5FF',
  },
];

const NAV_ITEMS = [
  { label: 'Inventory', icon: Package, href: '/', active: false },
  { label: 'Quests', icon: Award, href: '#', active: false },
  { label: 'Stats', icon: BarChart, href: '/stats', active: true },
  { label: 'Settings', icon: Settings, href: '#', active: false },
];

interface Transaction {
  id: string;
  date: string;
  amount: number;
}

const generateMockTransactions = (monthYear: string): Transaction[] => {
  let seed = monthYear.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const [y, m] = monthYear.split('-');
  const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
  
  const transactions: Transaction[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const numTransactions = Math.floor(random() * 4);
    for (let j = 0; j < numTransactions; j++) {
      const isIncome = random() > 0.5;
      const amount = Math.floor(random() * 200) + 10;
      transactions.push({
        id: `${monthYear}-${i}-${j}`,
        date: `${monthYear}-${String(i).padStart(2, '0')}`,
        amount: isIncome ? amount : -amount,
      });
    }
  }
  return transactions;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [selectedVault, setSelectedVault] = useState<string>(VAULTS[0]);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(CURRENT_MONTH_YEAR);
  const [monthYearOpen, setMonthYearOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const isCurrentMonth = selectedMonthYear === CURRENT_MONTH_YEAR;

  const transactions = useMemo(() => generateMockTransactions(selectedMonthYear), [selectedMonthYear]);

  const { chartData, netYieldValue } = useMemo(() => {
    const [y, m] = selectedMonthYear.split('-');
    const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
    
    const dailyValues = Array(daysInMonth).fill(0);
    let totalNet = 0;
    transactions.forEach(t => {
       const day = parseInt(t.date.split('-')[2], 10);
       dailyValues[day - 1] += t.amount;
       totalNet += t.amount;
    });
    
    let cumulative = 5000; // base value
    const data = dailyValues.map((val) => {
       cumulative += val;
       return cumulative;
    });
    
    return { 
      chartData: data, 
      netYieldValue: `${totalNet >= 0 ? '+' : ''}${totalNet.toLocaleString()}g` 
    };
  }, [transactions, selectedMonthYear]);

  const points = useMemo(() => {
    if (chartData.length === 0) return '';
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    
    return chartData.map((val, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [chartData]);

  const displayMonthYear = (yyyyMm: string) => {
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-background px-3 text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) */}
      <AppBar title="Pixel Pocket" avatarUrl={PLAYER.avatarUrl} />

      {/* NavigationDrawer (Desktop) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-low">
          <div className="h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img alt="Player Avatar" className="object-cover w-full h-full [image-rendering:pixelated]" src={PLAYER.avatarUrl} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">{PLAYER.name}</h2>
            <p className="font-body-sm text-on-surface-variant truncate">{PLAYER.level}</p>
            <p className="font-label-caps text-secondary text-[10px] mt-1">{PLAYER.tier}</p>
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
                    <span className="flex-grow text-left">{selectedVault}</span>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </Button>
                  {vaultOpen && (
                    <div className="absolute top-full left-0 w-full bg-surface-container-high border-4 border-black border-t-0 z-50">
                      {VAULTS.map((vault) => (
                        <div
                          key={vault}
                          className="p-2 hover:bg-primary hover:text-on-primary cursor-pointer font-body-sm"
                          onClick={() => {
                            setSelectedVault(vault);
                            setVaultOpen(false);
                          }}
                        >
                          {vault}
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
              {SUMMARY_METRICS.map(({ label, value, delta, trend, colorClass, BgIcon, bgIconColor }) => (
                <Card key={label} className="relative overflow-hidden flex flex-col gap-3 !p-3">
                  {/* Background Icon */}
                  <BgIcon className={`absolute -right-4 -top-4 w-32 h-32 opacity-10 ${bgIconColor}`} />
                  <h3 className="font-label-caps text-label-caps text-outline uppercase">{label}</h3>
                  <div className={`font-headline-lg text-headline-lg ${colorClass}`}>{value}</div>
                  <div className={`flex items-center gap-2 ${colorClass} font-body-sm text-body-sm`}>
                    {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{delta}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Net Yield — Full Width */}
            <Card className="relative overflow-hidden flex flex-col gap-3 !p-3">
              <NET_YIELD.BgIcon className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-secondary" />
              <h3 className="font-label-caps text-label-caps text-outline uppercase">{NET_YIELD.label}</h3>
              <div className={`font-headline-lg text-headline-lg ${NET_YIELD.colorClass}`}>{netYieldValue}</div>
              {/* Line chart */}
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
            </Card>

            {/* Resource Allocation */}
            <Card className="flex flex-col gap-4 !p-3">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Resource Allocation</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">Where your gold is going this cycle.</p>
              </div>
              <div className="flex flex-col gap-4">
                {RESOURCE_ALLOCATION.map(({ label, percent, colorClass }) => (
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
            </Card>

            {/* Top Drains */}
            <Card className="flex flex-col gap-4 !p-3">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b-4 border-black pb-2">Top Drains</h3>
              <div className="flex flex-col gap-3">
                {TOP_DRAINS.map(({ id, label, amount, icon, iconBg }) => {
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
            </Card>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
