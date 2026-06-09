'use client';

import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';

export default function LocationMap() {
  const { contact } = useSiteContent();
  return (
    <section id="location" className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Visit Our Office
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Located in the heart of Dumaguete City, Negros Oriental. Conveniently accessible for in-office consultations or meet us online for remote matters.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-[#E5E7EB] bg-gray-100 min-h-[400px]">
            <iframe
              src="https://maps.google.com/maps?q=9.3172933,123.2903507&z=18&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Address Information */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-br from-white to-[#F5F7FA] rounded-2xl p-8 border border-[#E5E7EB] shadow-lg flex flex-col justify-between min-h-[400px]">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                  Get in Touch
                </h3>
                <div className="w-12 h-1 bg-[#D4AF37] rounded-full"></div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-8 flex-1">
                {/* Address */}
                <div className="pb-8 border-b border-r border-[#E5E7EB]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                      <MapPin size={18} className="text-[#D4AF37]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wide">Address</h4>
                  </div>
                  <p className="text-[#6B7280] ml-13 text-sm leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                    {contact.address}
                  </p>
                </div>

                {/* Office Hours */}
                <div className="pb-8 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                      <Clock size={18} className="text-[#D4AF37]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wide">Hours</h4>
                  </div>
                  <div className="space-y-1 ml-13 text-[#6B7280] text-sm">
                    <p><strong>Mon-Fri:</strong> {contact.hoursWeekday}</p>
                    <p><strong>Sat:</strong> {contact.hoursSat}</p>
                    <p><strong>Sun:</strong> {contact.hoursSun}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="border-r border-[#E5E7EB]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                      <Phone size={18} className="text-[#D4AF37]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wide">Phone</h4>
                  </div>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-[#D4AF37] hover:text-[#1A2B3C] font-semibold transition-colors text-sm ml-13">
                    {contact.phone}
                  </a>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                      <Mail size={18} className="text-[#D4AF37]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wide">Email</h4>
                  </div>
                  <a href={`mailto:${contact.email}`} className="text-[#D4AF37] hover:text-[#1A2B3C] font-semibold transition-colors text-sm ml-13">
                    {contact.email}
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
