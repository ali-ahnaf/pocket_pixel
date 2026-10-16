import { useCallback, useEffect, useState } from 'react';
import { logger, preferencesService } from '../services';
import { useLocalUserId } from './DatabaseProvider';

export interface DisplaySettings {
  showIncome: boolean;
  showExpense: boolean;
  aiTransactionEntryEnabled: boolean;
  monthlyRecapDay: number | null;
}

// Module-level so every mounted hook shares the last-known value, as the web hook does.
let current: DisplaySettings = { showIncome: false, showExpense: false, aiTransactionEntryEnabled: false, monthlyRecapDay: null };
let loaded = false;
const listeners = new Set<() => void>();

const broadcast = (next: DisplaySettings): void => {
  current = next;
  loaded = true;
  listeners.forEach((listener) => listener());
};

/** Native port of packages/ui/src/hooks/useDisplaySettings.ts, backed by the local preferences table. */
export function useDisplaySettings(): DisplaySettings & {
  loaded: boolean;
  setShowIncome: (value: boolean) => void;
  setShowExpense: (value: boolean) => void;
  setAiTransactionEntryEnabled: (value: boolean) => void;
  setMonthlyRecapDay: (value: number | null) => void;
} {
  const userId = useLocalUserId();
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener = (): void => rerender((n) => n + 1);
    listeners.add(listener);
    if (!loaded) {
      preferencesService.getOrCreate(userId).then(
        (p) => broadcast({ showIncome: p.showIncome, showExpense: p.showExpense, aiTransactionEntryEnabled: p.aiTransactionEntryEnabled, monthlyRecapDay: p.monthlyRecapDay }),
        (err) => logger.error('Load preferences failed', { err }),
      );
    }
    return () => {
      listeners.delete(listener);
    };
  }, [userId]);

  const persist = useCallback(
    (patch: Partial<DisplaySettings>): void => {
      broadcast({ ...current, ...patch });
      preferencesService.update(userId, patch).catch((err) => logger.error('Save preferences failed', { err }));
    },
    [userId],
  );

  return {
    ...current,
    loaded,
    setShowIncome: useCallback((value: boolean) => persist({ showIncome: value }), [persist]),
    setShowExpense: useCallback((value: boolean) => persist({ showExpense: value }), [persist]),
    setAiTransactionEntryEnabled: useCallback((value: boolean) => persist({ aiTransactionEntryEnabled: value }), [persist]),
    setMonthlyRecapDay: useCallback((value: number | null) => persist({ monthlyRecapDay: value }), [persist]),
  };
}
