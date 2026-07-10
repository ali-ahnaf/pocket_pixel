'use client';

import { useEffect, useState } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { iconMapper } from '@/lib/iconMapper';
import type { DebtDto, VaultDto } from '@expense-tracker/shared';

interface ApplyDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtDto | null;
  vaults: VaultDto[];
  vaultId: string;
  onVaultChange: (vaultId: string) => void;
  onConfirm: (skipTransaction: boolean) => void;
  applying: boolean;
}

function formatCurrency(amount: number): string {
  return `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function ApplyDebtModal({ isOpen, onClose, debt, vaults, vaultId, onVaultChange, onConfirm, applying }: ApplyDebtModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [displayDebt, setDisplayDebt] = useState<DebtDto | null>(debt);
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const [skipTransaction, setSkipTransaction] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (debt) setDisplayDebt(debt);
      setSkipTransaction(false);
      setShouldRender(true);
      const t = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
      setVaultDropdownOpen(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, debt]);

  if (!shouldRender || !displayDebt) return null;

  const handleClose = () => {
    if (!applying) onClose();
  };

  const selectedVault = vaults.find((v) => v.id === vaultId);
  const SelectedVaultIcon = iconMapper(selectedVault?.icon || 'Briefcase');

  return (
    <>
      <div className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />

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
              <Check className="w-6 h-6" />
              Apply Due
            </h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 hover:bg-error-container hover:text-on-error-container transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="px-6 py-6 pt-4 space-y-4 overflow-y-auto">
          <p className="font-body-sm text-on-surface-variant">
            Confirm will create a {displayDebt.type} of <span className="font-bold text-on-surface">{formatCurrency(displayDebt.amount)}</span> for{' '}
            <span className="font-bold text-on-surface">{displayDebt.title}</span> in the current month and remove the due.
          </p>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">VAULT</label>
            {vaults.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">No vaults available — the expense will be unassigned.</p>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setVaultDropdownOpen((o) => !o)}
                  className="w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg active:translate-y-0.5 bg-surface-container-lowest hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3">
                    <SelectedVaultIcon className="text-secondary" size={20} />
                    <span className="text-primary font-bold">{selectedVault?.name ?? 'Select vault'}</span>
                  </div>
                  <ChevronDown className={`text-outline transition-transform ${vaultDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                </button>
                {vaultDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[115]" onClick={() => setVaultDropdownOpen(false)} />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[120] bg-surface-container-high border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                      <div className="max-h-60 overflow-y-auto">
                        {vaults.map((vault) => {
                          const VaultIcon = iconMapper(vault.icon || 'Briefcase');
                          const isSelected = vaultId === vault.id;
                          return (
                            <button
                              key={vault.id}
                              onClick={() => {
                                onVaultChange(vault.id);
                                setVaultDropdownOpen(false);
                              }}
                              className={`w-full h-14 px-4 flex items-center justify-between transition-colors hover:bg-surface-container-highest ${
                                isSelected ? 'bg-surface-container-highest' : 'bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <VaultIcon className={isSelected ? 'text-secondary' : 'text-outline'} size={20} />
                                <span className={`font-body-lg ${isSelected ? 'text-primary font-bold' : 'text-on-surface'}`}>{vault.name}</span>
                              </div>
                              {isSelected && <div className="w-4 h-4 bg-primary border-2 border-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setSkipTransaction((s) => !s)} disabled={applying} className="w-full flex items-center gap-3 text-left active:translate-y-0.5 disabled:opacity-60">
            <div className={`w-6 h-6 shrink-0 border-4 border-black flex items-center justify-center ${skipTransaction ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest'}`}>
              {skipTransaction && <Check className="w-4 h-4" />}
            </div>
            <span className="font-body-sm text-on-surface">Skip transaction — clear the due without creating an {displayDebt.type}.</span>
          </button>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={() => onConfirm(skipTransaction)} disabled={applying}>
              <Check className="w-4 h-4" />
              <span className="font-label-caps uppercase">{applying ? 'Applying...' : 'Confirm'}</span>
            </Button>
            <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={applying}>
              <span className="font-label-caps uppercase">Cancel</span>
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
