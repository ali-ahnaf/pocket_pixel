'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Plus, Save, Pencil } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { iconMapper } from '../lib/iconMapper';
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from '@/lib/helpers/static';

interface AddVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: { id?: string; name: string; description: string; icon?: string; color?: string };
  onSave?: (data: { id?: string; name: string; description: string; icon: string; color: string }) => void;
}

export function AddVaultModal({ isOpen, onClose, title, initialData, onSave }: AddVaultModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Briefcase');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description);
        setColor(initialData.color || '#3b82f6');
        setIcon(initialData.icon || 'Briefcase');
      } else {
        setName('');
        setDescription('');
        setColor('#3b82f6');
        setIcon('Briefcase');
      }
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData]);

  if (!shouldRender) return null;

  const isEditing = !!initialData;

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

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
            <h2 className="font-headline-md text-primary uppercase flex items-center gap-2">
              {isEditing ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
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

        {/* Content */}
        <main className="px-6 py-6 pt-0 space-y-6">
          <div className="space-y-4">
            <label className="pixel-input-label ml-1">NAME</label>
            <Input placeholder="e.g. Secret Stash" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />

            <div className="space-y-2">
              <label className="pixel-input-label ml-1">COLOR</label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 p-0 border-4 border-black cursor-pointer bg-surface-container-lowest" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 font-mono uppercase" placeholder="#000000" />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 border-2 border-black hover:scale-110 active:scale-95 transition-transform ${color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container-high' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="pixel-input-label ml-1">ICON</label>
              <div className="grid grid-rows-2 grid-flow-col gap-3 pb-2 pt-1 px-1 overflow-x-auto custom-scrollbar">
                {AVAILABLE_ICONS.map((iconName) => {
                  const IconComp = iconMapper(iconName);
                  const isSelected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`shrink-0 w-12 h-12 flex items-center justify-center border-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-container text-on-primary-container scale-110 shadow-[inset_2px_2px_0_rgba(255,255,255,0.3),inset_-2px_-2px_0_rgba(0,0,0,0.4)]'
                          : 'border-black bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest shadow-[inset_2px_2px_0_rgba(255,255,255,0.1),inset_-2px_-2px_0_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="pixel-input-label ml-1">DESCRIPTION</label>
              <textarea
                className="w-full min-h-[120px] p-3 bg-surface-container-lowest text-on-surface border-4 border-black font-inter text-base outline-none focus:border-primary transition-colors resize-none shadow-[inset_0_2px_0_rgba(0,0,0,0.9),inset_2px_0_0_rgba(0,0,0,0.4)]"
                placeholder="What is this vault for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full py-3 flex items-center justify-center gap-2 group"
              onClick={() => {
                onSave?.({ id: initialData?.id, name, description, icon, color });
                onClose();
              }}
            >
              <Save className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">{isEditing ? 'Save Changes' : 'Create Record'}</span>
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
          <p className="font-label-caps text-[10px]">{isEditing ? 'EDIT_RECORD_INTERFACE' : 'NEW_RECORD_INTERFACE'}</p>
        </div>
      </div>
    </>
  );
}
