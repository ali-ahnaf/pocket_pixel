'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Save, TrendingDown, TrendingUp, Coins, CalendarDays, ChevronDown } from 'lucide-react';
import { iconMapper } from '../lib/iconMapper';
import { Button } from './Button';
import { Input } from './Input';

interface AddRecurringQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function AddRecurringQuestModal({ isOpen, onClose, title }: AddRecurringQuestModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  
  // Date states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Tag state
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Vault state
  const VAULTS = [
    { id: '1', name: 'Main Stash', logo: 'Wallet', color: 'text-secondary' },
    { id: '2', name: 'Gold Reserve', logo: 'Gem', color: 'text-primary' },
    { id: '3', name: 'Secret Cache', logo: 'Shield', color: 'text-tertiary' },
    { id: '4', name: 'Travel Pouch', logo: 'Briefcase', color: 'text-error' },
  ];
  const [selectedVaultId, setSelectedVaultId] = useState(VAULTS[0].id);
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false);
  const selectedVault = VAULTS.find(v => v.id === selectedVaultId) || VAULTS[0];
  const SelectedVaultIcon = iconMapper(selectedVault.logo);

  // Interval state
  const INTERVALS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS[2]);
  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);

  const DUMMY_TAGS = ['POTIONS', 'GEAR', 'TAVERN', 'QUEST', 'LOOT', 'SCROLLS', 'FOOD', 'ARMOR', 'WEAPONS', 'MAPS'];
  
  const suggestions = DUMMY_TAGS.filter(
    tag => 
      !selectedTags.includes(tag) && 
      tag.toLowerCase().includes(tagInput.toLowerCase())
  ).slice(0, 3);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toUpperCase();
      if (newTag && !selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput('');
      }
      e.preventDefault();
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
      setIsIntervalDropdownOpen(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-xl transition-transform duration-300 ease-in-out custom-scrollbar ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-black/20 rounded-full"></div>
        </div>

        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-primary uppercase flex items-center gap-2">
              <Plus className="w-6 h-6" />
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="px-6 py-6 pt-0 space-y-5 overflow-y-auto">
          {/* Name Input */}
          <div className="space-y-2 mt-4">
            <label className="pixel-input-label ml-1">NAME</label>
            <Input 
              placeholder="e.g. Health Potion Subscription" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Amount Input */}
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

          {/* Transaction Type Toggle */}
          <div className="space-y-2">
            <label className="pixel-input-label ml-1">TYPE</label>
            <div className="grid grid-cols-2 gap-1 bg-black p-1 border-4 border-black">
              <button 
                onClick={() => setIsExpense(true)}
                className={`py-3 px-4 font-label-caps flex items-center justify-center gap-2 ${
                  isExpense 
                    ? 'bg-error-container text-on-error-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]' 
                    : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
                }`}
              >
                <TrendingDown size={18} />
                EXPENSE
              </button>
              <button 
                onClick={() => setIsExpense(false)}
                className={`py-3 px-4 font-label-caps flex items-center justify-center gap-2 ${
                  !isExpense 
                    ? 'bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)]' 
                    : 'bg-surface-container-low text-outline hover:bg-surface-container-highest transition-colors'
                }`}
              >
                <TrendingUp size={18} />
                INCOME
              </button>
            </div>
          </div>
          
          {/* Tags Autocomplete Section */}
          <div className="space-y-2">
            <label className="pixel-input-label ml-1">TAGS</label>
            <div className="relative">
              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map(tag => (
                    <span 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="bg-tertiary-container text-sm text-on-tertiary-container font-bold border-4 border-black px-3 py-1 font-label-caps flex items-center gap-1 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      {tag} <X size={14} />
                    </span>
                  ))}
                </div>
              )}

              <input 
                className="w-full h-12 px-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface focus:outline-none placeholder:text-surface-variant" 
                placeholder="Search or create tags..." 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.map(tag => (
                    <span 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="bg-surface-container-highest text-sm border-4 border-black px-3 py-1 font-label-caps font-bold flex items-center gap-1 active:translate-y-0.5 cursor-pointer hover:bg-surface-container-high transition-colors"
                    >
                      {tag} <Plus size={14} />
                    </span>
                  ))}
                </div>
              )}
              
              {tagInput && !suggestions.includes(tagInput.toUpperCase()) && !selectedTags.includes(tagInput.toUpperCase()) && (
                <div className="mt-3">
                  <span 
                    onClick={() => {
                      toggleTag(tagInput.toUpperCase());
                    }}
                    className="bg-surface-container-highest border-4 border-black px-3 py-1 font-label-caps text-primary flex items-center w-fit gap-1 active:translate-y-0.5 cursor-pointer"
                  >
                    CREATE: {tagInput.toUpperCase()} <Plus size={14} />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="pixel-input-label ml-1">START DATE</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface focus:outline-none placeholder:text-surface-variant [color-scheme:dark]" 
              />
            </div>
            <div className="space-y-2">
              <label className="pixel-input-label ml-1">END DATE</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] font-body-lg text-on-surface focus:outline-none placeholder:text-surface-variant [color-scheme:dark]" 
              />
            </div>
          </div>

          {/* Source Vault Selection */}
          <div className="space-y-2">
            <label className="pixel-input-label ml-1">SOURCE VAULT</label>
            <div className="relative">
              <button 
                onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
                className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low ${
                  isVaultDropdownOpen ? 'ring-4 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <SelectedVaultIcon className={selectedVault.color} size={20} />
                  <span className="text-primary font-bold">
                    {selectedVault.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-black/10 rounded-full" />
                  <ChevronDown 
                    className={`text-outline transition-transform duration-300 ${isVaultDropdownOpen ? 'rotate-180' : ''}`} 
                    size={20} 
                  />
                </div>
              </button>

              {isVaultDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[115]" 
                    onClick={() => setIsVaultDropdownOpen(false)}
                  />
                  <div className={`absolute top-[calc(100%+4px)] left-0 right-0 z-[120] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-200 ${isVaultDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {VAULTS.map((vault) => (
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
                            {(() => {
                              const VaultIcon = iconMapper(vault.logo);
                              return <VaultIcon className={selectedVaultId === vault.id ? vault.color : 'text-outline'} size={20} />;
                            })()}
                            <span className={`font-body-lg ${selectedVaultId === vault.id ? 'text-primary font-bold' : 'text-on-surface'}`}>
                              {vault.name}
                            </span>
                          </div>
                          {selectedVaultId === vault.id && (
                            <div className="w-4 h-4 bg-primary border-2 border-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Interval Dropdown */}
          <div className="space-y-2">
            <label className="pixel-input-label ml-1">INTERVAL</label>
            <div className="relative">
              <button 
                onClick={() => setIsIntervalDropdownOpen(!isIntervalDropdownOpen)}
                className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low ${
                  isIntervalDropdownOpen ? 'ring-4 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-secondary" size={20} />
                  <span className="text-primary font-bold">
                    {selectedInterval}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-black/10 rounded-full" />
                  <ChevronDown 
                    className={`text-outline transition-transform duration-300 ${isIntervalDropdownOpen ? 'rotate-180' : ''}`} 
                    size={20} 
                  />
                </div>
              </button>

              {isIntervalDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[115]" 
                    onClick={() => setIsIntervalDropdownOpen(false)}
                  />
                  <div className={`absolute bottom-[calc(100%+4px)] left-0 right-0 z-[120] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-200 ${isIntervalDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {INTERVALS.map((interval) => (
                        <button 
                          key={interval}
                          onClick={() => {
                            setSelectedInterval(interval);
                            setIsIntervalDropdownOpen(false);
                          }}
                          className={`w-full h-14 px-4 flex items-center justify-between font-body-lg transition-colors hover:bg-surface-container-highest group ${
                            selectedInterval === interval ? 'bg-surface-container-highest' : 'bg-surface-container-low'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-body-lg ${selectedInterval === interval ? 'text-primary font-bold' : 'text-on-surface'}`}>
                              {interval}
                            </span>
                          </div>
                          {selectedInterval === interval && (
                            <div className="w-4 h-4 bg-primary border-2 border-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button 
              variant="primary" 
              className="w-full py-3 flex items-center justify-center gap-2 group"
              onClick={() => {
                console.log('Saving Recurring Quest:', { 
                  name, 
                  amount, 
                  isExpense, 
                  selectedTags, 
                  startDate, 
                  endDate, 
                  selectedVaultId, 
                  selectedInterval 
                });
                onClose();
              }}
            >
              <Save className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">Create Record</span>
            </Button>
          </div>
        </main>

        {/* Footer Decor */}
        <div className="px-6 pb-6 pt-2 flex justify-between items-center opacity-30">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-primary border-2 border-black"></div>
            <div className="w-3 h-3 bg-secondary border-2 border-black"></div>
            <div className="w-3 h-3 bg-tertiary border-2 border-black"></div>
          </div>
          <p className="font-label-caps text-[10px]">NEW_RECORD_INTERFACE</p>
        </div>
      </div>
    </>
  );
}
