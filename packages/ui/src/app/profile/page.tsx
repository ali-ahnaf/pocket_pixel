'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input, AddVaultModal, AddRecurringQuestModal } from '@/components';
import {
  Menu,
  Package,
  Award,
  Settings,
  HelpCircle,
  Home,
  User,
  BarChart,
  Briefcase,
  Plus,
  Pencil,
  Star,
  Trash2,
  Repeat,
  Calendar,
  CalendarDays,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function ProfilePage() {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);

  const vaults = [
    {
      id: 'main',
      name: 'Main Stash',
      description: 'Primary storage for all loot',
      isDefault: true,
    },
    {
      id: 'savings',
      name: 'Savings Chest',
      description: 'Untouchable quest rewards',
      isDefault: false,
    },
  ];

  const recurringQuests = [
    {
      id: 1,
      type: 'EXPENSE',
      title: 'Health Potion Subscription',
      description: 'Recurring healing items',
      amount: 15.0,
      frequency: 'Monthly',
      category: 'Health',
    },
    {
      id: 2,
      type: 'INCOME',
      title: 'Guild Stipend',
      description: 'Weekly quest rewards',
      amount: 250.0,
      frequency: 'Weekly',
      category: 'Salary',
    },
  ];

  return (
    <div className="bg-background px-3 text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) / Top Row (Web) */}
      <header className="md:hidden bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed w-full border-b-4 border-black flex justify-between items-center px-margin-mobile h-16 sticky top-0 z-40">
        <Button
          variant="ghost"
          className="p-2 w-10 h-10 border-transparent bg-surface-container"
        >
          <Menu />
        </Button>
        <h1 className="font-headline-md font-bold uppercase tracking-tight text-primary text-center flex-1">
          QUEST_EXPENSE
        </h1>
        <div className="h-10 w-10 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden flex items-center justify-center shrink-0">
          <img
            alt="User Hero"
            className="object-cover w-full h-full [image-rendering:pixelated]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJFpqD4vowi2CIP0apqYcx4pQZc-1GhxIkIvmr0l0ru5LpO-kB8MM0uf33berY1u3AJJ4QQPgvyqqb_mbn_rtwpvqGUeFFCxCJzkz0m8uhaBy7OuAjsF4f-bI8G8fTt8ll5bW6XXxCAmrguk5ZrL0-go8p3kK8InJCRzjduXxKZUZNSulStFvchJk8q-frjuBtrDFxbAIY2VllQ63NsUuZVWQ-WgipbfHj8E9tg8lvzvZOJGcBJesFQF8yo9Y9AxGJixJ2HPfTqvcX"
          />
        </div>
      </header>

      {/* NavigationDrawer (Web) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-lowest shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)] mb-8">
          <div className="h-12 w-12 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img
              alt="Player Avatar"
              className="object-cover w-full h-full [image-rendering:pixelated]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvvd6oWG23o0fpC677Is0AQSfTuVA9oRwQIpTDwo6AQ8aJ7jiTQ_O6vTBm-IsiZmKhJHdWSmIG5q6gTSuuuQ6xLlJoejkOPGoCsQ4xO3ZNSnOjz5PL_ZygVPvVWi21hvluuAfYwbz5dvWLy1tyuwWyc6UAmM-q32gMWeUuajym5r84XB4FxxLZPekl_eAzIa-ucYR0gEOYM5AntqaLPJs-G0PGi1OeX7rGUWTppmz7125X66sJJJmE9Z7cBMKlbrupo5VnZLZok0MT"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">
              Steve Tracker
            </h2>
            <p className="font-body-sm text-on-surface-variant truncate">
              Level 42 Budgeter
            </p>
            <p className="font-label-caps text-secondary mt-1">Diamond Tier</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {/* Inactive Navigation Items */}
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Package />
            <span className="font-label-caps tracking-wider uppercase">
              Inventory
            </span>
          </a>
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Award />
            <span className="font-label-caps tracking-wider uppercase">
              Quests
            </span>
          </a>

          {/* Active State Navigation Item */}
          <a
            className="flex items-center gap-3 p-3 bg-primary text-on-primary border-4 border-transparent border-r-4 border-r-primary-container btn shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Settings />
            <span className="font-label-caps tracking-wider uppercase">
              Settings
            </span>
          </a>

          <div className="mt-auto">
            <a
              className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
              href="#"
            >
              <HelpCircle />
              <span className="font-label-caps tracking-wider uppercase">
                Help
              </span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col w-full relative pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-3 md:gap-14">
          {/* Profile Section */}
          <section>
            <h2 className="font-headline-lg text-primary mb-stack-sm flex items-center gap-2">
              <User className="w-8 h-8" />
              Player Profile
            </h2>
            <Card className="p-6 flex mt-2 flex-col md:flex-row gap-6 items-start md:items-center border-secondary-container bg-surface-container-low !shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)]">
              <div className="w-24 h-24 border-4 border-black shrink-0 relative">
                <img
                  alt="Profile Edit"
                  className="w-full h-full object-cover [image-rendering:pixelated]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUMEcKoshCeGGjOUvpzVTnDCyqx4UNE_2CEyJu3Oycji3Gz9B1kQgG_TzICvNN5jHz-qkc2b4YpO2bBHQjfIPKScpURnrSeTaU-HraqaAFEPPdst-84KboUonvDO4m8ehG6EAXOlXGcG8EV2zAOyoBLyOSM_eIFydceTDL5LX1Z2Mj_veh7QuhNQ88pNQXD2EZ_NpTD6peXGIel0Kt6gCW6ASt8zmsqduFJ3s4TGzbGzxfLZHpwhw97QDPIbmd6aUv8zkmNmjB7mp_"
                />
                <Button
                  variant="primary"
                  className="absolute -bottom-2 -right-2 w-8 h-8 !p-0 flex items-center justify-center rounded-none"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input label="Player Name" defaultValue="Steve Tracker" />
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Vaults Section */}
          <section>
            <div className="flex justify-between items-end mb-stack-sm border-b-4 border-outline-variant pb-2">
              <h2 className="font-headline-lg text-primary flex items-center gap-2">
                <Briefcase className="w-8 h-8" />
                Your Vaults
              </h2>
              <Button
                variant="primary"
                className="flex items-center gap-1 font-label-caps px-4 py-2 border-b-primary-container"
                onClick={() => setIsVaultModalOpen(true)}
              >
                <Plus className="w-[18px] h-[18px]" /> Add
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {vaults.map((vault) => (
                <Card
                  key={vault.id}
                  className={`p-4 relative flex flex-col mt-2 justify-between ${
                    vault.isDefault
                      ? 'border-primary mt-2'
                      : 'border-outline-variant'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-headline-md text-on-surface mb-1">
                        {vault.name}
                      </h3>
                      {vault.isDefault && (
                        <Badge variant="primary" className="text-[10px]">
                          DEFAULT
                        </Badge>
                      )}
                    </div>
                    <p className="font-body-sm text-on-surface-variant mb-4">
                      {vault.description}
                    </p>
                  </div>

                  {vault.isDefault ? (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="ghost"
                        className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                      >
                        <Pencil className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-4">
                      <button className="font-label-caps text-secondary flex items-center gap-1 hover:underline text-sm">
                        <Star className="w-[16px] h-[16px]" /> Set as Default
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="danger"
                          className="p-1 w-8 h-8 border-b-error flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Recurring Quests Section */}
          <section>
            <div className="flex justify-between items-end mb-stack-sm border-b-4 border-outline-variant pb-2">
              <h2 className="font-headline-lg text-secondary flex items-center gap-2">
                <Repeat className="w-8 h-8" />
                Recurring Quests
              </h2>
              <Button
                variant="primary"
                className="flex items-center gap-1 font-label-caps px-4 py-2 border-b-primary-container"
                onClick={() => setIsQuestModalOpen(true)}
              >
                <Plus className="w-[18px] h-[18px]" /> Add
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {recurringQuests.map((quest) => {
                const isExpense = quest.type === 'EXPENSE';
                const QuestIcon = isExpense ? Calendar : CalendarDays;

                return (
                  <Card
                    key={quest.id}
                    className={`p-4 mt-2 relative overflow-hidden ${
                      isExpense
                        ? 'border-error-container'
                        : 'border-primary-container'
                    }`}
                  >
                    <div
                      className={`absolute top-0 right-0 p-1.5 border-4 border-black border-t-0 border-r-0 ${
                        isExpense ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                      }`}
                    >
                      {isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                    </div>
                    <h3 className="font-headline-md text-on-surface mt-2 mb-1">
                      {quest.title}
                    </h3>
                    <p className="font-body-sm text-on-surface-variant mb-4">
                      {quest.description}
                    </p>
                    <div className="flex justify-between items-center bg-surface-dim border-4 border-black p-2 mb-4 border-t-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                      <span
                        className={`font-body-lg font-bold ${
                          isExpense ? 'text-error' : 'text-primary'
                        }`}
                      >
                        {isExpense ? '-' : '+'} ${quest.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 border-4 border-black text-on-surface-variant">
                        <QuestIcon className="w-[16px] h-[16px]" />
                        <span className="font-label-caps">
                          {quest.frequency}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-block font-label-caps px-2 py-1 border-4 border-black ${
                          isExpense
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        #{quest.category}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                        >
                          <Pencil className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="danger"
                          className="p-1 w-8 h-8 border-b-error flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 bg-surface-container-low px-2 border-t-4 border-black z-40 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
        {/* Inactive */}
        <a
          className="flex flex-col items-center justify-center text-outline opacity-80 hover:bg-surface-container-highest active:translate-y-0.5 transition-all duration-75 h-16 w-16 border-4 border-transparent"
          href="#"
        >
          <Home />
          <span className="font-label-caps text-[10px] mt-1">HOME</span>
        </a>

        {/* Active */}
        <a
          className="flex flex-col items-center justify-center bg-primary text-on-primary border-b-4 border-primary-fixed-dim translate-y-[-2px] h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)]"
          href="#"
        >
          <User />
          <span className="font-label-caps text-[10px] mt-1">PROFILE</span>
        </a>

        {/* Inactive */}
        <a
          className="flex flex-col items-center justify-center text-outline opacity-80 hover:bg-surface-container-highest active:translate-y-0.5 transition-all duration-75 h-16 w-16 border-4 border-transparent"
          href="#"
        >
          <BarChart />
          <span className="font-label-caps text-[10px] mt-1">STATS</span>
        </a>
      </nav>

      <AddVaultModal 
        isOpen={isVaultModalOpen} 
        onClose={() => setIsVaultModalOpen(false)} 
        title="Create New Vault"
      />

      <AddRecurringQuestModal 
        isOpen={isQuestModalOpen} 
        onClose={() => setIsQuestModalOpen(false)} 
        title="Add Recurring Quest"
      />
    </div>
  );
}
