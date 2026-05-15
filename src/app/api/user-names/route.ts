import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  // Only allow authenticated admin requests
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const authHeader = request.headers.get('authorization');
  const { data: { user } } = await anonClient.auth.getUser(
    authHeader ? authHeader.replace('Bearer ', '') : undefined
  );
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@miller.law';
  if (!user || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userIds } = await request.json() as { userIds: string[] };
  if (!userIds?.length) {
    return NextResponse.json({ names: {} });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const names: Record<string, string> = {};

  // Fetch each user's metadata in parallel
  await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await adminClient.auth.admin.getUserById(id);
      if (!error && data?.user) {
        const meta = data.user.user_metadata;
        const full =
          meta?.full_name ||
          meta?.name ||
          (meta?.first_name && meta?.last_name
            ? `${meta.first_name} ${meta.last_name}`
            : null) ||
          data.user.email ||
          null;
        if (full) names[id] = full;
      }
    })
  );

  return NextResponse.json({ names });
}
