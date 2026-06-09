import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY');
  cached = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return cached;
}
