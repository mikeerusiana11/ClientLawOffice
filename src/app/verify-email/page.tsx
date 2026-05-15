'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const returnTo = searchParams.get('returnTo') || '/?openAppointment=1';

        if (!token || !email) {
          setErrorMsg('Invalid verification link. Missing token or email.');
          setStatus('error');
          return;
        }

        console.log(`🔐 Verifying token for ${email}`);

        // Call the verification API endpoint
        const response = await fetch('/api/appointment/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json() as { verified?: boolean; error?: string };

        if (!response.ok) {
          console.error('❌ Verification failed:', data.error);
          setErrorMsg(data.error || 'Failed to verify email. Please try again.');
          setStatus('error');
          return;
        }

        console.log('✅ Email verified successfully');

        // Store the verified email for the appointment form to pick up
        try {
          sessionStorage.setItem('appointment_email_verified', email);
          localStorage.setItem('appointment_email_verified', email);
          localStorage.setItem('appointment_open_modal', '1');
        } catch {
          // storage may be unavailable in some contexts; proceed anyway
        }

        setStatus('success');

        // Redirect back to requested location (form can auto-open)
        setTimeout(() => {
          const finalRedirect = returnTo.startsWith('/') && !returnTo.startsWith('//')
            ? returnTo
            : '/?openAppointment=1';
          router.push(finalRedirect);
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Verification error:', errorMessage);
        setErrorMsg('An error occurred during verification. Please try again.');
        setStatus('error');
      }
    };

    handle();
  }, [searchParams, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
        <p className="text-lg text-zinc-700">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
        <h2 className="text-xl font-bold text-zinc-800">Email Verified!</h2>
        <p className="text-zinc-600 text-center">
          Your email has been confirmed. Redirecting you back to the appointment form…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-bold text-zinc-800">Verification Failed</h2>
      <p className="text-zinc-600 text-center">{errorMsg}</p>
      <a
        href="/"
        className="mt-4 px-6 py-2 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243548] transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full mx-4 text-center border border-zinc-200">
        <div className="mb-8">
          <div className="w-14 h-14 bg-[#D4AF37] rounded-xl flex items-center justify-center text-[#1A2B3C] text-2xl mx-auto mb-3">
            ⚖️
          </div>
          <p className="text-sm text-zinc-500 font-medium">Miller Law Office</p>
        </div>
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" />
              <p className="text-zinc-600">Loading…</p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
