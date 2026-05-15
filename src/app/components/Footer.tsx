'use client';

import { Phone, Mail, MapPin } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';

export default function Footer() {
  const { contact, services, hero, social } = useSiteContent();

  return (
    <footer className="bg-[#1A2B3C] text-white py-16 px-6">
      <div className="container mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Column 1 - Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚖</span>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
                Miller Law Office
              </h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              {hero.firmDescription}
            </p>
            <span className="text-[#D4AF37] text-sm font-semibold flex items-center gap-2">
              ✓ Licensed to Practice Law
            </span>
          </div>

          {/* Column 2 - Contact Details */}
          <div>
            <h4 className="text-lg font-bold mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Contact Details
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#D4AF37] flex-shrink-0 mt-1" />
                <span className="text-white/80" style={{ whiteSpace: 'pre-line' }}>
                  {contact.address}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-white/80">{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-white/80">{contact.email}</span>
              </div>
            </div>
          </div>

          {/* Column 3 - Office Hours & Practice Areas */}
          <div>
            <h4 className="text-lg font-bold mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Office Hours
            </h4>
            <div className="text-sm text-white/80 space-y-2 mb-8">
              <p><strong>Mon - Fri:</strong> {contact.hoursWeekday}</p>
              <p><strong>Sat:</strong> {contact.hoursSat}</p>
              <p><strong>Sun:</strong> {contact.hoursSun}</p>
            </div>

            <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>
              Practice Areas
            </h4>
            <ul className="text-sm text-white/70 space-y-2">
              {services.map(s => (
                <li key={s.id}>• {s.title}</li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Quick Links & Social */}
          <div>
            <h4 className="text-lg font-bold mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Quick Links
            </h4>
            <ul className="text-sm text-white/70 space-y-2 mb-8">
              <li>
                <a href="#about" className="hover:text-[#D4AF37] transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#D4AF37] transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#D4AF37] transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#D4AF37] transition-colors">
                  Contact
                </a>
              </li>
            </ul>

            <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>
              Quick Contact
            </h4>
            <div className="space-y-3">
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-[#D4AF37] transition-colors">
              <Phone size={15} className="text-[#D4AF37] flex-shrink-0" />
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-[#D4AF37] transition-colors break-all">
              <Mail size={15} className="text-[#D4AF37] flex-shrink-0" />
              {contact.email}
            </a>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/20 my-8"></div>

      {/* Bottom Section */}
      <div className="container mx-auto">
        <div className="text-sm text-white/70 text-center mb-6">
          <p>
            <strong>Disclaimer:</strong> The information on this website is for general information purposes only. Nothing on this site should be taken as legal advice for any individual case or situation. This information is not intended to create, and receipt or viewing does not constitute, an attorney-client relationship.
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-white/60 border-t border-white/20 pt-6">
          <p>&copy; 2026 Miller Law Office. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
