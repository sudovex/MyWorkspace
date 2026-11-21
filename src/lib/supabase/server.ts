/**
 * Server Supabase client factory (service-role).
 *
 * Uses the service-role key for trusted server-side writes (recruiter workflow,
 * contact submissions in M6). Never import this into client components.
 */
import { createClient } from '@supabase/supabase-js';
import { clientEnv, getServerEnv } from '@/lib/env';

export function createSupabaseServerClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createClient(url, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
