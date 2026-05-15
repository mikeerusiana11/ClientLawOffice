'use client';

import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import {
  Navigation,
  HeroSection,
  AboutSection,
  CivilLawServices,
  SmartFAQ,
  LocationMap,
  AppointmentModal,
  LegalAssistantChat,
  Footer,
} from './components/landing';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open the appointment modal after user returns from email verification
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('openAppointment') === '1';
      const verifiedEmail = sessionStorage.getItem('appointment_email_verified') || localStorage.getItem('appointment_email_verified');
      const shouldOpen = fromQuery || !!verifiedEmail || localStorage.getItem('appointment_open_modal') === '1';
      if (shouldOpen) {
        setIsModalOpen(true);
        localStorage.removeItem('appointment_open_modal');
      }
    } catch {
      // storage unavailable; ignore
    }
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navigation onScheduleClick={() => setIsModalOpen(true)} />
      <HeroSection onScheduleClick={() => setIsModalOpen(true)} />
      <AboutSection />
      <CivilLawServices />
      <SmartFAQ />
      <LocationMap />
      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LegalAssistantChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40 group">
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-[#D4AF37] rounded-full shadow-2xl hover:bg-[#C49D2E] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Open Legal Assistant Chat"
          >
            <Scale size={24} className="text-[#1A2B3C]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          </button>
          <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-[#1A2B3C] text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            Legal Assistant
            <div className="absolute top-full right-4 w-2 h-2 bg-[#1A2B3C] rotate-45 -translate-y-1" />
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
