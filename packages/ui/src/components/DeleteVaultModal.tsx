'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from './Button';

interface DeleteVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultName: string;
  onDelete: (action: 'delete_transactions' | 'move_transactions') => void;
}

export function DeleteVaultModal({ isOpen, onClose, vaultName, onDelete }: DeleteVaultModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'delete_transactions' | 'move_transactions'>('move_transactions');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-xl transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-black/20 rounded-full"></div>
        </div>

        {/* Header */}
        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-error uppercase flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Delete Vault
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 py-6 pt-0 space-y-6">
          <div className="space-y-4">
            <p className="font-body-md text-on-surface-variant">
              You are about to delete the vault <strong className="text-on-surface">"{vaultName}"</strong>. What would you like to do with its related transactions?
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                className={`w-full flex items-center gap-3 p-3 border-4 border-black transition-all ${
                  selectedAction === 'move_transactions' 
                    ? 'bg-secondary-container text-on-secondary-container shadow-[inset_2px_2px_0_rgba(255,255,255,0.3),inset_-2px_-2px_0_rgba(0,0,0,0.5)] translate-y-0.5' 
                    : 'bg-surface-container-lowest text-on-surface shadow-[inset_2px_2px_0_rgba(255,255,255,0.1),inset_-2px_-2px_0_rgba(0,0,0,0.3)] hover:bg-surface-container-low'
                }`}
                onClick={() => setSelectedAction('move_transactions')}
              >
                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 ${
                  selectedAction === 'move_transactions' ? 'bg-secondary' : 'bg-surface-container-highest'
                }`}>
                  {selectedAction === 'move_transactions' && <div className="w-2.5 h-2.5 bg-black" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-headline-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4" /> Move to Default
                  </div>
                  <div className="font-body-sm opacity-80">Transfer all transactions to your default vault.</div>
                </div>
              </button>
              
              <button
                type="button"
                className={`w-full flex items-center gap-3 p-3 border-4 border-black transition-all ${
                  selectedAction === 'delete_transactions' 
                    ? 'bg-error-container text-on-error-container shadow-[inset_2px_2px_0_rgba(255,255,255,0.3),inset_-2px_-2px_0_rgba(0,0,0,0.5)] translate-y-0.5' 
                    : 'bg-surface-container-lowest text-on-surface shadow-[inset_2px_2px_0_rgba(255,255,255,0.1),inset_-2px_-2px_0_rgba(0,0,0,0.3)] hover:bg-surface-container-low'
                }`}
                onClick={() => setSelectedAction('delete_transactions')}
              >
                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 ${
                  selectedAction === 'delete_transactions' ? 'bg-error' : 'bg-surface-container-highest'
                }`}>
                  {selectedAction === 'delete_transactions' && <div className="w-2.5 h-2.5 bg-black" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-headline-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete All
                  </div>
                  <div className="font-body-sm opacity-80">Permanently delete all related transactions.</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              variant="danger" 
              className="w-full py-3 flex items-center justify-center gap-2 group"
              onClick={() => {
                onDelete(selectedAction);
                onClose();
              }}
            >
              <Trash2 className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">Confirm Delete</span>
            </Button>
          </div>
        </main>

        {/* Footer Decor */}
        <div className="px-6 pb-6 pt-2 flex justify-between items-center opacity-30">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-error border-2 border-black"></div>
            <div className="w-3 h-3 bg-secondary border-2 border-black"></div>
            <div className="w-3 h-3 bg-tertiary border-2 border-black"></div>
          </div>
          <p className="font-label-caps text-[10px]">DANGER_ZONE_INTERFACE</p>
        </div>
      </div>
    </>
  );
}
