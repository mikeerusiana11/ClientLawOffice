'use client';

import { X, Phone, MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PHONE_RAW = '+639176317120';
const PHONE_DISPLAY = '+63 917 631 7120';

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const VIBER_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.398.002C8.46-.028 2.67.693.803 6.33c-.836 2.53-.922 5.826-.922 8.45C-.12 21.78.946 23.95 3.64 24h.003c.002 0 .003 0 .003-.003 0 0 .862.027.862-1.083v-.006c-.012-.27-.025-1.065-.023-1.71.002-.575.003-1.024.003-1.024-3.04-.647-3.687-3.156-3.687-3.156-.498-1.27-1.218-1.607-1.218-1.607-1.003-.666.074-.654.074-.654 1.104.076 1.685 1.114 1.685 1.114.977 1.63 2.565 1.16 3.19.888.1-.69.383-1.16.695-1.428-2.432-.27-4.99-1.188-4.99-5.293 0-1.168.425-2.124 1.12-2.873-.112-.27-.487-1.358.106-2.83 0 0 .913-.286 2.99 1.089A10.6 10.6 0 0 1 12 7.617a10.6 10.6 0 0 1 2.747.362c2.073-1.375 2.982-1.09 2.982-1.09.596 1.473.22 2.56.108 2.83.697.75 1.12 1.705 1.12 2.874 0 4.113-2.563 5.02-5.005 5.283.394.33.746.985.746 1.985 0 1.432-.013 2.586-.013 2.938 0 .285.196.62.754.514C21.55 21.325 24 17.552 24 12.003 24 5.494 18.5.03 11.398.003z" />
  </svg>
);

const OPTIONS = [
  {
    label: 'WhatsApp',
    desc: 'Send us a message',
    href: `https://wa.me/${PHONE_RAW.replace('+', '')}`,
    iconBg: '#25D366',
    icon: WHATSAPP_ICON,
  },
  {
    label: 'Viber',
    desc: 'Chat on Viber',
    href: `viber://chat?number=${PHONE_RAW}`,
    iconBg: '#7360F2',
    icon: VIBER_ICON,
  },
  {
    label: 'Call Us',
    desc: PHONE_DISPLAY,
    href: `tel:${PHONE_RAW}`,
    iconBg: '#D4AF37',
    icon: <Phone size={18} />,
  },
];

export default function ContactModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Contact us"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)' }}>

        {/* Gold accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #D4AF37, #f0d060, #D4AF37)' }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between"
          style={{ background: 'linear-gradient(160deg, #1A2B3C 0%, #243650 100%)' }}>
          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-1">Miller Law Office</p>
            <h2 className="text-white text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
              Get in Touch
            </h2>
            <p className="text-white/50 text-xs mt-1">Dumaguete City, Negros Oriental</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Contact options */}
        <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-1 mb-1">Reach Us</p>
          {OPTIONS.map(({ label, desc, href, iconBg, icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group flex items-center gap-4 px-4 py-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E5E7EB] hover:border-[#D4AF37]/40 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                style={{ backgroundColor: iconBg }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2B3C]">{label}</p>
                <p className="text-xs text-[#6B7280] truncate">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#CBD5E1] group-hover:text-[#D4AF37] transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>

        {/* Map */}
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} style={{ color: '#D4AF37' }} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Our Location</p>
            </div>
            <a
              href="https://maps.google.com/?q=9.3172933,123.2903507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold transition-colors hover:opacity-70"
              style={{ color: '#D4AF37' }}
            >
              Open in Maps <ExternalLink size={11} className="inline" />
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=123.2853507%2C9.3122933%2C123.2953507%2C9.3222933&layer=mapnik&marker=9.3172933%2C123.2903507"
              width="100%"
              height="180"
              loading="lazy"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              title="Miller Law Office location"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
