'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LogResourceModal } from './LogResourceModal';

export const GlobalTransactionFab = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Add transaction"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 z-50 h-16 w-16 items-center justify-center rounded-none border-4 border-black bg-primary text-on-primary shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
      >
        <Plus className="w-8 h-8 font-bold" />
      </button>

      <LogResourceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userId={user.id}
        onSuccess={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('transaction-added'));
          }
        }}
      />
    </>
  );
};
