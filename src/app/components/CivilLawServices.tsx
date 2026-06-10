'use client';

import {
  Users, Home, Briefcase, Scale, ScrollText, PenLine,
  FileText, Heart, Building2, ShieldCheck, type LucideIcon,
} from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useSiteContent } from '../hooks/useSiteContent';

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Home, Briefcase, Scale, ScrollText, PenLine,
  FileText, Heart, Building2, ShieldCheck,
};

function ServiceIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Scale;
  return <Icon size={26} className="text-white" />;
}

function ServiceSkeleton() {
  return (
    <div className="h-full bg-white rounded-2xl p-8 border border-[#E5E7EB] animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-lg bg-[#E5E7EB] flex-shrink-0" />
        <div className="w-36 h-6 rounded bg-[#E5E7EB] mt-2" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 rounded bg-[#E5E7EB]" />
        <div className="w-5/6 h-3 rounded bg-[#E5E7EB]" />
        <div className="w-4/6 h-3 rounded bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

export default function CivilLawServices() {
  const { ref, isInView } = useInView();
  const { services, loading } = useSiteContent();

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
          {loading && Array.from({ length: 6 }).map((_, i) => <ServiceSkeleton key={i} />)}
          {!loading && services.map((service, index) => (
            <div
              key={service.id}
              className={`h-full bg-gradient-to-br from-white to-[#F9FAFB] rounded-2xl p-8 border border-[#E5E7EB] hover:shadow-lg hover:-translate-y-2 hover:border-[#D4AF37] transition-all duration-300 pre-animate ${isInView ? `animate-fade-in-up delay-${Math.min((index + 1) * 100, 400)}` : ''}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#1A2B3C' }}
                >
                  <ServiceIcon name={service.icon} />
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
