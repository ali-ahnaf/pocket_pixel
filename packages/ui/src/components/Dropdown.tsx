'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderValue: (value: T) => React.ReactNode;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
  keyExtractor: (option: T) => string | number;
  direction?: 'up' | 'down';
  triggerClassName?: string;
}

export function Dropdown<T>({
  options,
  value,
  onChange,
  renderValue,
  renderOption,
  keyExtractor,
  direction = 'down',
  triggerClassName = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const directionClasses =
    direction === 'up'
      ? {
          position: 'bottom-[calc(100%+4px)]',
          transition: isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        }
      : {
          position: 'top-[calc(100%+4px)]',
          transition: isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 px-4 border-4 border-black flex items-center justify-between font-body-lg transition-all active:translate-y-0.5 active:shadow-none group bg-surface-container-lowest hover:bg-surface-container-low ${
          isOpen ? 'ring-4 ring-primary/20' : ''
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-3">
          {renderValue(value)}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-black/10 rounded-full" />
          <ChevronDown
            className={`text-outline transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            size={20}
          />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Global click-away overlay overlaying on top of inputs but kept accessible */}
          <div className="fixed inset-0 z-[115]" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute ${directionClasses.position} left-0 right-0 z-[120] bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-200 ${directionClasses.transition}`}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => {
                const optionKey = keyExtractor(option);
                const isSelected = keyExtractor(value) === optionKey;
                return (
                  <button
                    type="button"
                    key={optionKey}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full h-14 px-4 flex items-center justify-between font-body-lg transition-colors hover:bg-surface-container-highest group ${
                      isSelected ? 'bg-surface-container-highest' : 'bg-surface-container-low'
                    }`}
                  >
                    {renderOption(option, isSelected)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}