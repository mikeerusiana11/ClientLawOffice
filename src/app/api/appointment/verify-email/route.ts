import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client — can delete pending users after OTP verification
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — used to drive OTP send/verify as the user would
const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      action: 'send' | 'verify' | 'cleanup';
      email: string;
      token?: string;
      returnTo?: string;
    };

    const { action, email, token, returnTo } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // ── SEND ──────────────────────────────────────────────────────────────────
    if (action === 'send') {
      // Do not create a persistent user — we will delete it after verification
      const siteUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const safeReturnTo = (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//'))
        ? returnTo
        : '/?openAppointment=1';
      const { error: otpError } = await anonSupabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${siteUrl}/verify-email?returnTo=${encodeURIComponent(safeReturnTo)}`,
        },
      });

      if (otpError) {
        console.error('OTP send error:', otpError);
        const debugDetail = process.env.NODE_ENV !== 'production'
          ? ` (${otpError.message || otpError.code || 'unknown error'})`
          : '';
        return NextResponse.json(
          { error: `Could not send verification link. Please try again.${debugDetail}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Verification code sent.' }, { status: 200 });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const { data, error: verifyError } = await anonSupabase.auth.verifyOtp({
        email: normalizedEmail,
        token: token.trim(),
        type: 'email',
      });

      if (verifyError || !data.user) {
        return NextResponse.json(
          { error: 'Invalid or expired code. Please request a new one.' },
          { status: 400 }
        );
      }

      const userId = data.user.id;

      // Clean up — delete the pending user so no account lingers until admin enrolls
      await adminSupabase.auth.admin.deleteUser(userId);

      return NextResponse.json({ verified: true }, { status: 200 });
    }

    // ── CLEANUP ───────────────────────────────────────────────────────────────
    if (action === 'cleanup') {
      const authHeader = request.headers.get('Authorization') || '';
      const accessToken = authHeader.replace('Bearer ', '').trim();
      if (accessToken) {
        const { data: { user } } = await adminSupabase.auth.getUser(accessToken);
        if (user && user.email?.toLowerCase() === normalizedEmail) {
          await adminSupabase.auth.admin.deleteUser(user.id);
        }
      }
      return NextResponse.json({ cleaned: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('verify-email route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
