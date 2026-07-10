'use client';

import { Suspense, createContext, useCallback, useContext, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface QueryParamsContextValue {
  getParam: (key: string) => string | null;
  setParam: (key: string, value: string | null) => void;
}

const QueryParamsContext = createContext<QueryParamsContextValue | null>(null);

function QueryParamsBridge({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getParam = useCallback((key: string): string | null => searchParams.get(key), [searchParams]);

  const setParam = useCallback(
    (key: string, value: string | null): void => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return <QueryParamsContext.Provider value={{ getParam, setParam }}>{children}</QueryParamsContext.Provider>;
}

/**
 * Provides read/write access to the URL query string via context, so any
 * descendant can persist state (filters, tabs, etc.) in the query params and
 * survive page refreshes. Wraps `useSearchParams` in a Suspense boundary as
 * required by Next.js static export (`output: 'export'`).
 */
export function QueryParamsProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <QueryParamsBridge>{children}</QueryParamsBridge>
    </Suspense>
  );
}

export function useQueryParams(): QueryParamsContextValue {
  const context = useContext(QueryParamsContext);
  if (!context) {
    throw new Error('useQueryParams must be used within a QueryParamsProvider');
  }
  return context;
}
