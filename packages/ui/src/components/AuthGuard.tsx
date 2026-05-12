'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/api/ApiClient';

const PUBLIC_PATHS = ['/signin', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window === 'undefined' ? null : window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (token && isPublic) {
      router.replace('/');
    } else if (!token && !isPublic) {
      window.localStorage.removeItem('pixel_pocket_profile');
      router.replace('/signin');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
