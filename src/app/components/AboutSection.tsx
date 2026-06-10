'use client';

import { Shield, MessageCircle, Lightbulb } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const VALUES = [
  {
    icon: Shield,
    title: 'Ethical Practice',
    desc: 'We prioritize confidentiality, integrity, and professional excellence in every matter we handle. Attorney-client privilege is strictly observed, and your case details are never shared without your explicit consent.',
  },
  {
    icon: MessageCircle,
    title: 'Clear Communication',
    desc: 'We keep you informed at every stage with straightforward, honest communication tailored to your preferences. No legal jargon, no surprises — just transparent updates and responsive answers to your questions.',
  },
  {
    icon: Lightbulb,
    title: 'Practical Solutions',
    desc: 'We provide sound legal advice focused on effective, real-world outcomes. Every strategy is designed around your specific circumstances, goals, and resources — not a one-size-fits-all template.',
  },
];

export default function AboutSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="about" className="bg-[#F9FAFB] py-24 px-6 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto max-w-4xl">
        {/* About Attorney Introduction */}
        <div className={`text-center mb-16 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
            About Atty. Abigail T. Miller
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed max-w-3xl mx-auto">
            Atty. Abigail T. Miller is dedicated to providing ethical legal solutions. She is committed to giving clients direct access to her services, straightforward advice, and dedicated focus on their legal matters. Whether handling civil disputes, family concerns, real estate transactions, or corporate matters, she works with the conviction that honest communication and practical guidance make all the difference.
          </p>
        </div>

        {/* Core Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUES.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={`text-center p-8 border border-[#E5E7EB] rounded-xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white pre-animate ${isInView ? `animate-fade-in-up delay-${(i + 1) * 100}` : ''}`}
            >
              <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon size={26} style={{ color: '#D4AF37' }} />
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)', color: '#A67C00' }}>{title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
