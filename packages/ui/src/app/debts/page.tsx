'use client';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, TrendingDown, TrendingUp, X, Coins, ChevronDown } from 'lucide-react';

import { AppBar, BottomNavBar, Button, Card, AddDebtModal, DesktopSidebar } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { profileApi } from '@/lib/api';
import type { DebtDto, VaultDto } from '@expense-tracker/shared';
import { iconMapper } from '@/lib/iconMapper';

const DebtTypes = {
  INCOMPLETE: 'incomplete',
  COMPLETED: 'completed',
  ALL: 'all',
} as const;

type DebtType = (typeof DebtTypes)[keyof typeof DebtTypes];

function formatCurrency(amount: number): string {
  return `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DebtsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [debts, setDebts] = useState<DebtDto[]>([]);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<DebtDto | null>(null);
  const [status, setStatus] = useState<DebtType>(DebtTypes.INCOMPLETE);

  const [applyDebt, setApplyDebt] = useState<DebtDto | null>(null);
  const [applyVaultId, setApplyVaultId] = useState<string>('');
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);
  const [applyingAction, setApplyingAction] = useState<'confirm' | 'withoutTransaction' | null>(null);
  const applying = applyingAction !== null;
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    Promise.all([profileApi.getDebts(userId, status), profileApi.getVaults(userId)])
      .then(([d, v]) => {
        setDebts(d);
        setVaults(v);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId, status]);

  const handleCreate = async (data: { title: string; amount: number; type: 'expense' | 'income'; notes: string | null }) => {
    if (!userId) return;
    const created = await profileApi.createDebt(userId, data);
    setDebts((prev) => [created, ...prev]);
  };

  const handleUpdate = async (data: { title: string; amount: number; type: 'expense' | 'income'; notes: string | null }) => {
    if (!userId || !editDebt) return;
    const updated = await profileApi.updateDebt(userId, editDebt.id, data);
    setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const openApplyDialog = (debt: DebtDto) => {
    const defaultVault = vaults.find((v) => v.isDefault) ?? vaults[0];
    setApplyVaultId(defaultVault?.id ?? '');
    setApplyDebt(debt);
  };

  const handleApply = async (skipTransaction?: boolean) => {
    if (!userId || !applyDebt) return;

    setApplyingAction(skipTransaction ? 'withoutTransaction' : 'confirm');

    try {
      await profileApi.applyDebt(userId, applyDebt.id, applyVaultId || null, skipTransaction);
      setDebts((prev) => prev.filter((d) => d.id !== applyDebt.id));
      setApplyDebt(null);
      setVaultDropdownOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingAction(null);
    }
  };

  const handleDiscard = async (debt: DebtDto) => {
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

      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 pb-6 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-stack-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-surface-container-highest pb-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                <Link href="/" className="text-primary no-underline">
                  Debts
                </Link>
              </h2>
              <p className="font-body-sm text-on-surface-variant">Templates you can apply as expenses or income whenever they come due.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Button
                  variant="primary"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low
                    ${statusDropdownOpen ? 'ring-4 ring-primary/20' : ''}
                  `}
                >
                  <span className="text-primary font-bold">{status.charAt(0).toUpperCase() + status.slice(1)}</span>

                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-black/10 rounded-full" />
                    <ChevronDown className={`text-outline transition-transform duration-300 ${statusDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                  </div>
                </Button>

                {statusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[115]" onClick={() => setStatusDropdownOpen(false)} />

                    <div
                      className={`absolute top-[calc(100%+4px)] left-0 right-0 z-[120] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-200
                  ${statusDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                  `}
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {Object.values(DebtTypes).map((type) => {
                          const isSelected = status === type;

                          return (
                            <button
                              key={type}
                              onClick={() => {
                                setStatus(type);
                                setStatusDropdownOpen(false);
                              }}
                              className={`w-full h-14 px-4 flex items-center justify-between font-body-lg transition-colors hover:bg-surface-container-highest group ${
                                isSelected ? 'bg-surface-container-highest' : 'bg-surface-container-low'
                              }`}
                            >
                              <span className={`font-body-lg ${isSelected ? 'text-primary font-bold' : 'text-on-surface'}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>

                              {isSelected && <div className="w-4 h-4 bg-primary border-2 border-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button variant="primary" className="flex h-14 items-center gap-2 whitespace-nowrap" onClick={() => setAddOpen(true)}>
                <Plus className="w-5 h-5" />
                <span className="font-label-caps uppercase tracking-wider whitespace-nowrap">New Due</span>
              </Button>
            </div>
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
                    <button
                      type="button"
                      onClick={() => setEditDebt(debt)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group focus:outline-none"
                      aria-label={`Edit ${debt.title}`}
                    >
                      <div
                        className={`w-12 h-12 shrink-0 border-4 border-black flex items-center justify-center ${isIncome ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}
                      >
                        {isIncome ? <TrendingUp /> : <TrendingDown />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">{debt.title}</span>

                          {debt.completed && <span className="text-xs bg-green-200 px-2 py-1 rounded">✓ Completed</span>}
                        </div>
                        <span className={`font-label-caps text-[11px] uppercase ${isIncome ? 'text-primary' : 'text-error'}`}>
                          {formatCurrency(debt.amount)} · {debt.type}
                        </span>
                        {debt.notes && <span className="font-body-sm text-on-surface-variant truncate mt-0.5">{debt.notes}</span>}
                      </div>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="primary" size="sm" className="flex items-center gap-1" onClick={() => openApplyDialog(debt)}>
                        <Check className="w-4 h-4" />
                        <span className="font-label-caps uppercase">Apply</span>
                      </Button>
                      <Button variant="danger" size="sm" className="flex items-center gap-1" onClick={() => handleDiscard(debt)}>
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

      <AddDebtModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleCreate} />

      <AddDebtModal isOpen={editDebt !== null} onClose={() => setEditDebt(null)} onSave={handleUpdate} debt={editDebt} />

      {applyDebt && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[100]" onClick={() => !applying && setApplyDebt(null)} />
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
                Confirm will create a {applyDebt.type} of <span className="font-bold text-on-surface">{formatCurrency(applyDebt.amount)}</span> for{' '}
                <span className="font-bold text-on-surface">{applyDebt.title}</span> in the current month and remove the due. Apply without transaction will remove the due without creating a
                transaction.
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
                <Button variant="ghost" className="flex-1" onClick={() => setApplyDebt(null)} disabled={applying}>
                  <span className="font-label-caps uppercase">Cancel</span>
                </Button>
                <Button variant="primary" className="w-full flex items-center justify-center gap-2" onClick={() => handleApply()} disabled={applying}>
                  <Check className="w-4 h-4" />
                  <span className="font-label-caps uppercase">{applyingAction === 'confirm' ? 'Applying...' : 'Confirm'}</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
