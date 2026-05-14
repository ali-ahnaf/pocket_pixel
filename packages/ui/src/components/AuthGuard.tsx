'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/api/ApiClient';
import PixelLoader from '@/components/PixelLoader';

const PUBLIC_PATHS = ['/signin', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = typeof window === 'undefined' ? null : window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (token && isPublic) {
      router.replace('/');
    } else if (!token && !isPublic) {
      window.localStorage.removeItem('pocket_pixel_profile');
      router.replace('/signin');
    }

    setTimeout(() => {
      setChecking(false);
    }, 1500);
  }, [pathname, router]);

  if (checking) return <PixelLoader />;

  return <>{children}</>;
}
