'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface DeleteTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagName: string;
  onDelete: () => void;
}

export function DeleteTagModal({ isOpen, onClose, tagName, onDelete }: DeleteTagModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

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
              Delete Tag
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
        <main className="px-6 py-6 pt-0 space-y-6 mt-6">
          <div className="space-y-4">
            <p className="font-body-md text-on-surface-variant">
              Are you sure you want to delete the tag <strong className="text-on-surface">"{tagName}"</strong>? Transactions using this tag will keep the tag data, but it will be removed from your list of available tags.
            </p>
          </div>

          <div className="pt-2 flex gap-4">
            <Button 
              variant="ghost" 
              className="w-full py-3 flex items-center justify-center"
              onClick={onClose}
            >
              <span className="font-headline-sm uppercase tracking-wider">Cancel</span>
            </Button>
            <Button 
              variant="danger" 
              className="w-full py-3 flex items-center justify-center gap-2 group"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">Delete</span>
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
