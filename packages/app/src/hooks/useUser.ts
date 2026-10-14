import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { User } from '../entities/User.entity';
import { logger, usersService } from '../services';
import { useLocalUserId } from './DatabaseProvider';

/** The local user, re-read whenever the screen gains focus so a profile edit shows up on return. */
export function useUser(): { user: User | null; reload: () => void } {
  const userId = useLocalUserId();
  const [user, setUser] = useState<User | null>(null);

  const reload = useCallback(() => {
    usersService.getById(userId).then(setUser, (err) => logger.error('Load user failed', { err }));
  }, [userId]);

  useFocusEffect(reload);

  return { user, reload };
}
