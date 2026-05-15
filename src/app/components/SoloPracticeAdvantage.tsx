'use client';

import { Phone, Calendar, MessageSquare, CheckCircle } from 'lucide-react';
import { useInView } from '../hooks/useInView';

export default function SoloPracticeAdvantage() {
  const advantages = [
    {
      icon: <Phone size={24} />,
      title: 'Direct Attorney Access',
      description: 'Work directly with Atty. Abigail T. Miller, not paralegals or assistants.',
    },
    {
      icon: <Calendar size={24} />,
      title: 'Personalized Attention',
      description: 'Customized legal strategies tailored to your specific situation and needs.',
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Responsive Communication',
      description: 'Regular updates and responsive service tailored to your preferences.',
    },
  ];

  const reasons = [
    'Lower overhead means competitive rates without sacrificing quality legal work',
    'Your attorney handles your case from start to finish with dedicated focus',
    'Flexible scheduling with personalized, boutique practice attention',
  ];

  const { ref, isInView } = useInView();

  return (
    <section className="bg-[#1A2B3C] py-24 px-6">
      <div ref={ref} className="container mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            The Solo Practice Advantage
          </h2>
          <p className="text-lg text-[#D4AF37]">
            When you work with a solo practitioner, you're not just another case number
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {advantages.map((advantage, index) => (
            <div
              key={index}
              className={`bg-white/10 rounded-xl p-8 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 cursor-default pre-animate ${isInView ? `animate-fade-in-up delay-${(index + 1) * 100}` : ''}`}
            >
              <div className="mb-5" style={{ color: '#D4AF37' }}>{advantage.icon}</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#D4AF37', fontFamily: 'Playfair Display' }}>
                {advantage.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">{advantage.description}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Section */}
        <div className={`max-w-2xl mx-auto bg-white/10 rounded-xl p-8 pre-animate ${isInView ? 'animate-fade-in-up delay-400' : ''}`}>
          <h3 className="text-lg font-bold mb-6" style={{ color: '#D4AF37', fontFamily: 'Playfair Display' }}>
            Why Choose Solo Practice?
          </h3>
          <div className="space-y-4">
            {reasons.map((reason, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-white/70 text-sm leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
