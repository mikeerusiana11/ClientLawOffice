'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Award, BookOpen, Star, Scale, Shield, Users, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import ContactModal from './ContactModal';

const PHOTOS = [
  '/474831539_10227071476280562_3922689921505130759_n.jpg',
  '/474877647_10227072308181359_3499186668188173376_n.jpg',
  '/474913297_10227071476160559_2415090380508828193_n.jpg',
  '/476831559_10227162528436809_3554763883764144521_n.jpg',
  '/480239442_10227494354452252_3252315835987094932_n.jpg',
  '/503671851_10228437098300259_1370086591073992513_n.jpg',
];

const CREDENTIALS = [
  { icon: Award,    title: 'Bar Admission',  desc: 'Integrated Bar of the Philippines' },
  { icon: BookOpen, title: 'Education',      desc: 'Juris Doctor — Law School Graduate' },
  { icon: Star,     title: 'Recognition',    desc: 'Committed to client satisfaction' },
  { icon: Scale,    title: 'Approach',       desc: 'Direct access — no handoffs' },
];

const PRACTICE_AREAS = [
  { icon: Shield,    title: 'Civil Law',       desc: 'Property, contracts & disputes' },
  { icon: Users,     title: 'Family Law',      desc: 'Custody, annulment & support' },
  { icon: Briefcase, title: 'Corporate Law',   desc: 'Business & compliance' },
  { icon: BookOpen,  title: 'Estate Planning', desc: 'Wills, trusts & succession' },
];

type SlideType = 'credentials' | 'practice' | 'photo';

interface Slide {
  type: SlideType;
  label: string;
  photoSrc?: string;
}

const SLIDES: Slide[] = [
  { type: 'credentials', label: 'Profile' },
  { type: 'practice',    label: 'Practice' },
  ...PHOTOS.map((src, i) => ({ type: 'photo' as SlideType, label: `Photo ${i + 1}`, photoSrc: src })),
];

interface SlideItem {
  icon: React.ElementType;
  title: string;
  desc: string;
}

