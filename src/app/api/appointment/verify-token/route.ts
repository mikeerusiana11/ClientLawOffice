import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json() as { token?: string; email?: string };

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log(`🔍 Verifying token for ${normalizedEmail}`);

    // Look up token in database
    const { data: tokenRecord, error: lookupError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', normalizedEmail)
      .single();

    if (lookupError || !tokenRecord) {
      console.warn(`❌ Token not found or invalid for ${normalizedEmail}`);
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!tokenRecord.expires_at || new Date() > new Date(tokenRecord.expires_at)) {
      console.warn(`❌ Token expired for ${normalizedEmail}`);
      // Delete expired token
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('id', tokenRecord.id ?? '');

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    console.log(`✅ Token verified successfully for ${normalizedEmail}`);

    // Delete the token after successful verification
    const { error: deleteError } = await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('id', tokenRecord.id);

    if (deleteError) {
      console.error('⚠️ Failed to delete token:', deleteError);
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        email: normalizedEmail,
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in verify-token:', errorMessage, error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
