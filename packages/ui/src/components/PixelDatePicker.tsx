'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PixelDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const WEEKDAYS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const buildCalendarDays = (viewDate: Date): Date[] => {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

export function PixelDatePicker({ value, onChange }: PixelDatePickerProps) {
  const selected = parseDate(value);
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const [viewDate, setViewDate] = useState<Date>(selected ?? today);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = (): void => {
    setViewDate(selected ?? today);
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen(true);
      return;
    }
    const POPUP_HEIGHT = 380;
    const POPUP_WIDTH = 288;
    const GAP = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < POPUP_HEIGHT && rect.top > POPUP_HEIGHT;
    const left = Math.max(GAP, Math.min(rect.right - POPUP_WIDTH, window.innerWidth - POPUP_WIDTH - GAP));
    setCoords(openUp ? { left, bottom: window.innerHeight - rect.top + GAP } : { left, top: rect.bottom + GAP });
    setIsOpen(true);
  };

  const goToMonth = (offset: number): void => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const selectDay = (day: Date): void => {
    onChange(formatDate(day));
    setIsOpen(false);
  };

  const days = buildCalendarDays(viewDate);
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-label="Change date"
        className="relative h-16 w-16 shrink-0 bg-surface-container-lowest border-4 border-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.6),_inset_-2px_-2px_0px_rgba(255,255,255,0.05)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-transform"
      >
        <Calendar className="text-secondary" />
        <input type="date" value={value} readOnly tabIndex={-1} aria-hidden="true" className="hidden" />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[115]" onClick={() => setIsOpen(false)} />
            <div
              style={{ left: coords.left, top: coords.top, bottom: coords.bottom }}
              className="fixed z-[120] w-72 bg-surface-container-high border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-headline-md text-primary uppercase text-lg">{monthLabel}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => goToMonth(-1)}
                    aria-label="Previous month"
                    className="w-8 h-8 bg-surface-container-lowest border-2 border-black flex items-center justify-center text-on-surface hover:bg-surface-container-highest active:translate-y-0.5 transition-transform"
                  >
                    <ChevronLeft size={16} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMonth(1)}
                    aria-label="Next month"
                    className="w-8 h-8 bg-surface-container-lowest border-2 border-black flex items-center justify-center text-on-surface hover:bg-surface-container-highest active:translate-y-0.5 transition-transform"
                  >
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((weekday, index) => (
                  <div key={index} className="h-7 flex items-center justify-center font-label-caps text-[10px] text-outline">
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const isSelected = selected !== null && isSameDay(day, selected);
                  const isToday = isSameDay(day, today);
                  const stateClass = isSelected
                    ? 'bg-primary text-on-primary border-black font-bold'
                    : isToday
                      ? 'border-primary text-primary hover:bg-surface-container-highest'
                      : isCurrentMonth
                        ? 'border-transparent text-on-surface hover:bg-surface-container-highest'
                        : 'border-transparent text-outline/50 hover:bg-surface-container-highest';
                  return (
                    <button
                      key={formatDate(day)}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`h-9 flex items-center justify-center font-body-sm border-2 transition-colors active:translate-y-0.5 ${stateClass}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-outline-variant">
                <button type="button" onClick={() => selectDay(today)} className="font-label-caps text-xs text-primary uppercase hover:underline">
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="font-label-caps text-xs text-outline uppercase hover:text-error hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
