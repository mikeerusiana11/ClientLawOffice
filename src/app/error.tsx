'use client';

import { useEffect } from 'react';
import { Scale, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Scale size={26} style={{ color: '#D4AF37' }} />
          <span className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Georgia, serif' }}>
            Miller Law Office
          </span>
        </div>
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2B3C] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Something went wrong
        </h1>
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          We encountered an unexpected error. Please try again, or contact our office directly for immediate assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95"
            style={{ backgroundColor: '#D4AF37', color: '#1A2B3C' }}
          >
            Try Again
          </button>
          <a
            href="tel:+639176317120"
            className="px-6 py-3 rounded-lg font-semibold text-sm border-2 transition-all hover:text-white active:scale-95"
            style={{ borderColor: '#1A2B3C', color: '#1A2B3C' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1A2B3C'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
          >
            Call +63 917 631 7120
          </a>
        </div>
      </div>
    </div>
  );
}
