'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserPreferenceDto } from '@expense-tracker/shared';
import { profileApi } from '@/lib/api';
import { useAuth } from './useAuth';

const SETTINGS_EVENT = 'pocket_pixel_display_settings';

export interface DisplaySettings {
  showIncome: boolean;
  showExpense: boolean;
}

const DEFAULT_SETTINGS: DisplaySettings = { showIncome: false, showExpense: false };

// Module-level cache so components mounted after the first fetch render the
// last-known settings immediately instead of flashing the defaults.
let currentSettings: DisplaySettings = DEFAULT_SETTINGS;

const broadcast = (settings: DisplaySettings): void => {
  currentSettings = settings;
  // Notify every hook instance in this tab (React state isn't shared across them).
  window.dispatchEvent(new Event(SETTINGS_EVENT));
};

interface UseDisplaySettingsResult extends DisplaySettings {
  setShowIncome: (value: boolean) => void;
  setShowExpense: (value: boolean) => void;
}

export const useDisplaySettings = (): UseDisplaySettingsResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [settings, setSettings] = useState<DisplaySettings>(currentSettings);

  useEffect(() => {
    const sync = (): void => setSettings(currentSettings);
    window.addEventListener(SETTINGS_EVENT, sync);
    return () => window.removeEventListener(SETTINGS_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    profileApi
      .getPreferences(userId)
      .then((prefs: UserPreferenceDto) => {
        if (!cancelled) broadcast({ showIncome: prefs.showIncome, showExpense: prefs.showExpense });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    (next: DisplaySettings): void => {
      // Optimistic: update the UI immediately, then persist to the API.
      broadcast(next);
      if (!userId) return;
      profileApi.updatePreferences(userId, next).catch(() => undefined);
    },
    [userId],
  );

  const setShowIncome = useCallback((value: boolean): void => persist({ ...currentSettings, showIncome: value }), [persist]);
  const setShowExpense = useCallback((value: boolean): void => persist({ ...currentSettings, showExpense: value }), [persist]);

  return { ...settings, setShowIncome, setShowExpense };
};
