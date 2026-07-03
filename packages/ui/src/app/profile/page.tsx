'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Card,
  Badge,
  Input,
  AddVaultModal,
  AddRecurringQuestModal,
  DeleteVaultModal,
  DeleteQuestModal,
  AppBar,
  AvatarPickerModal,
  BottomNavBar,
  AddTagModal,
  DeleteTagModal,
  DesktopSidebar,
} from '@/components';
import { User, Briefcase, Plus, Pencil, Star, Trash2, Repeat, Calendar, CalendarDays, TrendingDown, TrendingUp, Tag, Coins } from 'lucide-react';
import { iconMapper } from '@/lib/iconMapper';
import { profileApi } from '@/lib/api';
import type { VaultDto, TagDto, RecurringDto } from '@expense-tracker/shared';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toUiVault(v: VaultDto) {
  return { ...v, color: v.backgroundColor || '#3b82f6', icon: v.icon || 'Briefcase' };
}

function toUiTag(t: TagDto) {
  return { ...t, color: t.backgroundColor || '#3b82f6', icon: t.icon || 'Tag' };
}

function toUiQuest(q: RecurringDto) {
  const tagNames = (q.tags || []).map((tag) => tag.name);

  return {
    id: q.id,
    type: q.type.toUpperCase() as 'EXPENSE' | 'INCOME',
    title: q.title || '',
    description: tagNames.join(', '),
    amount: Number(q.amount),
    frequency: capitalize(q.interval),
    category: tagNames[0] || 'Uncategorized',
    startDate: q.startDate || '',
    endDate: q.endDate || '',
    tagIds: q.tagIds || [],
    vaultId: q.vaultId || null,
  };
}

