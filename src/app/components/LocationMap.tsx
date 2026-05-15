'use client';

import { MapPin, Clock, Phone, Mail } from 'lucide-react';

export default function LocationMap() {
  return (
    <section id="location" className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4" style={{ fontFamily: 'Playfair Display' }}>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.280!2d123.3070!3d9.3027!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33ab6e8a0bdb1a91%3A0x5f36c5d7c0d0c0d0!2s878R%2BW4%20Dumaguete%20City%2C%20Negros%20Oriental!5e0!3m2!1sen!2sph!4v1234567890"
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
                <h3 className="text-2xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
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
                  <p className="text-[#6B7280] ml-13 text-sm leading-relaxed">
                    878R+W4<br />
                    Dumaguete City<br />
                    Negros Oriental
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
                    <p><strong>Mon-Fri:</strong> 9AM-5PM</p>
                    <p><strong>Sat:</strong> By Appt</p>
                    <p><strong>Sun:</strong> Closed</p>
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
                  <a href="tel:+639176317120" className="text-[#D4AF37] hover:text-[#1A2B3C] font-semibold transition-colors text-sm ml-13">
                    +63 917-631-7120
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
                  <a href="mailto:attyabigailtmiller@gmail.com" className="text-[#D4AF37] hover:text-[#1A2B3C] font-semibold transition-colors text-sm ml-13">
                    attyabigailtmiller@gmail.com
                  </a>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => (document.querySelector('[aria-label="Open appointment modal"]') as HTMLElement)?.click()}
                className="w-full mt-8 bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 text-sm"
              >
                Book a Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
