import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { ChangePasswordPayload, SignInPayload, SignUpPayload } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { PixelLoader } from '../components/PixelLoader';
import { authService, logger, recurringService } from '../services';

interface AuthContextValue {
  /** The signed-in user, or null when signed out. */
  userId: string | null;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  /** Sets a new password for an email while signed out, without verification. */
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  /** Changes the signed-in user's password. */
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Restores the stored session once the DB is open, and runs the signed-in user's recurring catch-up. Render it inside DatabaseProvider. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    authService
      .restoreSession()
      .then(setUserId, setError)
      .finally(() => setRestored(true));
  }, []);

  // No background jobs on the device: catch up recurring transactions on sign-in and whenever the app returns to the foreground.
  useEffect(() => {
    if (!userId) return;
    const catchUp = () => recurringService.catchUp(userId).catch((err) => logger.error('Recurring catch-up failed', { err }));
    catchUp();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') catchUp();
    });
    return () => sub.remove();
  }, [userId]);

  const signIn = useCallback(async (payload: SignInPayload) => setUserId(await authService.signIn(payload)), []);
  const signUp = useCallback(async (payload: SignUpPayload) => setUserId(await authService.signUp(payload)), []);
  const signOut = useCallback(async () => {
    await authService.signOut();
    setUserId(null);
  }, []);
  const resetPassword = useCallback((email: string, newPassword: string) => authService.resetPassword(email, newPassword), []);
  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      if (!userId) throw new AppError('You must be signed in to change your password', 401);
      await authService.changePassword(userId, payload);
    },
    [userId],
  );
  const value = useMemo(() => ({ userId, signIn, signUp, signOut, resetPassword, changePassword }), [userId, signIn, signUp, signOut, resetPassword, changePassword]);

  if (error) throw error;
  if (!restored) return <PixelLoader />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