type UiVault = ReturnType<typeof toUiVault>;
type UiTag = ReturnType<typeof toUiTag>;
type UiQuest = ReturnType<typeof toUiQuest>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const userId = user?.id ?? null;
  const [loading, setLoading] = useState(true);

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState<UiQuest | null>(null);
  const [questToDelete, setQuestToDelete] = useState<{ id: string; title: string } | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<{ id?: string; name: string; color: string; icon: string } | undefined>(undefined);
  const [tagToDelete, setTagToDelete] = useState<UiTag | null>(null);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('/avatars/avatar1.jpeg');
  const [playerName, setPlayerName] = useState('');

  const [vaults, setVaults] = useState<UiVault[]>([]);
  const [vaultToEdit, setVaultToEdit] = useState<{ id?: string; name: string; description: string; icon?: string; color?: string; budget?: number | null } | undefined>(undefined);
  const [vaultToDelete, setVaultToDelete] = useState<{ id: string; name: string } | null>(null);

  const [recurringQuests, setRecurringQuests] = useState<UiQuest[]>([]);
  const [tags, setTags] = useState<UiTag[]>([]);

  useEffect(() => {
    if (!user) return;
    setPlayerName(user.name || '');
    setAvatarUrl(user.avatar || '/avatars/avatar1.jpeg');
  }, [user]);

  const fetchAll = useCallback(async (uid: string) => {
    setLoading(true);
    const [vaultsRes, tagsRes, questsRes] = await Promise.all([profileApi.getVaults(uid), profileApi.getTags(uid), profileApi.getRecurringQuests(uid)]);
    if (vaultsRes) setVaults(vaultsRes.map(toUiVault));
    if (tagsRes) setTags(tagsRes.map(toUiTag));
    if (questsRes) setRecurringQuests(questsRes.map(toUiQuest));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) fetchAll(userId);
  }, [userId, fetchAll]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    const res = await profileApi.updateUser(userId, { name: playerName, avatar: avatarUrl });
    if (res) {
      updateProfile({ id: res.id, name: res.name, email: res.email, avatar: res.avatar });
    }
  };

  const handleSaveVault = async (data: { id?: string; name: string; description: string; icon?: string; color?: string; budget: number | null }) => {
    if (!userId) return;
    const payload = { name: data.name, description: data.description, icon: data.icon, backgroundColor: data.color, monthlyBudget: data.budget };
    if (data.id) {
      const res = await profileApi.updateVault(userId, data.id, payload);
      if (res) setVaults((prev) => prev.map((v) => (v.id === data.id ? toUiVault(res) : v)));
    } else {
      const res = await profileApi.createVault(userId, payload);
      if (res) setVaults((prev) => [...prev, toUiVault(res)]);
    }
  };

  const handleSetDefault = async (vaultId: string) => {
    if (!userId) return;
    const res = await profileApi.setDefaultVault(userId, vaultId);
    if (res) {
      setVaults((prev) => prev.map((v) => ({ ...v, isDefault: v.id === vaultId })));
    }
  };

  const handleDeleteVault = async (_action: 'delete_transactions' | 'move_transactions') => {
    if (!userId || !vaultToDelete) return;
    await profileApi.deleteVault(userId, vaultToDelete.id);
    setVaults((prev) => prev.filter((v) => v.id !== vaultToDelete.id));
    setVaultToDelete(null);
  };

  const handleSaveQuest = async (data: any) => {
    if (!userId) return;
    const payload = {
      title: data.title || data.name,
      amount: data.amount,
      type: (data.type as string).toLowerCase(),
      interval: (data.frequency || data.selectedInterval || 'monthly').toLowerCase(),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      tagIds: data.tagIds || [],
      vaultId: data.vaultId || null,
    };
    if (data.id) {
      const res = await profileApi.updateRecurringQuest(userId, data.id, payload);
      if (res) setRecurringQuests((prev) => prev.map((q) => (q.id === data.id ? toUiQuest(res) : q)));
    } else {
      const res = await profileApi.createRecurringQuest(userId, payload);
      if (res) setRecurringQuests((prev) => [...prev, toUiQuest(res)]);
    }
  };

  const handleCreateTagForQuest = async (name: string): Promise<TagDto | null> => {
    if (!userId) return null;
    const res = await profileApi.createTag(userId, { name });
    if (res) {
      setTags((prev) => [...prev, toUiTag(res)]);
      return res;
    }
    return null;
  };

  const handleDeleteQuest = async () => {
    if (!userId || !questToDelete) return;
    await profileApi.deleteRecurringQuest(userId, questToDelete.id);
    setRecurringQuests((prev) => prev.filter((q) => q.id !== questToDelete.id));
    setQuestToDelete(null);
  };

  const handleSaveTag = async (data: { id?: string; name: string; color: string; icon: string }) => {
    if (!userId) return;
    const payload = { name: data.name, icon: data.icon, backgroundColor: data.color };
    if (data.id) {
      const res = await profileApi.updateTag(userId, data.id, payload);
      if (res) setTags((prev) => prev.map((t) => (t.id === data.id ? toUiTag(res) : t)));
    } else {
      const res = await profileApi.createTag(userId, payload);
      if (res) setTags((prev) => [...prev, toUiTag(res)]);
    }
  };

  const handleDeleteTag = async () => {
    if (!userId || !tagToDelete) return;
    await profileApi.deleteTag(userId, tagToDelete.id);
    setTags((prev) => prev.filter((t) => t.id !== tagToDelete.id));
    setTagToDelete(null);
  };

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <AppBar />

      <DesktopSidebar name={playerName} avatar={avatarUrl} />

      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-3 md:gap-14">
          {/* Profile Section */}
          <section>
            <h2 className="font-headline-lg text-primary mb-stack-sm flex items-center gap-2">
              <User className="w-8 h-8" />
              Player Profile
            </h2>
            <Card className="p-6 flex mt-2 flex-col md:flex-row gap-6 items-start md:items-center border-secondary-container bg-surface-container-low !shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)]">
              <div className="w-24 h-24 border-4 border-black shrink-0 relative">
                <img alt="Profile Edit" className="w-full h-full object-cover [image-rendering:pixelated]" src={avatarUrl} />
                <Button variant="primary" className="absolute -bottom-2 -right-2 w-8 h-8 !p-0 flex items-center justify-center rounded-none" onClick={() => setIsAvatarModalOpen(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input label="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-start">
                  <Button variant="primary" className="font-label-caps px-6 py-2 w-full" onClick={handleSaveProfile}>
                    Save changes
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Vaults Section */}
          <section>
            <div className="flex justify-between items-end mb-stack-sm border-b-4 border-outline-variant pb-2">
              <h2 className="font-headline-lg text-primary flex items-center gap-2">
                <Briefcase className="w-8 h-8" />
                Your Vaults
              </h2>
              <Button
                variant="primary"
                className="flex items-center gap-1 font-label-caps px-4 py-2 border-b-primary-container"
                onClick={() => {
                  setVaultToEdit(undefined);
                  setIsVaultModalOpen(true);
                }}
              >
                <Plus className="w-[18px] h-[18px]" /> Add
              </Button>
            </div>
            {loading ? (
              <p className="font-body-sm text-on-surface-variant">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {vaults.map((vault) => {
                  const IconComp = iconMapper(vault.icon || 'Briefcase');
                  return (
                    <Card key={vault.id} className={`p-4 relative flex flex-col mt-2 justify-between ${vault.isDefault ? 'border-primary mt-2' : 'border-outline-variant'}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 flex items-center justify-center border-2 border-black shrink-0" style={{ backgroundColor: vault.color || '#3b82f6' }}>
                              <IconComp size={16} className="text-black drop-shadow-sm" />
                            </div>
                            <h3 className="font-headline-md text-on-surface">{vault.name}</h3>
                          </div>
                          {vault.isDefault && (
                            <Badge variant="primary" className="text-[10px]">
                              DEFAULT
                            </Badge>
                          )}
                        </div>
                        <p className="font-body-sm text-on-surface-variant mb-4">{vault.description}</p>
                      </div>

                      {vault.isDefault ? (
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="ghost"
                            className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                            onClick={() => {
                              setVaultToEdit({ id: vault.id, name: vault.name, description: vault.description, icon: vault.icon, color: vault.color, budget: vault.monthlyBudget });
                              setIsVaultModalOpen(true);
                            }}
                          >
                            <Pencil className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-4">
                          <button className="font-label-caps text-secondary flex items-center gap-1 hover:underline text-sm" onClick={() => handleSetDefault(vault.id)}>
                            <Star className="w-[16px] h-[16px]" /> Set as Default
                          </button>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                              onClick={() => {
                                setVaultToEdit({ id: vault.id, name: vault.name, description: vault.description, icon: vault.icon, color: vault.color, budget: vault.monthlyBudget });
                                setIsVaultModalOpen(true);
                              }}
                            >
                              <Pencil className="w-5 h-5" />
                            </Button>
                            <Button variant="danger" className="p-1 w-8 h-8 border-b-error flex items-center justify-center" onClick={() => setVaultToDelete({ id: vault.id, name: vault.name })}>
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recurring Quests Section */}
          <section>
            <div className="flex justify-between items-end mb-stack-sm border-b-4 border-outline-variant pb-2">
              <h2 className="font-headline-lg text-secondary flex items-center gap-2">
                <Repeat className="w-8 h-8" />
                Recurring Quests
              </h2>
              <Button
                variant="primary"
                className="flex items-center gap-1 font-label-caps px-4 py-2 border-b-primary-container"
                onClick={() => {
                  setQuestToEdit(null);
                  setIsQuestModalOpen(true);
                }}
              >
                <Plus className="w-[18px] h-[18px]" /> Add
              </Button>
            </div>
            {loading ? (
              <p className="font-body-sm text-on-surface-variant">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                {recurringQuests.map((quest) => {
                  const isExpense = quest.type === 'EXPENSE';
                  const QuestIcon = isExpense ? Calendar : CalendarDays;
                  return (
                    <Card key={quest.id} className={`p-4 mt-2 relative overflow-hidden ${isExpense ? 'border-error-container' : 'border-primary-container'}`}>
                      <div className={`absolute top-0 right-0 p-1.5 border-4 border-black border-t-0 border-r-0 ${isExpense ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}>
                        {isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <h3 className="font-headline-md text-on-surface mt-2 mb-1">{quest.title}</h3>
                      <p className="font-body-sm text-on-surface-variant mb-4">{quest.description}</p>
                      <div className="flex justify-between items-center bg-surface-dim border-4 border-black p-2 mb-4 border-t-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]">
                        <span className={`font-body-lg font-bold flex items-center gap-1 ${isExpense ? 'text-error' : 'text-primary'}`}>
                          {isExpense ? '-' : '+'} <Coins className="w-[16px] h-[16px]" /> {quest.amount.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 border-4 border-black text-on-surface-variant">
                          <QuestIcon className="w-[16px] h-[16px]" />
                          <span className="font-label-caps">{quest.frequency}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`inline-block font-label-caps px-2 py-1 border-4 border-black ${isExpense ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'}`}
                        >
                          #{quest.category}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            className="p-1 w-8 h-8 border-b-black bg-surface-container-highest text-on-surface flex items-center justify-center"
                            onClick={() => {
                              setQuestToEdit(quest);
                              setIsQuestModalOpen(true);
                            }}
                          >
                            <Pencil className="w-5 h-5" />
                          </Button>
                          <Button variant="danger" className="p-1 w-8 h-8 border-b-error flex items-center justify-center" onClick={() => setQuestToDelete({ id: quest.id, title: quest.title })}>
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Tags */}
          <section>
            <div className="flex justify-between items-end mb-stack-sm border-b-4 border-outline-variant pb-2">
              <h2 className="font-headline-lg text-tertiary flex items-center gap-2">
                <Tag className="w-8 h-8" />
                Tags
              </h2>
              <Button
                variant="primary"
                className="flex items-center gap-1 font-label-caps px-4 py-2 border-b-primary-container"
                onClick={() => {
                  setTagToEdit(undefined);
                  setIsTagModalOpen(true);
                }}
              >
                <Plus className="w-[18px] h-[18px]" /> Add
              </Button>
            </div>
            {loading ? (
              <p className="font-body-sm text-on-surface-variant">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 gap-gutter mt-4">
                {tags.map((tag) => {
                  const IconComp = iconMapper(tag.icon);
                  return (
                    <Card key={tag.id} className="p-3 flex items-center justify-between border-outline-variant hover:border-black transition-colors relative group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 flex items-center justify-center border-2 border-black shrink-0" style={{ backgroundColor: tag.color }}>
                          <IconComp size={16} className="text-black drop-shadow-sm" />
                        </div>
                        <span className="font-headline-sm truncate" title={tag.name}>
                          {tag.name}
                        </span>
                      </div>
                      <div className="flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-2 shrink-0 bg-surface-container-low">
                        <button
                          className="p-1 hover:bg-surface-container-highest border-2 border-transparent hover:border-black transition-all"
                          onClick={() => {
                            setTagToEdit({ id: tag.id, name: tag.name, color: tag.color, icon: tag.icon });
                            setIsTagModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 hover:bg-error-container text-error hover:text-on-error-container border-2 border-transparent hover:border-error transition-all"
                          onClick={() => setTagToDelete(tag)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNavBar />

      <AddVaultModal isOpen={isVaultModalOpen} onClose={() => setIsVaultModalOpen(false)} title={vaultToEdit ? 'Edit Vault' : 'Create New Vault'} initialData={vaultToEdit} onSave={handleSaveVault} />
      <DeleteVaultModal isOpen={!!vaultToDelete} onClose={() => setVaultToDelete(null)} vaultName={vaultToDelete?.name || ''} onDelete={handleDeleteVault} />
      <AddRecurringQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        title={questToEdit ? 'Edit Recurring Quest' : 'Add Recurring Quest'}
        initialData={questToEdit}
        onSave={handleSaveQuest}
        availableTags={tags}
        availableVaults={vaults}
        onCreateTag={handleCreateTagForQuest}
      />

      <DeleteQuestModal isOpen={!!questToDelete} onClose={() => setQuestToDelete(null)} questName={questToDelete?.title || ''} onDelete={handleDeleteQuest} />
      <AddTagModal isOpen={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} title={tagToEdit ? 'Edit Tag' : 'Create New Tag'} initialData={tagToEdit} onSave={handleSaveTag} />
      <DeleteTagModal isOpen={!!tagToDelete} onClose={() => setTagToDelete(null)} tagName={tagToDelete?.name || ''} onDelete={handleDeleteTag} />
      <AvatarPickerModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} currentAvatar={avatarUrl} onSelect={(avatar: string) => setAvatarUrl(avatar)} />
      
    </div>
  );
}
