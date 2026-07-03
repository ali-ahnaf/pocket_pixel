'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import PixelLoader from '@/components/PixelLoader';

const PUBLIC_PATHS = ['/signin', '/signup', '/forgot-password', '/reset-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!pathname) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    const checkAuth = async () => {
      try {
        const res = await authApi.ping();
        const authenticated = res.authenticated;

        if (authenticated && isPublic) {
          router.replace('/');
          return;
        }

        if (!authenticated && !isPublic) {
          localStorage.removeItem('pocket_pixel_profile');
          router.replace('/signin');
          return;
        }
      } catch {
        if (!isPublic) {
          localStorage.removeItem('pocket_pixel_profile');
          router.replace('/signin');
          return;
        }
      }

      setChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (checking) return <PixelLoader />;

  return <>{children}</>;
}
