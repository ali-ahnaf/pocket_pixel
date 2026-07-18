'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PixelLoader from '@/components/PixelLoader';

interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

// Decode a JWT payload (base64url) without verifying — the token is the user's
// own session, only used here to seed the local profile. The API already
// verified the Google identity before signing it.
function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const parsed = JSON.parse(json);
    if (!parsed?.userId) return null;
    return parsed as DecodedToken;
  } catch {
    return null;
  }
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const decoded = token ? decodeToken(token) : null;

    if (params.get('error') || !token || !decoded) {
      setFailed(true);

      const timer = setTimeout(() => router.replace('/signin'), 2000);
      return () => clearTimeout(timer);
    }

    setSession(token, { id: decoded.userId, name: decoded.name, email: decoded.email, avatar: decoded.avatar });
    router.replace('/');
  }, [router, setSession]);

  if (failed) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center gap-3 p-4">
        <p className="font-label-caps text-primary text-[13px] tracking-widest uppercase">Google sign-in failed — redirecting…</p>
      </div>
    );
  }

  return <PixelLoader />;
}
