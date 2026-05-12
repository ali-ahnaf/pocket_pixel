'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input, AddVaultModal, AddRecurringQuestModal, DeleteVaultModal, DeleteQuestModal, AppBar, AvatarPickerModal, BottomNavBar, AddTagModal, DeleteTagModal } from '@/components';
import { Package, Award, Settings, HelpCircle, Home, User, BarChart, Briefcase, Plus, Pencil, Star, Trash2, Repeat, Calendar, CalendarDays, TrendingDown, TrendingUp, Tag } from 'lucide-react';
import { iconMapper } from '@/lib/iconMapper';

export default function ProfilePage() {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);

  const [questToEdit, setQuestToEdit] = useState<any>(null);
  const [questToDelete, setQuestToDelete] = useState<{ id: number; title: string } | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<any>(undefined);
  const [tagToDelete, setTagToDelete] = useState<any>(null);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('/avatars/avatar1.jpeg');
  const [playerName, setPlayerName] = useState('Steve Tracker');

  const [vaults, setVaults] = useState([
    {
      id: 'main',
      name: 'Main Stash',
      description: 'Primary storage for all loot',
      isDefault: true,
      icon: 'Briefcase',
      color: '#3b82f6',
    },
    {
      id: 'savings',
      name: 'Savings Chest',
      description: 'Untouchable quest rewards',
      isDefault: false,
      icon: 'PiggyBank',
      color: '#10b981',
    },
  ]);

  const [vaultToEdit, setVaultToEdit] = useState<{ id?: string; name: string; description: string; icon?: string; color?: string } | undefined>(undefined);
  const [vaultToDelete, setVaultToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSaveVault = (data: { id?: string; name: string; description: string; icon?: string; color?: string }) => {
    if (data.id) {
      setVaults(vaults.map((v) => (v.id === data.id ? { ...v, name: data.name, description: data.description, icon: data.icon || 'Briefcase', color: data.color || '#3b82f6' } : v)));
    } else {
      const newVault = {
        id: `vault-${Date.now()}`,
        name: data.name,
        description: data.description,
        isDefault: vaults.length === 0,
        icon: data.icon || 'Briefcase',
        color: data.color || '#3b82f6',
      };
      setVaults([...vaults, newVault]);
    }
  };

  const handleSetDefault = (vaultId: string) => {
    setVaults(
      vaults.map((v) => ({
        ...v,
        isDefault: v.id === vaultId,
      })),
    );
  };

  const handleDeleteVault = (action: 'delete_transactions' | 'move_transactions') => {
    if (!vaultToDelete) return;
    // In a real app, we would perform action on transactions here
    console.log(`Action chosen for deleted vault transactions: ${action}`);
    setVaults(vaults.filter((v) => v.id !== vaultToDelete.id));
    setVaultToDelete(null);
  };

  const [recurringQuests, setRecurringQuests] = useState([
    {
      id: 1,
      type: 'EXPENSE',
      title: 'Health Potion Subscription',
      description: 'Recurring healing items',
      amount: 15.0,
      frequency: 'Monthly',
      category: 'Health',
    },
    {
      id: 2,
      type: 'INCOME',
      title: 'Guild Stipend',
      description: 'Weekly quest rewards',
      amount: 250.0,
      frequency: 'Weekly',
      category: 'Salary',
    },
  ]);

  const handleSaveQuest = (data: any) => {
    if (data.id) {
      setRecurringQuests(recurringQuests.map((q) => (q.id === data.id ? { ...q, ...data } : q)));
    } else {
      setRecurringQuests([...recurringQuests, { ...data, id: Date.now(), description: 'New recurring quest' }]);
    }
  };

  const handleDeleteQuest = () => {
    if (!questToDelete) return;
    setRecurringQuests(recurringQuests.filter((q) => q.id !== questToDelete.id));
    setQuestToDelete(null);
  };

  const [tags, setTags] = useState([
    { id: '1', name: 'Groceries', color: '#84cc16', icon: 'ShoppingCart' },
    { id: '2', name: 'Entertainment', color: '#8b5cf6', icon: 'Gamepad2' },
    { id: '3', name: 'Transport', color: '#ef4444', icon: 'Car' },
    { id: '4', name: 'Housing', color: '#3b82f6', icon: 'Home' },
  ]);

  const handleSaveTag = (data: { id?: string; name: string; color: string; icon: string }) => {
    if (data.id) {
      setTags(tags.map(t => t.id === data.id ? { ...t, ...data } : t));
    } else {
      setTags([...tags, { ...data, id: `tag-${Date.now()}` }]);
    }
  };

  const handleDeleteTag = () => {
    if (!tagToDelete) return;
    setTags(tags.filter(t => t.id !== tagToDelete.id));
    setTagToDelete(null);
  };

  return (
    <div className="bg-background px-3 text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* TopAppBar (Mobile) / Top Row (Web) */}
      <AppBar avatarUrl={avatarUrl} />

      {/* NavigationDrawer (Web) */}
      <aside className="hidden md:flex flex-col h-screen w-80 border-r-4 border-black bg-surface-container dark:bg-surface-container-high sticky top-0 z-50">
        <div className="p-4 border-b-4 border-black flex items-center gap-4 bg-surface-container-lowest shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)] mb-8">
          <div className="h-12 w-12 border-4 border-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.3),_inset_2px_2px_0px_0px_rgba(255,255,255,0.2)] rounded-none bg-secondary-container overflow-hidden shrink-0">
            <img
              alt="Player Avatar"
              className="object-cover w-full h-full [image-rendering:pixelated]"
              src={avatarUrl}
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-headline-md text-primary truncate">{playerName}</h2>
            <p className="font-body-sm text-on-surface-variant truncate">Level 42 Budgeter</p>
            <p className="font-label-caps text-secondary mt-1">Diamond Tier</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {/* Inactive Navigation Items */}
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Package />
            <span className="font-label-caps tracking-wider uppercase">Inventory</span>
          </a>
          <a
            className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Award />
            <span className="font-label-caps tracking-wider uppercase">Quests</span>
          </a>

          {/* Active State Navigation Item */}
          <a
            className="flex items-center gap-3 p-3 bg-primary text-on-primary border-4 border-transparent border-r-4 border-r-primary-container btn shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
            href="#"
          >
            <Settings />
            <span className="font-label-caps tracking-wider uppercase">Settings</span>
          </a>

          <div className="mt-auto">
            <a
              className="flex items-center gap-3 p-3 text-on-surface hover:bg-surface-container-highest hover:translate-x-1 active:scale-95 transition-transform border-4 border-transparent hover:border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)]"
              href="#"
            >
              <HelpCircle />
              <span className="font-label-caps tracking-wider uppercase">Help</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col w-full relative pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl w-full mx-auto p-margin-mobile md:p-8 flex flex-col gap-3 md:gap-14">
          {/* Profile Section */}
          <section>
            <h2 className="font-headline-lg text-primary mb-stack-sm flex items-center gap-2">
              <User className="w-8 h-8" />
              Player Profile
            </h2>
            <Card className="p-6 flex mt-2 flex-col md:flex-row gap-6 items-start md:items-center border-secondary-container bg-surface-container-low !shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)]">
              <div className="w-24 h-24 border-4 border-black shrink-0 relative">
                <img
                  alt="Profile Edit"
                  className="w-full h-full object-cover [image-rendering:pixelated]"
                  src={avatarUrl}
                />
                <Button 
                  variant="primary" 
                  className="absolute -bottom-2 -right-2 w-8 h-8 !p-0 flex items-center justify-center rounded-none"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input 
                      label="Player Name" 
                      value={playerName} 
                      onChange={(e) => setPlayerName(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="flex justify-start">
                  <Button 
                    variant="primary" 
                    className="font-label-caps px-6 py-2 w-full"
                    onClick={() => {
                      // Logic to save changes (e.g. API call)
                      console.log('Saving changes:', { playerName, avatarUrl });
                    }}
                  >
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
                          setVaultToEdit(vault);
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
                            setVaultToEdit(vault);
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
              )})}
            </div>
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
                      <span className={`font-body-lg font-bold ${isExpense ? 'text-error' : 'text-primary'}`}>
                        {isExpense ? '-' : '+'} ${quest.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 border-4 border-black text-on-surface-variant">
                        <QuestIcon className="w-[16px] h-[16px]" />
                        <span className="font-label-caps">{quest.frequency}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-block font-label-caps px-2 py-1 border-4 border-black ${
                          isExpense ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'
                        }`}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter mt-4">
              {tags.map((tag) => {
                const IconComp = iconMapper(tag.icon);
                return (
                  <Card key={tag.id} className="p-3 flex items-center justify-between border-outline-variant hover:border-black transition-colors relative group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 flex items-center justify-center border-2 border-black shrink-0" style={{ backgroundColor: tag.color }}>
                        <IconComp size={16} className="text-black drop-shadow-sm" />
                      </div>
                      <span className="font-headline-sm truncate" title={tag.name}>{tag.name}</span>
                    </div>
                    <div className="flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity gap-1 ml-2 shrink-0 bg-surface-container-low">
                      <button
                        className="p-1 hover:bg-surface-container-highest border-2 border-transparent hover:border-black transition-all"
                        onClick={() => {
                          setTagToEdit(tag);
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
          </section>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <BottomNavBar />

      <AddVaultModal isOpen={isVaultModalOpen} onClose={() => setIsVaultModalOpen(false)} title={vaultToEdit ? 'Edit Vault' : 'Create New Vault'} initialData={vaultToEdit} onSave={handleSaveVault} />
      <DeleteVaultModal isOpen={!!vaultToDelete} onClose={() => setVaultToDelete(null)} vaultName={vaultToDelete?.name || ''} onDelete={handleDeleteVault} />
      <AddRecurringQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        title={questToEdit ? 'Edit Recurring Quest' : 'Add Recurring Quest'}
        initialData={questToEdit}
        onSave={handleSaveQuest}
      />

      <DeleteQuestModal isOpen={!!questToDelete} onClose={() => setQuestToDelete(null)} questName={questToDelete?.title || ''} onDelete={handleDeleteQuest} />
      
      <AddTagModal 
        isOpen={isTagModalOpen} 
        onClose={() => setIsTagModalOpen(false)} 
        title={tagToEdit ? 'Edit Tag' : 'Create New Tag'} 
        initialData={tagToEdit} 
        onSave={handleSaveTag} 
      />
      <DeleteTagModal 
        isOpen={!!tagToDelete} 
        onClose={() => setTagToDelete(null)} 
        tagName={tagToDelete?.name || ''} 
        onDelete={handleDeleteTag} 
      />
      <AvatarPickerModal 
        isOpen={isAvatarModalOpen} 
        onClose={() => setIsAvatarModalOpen(false)} 
        currentAvatar={avatarUrl} 
        onSelect={(avatar: string) => setAvatarUrl(avatar)} 
      />
    </div>
  );
}
