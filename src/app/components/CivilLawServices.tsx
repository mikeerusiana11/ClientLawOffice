'use client';

import { useInView } from '../hooks/useInView';
import { useSiteContent } from '../hooks/useSiteContent';

export default function CivilLawServices() {
  const { ref, isInView } = useInView();
  const { services } = useSiteContent();

  return (
    <section id="services" className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Practice Areas
          </h2>
          <p className="text-lg text-[#6B7280]">
            Comprehensive legal solutions across multiple areas of practice
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`h-full bg-gradient-to-br from-white to-[#F9FAFB] rounded-2xl p-8 border border-[#E5E7EB] hover:shadow-lg hover:-translate-y-2 hover:border-[#D4AF37] transition-all duration-300 pre-animate ${isInView ? `animate-fade-in-up delay-${Math.min((index + 1) * 100, 400)}` : ''}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ backgroundColor: '#D4AF37' }}
                >
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1A2B3C] mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {service.title}
                </h3>
              </div>
              <p className="text-[#6B7280] leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
