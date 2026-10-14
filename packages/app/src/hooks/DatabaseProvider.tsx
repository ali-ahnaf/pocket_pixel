import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { PixelLoader } from '../components/PixelLoader';
import { initDatabase } from '../db/init';
import { logger, recurringService } from '../services';

const LocalUserContext = createContext<string | null>(null);

/** Opens the on-device DB before rendering children, showing the pixel loader meanwhile. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    initDatabase().then((r) => setUserId(r.userId), setError);
  }, []);

  // No background jobs on the device: catch up recurring transactions whenever the app returns to the foreground.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recurringService.catchUp(userId).catch((err) => logger.error('Recurring catch-up failed', { err }));
    });
    return () => sub.remove();
  }, [userId]);

  // Expo Router's error boundary shows the failure instead of the home screen.
  if (error) throw error;
  if (!userId) return <PixelLoader />;
  return <LocalUserContext.Provider value={userId}>{children}</LocalUserContext.Provider>;
}

export function useLocalUserId(): string {
  const userId = useContext(LocalUserContext);
  if (!userId) throw new Error('useLocalUserId must be used inside DatabaseProvider');
  return userId;
}
