'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { LogResourceModal } from './LogResourceModal';
import { useAuth } from '@/hooks/useAuth';

interface GlobalFABProps {
  onSuccess?: () => void;
  selectedMonth?: number;
  selectedYear?: number;
}

export default function GlobalFAB({ onSuccess, selectedMonth, selectedYear }: GlobalFABProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <div className="hidden md:block fixed bottom-24 md:bottom-8 right-4 md:right-20 z-[100]">
        <Button
          onClick={() => setIsOpen(true)}
          variant="primary"
          className="h-16 w-16 flex items-center justify-center rounded-none relative focus:outline-none !p-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          <Plus className="w-8 h-8 font-bold" />
        </Button>
      </div>

      <LogResourceModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} userId={userId} selectedMonth={selectedMonth} selectedYear={selectedYear} />
    </>
  );
}
