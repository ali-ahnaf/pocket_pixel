'use client';

import { useState } from 'react';
import { Button, Card, Window, Input, ProgressBar, LogResourceModal } from '@/components';
import {
  Menu,
  Package,
  Award,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Utensils,
  CircleDollarSign,
  ShoppingCart,
  Car,
  Home,
  User,
  BarChart,
  Plus,
  ChevronDown,
} from 'lucide-react';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
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
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTV2sgb4K75MucA0M1DwQAGMUarTVvi5egJzW6eNkkbZJp9RW_rSc80vIIa7dKzfgbfETcfX3h-J2UGyaUDXMVkqqOTdQLqesD6Sxcs8X760APYgKQq_9-hwpRex8vse18DM-qxt2ezbxiRJv2FHTM_TazKDwQgGJ7fPH0rGJlI9T-IME851XA6RUpwvfR4R1K0jz6lhxwpQd1ClWo6pZ7WNLkBrmlO_2DUj8R5CiwvtXmifayEKiUTF7gdN_WL_ON2FDa8ebPRDSc"
          />
        </div>
      </header>

      {/* NavigationDrawer (Web) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-low">
          <div className="h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img
              alt="Player Avatar"
              className="object-cover w-full h-full [image-rendering:pixelated]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKpsqCIjDYjNUPmXY_uoVzwJLesM391vYedYwMZDJJk-dolthKD8iA7q4A2Bx3b_QA3-jwxxULd7orLp6A61NgkWPZOxXQHOd03GC7HnO_3caU74NFN-47JVTE6iGSGgSpnhZr2i0FMV8RJFs8O1xQqHDfmHwVHI91f9uwVx4DlFb6e-57BM263HO3eYZg8lqkWrvjXA0rL0sKe_mxTLoUy5XEPjByGaaTwkMhhlT0yuLM4_-Karr2hKn7BZNaMTsSViaJNkUxIIQs"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">
              Steve Tracker
            </h2>
            <p className="font-body-sm text-on-surface-variant truncate">
              Level 42 Budgeter
            </p>
            <p className="font-label-caps text-secondary text-[10px] mt-1">
              Diamond Tier
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {/* Active State Navigation Item */}
          <a
            className="flex items-center gap-3 p-3 bg-primary text-on-primary border-r-4 border-primary-container btn"
            href="#"
          >
            <Package />
            <span className="font-label-caps tracking-wider uppercase">
              Inventory
            </span>
          </a>

          {/* Inactive Navigation Items */}
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
            href="#"
          >
            <Award />
            <span className="font-label-caps tracking-wider uppercase">
              Quests
            </span>
          </a>
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
            href="#"
          >
            <Settings />
            <span className="font-label-caps tracking-wider uppercase">
              Settings
            </span>
          </a>

          <div className="mt-auto pt-4 border-t-4 border-black">
            <a
              className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black"
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
        <div className="max-w-4xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-stack-md">
          {/* Month Selector */}
          <section className="flex justify-between items-center bg-surface-container border-4 border-black p-4 shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
            <Button
              variant="ghost"
              className="p-2 w-10 h-10 text-primary bg-surface hover:bg-surface-container-highest"
            >
              <ChevronLeft />
            </Button>
            <div className="text-center flex flex-col items-center">
              <h2 className="font-headline-md text-primary tracking-tight">
                OCTOBER 2023
              </h2>
              <span className="font-label-caps text-on-surface-variant uppercase mt-1">
                Current Realm
              </span>
            </div>
            <Button
              variant="ghost"
              className="p-2 w-10 h-10 text-primary bg-surface hover:bg-surface-container-highest"
            >
              <ChevronRight />
            </Button>
          </section>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-md">
            {/* Summary Card */}
            <Card className="lg:col-span-1 flex flex-col gap-4 !p-4">
              <h3 className="font-label-caps text-outline uppercase border-b-4 border-black pb-2">
                Status
              </h3>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-on-surface">
                    Loot Gained
                  </span>
                  <span className="font-label-caps text-primary">
                    +$4,250.00
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-sm text-on-surface">
                    Gold Spent
                  </span>
                  <span className="font-label-caps text-error">-$2,140.50</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t-4 border-black">
                <div className="flex justify-between items-end">
                  <span className="font-label-caps text-outline uppercase">
                    Net Yield
                  </span>
                  <span className="font-headline-md text-primary">
                    +$2,109.50
                  </span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={60} max={100} variant="primary" />
                </div>
              </div>
            </Card>

            {/* Transactions List */}
            <Card className="lg:col-span-2 flex flex-col gap-4 !p-4 bg-surface-container">
              <div className="flex justify-between items-center border-b-4 border-black pb-2">
                <h3 className="font-label-caps text-outline uppercase">
                  Recent Drops
                </h3>
                <button className="text-xs font-label-caps text-primary hover:underline">
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Transaction Item (Expense) */}
                <div className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer group shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                  <div className="h-10 w-10 bg-error-container text-on-error-container border-2 border-black flex items-center justify-center shrink-0">
                    <Utensils />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-lg font-bold text-on-surface truncate">
                      Tavern Provisions
                    </p>
                    <p className="font-body-sm text-on-surface-variant truncate">
                      Food &amp; Drink
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-label-caps text-error">-$45.00</p>
                    <p className="font-body-sm text-outline text-[10px]">
                      Oct 12
                    </p>
                  </div>
                </div>

                {/* Transaction Item (Income) */}
                <div className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer group shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                  <div className="h-10 w-10 bg-primary-container text-on-primary-container border-2 border-black flex items-center justify-center shrink-0">
                    <CircleDollarSign />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-lg font-bold text-on-surface truncate">
                      Bounty Reward
                    </p>
                    <p className="font-body-sm text-on-surface-variant truncate">
                      Salary
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-label-caps text-primary">+$2,500.00</p>
                    <p className="font-body-sm text-outline text-[10px]">
                      Oct 01
                    </p>
                  </div>
                </div>

                {/* Transaction Item (Expense) */}
                <div className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer group shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                  <div className="h-10 w-10 bg-secondary-container text-on-secondary-container border-2 border-black flex items-center justify-center shrink-0">
                    <ShoppingCart />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-lg font-bold text-on-surface truncate">
                      Market Tools
                    </p>
                    <p className="font-body-sm text-on-surface-variant truncate">
                      Supplies
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-label-caps text-error">-$120.75</p>
                    <p className="font-body-sm text-outline text-[10px]">
                      Oct 05
                    </p>
                  </div>
                </div>

                {/* Transaction Item (Expense) */}
                <div className="flex items-center gap-4 bg-surface p-3 border-4 border-black hover:bg-surface-container-highest transition-colors cursor-pointer group shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                  <div className="h-10 w-10 bg-tertiary-container text-on-tertiary-container border-2 border-black flex items-center justify-center shrink-0">
                    <Car />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-lg font-bold text-on-surface truncate">
                      Mount Upkeep
                    </p>
                    <p className="font-body-sm text-on-surface-variant truncate">
                      Transport
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-label-caps text-error">-$60.00</p>
                    <p className="font-body-sm text-outline text-[10px]">
                      Oct 10
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 bg-surface-container-low px-2 border-t-4 border-black z-40 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
        {/* Active */}
        <a
          className="flex flex-col items-center justify-center bg-primary text-on-primary border-b-4 border-primary-fixed-dim translate-y-[-2px] h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)]"
          href="/"
        >
          <Home />
          <span className="font-label-caps text-[10px] mt-1">HOME</span>
        </a>

        {/* Inactive */}
        <a
          className="flex flex-col items-center justify-center text-outline opacity-80 hover:bg-surface-container-highest active:translate-y-0.5 transition-all duration-75 h-16 w-16 border-4 border-transparent"
          href="/profile"
        >
          <User />
          <span className="font-label-caps text-[10px] mt-1">PROFILE</span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-outline opacity-80 hover:bg-surface-container-highest active:translate-y-0.5 transition-all duration-75 h-16 w-16 border-4 border-transparent"
          href="/stats"
        >
          <BarChart />
          <span className="font-label-caps text-[10px] mt-1">STATS</span>
        </a>
      </nav>

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

      <LogResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
