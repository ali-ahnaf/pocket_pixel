'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, BarChart, Coins } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const rawPathname = usePathname();
  const pathname = rawPathname?.replace(/\/$/, '') || '/';

  const navItems = [
    { label: 'HOME', href: '/', icon: Home },
    { label: 'STATS', href: '/stats', icon: BarChart },
    { label: 'DEBTS', href: '/debts', icon: Coins },
    { label: 'PROFILE', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 bg-surface-container-low px-2 border-t-4 border-black z-40 shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center h-16 w-16 border-4 transition-all duration-75 ${
              isActive
                ? 'bg-primary text-on-primary border-black border-b-4 border-primary-fixed-dim translate-y-[-2px] shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                : 'text-outline opacity-80 border-transparent hover:bg-surface-container-highest active:translate-y-0.5'
            }`}
          >
            <Icon size={24} />
            <span className="font-label-caps text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
