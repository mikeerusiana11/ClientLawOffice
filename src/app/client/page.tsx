'use client';

import { useEffect } from 'react';

/**
 * The Client Portal has been retired.
 * Enrolled clients now book via the public landing page.
 * Redirect anyone who navigates to /client back to the home page.
 */
export default function ClientPortalRedirect() {
  useEffect(() => {
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A2B3C]">
      <div className="text-center">
        <div className="text-4xl mb-4">⚖️</div>
        <p className="text-white text-sm">Redirecting to the main site…</p>
      </div>
    </div>
  );
}
