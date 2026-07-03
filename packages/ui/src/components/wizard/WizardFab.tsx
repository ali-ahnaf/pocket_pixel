'use client';

import { Wand2 } from 'lucide-react';

interface WizardFabProps {
  onClick: () => void;
}

// Floating action button that summons the wizard chat sheet. Lives bottom-right
// of the Stats page with a gentle pulsing glow to draw the adventurer's eye.
export function WizardFab({ onClick }: WizardFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Summon Aldric the Wise"
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[90] w-14 h-14 flex items-center justify-center bg-primary text-on-primary border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5),0_0_18px_rgba(0,0,0,0)] animate-pulse hover:animate-none hover:bg-primary/90 active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-all"
    >
      <Wand2 className="w-7 h-7" />
    </button>
  );
}
