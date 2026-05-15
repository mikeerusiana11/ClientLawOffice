import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { renderVerificationEmail } from '@/lib/emails/verificationEmail';
import { EMAIL_FROM } from '@/lib/html';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── From address ────────────────────────────────────────────────────────────
// Must match a verified domain in Resend.
const FROM_ADDRESS = EMAIL_FROM;

export async function POST(request: NextRequest) {
  try {
    const { email, returnTo } = await request.json() as { email?: string; returnTo?: string };

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate a secure random 32-character hex token
    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log(`🔐 Generating verification token for ${normalizedEmail}`);

    // Delete any previous unused tokens for this email to avoid table bloat
    const { error: cleanupError } = await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('email', normalizedEmail);

    if (cleanupError) {
      // Non-fatal — log and continue
      console.warn('⚠️ Could not clean up old tokens:', cleanupError.message);
    }

    // Store new token in database
    const { error: dbError } = await supabase
      .from('email_verification_tokens')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select();

    if (dbError) {
      console.error('❌ Failed to store token:', dbError);
      return NextResponse.json(
        { error: `Failed to generate verification token: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Build the verification URL
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const safeReturnTo =
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//')
        ? returnTo
        : '/?openAppointment=1';

    const verificationUrl = `${origin}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}&returnTo=${encodeURIComponent(safeReturnTo)}`;

    console.log(`📧 Sending verification email to ${normalizedEmail}`);

    // ── Send email via Resend ──────────────────────────────────────────────
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: normalizedEmail,
      subject: 'Verify your email — Miller Law Office',
      html: renderVerificationEmail({ verificationUrl, email: normalizedEmail }),
    });

    if (emailError) {
      console.error('❌ Resend email error:', JSON.stringify(emailError));
      // Clean up the token we just inserted so user can retry cleanly
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('token', token);

      const devDetail = process.env.NODE_ENV !== 'production'
        ? ` [Resend: ${(emailError as { message?: string; name?: string }).message ?? JSON.stringify(emailError)}]`
        : '';

      return NextResponse.json(
        { error: `Failed to send verification email. Please try again.${devDetail}` },
        { status: 500 }
      );
    }

    console.log(`✅ Verification email sent (Resend ID: ${emailData?.id ?? 'unknown'})`);

    return NextResponse.json(
      {
        message: 'Verification email sent. Please check your inbox.',
        // Only expose verificationUrl in development for easy testing
        ...(process.env.NODE_ENV === 'development' && { verificationUrl }),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in send-verification-token:', errorMessage, error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
