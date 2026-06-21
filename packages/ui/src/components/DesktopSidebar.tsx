'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, BarChart, User, Coins, type LucideIcon } from 'lucide-react';

const PROFILE_STORAGE_KEY = 'pocket_pixel_profile';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Stats', href: '/stats', icon: BarChart },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Debts', href: '/debts', icon: Coins },
];

interface DesktopSidebarProps {
  /** Optional overrides; when omitted the profile is read from localStorage (same as AppBar). */
  name?: string;
  email?: string;
  avatar?: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ name, email, avatar }) => {
  const [storedProfile, setStoredProfile] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        setStoredProfile(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse profile from localStorage', e);
      }
    }
  }, []);

  const displayName = name ?? storedProfile?.name ?? '...';
  const displayEmail = email ?? storedProfile?.email ?? '';
  const displayAvatar = avatar ?? storedProfile?.avatar ?? '/avatars/avatar1.jpeg';

  return (
    <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
      <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-low">
        <div className="h-16 w-16 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
          <img alt="Player Avatar" className="object-cover w-full h-full [image-rendering:pixelated]" src={displayAvatar} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <h2 className="font-headline-md text-primary truncate">{displayName}</h2>
          <p className="font-body-sm text-on-surface-variant truncate">{displayEmail}</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }, index) => {
          const isActive = index === 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'flex items-center gap-3 p-3 bg-primary text-on-primary border-r-4 border-primary-container btn'
                  : 'flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black'
              }
            >
              <Icon />
              <span className="font-label-caps tracking-wider uppercase">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
