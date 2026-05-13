'use client';

import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from './Button';

export const AppBar: React.FC = () => {
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pixel_pocket_profile');
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        if (profile.avatar) {
          setLocalAvatarUrl(profile.avatar);
        }
      } catch (e) {
        console.error('Failed to parse profile from localStorage', e);
      }
    }
  }, []);

  const displayAvatarUrl = localAvatarUrl || '/avatars/avatar1.jpeg';

  return (
    <header className="md:hidden bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed w-full border-b-4 border-black flex justify-between items-center px-margin-mobile h-16 sticky top-0 z-40">
      <Button variant="ghost" className="p-2 w-10 h-10 border-transparent bg-surface-container">
        <Menu />
      </Button>
      <h1 className="font-headline-md font-bold uppercase tracking-tight text-primary text-center flex-1">Pixel Pocket</h1>
      <div className="h-10 w-10 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden flex items-center justify-center shrink-0">
        <img alt="User Hero" className="object-cover w-full h-full [image-rendering:pixelated]" src={displayAvatarUrl} />
      </div>
    </header>
  );
};
