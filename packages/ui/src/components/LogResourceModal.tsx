'use client';

import { useState, useEffect } from 'react';
import { X, Coins, TrendingDown, TrendingUp, ChevronDown, Plus, Package } from 'lucide-react';
import { iconMapper } from '../lib/iconMapper';

interface LogResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogResourceModal({ isOpen, onClose }: LogResourceModalProps) {
  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  
  // Tag state
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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
      // Brief delay to allow the browser to paint before starting the transition
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsVaultDropdownOpen(false);
      // Wait for the animation to complete (300ms) before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop for Bottom Sheet */}
      <div 
        className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Main Container (The Bottom Sheet) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[60] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-lg md:rounded-none transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Top Bar Decor (The "Handle") */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-2 bg-black opacity-40"></div>
        </div>

        {/* Header */}
        <header className="px-4 pt-2 pb-5 shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="font-headline-md text-primary uppercase">LOG NEW RESOURCE</h1>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none"
            >
              <X className="text-on-surface" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="px-4 space-y-5 pb-3 overflow-y-auto">
          {/* Amount Input */}
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

          {/* Transaction Type Toggle */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1 bg-black p-1 border-4 border-black">
              {/* Expense Active State */}
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
              {/* Income Inactive State */}
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

          {/* Source Vault Selection */}
          <div className="space-y-2">
            <div className="relative">
              {/* Dropdown Trigger */}
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

              {/* Dropdown Menu */}
              {isVaultDropdownOpen && (
                <>
                  {/* Invisible backdrop to close dropdown on click outside */}
                  <div 
                    className="fixed inset-0 z-[65]" 
                    onClick={() => setIsVaultDropdownOpen(false)}
                  />
                  <div className={`absolute top-[calc(100%+4px)] left-0 right-0 z-[70] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-200 ${isVaultDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
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
                            <span className={`font-body-lg uppercase ${selectedVaultId === vault.id ? 'text-primary font-bold' : 'text-on-surface'}`}>
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

          {/* Tags Autocomplete Section */}
          <div className="space-y-2">
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
                placeholder="Search or create..." 
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

          {/* Action Button */}
          <div className="pt-5">
            <button className="w-full h-20 bg-primary-container text-on-primary-container border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-4 transition-transform group">
              <span className="font-headline-md font-black uppercase tracking-wider">RECORD</span>
              <Package size={32} />
            </button>
          </div>

          {/* Visual Context Footer Decor */}
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
