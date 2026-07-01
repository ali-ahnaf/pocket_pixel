'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Save, Coins, Pencil } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { TransactionTypeToggle } from './TransactionTypeToggle';
import type { DebtDto } from '@expense-tracker/shared';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; amount: number; type: 'expense' | 'income'; notes: string | null }) => void;
  debt?: DebtDto | null;
}

export function AddDebtModal({ isOpen, onClose, onSave, debt = null }: AddDebtModalProps) {
  const isEditing = Boolean(debt);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(debt?.title ?? '');
      setAmount(debt ? String(debt.amount) : '');
      setIsExpense(debt ? debt.type === 'expense' : true);
      setNotes(debt?.notes ?? '');
      setShouldRender(true);
      const t = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, debt]);

  if (!shouldRender) return null;

  const canSave = name.trim().length > 0 && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const trimmedNotes = notes.trim();
    onSave({
      title: name.trim(),
      amount: parseFloat(amount),
      type: isExpense ? 'expense' : 'income',
      notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    });
    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-xl transition-transform duration-300 ease-in-out custom-scrollbar ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
        </div>

        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-primary uppercase flex items-center gap-2">
              {isEditing ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              {isEditing ? 'Edit Due' : 'New Due'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 hover:bg-error-container hover:text-on-error-container transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="px-6 py-6 pt-0 space-y-5 overflow-y-auto">
          <div className="space-y-2 mt-4">
            <label className="pixel-input-label ml-1">NAME</label>
            <Input placeholder="e.g. Rent, Loan Repayment" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">AMOUNT</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Coins className="text-secondary" />
              </div>
              <input
                className="w-full h-14 pl-14 pr-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-headline-sm text-secondary placeholder:text-surface-variant focus:outline-none focus:ring-0"
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">TYPE</label>
            <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
          </div>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">NOTES</label>
            <textarea
              className="w-full min-h-[96px] p-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface placeholder:text-surface-variant focus:outline-none focus:ring-0 resize-y custom-scrollbar"
              placeholder="e.g - Borrowed for concert tickets, pay back by August"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full py-3 flex items-center justify-center gap-2 group disabled:opacity-50" onClick={handleSave} disabled={!canSave}>
              <Save className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">{isEditing ? 'Update Due' : 'Save Due'}</span>
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
