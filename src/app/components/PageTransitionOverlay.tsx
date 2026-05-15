'use client';

import { Scale } from 'lucide-react';

interface PageTransitionOverlayProps {
  message?: string;
}

export default function PageTransitionOverlay({ message = 'Loading...' }: PageTransitionOverlayProps) {
  return (
    <div className="fixed inset-0 z-[999] bg-[#1A2B3C] flex flex-col items-center justify-center page-transition-enter">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Scale size={36} className="text-[#D4AF37]" />
        <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display' }}>
          Miller Law Office
        </span>
      </div>

      {/* Spinner */}
      <div
        className="w-10 h-10 rounded-full border-4 border-white/20 border-t-[#D4AF37] spin-gold mb-4"
      />

      {/* Message */}
      <p className="text-white/60 text-sm">{message}</p>
    </div>
  );
}
