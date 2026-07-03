'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

interface TransactionTypeToggleProps {
  isExpense: boolean;
  onChange: (isExpense: boolean) => void;
}

export function TransactionTypeToggle({ isExpense, onChange }: TransactionTypeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 bg-black p-1 border-4 border-black">
      <button
        onClick={() => onChange(true)}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${
          isExpense
            ? 'bg-error-container text-on-error-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
            : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
        }`}
      >
        <TrendingDown size={18} />
        Expense
      </button>
      <button
        onClick={() => onChange(false)}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${
          !isExpense
            ? 'bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
            : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
        }`}
      >
        <TrendingUp size={18} />
        Income
      </button>
    </div>
  );
}
