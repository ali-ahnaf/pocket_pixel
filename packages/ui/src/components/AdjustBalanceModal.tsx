'use client';

import React, { useState, useEffect } from 'react';
import { X, Scale, Coins } from 'lucide-react';
import { profileApi } from '../lib/api';
import { formatCurrency } from '@/lib/helpers/formatters';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string | null;
  currentNetYield: number;
  selectedMonth?: number;
  selectedYear?: number;
  vaultId?: string | null;
}

export function AdjustBalanceModal({ isOpen, onClose, onSuccess, userId, currentNetYield, selectedMonth, selectedYear, vaultId }: AdjustBalanceModalProps) {
  const [targetBalance, setTargetBalance] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetBalance(Number(currentNetYield.toFixed(2)).toString());
      setError(null);
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentNetYield]);

  if (!shouldRender) return null;

  const parsedTarget = parseFloat(targetBalance.trim());
  const isValidNumber = !isNaN(parsedTarget) && isFinite(Number(targetBalance.trim()));
  const diff = isValidNumber ? Math.round((parsedTarget - currentNetYield) * 100) / 100 : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userId || !isValidNumber || isSubmitting) return;

    if (diff === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const now = new Date();
    const isCurrentMonth = selectedMonth === undefined || selectedYear === undefined || (selectedMonth === now.getMonth() && selectedYear === now.getFullYear());
    const date = isCurrentMonth ? undefined : `${selectedYear}-${String((selectedMonth ?? 0) + 1).padStart(2, '0')}-01`;

    try {
      await profileApi.createTransaction(userId, {
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        title: 'Balance adjustment',
        vaultId: vaultId ?? null,
        date,
      });
      onSuccess?.();
      onClose();
    } catch {
      setError('Failed to create balance adjustment transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Main Container (Bottom Sheet on mobile, centered modal on desktop) */}
      <div
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[60] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-lg md:rounded-none transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Top Bar Decor ("Handle") */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-2 bg-black opacity-40"></div>
        </div>

        {/* Header */}
        <header className="px-4 pt-2 pb-5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-primary" />
              <h1 className="font-headline-md text-primary uppercase">ADJUST BALANCE</h1>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none"
            >
              <X className="text-on-surface" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="px-4 space-y-5 pb-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Net Yield Info Box */}
            <div className="p-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6)] flex justify-between items-center">
              <span className="font-label-caps text-xs text-outline uppercase">Current Net Yield</span>
              <span className={`font-headline-md ${currentNetYield >= 0 ? 'text-primary' : 'text-error'}`}>
                {currentNetYield >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(currentNetYield))}
              </span>
            </div>

            {/* Target Balance Input */}
            <div className="space-y-2">
              <label htmlFor="targetBalanceInput" className="font-label-caps text-xs text-on-surface uppercase block">
                Target Net Yield ($)
              </label>
              <div className="relative flex items-center flex-1">
                <div className="absolute left-4 flex items-center pointer-events-none">
                  <Coins className="text-secondary" />
                </div>
                <input
                  id="targetBalanceInput"
                  className="w-full h-16 pl-14 pr-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-headline-md text-secondary placeholder:text-surface-variant focus:outline-none focus:ring-0"
                  placeholder="0.00"
                  type="number"
                  step="any"
                  value={targetBalance}
                  onChange={(e) => setTargetBalance(e.target.value)}
                />
              </div>
            </div>

            {/* Difference Preview */}
            {isValidNumber && (
              <div className="p-3 bg-surface-container-lowest border-2 border-black flex justify-between items-center font-body-sm text-xs">
                <span className="text-outline uppercase font-label-caps">Adjustment needed</span>
                <span className={`font-label-caps font-bold ${diff > 0 ? 'text-primary' : diff < 0 ? 'text-error' : 'text-outline'}`}>
                  {diff > 0 ? `+${formatCurrency(diff)} (Income)` : diff < 0 ? `-${formatCurrency(Math.abs(diff))} (Expense)` : 'No change'}
                </span>
              </div>
            )}

            {error && <div className="text-xs text-error font-body-sm font-bold">{error}</div>}

            {/* Save Button */}
            <button
              type="submit"
              disabled={!isValidNumber || isSubmitting}
              className="w-full h-16 bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-4 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-headline-md font-black uppercase tracking-wider">{isSubmitting ? 'SAVING...' : 'SAVE ADJUSTMENT'}</span>
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