function SlideGrid({ items }: { items: SlideItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ height: '260px', gridTemplateRows: '1fr 1fr' }}>
      {items.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="bg-gradient-to-br from-white/15 to-white/5 border border-[#D4AF37]/30 rounded-xl p-5 hover:border-[#D4AF37]/60 hover:bg-white/20 transition-all flex flex-col justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(212,175,55,0.25)' }}>
            <Icon size={22} style={{ color: '#D4AF37' }} />
          </div>
          <p className="text-sm font-bold text-white leading-tight uppercase tracking-wide">{title}</p>
          <p className="text-xs text-white/70 mt-2">{desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function HeroSection() {
  const { ref, isInView } = useInView(0.15);
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const slideRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    if (next === slideRef.current) return;
    setFading(true);
    setTimeout(() => {
      slideRef.current = next;
      setSlide(next);
      setFading(false);
    }, 280);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goTo((slideRef.current + 1) % SLIDES.length);
    }, 5000);
  }, [goTo]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const prev = useCallback(() => {
    goTo((slideRef.current + SLIDES.length - 1) % SLIDES.length);
    startTimer();
  }, [goTo, startTimer]);

  const next = useCallback(() => {
    goTo((slideRef.current + 1) % SLIDES.length);
    startTimer();
  }, [goTo, startTimer]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const currentSlide = SLIDES[slide];

  return (
    <>
    <section className="bg-white px-6 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-24 lg:pt-28 pb-12">

        {/* ── Left ── */}
        <div>
          <div className={`flex items-center gap-2 mb-6 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
            <Scale size={14} style={{ color: '#D4AF37' }} />
            <span style={{ color: '#D4AF37' }} className="font-medium">Boutique Solo Practice. Trusted Legal Solutions.</span>
          </div>

          <h1
            className={`text-3xl md:text-5xl font-bold text-[#1A2B3C] mb-6 leading-tight pre-animate ${isInView ? 'animate-fade-in-up delay-100' : ''}`}
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Reliable Legal Services for Every Life Matter
          </h1>

          <p className={`text-lg text-[#6B7280] mb-8 leading-relaxed pre-animate ${isInView ? 'animate-fade-in-up delay-200' : ''}`}>
            Miller Law Office, headed by Atty. Abigail T. Miller, provides ethical, practical legal solutions for civil, criminal, family law, real estate, estate planning, and corporate matters. Direct attorney access ensures your case receives dedicated attention and sound legal advice.
          </p>

          <div className={`flex flex-wrap items-center gap-3 pre-animate ${isInView ? 'animate-fade-in-up delay-300' : ''}`}>
            <button
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#D4AF37', color: '#1A2B3C' }}
            >
              Contact Us
            </button>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm border-2 transition-all hover:bg-[#1A2B3C] hover:text-white active:scale-95"
              style={{ borderColor: '#1A2B3C', color: '#1A2B3C' }}
            >
              View Services →
            </a>
          </div>

          {/* Stats strip */}
          <div className={`mt-10 grid grid-cols-3 gap-6 pre-animate ${isInView ? 'animate-fade-in-up delay-400' : ''}`}>
            {[
              { value: '2025', label: 'Year Founded' },
              { value: '5.0★', label: 'Google Rating' },
              { value: '8+',  label: 'Practice Areas' },
            ].map((s, i) => (
              <div key={s.label} className={`text-center ${i !== 2 ? 'border-r border-[#E5E7EB]' : ''}`}>
                <p className="text-3xl font-extrabold text-[#1A2B3C]" style={{ fontFamily: 'var(--font-playfair)' }}>{s.value}</p>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className={`mt-6 h-px bg-[#E5E7EB] pre-animate ${isInView ? 'animate-fade-in-up delay-500' : ''}`} />
          <p className={`mt-3 text-xs text-[#94A3B8] pre-animate ${isInView ? 'animate-fade-in-up delay-500' : ''}`}>
            ✓ Licensed to practice law · Member, Integrated Bar of the Philippines
          </p>
        </div>

        {/* ── Right: Rotating Attorney Card ── */}
        <div
          className={`relative bg-[#1A2B3C] rounded-2xl p-6 lg:p-10 text-white border border-[#D4AF37]/20 shadow-2xl pre-animate ${isInView ? 'animate-fade-in-right delay-100' : ''}`}
          style={{ display: 'flex', flexDirection: 'column' }}
          onMouseEnter={pauseTimer}
          onMouseLeave={startTimer}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {/* Card Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: '#D4AF37' }}>Licensed Attorney</p>
              <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                Abigail T. Miller
              </h3>
              <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                Solo Practitioner
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: '#D4AF37' }}>
              <span className="text-2xl font-extrabold" style={{ color: '#D4AF37' }}>AM</span>
            </div>
          </div>

          {/* Animated Slide Content */}
          <div
            className="flex-1 relative"
            aria-live="polite"
            aria-atomic="true"
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
            }}
          >
            {currentSlide.type === 'credentials' && <SlideGrid items={CREDENTIALS} />}
            {currentSlide.type === 'practice'    && <SlideGrid items={PRACTICE_AREAS} />}

            {/* Photo slide */}
            {currentSlide.type === 'photo' && currentSlide.photoSrc && (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '260px' }}>
                <Image
                  src={currentSlide.photoSrc}
                  alt=""
                  aria-hidden="true"
                  fill
                  draggable={false}
                  style={{ objectFit: 'cover', filter: 'blur(16px)', transform: 'scale(1.1)', opacity: 0.6 }}
                />
                <Image
                  src={currentSlide.photoSrc}
                  alt="Atty. Abigail T. Miller"
                  fill
                  draggable={false}
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                />
                <p className="absolute bottom-3 left-4 text-xs text-white/70 z-10">
                  Atty. Abigail T. Miller
                </p>
              </div>
            )}
          </div>

          {/* Arrow Controls */}
          <div className="hidden sm:flex absolute top-1/2 left-4 right-4 -translate-y-1/2 items-center justify-between pointer-events-none z-10">
            <button type="button" onClick={prev} aria-label="Previous slide"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors pointer-events-auto">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button type="button" onClick={next} aria-label="Next slide"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors pointer-events-auto">
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>

          {/* Dot nav */}
          <div className="flex items-center justify-center mt-6 pt-4 border-t border-white/10 gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                type="button"
                key={s.label}
                onClick={() => { goTo(i); startTimer(); }}
                className="transition-all rounded-full flex-shrink-0"
                style={{
                  width: slide === i ? '20px' : '6px',
                  height: '6px',
                  backgroundColor: slide === i ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                }}
                aria-label={s.label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
    <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
