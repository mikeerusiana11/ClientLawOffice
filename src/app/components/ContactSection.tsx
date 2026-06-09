'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Scale } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useSiteContent } from '../hooks/useSiteContent';

export default function ContactSection() {
  const { ref, isInView } = useInView(0.15);
  const { contact } = useSiteContent();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Compose mailto link as a graceful fallback
    const subject = encodeURIComponent(`Inquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || 'Not provided'}\n\nMessage:\n${form.message}`
    );
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, '_blank');
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Address',
      value: contact.address,
      href: contact.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(contact.address)}`,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, '')}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: Clock,
      label: 'Office Hours',
      value: `Mon–Fri: ${contact.hoursWeekday}\nSat: ${contact.hoursSat}\nSun: ${contact.hoursSun}`,
      href: null,
    },
  ];

  return (
    <section id="contact" className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
      <div ref={ref} className="container mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 pre-animate ${isInView ? 'animate-fade-in-up' : ''}`}>
          <h2 className="text-4xl font-bold text-[#1A2B3C] mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Get in Touch
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Have a legal concern? Reach out directly and Atty. Miller will personally respond within one business day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* ── Left: Contact Form ── */}
          <div className={`pre-animate ${isInView ? 'animate-fade-in-up delay-100' : ''}`}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-8">
              <h3 className="text-2xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                Send a Message
              </h3>
              <div className="w-10 h-1 bg-[#D4AF37] rounded-full mb-6" />

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-[#1A2B3C] mb-2" style={{ fontFamily: 'Playfair Display' }}>
                    Message Sent!
                  </h4>
                  <p className="text-[#6B7280] text-sm">
                    Your inquiry has been sent. Atty. Miller will reply within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
                    className="mt-6 text-[#D4AF37] font-medium text-sm hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B3C] uppercase tracking-wide mb-1.5">
                        Full Name <span className="text-[#D4AF37]">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Juan dela Cruz"
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B3C] uppercase tracking-wide mb-1.5">
                        Email Address <span className="text-[#D4AF37]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A2B3C] uppercase tracking-wide mb-1.5">
                      Phone Number <span className="text-[#94A3B8] font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A2B3C] uppercase tracking-wide mb-1.5">
                      Your Message <span className="text-[#D4AF37]">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Briefly describe your legal concern or what you'd like to discuss..."
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none"
                    />
                  </div>

                  <p className="text-xs text-[#94A3B8]">
                    ✓ All inquiries are treated with strict confidentiality. Submitting this form does not create an attorney-client relationship.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D4AF37] text-[#1A2B3C] font-bold py-3.5 px-6 rounded-xl hover:bg-[#C49D2E] hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#1A2B3C]/30 border-t-[#1A2B3C] rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── Right: Contact Info ── */}
          <div className={`flex flex-col gap-6 pre-animate ${isInView ? 'animate-fade-in-right delay-200' : ''}`}>
            {/* Info Card */}
            <div className="bg-[#1A2B3C] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display' }}>
                Office Information
              </h3>
              <div className="w-10 h-1 bg-[#D4AF37] rounded-full mb-8" />

              <div className="space-y-6">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={18} style={{ color: '#D4AF37' }} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] mb-1">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="text-white/80 text-sm hover:text-[#D4AF37] transition-colors leading-relaxed whitespace-pre-line"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick CTA */}
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                <Scale size={20} className="text-[#1A2B3C]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A2B3C]">Ready to discuss your case?</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Book a formal consultation directly through our scheduling system.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
