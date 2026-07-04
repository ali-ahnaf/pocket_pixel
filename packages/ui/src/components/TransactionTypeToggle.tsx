'use client';

import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { TransactionType } from '@expense-tracker/shared';

type TransactionTypeToggleProps =
  | {
      isExpense: boolean;
      transactionType?: never;
      onChange: (isExpense: boolean) => void;
      allowTransfer?: false;
    }
  | {
      isExpense?: never;
      transactionType: TransactionType;
      onChange: (transactionType: TransactionType) => void;
      allowTransfer?: boolean;
    };

export function TransactionTypeToggle(props: TransactionTypeToggleProps) {
  const allowTransfer = props.allowTransfer ?? false;
  const activeType = props.transactionType !== undefined ? props.transactionType : props.isExpense ? 'expense' : 'income';

  const handleSelect = (nextType: TransactionType) => {
    if (props.transactionType !== undefined) {
      props.onChange(nextType);
    } else {
      props.onChange(nextType === 'expense');
    }
  };

  return (
    <div className={`grid ${allowTransfer ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-black p-1 border-4 border-black`}>
      <button
        onClick={() => handleSelect('expense')}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${
          activeType === 'expense'
            ? 'bg-error-container text-on-error-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
            : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
        }`}
      >
        <TrendingDown size={18} />
        Expense
      </button>
      <button
        onClick={() => handleSelect('income')}
        className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${
          activeType === 'income'
            ? 'bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
            : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
        }`}
      >
        <TrendingUp size={18} />
        Income
      </button>
      {allowTransfer && (
        <button
          onClick={() => handleSelect('transfer')}
          className={`py-3 px-4 flex items-center justify-center gap-2 font-bold ${
            activeType === 'transfer'
              ? 'bg-secondary-container text-on-secondary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]'
              : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
          }`}
        >
          <ArrowLeftRight size={18} />
          Transfer
        </button>
      )}
    </div>
  );
}
