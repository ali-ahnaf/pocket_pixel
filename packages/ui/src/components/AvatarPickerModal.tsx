'use client';

import { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { Button } from './Button';
import Image from 'next/image';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSelect: (avatar: string) => void;
}

const AVATARS = [
  '/avatars/avatar1.jpeg',
  '/avatars/avatar2.jpeg',
  '/avatars/avatar3.jpeg',
  '/avatars/avatar4.jpeg',
  '/avatars/avatar5.jpeg',
  '/avatars/avatar6.png',
];

export function AvatarPickerModal({ isOpen, onClose, currentAvatar, onSelect }: AvatarPickerModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentAvatar);
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentAvatar]);

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
      
      {/* Bottom Sheet / Modal */}
      <div 
        className={`fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-xl md:rounded-xl transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-[60%] opacity-0'
        }`}
      >
        {/* Handle (Mobile) */}
        <div className="flex justify-center py-2 shrink-0 md:hidden">
          <div className="w-12 h-1.5 bg-black/20 rounded-full"></div>
        </div>

        {/* Header */}
        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-primary uppercase flex items-center gap-2">
              <User className="w-6 h-6" />
              Select Avatar
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
          <div className="grid grid-cols-3 gap-4 py-4">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative aspect-square border-4 transition-all overflow-hidden ${
                  selectedAvatar === avatar 
                    ? 'border-primary shadow-[4px_4px_0_0_rgba(0,0,0,1)] scale-105 z-10' 
                    : 'border-black hover:border-primary-container opacity-70 hover:opacity-100'
                }`}
              >
                <img 
                  src={avatar} 
                  alt="Avatar option" 
                  className="w-full h-full object-cover [image-rendering:pixelated]"
                />
                {selectedAvatar === avatar && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="bg-primary text-on-primary p-1 border-2 border-black">
                      <Save className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button 
              variant="primary" 
              className="w-full py-3 flex items-center justify-center gap-2 group"
              onClick={() => {
                onSelect(selectedAvatar);
                onClose();
              }}
            >
              <Save className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">Select Avatar</span>
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
          <p className="font-label-caps text-[10px]">AVATAR_SELECTION_V1</p>
        </div>
      </div>
    </>
  );
}
