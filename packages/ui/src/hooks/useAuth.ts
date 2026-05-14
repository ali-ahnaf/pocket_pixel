'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/api/ApiClient';

const PROFILE_STORAGE_KEY = 'pocket_pixel_profile';

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'CLEAR_USER' }
  | { type: 'DONE_LOADING' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { user: action.payload, loading: false };
    case 'CLEAR_USER':
      return { user: null, loading: false };
    case 'DONE_LOADING':
      return { ...state, loading: false };
  }
}

export function useAuth() {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, { user: null, loading: true });

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) {
      dispatch({ type: 'CLEAR_USER' });
      router.push('/signin');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.id) {
        dispatch({ type: 'CLEAR_USER' });
        router.push('/signin');
        return;
      }
      dispatch({ type: 'SET_USER', payload: parsed });
    } catch {
      dispatch({ type: 'CLEAR_USER' });
      router.push('/signin');
    }
  }, [router]);

  const setSession = useCallback((token: string, profile: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    dispatch({ type: 'SET_USER', payload: profile });
  }, []);

  const updateProfile = useCallback((profile: AuthUser) => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    dispatch({ type: 'SET_USER', payload: profile });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  return { ...state, setSession, updateProfile, signOut };
}
