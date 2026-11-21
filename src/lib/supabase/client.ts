/**
 * Browser Supabase client factory.
 *
 * Returns `null` when public Supabase env is absent so UI can degrade
 * gracefully at M0 (the contact/hire features are wired in M6). Callers should
 * treat `null` as "backend not configured".
 */
import { createBrowserClient } from '@supabase/ssr';
import { clientEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = clientEnv;
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createBrowserClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
