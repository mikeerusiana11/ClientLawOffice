'use client';

import Link from 'next/link';
import { Scale, LogIn, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';

interface NavigationProps {
  onScheduleClick?: () => void;
}

export default function Navigation({ onScheduleClick }: NavigationProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-[#E5E7EB]'
            : 'bg-white shadow-md'
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Scale size={24} className="text-[#1A2B3C]" />
            <span className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              Miller Law Office
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-[#1A2B3C] hover:text-[#D4AF37] transition-colors font-medium">
              About
            </Link>
            <Link href="#services" className="text-[#1A2B3C] hover:text-[#D4AF37] transition-colors font-medium">
              Services
            </Link>
            <Link href="#location" className="text-[#1A2B3C] hover:text-[#D4AF37] transition-colors font-medium">
              Location
            </Link>
            <Link href="#faq" className="text-[#1A2B3C] hover:text-[#D4AF37] transition-colors font-medium">
              FAQ
            </Link>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 text-[#1A2B3C] hover:text-[#D4AF37] transition-colors font-medium"
            >
              <LogIn size={18} />
              Login
            </button>
            <button
              onClick={onScheduleClick}
              className="bg-[#D4AF37] text-[#1A2B3C] font-semibold px-6 py-2.5 rounded-full hover:bg-[#C49D2E] hover:scale-105 active:scale-95 transition-all"
            >
              Book a Consultation
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-[#1A2B3C]"
            onClick={() => setIsMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 py-4 flex flex-col gap-4">
            <Link href="#about" onClick={closeMenu} className="text-[#1A2B3C] hover:text-[#D4AF37] font-medium py-2">About</Link>
            <Link href="#services" onClick={closeMenu} className="text-[#1A2B3C] hover:text-[#D4AF37] font-medium py-2">Services</Link>
            <Link href="#location" onClick={closeMenu} className="text-[#1A2B3C] hover:text-[#D4AF37] font-medium py-2">Location</Link>
            <Link href="#faq" onClick={closeMenu} className="text-[#1A2B3C] hover:text-[#D4AF37] font-medium py-2">FAQ</Link>
            <button
              onClick={() => { closeMenu(); setIsLoginModalOpen(true); }}
              className="flex items-center gap-2 text-[#1A2B3C] hover:text-[#D4AF37] font-medium py-2"
            >
              <LogIn size={18} /> Login
            </button>
            <button
              onClick={() => { closeMenu(); onScheduleClick?.(); }}
              className="bg-[#D4AF37] text-[#1A2B3C] font-semibold px-6 py-3 rounded-full hover:bg-[#C49D2E] transition-colors w-full"
            >
              Book a Consultation
            </button>
          </div>
        )}
      </nav>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
