import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let cachedAdmin: ReturnType<typeof createClient<Database>> | null = null;
let cachedPublic: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY');
  cachedAdmin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}

export function createPublicClient() {
  if (cachedPublic) return cachedPublic;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  cachedPublic = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedPublic;
}
