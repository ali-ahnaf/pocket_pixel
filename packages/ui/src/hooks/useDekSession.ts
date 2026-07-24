'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearSessionDek, getSessionDek, isSessionDekHydrated, peekSessionDek, setSessionDek, subscribeSessionDek } from '@/lib/crypto/dek-session';

interface UseDekSessionResult {
  /** The unwrapped OpenRouter DEK for this session, or `null` if not set/unwrapped yet. */
  dek: CryptoKey | null;
  /** True while the initial `sessionStorage` rehydration is in flight. */
  loading: boolean;
  /** Stores the DEK in memory + `sessionStorage`. Call at login and first-time key setup. */
  setDek: (dek: CryptoKey) => Promise<void>;
  /** Clears the DEK from memory + `sessionStorage`. Call at logout. */
  clearDek: () => void;
}

/**
 * React hook over the module-level DEK session singleton
 * (`@/lib/crypto/dek-session`). Multiple components mounting this hook all
 * observe the same in-memory DEK, so saving/clearing it in one place (e.g.
 * Settings) is immediately visible everywhere else (e.g. the expense parser).
 *
 * Not wired into the login/logout flows yet — that happens when the Settings
 * AI section and parser are built and can call `setDek`/`clearDek` at the
 * right points.
 */
export function useDekSession(): UseDekSessionResult {
  const [dek, setDekState] = useState<CryptoKey | null>(peekSessionDek());
  const [loading, setLoading] = useState(!isSessionDekHydrated());

  useEffect(() => {
    const unsubscribe = subscribeSessionDek(setDekState);
    if (!isSessionDekHydrated()) {
      getSessionDek().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return unsubscribe;
  }, []);

  const setDek = useCallback(async (next: CryptoKey): Promise<void> => {
    await setSessionDek(next);
  }, []);

  const clearDek = useCallback((): void => {
    clearSessionDek();
  }, []);

  return { dek, loading, setDek, clearDek };
}
