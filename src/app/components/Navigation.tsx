'use client';

import Link from 'next/link';
import { Scale, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ContactModal from './ContactModal';

const NAV_SECTIONS = ['about', 'services', 'testimonials', 'location', 'faq'] as const;

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const lastSection = NAV_SECTIONS[NAV_SECTIONS.length - 1];
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
        setActiveSection(lastSection);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -50% 0px' }
    );
    NAV_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
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
            <span className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Miller Law Office
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '#about', label: 'About', id: 'about' },
              { href: '#services', label: 'Services', id: 'services' },
              { href: '#testimonials', label: 'Reviews', id: 'testimonials' },
              { href: '#location', label: 'Location', id: 'location' },
              { href: '#faq', label: 'FAQ', id: 'faq' },
            ].map(({ href, label, id }) => (
              <Link
                key={id}
                href={href}
                className={`transition-colors font-medium text-sm hover:text-[#A67C00] ${
                  activeSection === id ? 'text-[#A67C00]' : 'text-[#1A2B3C]'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => setIsContactOpen(true)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#D4AF37', color: '#1A2B3C' }}
            >
              Contact Us
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
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 py-4 flex flex-col gap-4 nav-dropdown-enter">
            {[
              { href: '#about', label: 'About', id: 'about' },
              { href: '#services', label: 'Services', id: 'services' },
              { href: '#testimonials', label: 'Reviews', id: 'testimonials' },
              { href: '#location', label: 'Location', id: 'location' },
              { href: '#faq', label: 'FAQ', id: 'faq' },
            ].map(({ href, label, id }) => (
              <Link
                key={id}
                href={href}
                onClick={closeMenu}
                className={`font-medium py-2 transition-colors hover:text-[#A67C00] ${
                  activeSection === id ? 'text-[#A67C00]' : 'text-[#1A2B3C]'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => { closeMenu(); setIsContactOpen(true); }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#D4AF37', color: '#1A2B3C' }}
            >
              Contact Us
            </button>
          </div>
        )}
      </nav>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
