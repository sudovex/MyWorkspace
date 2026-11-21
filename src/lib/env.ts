/**
 * Type-safe environment access.
 *
 * Public (client) variables are validated eagerly at import — a missing public
 * URL is always a mistake. Server secrets (Supabase service role, Resend) are
 * validated LAZILY via `getServerEnv()` so the app still builds and runs at M0
 * without any backend configured; the throw only happens the moment a feature
 * that needs them is invoked (M6).
 */
import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CONTACT_NOTIFICATION_EMAIL: z.string().email(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validate and return server-only secrets. Throws a descriptive error if any
 * are missing. Call this ONLY inside server code (route handlers, actions).
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_NOTIFICATION_EMAIL: process.env.CONTACT_NOTIFICATION_EMAIL,
  });
  if (!parsed.success) {
    throw new Error(
      `Missing/invalid server environment variables:\n${parsed.error
        .issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
