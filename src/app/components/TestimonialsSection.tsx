'use client';

import { Star, ExternalLink } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=Miller+Law+Office&kgmid=/g/11mt95krpj';

const TESTIMONIALS = [
  {
    name: 'Marco Selmo',
    location: 'Australia',
    initials: 'MS',
    text: 'Abigail handled a legal matter for me, being a foreigner from Australia, and I must say I was highly impressed with her professionalism and care towards me, and at all times going above and beyond, even out of her working hours, to assist.',
    rating: 5,
  },
  {
    name: 'Devie Kate Gornez',
    location: 'Dumaguete City',
    initials: 'DG',
    text: 'I was in a rough patch of my personal life on which legal advice was necessary. I personally contacted Attorney Abigail for her expertise and I was so relieved by her thorough explanation to my situation and the rights I didn\'t know I am entitled to. She handled all the paperwork quickly without a doubt. Thank You Attorney!!!',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section id="testimonials" className="bg-white px-6 py-24 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto max-w-5xl">
        <div className={`text-center mb-12 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>
            Client Testimonials
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B3C] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            What Our Clients Say
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Trusted by individuals, families, and businesses in Dumaguete City and across Negros Oriental.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all pre-animate ${isInView ? `animate-fade-in-up delay-${(i + 1) * 100}` : ''}`}
            >
              {/* Stars + Google badge */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#D4AF37" style={{ color: '#D4AF37' }} />
                  ))}
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-label="Google review">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>

              <p className="text-[#374151] text-sm leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A2B3C]">{t.name}</p>
                  <p className="text-xs text-[#6B7280]">{t.location} · Google Review</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google Reviews link */}
        <div className={`mt-10 flex justify-center pre-animate ${isInView ? 'animate-fade-in-up delay-500' : ''}`}>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-sm font-semibold text-[#1A2B3C]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            See all reviews on Google
            <ExternalLink size={13} className="text-[#6B7280]" />
          </a>
        </div>

        <p className={`mt-4 text-center text-xs text-[#94A3B8] pre-animate ${isInView ? 'animate-fade-in-up delay-600' : ''}`}>
          Reviews are verified by Google · Miller Law Office on Google Business
        </p>
      </div>
    </section>
  );
}
