'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useInView } from '../hooks/useInView';

interface FAQItem {
  question: string;
  answer: string;
}

export default function SmartFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, isInView } = useInView();

  const faqs: FAQItem[] = [
    {
      question: 'What types of cases do you handle?',
      answer:
        'Miller Law Office assists clients across a broad range of legal matters: civil and criminal cases, family law and special proceedings (including annulment, legal separation, and custody), property and real estate transactions, estate settlement and succession, contracts and legal documentation, basic corporate and business registration, and notarial services. Each case is evaluated based on its specific facts, legal issues, and the availability of the office. Acceptance is subject to a case assessment to ensure we can provide competent and dedicated representation.',
    },
    {
      question: 'How do I schedule a consultation?',
      answer:
        'You can book a consultation directly through our website by clicking "Book a Consultation," or reach us via phone or email. Briefly describe your legal concern when making contact so we can prepare accordingly. All consultations are by appointment only — walk-ins are not accepted. Once you submit your request, the office will confirm your schedule, consultation format (in-person, phone, or video), and any applicable professional fees within one business day.',
    },
    {
      question: 'Are consultations confidential?',
      answer:
        'Yes, absolutely. All consultations are protected by attorney-client privilege, which is a fundamental principle of legal practice. Everything you share with Atty. Miller during a consultation is strictly confidential and cannot be disclosed to third parties without your explicit consent, subject only to limited exceptions recognized by law (such as preventing imminent harm). This confidentiality applies from your very first contact with the office.',
    },
    {
      question: 'What is your fee structure?',
      answer:
        'Legal fees vary depending on the nature, complexity, and scope of your case. For consultations, a professional fee may apply and will be disclosed before your scheduled appointment. For ongoing representation, fees are discussed transparently at the outset — whether based on an hourly rate, a fixed retainer, or a case-specific arrangement. We believe in complete transparency about costs so there are no surprises. No legal work begins until the fee arrangement is agreed upon in writing.',
    },
    {
      question: 'How will you communicate case updates?',
      answer:
        'We are committed to keeping you informed throughout your case. You can expect timely updates by phone, email, or in-person meetings — whatever format you prefer. Atty. Miller personally handles all client communications, so you always speak directly with your attorney and never a paralegal or assistant. We set clear expectations at the start of engagement about update frequency, and you are always welcome to reach out with questions between scheduled updates.',
    },
    {
      question: 'Do you handle cases outside Dumaguete City?',
      answer:
        'Miller Law Office is based in Dumaguete City, Negros Oriental, and primarily serves clients in the region. However, remote consultations by phone or video are available for clients outside the area. For matters requiring court appearances or on-site presence in other jurisdictions, this will be assessed on a case-by-case basis. Please contact the office to discuss the specifics of your situation and how we can best assist you.',
    },
  ];

  return (
    <section id="faq" className="bg-[#F9FAFB] py-24 px-6 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className={`text-center mb-16 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#6B7280]">
            Common questions about working with Miller Law Office
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md hover:border-[#D4AF37] transition-all duration-300 pre-animate ${isInView ? `animate-fade-in-up delay-${Math.min((index + 1) * 100, 600)}` : ''}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-[#F9FAFB] transition-colors text-left"
              >
                <h3 className="text-base font-semibold text-[#1A2B3C] pr-4" style={{ fontFamily: 'Playfair Display' }}>
                  {faq.question}
                </h3>
                <ChevronDown
                  size={20}
                  className={`text-[#6B7280] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-[#D4AF37]' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-5 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                  <p className="text-[#6B7280] leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
