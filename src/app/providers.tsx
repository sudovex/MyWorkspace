'use client';

/**
 * Client-side application providers.
 *
 * - React Query: the QueryClient is created once via lazy `useState` init so it
 *   is never recreated across renders (a fresh client per render silently
 *   discards cache and in-flight requests).
 * - OS settings: rehydrated from localStorage exactly once on mount, matching
 *   the `skipHydration` strategy in the OS store to avoid SSR mismatches.
 */
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOSStoreHydration } from '@/stores/osStore';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useOSStoreHydration();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
