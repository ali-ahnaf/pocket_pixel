'use client';

import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { TransactionType } from '@expense-tracker/shared';

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  showTransfer?: boolean;
}

const ACTIVE_STYLE = 'border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]';
const INACTIVE_STYLE = 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors';

export function TransactionTypeToggle({ value, onChange, showTransfer = false }: TransactionTypeToggleProps) {
  return (
    <div className={`grid ${showTransfer ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-black p-1 border-4 border-black`}>
      <button
        onClick={() => onChange('expense')}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${value === 'expense' ? `bg-error-container text-on-error-container ${ACTIVE_STYLE}` : INACTIVE_STYLE}`}
      >
        <TrendingDown size={18} />
        Expense
      </button>
      <button
        onClick={() => onChange('income')}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${value === 'income' ? `bg-primary-container text-on-primary-container ${ACTIVE_STYLE}` : INACTIVE_STYLE}`}
      >
        <TrendingUp size={18} />
        Income
      </button>
      {showTransfer && (
        <button
          onClick={() => onChange('transfer')}
          className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${value === 'transfer' ? `bg-secondary-container text-on-secondary-container ${ACTIVE_STYLE}` : INACTIVE_STYLE}`}
        >
          <ArrowLeftRight size={18} />
          Transfer
        </button>
      )}
    </div>
  );
}
