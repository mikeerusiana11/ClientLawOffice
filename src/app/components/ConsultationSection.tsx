'use client';

import { useInView } from '../hooks/useInView';

interface ConsultationSectionProps {}

export default function ConsultationSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="contact" className="bg-gradient-to-r from-[#1A2B3C] to-[#2A3F5C] py-8 px-6">
      <div ref={ref} className="container mx-auto flex items-center justify-between gap-6">
        <div className={`pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display' }}>
            Ready to Get Started?
          </h3>
          <p className="text-sm text-[#D4AF37]">
            Schedule your consultation with Atty. Abigail T. Miller today.
          </p>
        </div>
        
        <button className="px-8 py-3 bg-[#D4AF37] text-[#1A2B3C] font-semibold rounded-lg hover:bg-[#E5C158] transition-colors whitespace-nowrap flex-shrink-0">
          Book Now
        </button>
      </div>
    </section>
  );
}
