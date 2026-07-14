'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { iconMapper } from '../lib/iconMapper';
import type { VaultDto } from '@expense-tracker/shared';

interface VaultPickerProps {
  vaults: VaultDto[];
  selectedVaultId: string | null;
  onSelect: (vaultId: string | null) => void;
  /** When true, exposes a "No vault" option that selects `null`. */
  allowNone?: boolean;
  /** A vault id that cannot be picked here (e.g. already chosen as the other side of a transfer). */
  disabledVaultId?: string | null;
  placeholder?: string;
  /** Accessible label / test hook for the trigger button. */
  ariaLabel?: string;
}

export function VaultPicker({ vaults, selectedVaultId, onSelect, allowNone = false, disabledVaultId = null, placeholder = 'Select vault', ariaLabel }: VaultPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedVault = vaults.find((v) => v.id === selectedVaultId) ?? null;

  const select = (vaultId: string | null) => {
    onSelect(vaultId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low ${
          isOpen ? 'ring-4 ring-primary/20' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedVault &&
            (() => {
              const VaultIcon = iconMapper(selectedVault.icon || 'Briefcase');
              return <VaultIcon className="text-primary" size={20} />;
            })()}
          <span className="text-primary font-bold">{selectedVault?.name ?? placeholder}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-black/10 rounded-full" />
          <ChevronDown className={`text-outline transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[70] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {allowNone && (
                <button
                  type="button"
                  onClick={() => select(null)}
                  className={`w-full h-14 px-4 flex items-center font-body-lg transition-colors hover:bg-surface-container-highest ${
                    selectedVaultId === null ? 'bg-surface-container-highest text-primary font-bold' : 'bg-surface-container-low text-on-surface'
                  }`}
                >
                  No vault
                </button>
              )}
              {vaults.map((vault) => {
                const VaultIcon = iconMapper(vault.icon || 'Briefcase');
                const isSelected = selectedVaultId === vault.id;
                const isDisabled = disabledVaultId === vault.id;
                return (
                  <button
                    key={vault.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => select(vault.id)}
                    className={`w-full h-14 px-4 flex items-center justify-between font-body-lg transition-colors group ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-surface-container-low'
                        : `hover:bg-surface-container-highest ${isSelected ? 'bg-surface-container-highest' : 'bg-surface-container-low'}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <VaultIcon className={isSelected ? 'text-primary' : 'text-outline'} size={20} />
                      <span className={`font-body-lg uppercase ${isSelected ? 'text-primary font-bold' : 'text-on-surface'}`}>{vault.name}</span>
                    </div>
                    {isDisabled ? <span className="font-label-caps text-[10px] text-outline">IN USE</span> : isSelected && <div className="w-4 h-4 bg-primary border-2 border-black" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
