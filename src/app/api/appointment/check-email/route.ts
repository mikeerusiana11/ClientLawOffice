import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Supabase Auth admin list is paginated, so scan multiple pages to avoid false negatives.
    let page = 1;
    const perPage = 200;
    const maxPages = 10;
    let foundUser: { email_confirmed_at?: string | null } | null = null;

    while (page <= maxPages && !foundUser) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('check-email listUsers error:', error);
        return NextResponse.json({ error: 'Unable to check email right now' }, { status: 500 });
      }

      const users = data?.users ?? [];
      foundUser = users.find((u) => (u.email || '').toLowerCase() === normalizedEmail) || null;

      if (users.length < perPage) {
        break;
      }

      page += 1;
    }

    if (!foundUser) {
      return NextResponse.json({ available: true, status: 'available' }, { status: 200 });
    }

    if (foundUser.email_confirmed_at) {
      return NextResponse.json({ available: false, status: 'enrolled' }, { status: 200 });
    }

    return NextResponse.json({ available: true, status: 'pending_verification' }, { status: 200 });
  } catch (error) {
    console.error('check-email route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
