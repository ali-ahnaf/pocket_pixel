'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PROFILE_STORAGE_KEY } from '@/lib/api/ApiClient';
import PixelLoader from '@/components/PixelLoader';

const PUBLIC_PATHS = ['/signin', '/signup', '/forgot-password', '/reset-password', '/auth/google/callback'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!pathname) return;

    const hasProfile = typeof window === 'undefined' ? false : !!window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (hasProfile && isPublic) {
      router.replace('/');
      return;
    }

    if (!hasProfile && !isPublic) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      router.replace('/signin');
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) return <PixelLoader />;

  return <>{children}</>;
}