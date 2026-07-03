'use client';

import { useState, useEffect } from 'react';
import { X, Coins, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { iconMapper } from '../lib/iconMapper';
import { profileApi } from '../lib/api';
import { TransactionTypeToggle } from './TransactionTypeToggle';
import type { TagDto, VaultDto, TransactionDto } from '@expense-tracker/shared';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string | null;
  transaction: TransactionDto | null;
}

export function EditTransactionModal({ isOpen, onClose, onSuccess, userId, transaction }: EditTransactionModalProps) {
  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagDto[]>([]);

  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false);

  const selectedVault = vaults.find((v) => v.id === selectedVaultId) ?? null;

  const suggestions = availableTags.filter((tag) => !selectedTags.some((t) => t.id === tag.id) && tag.name.toLowerCase().includes(tagInput.toLowerCase())).slice(0, 3);

  useEffect(() => {
    if (isOpen && userId) {
      profileApi.getTags(userId).then((res) => {
        if (res) setAvailableTags(res);
      });
      profileApi.getVaults(userId).then((res) => {
        if (res) setVaults(res);
      });
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen && transaction) {
      setIsExpense(transaction.type === 'expense');
      setAmount(String(transaction.amount));
      setTitle(transaction.title ?? '');
      setSelectedTags(transaction.tags ?? []);
      setSelectedVaultId(transaction.vaultId);
      setTagInput('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, transaction]);

  const toggleTag = (tag: TagDto) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && userId) {
      e.preventDefault();
      const tagName = tagInput.trim();
      if (selectedTags.some((t) => t.name === tagName)) return;
      const existing = availableTags.find((t) => t.name === tagName);
      if (existing) {
        toggleTag(existing);
      } else {
        const res = await profileApi.createTag(userId, { name: tagName });
        if (res) {
          setAvailableTags([...availableTags, res]);
          setSelectedTags([...selectedTags, res]);
          setTagInput('');
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!userId || !amount || !transaction || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await profileApi.updateTransaction(userId, transaction.id, {
        amount: parseFloat(amount),
        type: isExpense ? 'expense' : 'income',
        tagIds: selectedTags.map((t) => t.id),
        title: title || null,
        vaultId: selectedVaultId,
      });
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !transaction || isDeleting) return;
    setIsDeleting(true);
    try {
      await profileApi.deleteTransaction(userId, transaction.id);
      onSuccess?.();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsVaultDropdownOpen(false);
      setShowDeleteConfirm(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[60] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-lg md:rounded-none transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-2 bg-black opacity-40"></div>
        </div>

        <header className="px-4 pt-2 pb-5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Pencil size={18} className="text-primary" />
              <h1 className="font-headline-md text-primary uppercase">Edit Transaction</h1>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none">
              <X className="text-on-surface" />
            </button>
          </div>
        </header>

        <main className="px-4 space-y-5 pb-3 overflow-y-auto">
          <div className="space-y-2">
            <input
              className="w-full h-16 px-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface focus:outline-none placeholder:text-surface-variant"
              placeholder="e.g. Grocery run"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Coins className="text-secondary" />
              </div>
              <input
                className="w-full h-16 pl-14 pr-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-headline-md text-secondary placeholder:text-surface-variant focus:outline-none focus:ring-0"
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
          </div>

          {vaults.length > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <button
                  onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
                  className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low ${
                    isVaultDropdownOpen ? 'ring-4 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedVault &&
                      (() => {
                        const VaultIcon = iconMapper(selectedVault.icon || 'Briefcase');
                        return <VaultIcon className="text-primary" size={20} />;
                      })()}
                    <span className="text-primary font-bold">{selectedVault?.name ?? 'Select vault'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-black/10 rounded-full" />
                    <ChevronDown className={`text-outline transition-transform duration-300 ${isVaultDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                  </div>
                </button>

                {isVaultDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[65]" onClick={() => setIsVaultDropdownOpen(false)} />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[70] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => {
                            setSelectedVaultId(null);
                            setIsVaultDropdownOpen(false);
                          }}
                          className={`w-full h-14 px-4 flex items-center font-body-lg transition-colors hover:bg-surface-container-highest ${
                            selectedVaultId === null ? 'bg-surface-container-highest text-primary font-bold' : 'bg-surface-container-low text-on-surface'
                          }`}
                        >
                          No vault
                        </button>
                        {vaults.map((vault) => {
                          const VaultIcon = iconMapper(vault.icon || 'Briefcase');
                          return (
                            <button
                              key={vault.id}
                              onClick={() => {
                                setSelectedVaultId(vault.id);
                                setIsVaultDropdownOpen(false);
                              }}
                              className={`w-full h-14 px-4 flex items-center justify-between font-body-lg transition-colors hover:bg-surface-container-highest group ${
                                selectedVaultId === vault.id ? 'bg-surface-container-highest' : 'bg-surface-container-low'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <VaultIcon className={selectedVaultId === vault.id ? 'text-primary' : 'text-outline'} size={20} />
                                <span className={`font-body-lg uppercase ${selectedVaultId === vault.id ? 'text-primary font-bold' : 'text-on-surface'}`}>{vault.name}</span>
                              </div>
                              {selectedVaultId === vault.id && <div className="w-4 h-4 bg-primary border-2 border-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="relative">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => {
                    const TagIcon = iconMapper(tag.icon || 'Hash');
                    return (
                      <span
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        style={{ backgroundColor: tag.backgroundColor ?? '#64748B' }}
                        className="text-sm text-white font-bold border-4 border-black px-2 py-1 font-label-caps flex items-center gap-2 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                      >
                        <TagIcon size={12} strokeWidth={3} />
                        {tag.name} <X size={12} strokeWidth={3} />
                      </span>
                    );
                  })}
                </div>
              )}

              <input
                className="w-full h-12 px-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface focus:outline-none placeholder:text-surface-variant"
                placeholder="Search or create tag..."
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.map((tag) => {
                    const SuggestionIcon = iconMapper(tag.icon || 'Hash');
                    const color = tag.backgroundColor ?? '#64748B';
                    return (
                      <span
                        key={tag.id}
                        onClick={() => toggleTag(tag)}
                        style={{ backgroundColor: `${color}20`, borderColor: color }}
                        className="bg-surface-container-highest text-sm border-4 px-2 py-1 font-label-caps font-bold flex items-center gap-2 active:translate-y-0.5 cursor-pointer hover:bg-surface-container-high transition-colors"
                      >
                        <SuggestionIcon size={12} style={{ color }} strokeWidth={3} />
                        <span style={{ color }}>{tag.name}</span>
                        <Plus size={12} style={{ color }} strokeWidth={3} />
                      </span>
                    );
                  })}
                </div>
              )}

              {tagInput && !suggestions.some((t) => t.name.toLowerCase() === tagInput.toLowerCase()) && !selectedTags.some((t) => t.name.toLowerCase() === tagInput.toLowerCase()) && (
                <div className="mt-3">
                  <span
                    onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as React.KeyboardEvent)}
                    className="bg-surface-container-highest border-4 border-black px-3 py-1 font-label-caps text-primary flex items-center w-fit gap-1 active:translate-y-0.5 cursor-pointer"
                  >
                    CREATE: {tagInput} <Plus size={14} />
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-5 flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={!amount || isSubmitting}
              className="w-full h-16 bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-4 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil size={20} />
              <span className="font-headline-md font-black uppercase tracking-wider">{isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-12 border-4 border-black bg-surface-container-low text-error font-label-caps flex items-center justify-center gap-2 hover:bg-error-container hover:text-on-error-container transition-colors active:translate-y-0.5"
              >
                <Trash2 size={16} />
                DELETE TRANSACTION
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-12 border-4 border-black bg-surface-container-low text-on-surface font-label-caps active:translate-y-0.5 hover:bg-surface-container-highest transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-12 border-4 border-black bg-error text-on-error font-label-caps flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 opacity-50">
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-error border-4 border-black"></div>
              <div className="w-4 h-4 bg-primary border-4 border-black"></div>
              <div className="w-4 h-4 bg-secondary border-4 border-black"></div>
            </div>
            <p className="font-label-caps text-[10px] text-outline">VER 1.0.42_STABLE</p>
          </div>
        </main>
      </div>
    </>
  );
}
