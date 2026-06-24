'use client';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, TrendingDown, TrendingUp, X, Coins, ChevronDown } from 'lucide-react';
import { AppBar, BottomNavBar, Button, Card, AddDebtModal, DesktopSidebar } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { profileApi } from '@/lib/api';
import type { ApiDebt, ApiVault } from '@/lib/api/ProfileApi';
import { iconMapper } from '@/lib/iconMapper';

function formatCurrency(amount: number): string {
  return `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DebtsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [vaults, setVaults] = useState<ApiVault[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [applyDebt, setApplyDebt] = useState<ApiDebt | null>(null);
  const [applyVaultId, setApplyVaultId] = useState<string>('');
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    Promise.all([profileApi.getDebts(userId), profileApi.getVaults(userId)])
      .then(([d, v]) => {
        setDebts(d);
        setVaults(v);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleCreate = async (data: { title: string; amount: number; type: 'expense' | 'income' }) => {
    if (!userId) return;
    const created = await profileApi.createDebt(userId, data);
    setDebts((prev) => [created, ...prev]);
  };

  const openApplyDialog = (debt: ApiDebt) => {
    const defaultVault = vaults.find((v) => v.isDefault) ?? vaults[0];
    setApplyVaultId(defaultVault?.id ?? '');
    setApplyDebt(debt);
  };

  const handleConfirmApply = async () => {
    if (!userId || !applyDebt) return;
    setApplying(true);
    try {
      await profileApi.applyDebt(userId, applyDebt.id, applyVaultId || null);
      setDebts((prev) => prev.filter((d) => d.id !== applyDebt.id));
      setApplyDebt(null);
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  const handleDiscard = async (debt: ApiDebt) => {
    if (!userId) return;
    if (!confirm(`Discard "${debt.title}"?`)) return;
    await profileApi.deleteDebt(userId, debt.id);
    setDebts((prev) => prev.filter((d) => d.id !== debt.id));
  };

  const selectedVault = vaults.find((v) => v.id === applyVaultId);
  const SelectedVaultIcon = iconMapper(selectedVault?.icon || 'Briefcase');

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <AppBar />

      <DesktopSidebar />

      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-stack-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-surface-container-highest pb-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Debts</h2>
              <p className="font-body-sm text-on-surface-variant">Templates you can apply as expenses or income whenever they come due.</p>
            </div>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <span className="font-label-caps uppercase tracking-wider">New Due</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-container-highest border-4 border-black" />
              ))}
            </div>
          ) : debts.length === 0 ? (
            <Card className="flex flex-col gap-3 items-center text-center py-12">
              <Coins className="w-12 h-12 text-outline opacity-50" />
              <p className="font-headline-sm text-on-surface">No dues yet.</p>
              <p className="font-body-sm text-on-surface-variant">Create a due to keep a reusable template — apply it whenever the payment lands.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {debts.map((debt) => {
                const isIncome = debt.type === 'income';
                return (
                  <Card key={debt.id} className="flex flex-col sm:flex-row sm:items-center gap-3 !p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 shrink-0 border-4 border-black flex items-center justify-center ${isIncome ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                        {isIncome ? <TrendingUp /> : <TrendingDown />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline-sm text-on-surface truncate">{debt.title}</span>
                        <span className={`font-label-caps text-[11px] uppercase ${isIncome ? 'text-primary' : 'text-error'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(debt.amount)} · {debt.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => openApplyDialog(debt)}
                      >
                        <Check className="w-4 h-4" />
                        <span className="font-label-caps uppercase">Apply</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleDiscard(debt)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-label-caps uppercase">Discard</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNavBar />

      <AddDebtModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleCreate} />

      {applyDebt && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[100]"
            onClick={() => !applying && setApplyDebt(null)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <header className="px-6 py-4 border-b-4 border-black flex justify-between items-center">
              <h2 className="font-headline-md text-primary uppercase">Apply Due</h2>
              <button
                onClick={() => !applying && setApplyDebt(null)}
                className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center hover:bg-error-container hover:text-on-error-container transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-6 space-y-4">
              <p className="font-body-sm text-on-surface-variant">
                This will create a {applyDebt.type} of <span className="font-bold text-on-surface">{formatCurrency(applyDebt.amount)}</span> for <span className="font-bold text-on-surface">{applyDebt.title}</span> in the current month and remove the due.
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
                              const isSelected = applyVaultId === vault.id;
                              return (
                                <button
                                  key={vault.id}
                                  onClick={() => {
                                    setApplyVaultId(vault.id);
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

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setApplyDebt(null)}
                  disabled={applying}
                >
                  <span className="font-label-caps uppercase">Cancel</span>
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleConfirmApply}
                  disabled={applying}
                >
                  <Check className="w-4 h-4" />
                  <span className="font-label-caps uppercase">{applying ? 'Applying...' : 'Confirm'}</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
