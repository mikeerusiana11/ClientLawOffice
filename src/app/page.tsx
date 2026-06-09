'use client';

import { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import {
  Navigation,
  HeroSection,
  AboutSection,
  CivilLawServices,
  SmartFAQ,
  LocationMap,
  LegalAssistantChat,
  Footer,
} from './components/landing';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowLabel(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <CivilLawServices />
      <SmartFAQ />
      <LocationMap />
      <LegalAssistantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Delayed label */}
          <div
            className="bg-[#1A2B3C] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap transition-all duration-500"
            style={{ opacity: showLabel ? 1 : 0, transform: showLabel ? 'translateY(0)' : 'translateY(6px)' }}
          >
            AI Legal Assistant
          </div>
          {/* Icon button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative w-14 h-14 bg-[#D4AF37] rounded-full shadow-2xl hover:bg-[#C49D2E] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Open Legal Assistant Chat"
          >
            <Scale size={24} className="text-[#1A2B3C]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}
