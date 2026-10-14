import { ReactNode, useEffect, useState } from 'react';
import { PixelLoader } from '../components/PixelLoader';
import { initDatabase } from '../db/init';
import { useAuth } from './AuthProvider';

/** Opens the on-device DB before rendering children, showing the pixel loader meanwhile. */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    initDatabase().then(() => setReady(true), setError);
  }, []);

  // Expo Router's error boundary shows the failure instead of the home screen.
  if (error) throw error;
  if (!ready) return <PixelLoader />;
  return <>{children}</>;
}

/** The signed-in user's id. Only call it from screens that are mounted while signed in. */
export function useLocalUserId(): string {
  const { userId } = useAuth();
  if (!userId) throw new Error('useLocalUserId must be used while signed in');
  return userId;
}
