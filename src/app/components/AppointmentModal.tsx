'use client';

import { X } from 'lucide-react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useModalTransition } from '../hooks/useModalTransition';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const { mounted, backdropClass, panelClass } = useModalTransition(isOpen);
  const [step, setStep] = useState(1); // 1: Contact, 2: Appointment, 3: Review
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const emailValue = formData.email.trim();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(emailValue);
  const showEmailState = emailValue.length > 0;

  const localTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const effectiveSlots = availableSlots;

  // Reset all state when the modal closes (not on initial mount)
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      setStep(1);
      setFormData({ name: '', email: '', phone: '', service: '', preferredDate: '', preferredTime: '', message: '' });
      setSubmitted(false);
      setSaving(false);
      setError('');
      setSendingCode(false);
      setCodeSent(false);
      setEmailVerified(false);
      setAvailableSlots([]);
      setBookedSlots([]);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Restore form draft + verified email after returning from /verify-email
  useEffect(() => {
    try {
      const verifiedEmail = sessionStorage.getItem('appointment_email_verified') || localStorage.getItem('appointment_email_verified');
      const savedDraft = sessionStorage.getItem('appointment_form_draft') || localStorage.getItem('appointment_form_draft');
      if (verifiedEmail) {
        let draft: typeof formData | null = null;
        if (savedDraft) {
          try { draft = JSON.parse(savedDraft) as typeof formData; } catch { /* ignore */ }
        }
        setFormData(prev => ({ ...(draft ?? prev), email: verifiedEmail }));
        setEmailVerified(true);
        sessionStorage.removeItem('appointment_email_verified');
        localStorage.removeItem('appointment_email_verified');
        if (draft) sessionStorage.removeItem('appointment_form_draft');
        if (draft) localStorage.removeItem('appointment_form_draft');
      }
    } catch { /* sessionStorage unavailable */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'email') {
      setEmailVerified(false);
      setCodeSent(false);
      setError('');
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Check availability when date is selected
    if (e.target.name === 'preferredDate' && e.target.value) {
      checkAvailability(e.target.value);
    }
  };

  const checkAvailability = async (date: string) => {
    setLoadingAvailability(true);
    try {
      const res = await fetch('/api/appointment/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json() as { available_slots?: string[]; booked_slots?: string[] };
      setAvailableSlots(data.available_slots || []);
      setBookedSlots(data.booked_slots || []);
      
      // Clear time selection if previously selected time is now booked
      if (formData.preferredTime && data.booked_slots?.includes(formData.preferredTime)) {
        setFormData(prev => ({ ...prev, preferredTime: '' }));
        setError('Previously selected time is now booked. Please choose another.');
      }
    } catch (err) {
      console.error('Failed to check availability:', err);
      setAvailableSlots([]);
      setBookedSlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Validate current step
  const validateStep = (currentStep: number): boolean => {
    setError('');
    if (currentStep === 1) {
      // Contact Info validation
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address');
        return false;
      }
      if (!emailIsValid) {
        setError('Please enter a valid email address');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Please enter your phone number');
        return false;
      }
      if (!emailVerified) {
        setError('Please verify your email before continuing. Check your inbox for the verification link.');
        return false;
      }
      return true;
    } else if (currentStep === 2) {
      // Appointment Details validation
      if (!formData.preferredDate) {
        setError('Please select a date');
        return false;
      }
      if (!formData.preferredTime) {
        setError('Please select a time');
        return false;
      }
      if (!formData.service) {
        setError('Please select a service');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setError('');
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const checkEmailAvailability = async (email: string): Promise<'available' | 'pending_verification' | 'enrolled' | 'unknown'> => {
    try {
      const res = await fetch('/api/appointment/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        return 'unknown';
      }

      const data = await res.json() as { status?: 'available' | 'pending_verification' | 'enrolled' };
      return data.status || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const handleSendCode = async () => {
    const email = formData.email.trim();
    if (!email) { setError('Please enter your email first.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }
    const status = await checkEmailAvailability(email);
    if (status === 'enrolled') {
      setError('This email is already in our system. Please contact our office.');
      return;
    }
    setSendingCode(true);
    setError('');
    // Save form draft so it can be restored after the email-link redirect
    try {
      sessionStorage.setItem('appointment_form_draft', JSON.stringify(formData));
      localStorage.setItem('appointment_form_draft', JSON.stringify(formData));
    } catch { /* ignore */ }
    try {
      console.log(`📧 Requesting verification token for ${email}`);
      const res = await fetch('/api/appointment/send-verification-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, returnTo: (() => { const u = new URL(window.location.href); u.searchParams.set('openAppointment', '1'); return u.pathname + u.search; })() }),
      });
      const data = await res.json() as { error?: string; verificationUrl?: string };
      if (!res.ok) { setError(data.error || 'Unable to send verification link. Please try again.'); return; }
      console.log('✅ Verification token sent');
      setCodeSent(true);
      // In development, log the verification URL for testing
      if (process.env.NODE_ENV === 'development' && data.verificationUrl) {
        console.log('🔗 Dev verification URL:', data.verificationUrl);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to send verification link.';
      setError(errorMsg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // DEV NOTE: Temporarily bypassing email verification for testing
    setSaving(true);
    setError('');
    try {
      const emailStatus = await checkEmailAvailability(formData.email.trim());
      if (emailStatus === 'enrolled') {
        setError('This email is already in our system. Please contact our office.');
        return;
      }
      if (emailStatus === 'unknown') {
        setError('Could not validate this email right now. Please try again.');
        return;
      }

      const serviceLabels: Record<string, string> = {
        civil: 'Civil Matters',
        criminal: 'Criminal Defense',
        family: 'Family Law',
        realestate: 'Real Estate',
        estate: 'Estate Planning',
        corporate: 'Corporate & Business',
        documentation: 'Documentation Services',
        notarial: 'Notarial Services',
      };

      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone,
          title: serviceLabels[formData.service] || formData.service,
          date: formData.preferredDate,
          time: formData.preferredTime,
          type: formData.service,
          method: 'In-Person',
          notes: formData.message || null,
        }),
      });

      const data = await res.json() as { error?: string; message?: string };
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appointment');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', service: '', preferredDate: '', preferredTime: '', message: '' });
        setCodeSent(false);
        setEmailVerified(false);
        onClose();
      }, 2500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again or call us directly.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${backdropClass}`}>
      <div className={`bg-white rounded-2xl border-2 border-[#D4AF37] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${panelClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center text-[#1A2B3C]">
              📅
            </div>
            <h2 className="text-2xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              Request Appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1A2B3C] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-[#6B7280] text-center mb-6">
          Fill out the form below and we'll contact you within 24 hours to schedule your consultation
        </p>

        {submitted && (
          <div className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">✓</div>
              <h3 className="text-lg font-bold text-green-700">Appointment Request Confirmed!</h3>
            </div>
            
            <p className="text-sm text-green-700 mb-4">
              Thank you for booking with Miller Law Office. We'll contact you within 24 hours to confirm.
            </p>

            <div className="bg-white rounded-lg p-4 space-y-3 border border-green-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">SERVICE</p>
                  <p className="text-sm font-bold text-[#1A2B3C]">
                    {(() => {
                      const services: Record<string, string> = {
                        civil: 'Civil Matters',
                        criminal: 'Criminal Defense',
                        family: 'Family Law',
                        realestate: 'Real Estate',
                        estate: 'Estate Planning',
                        corporate: 'Corporate & Business',
                        documentation: 'Documentation Services',
                        notarial: 'Notarial Services',
                      };
                      return services[formData.service] || formData.service;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">LOCATION</p>
                  <p className="text-sm font-bold text-[#1A2B3C]">Miller Law Office</p>
                </div>
              </div>

              <div className="border-t border-green-200 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">DATE</p>
                    <p className="text-sm font-bold text-[#1A2B3C]">
                      {formData.preferredDate
                        ? new Date(formData.preferredDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">TIME</p>
                    <p className="text-sm font-bold text-[#1A2B3C]">{formData.preferredTime || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-semibold text-[#64748B] mb-2">CONTACT INFORMATION</p>
                <div className="space-y-1">
                  <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Name:</span> {formData.name}</p>
                  <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Email:</span> {formData.email}</p>
                  <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Phone:</span> {formData.phone}</p>
                </div>
              </div>

              {formData.message && (
                <div className="border-t border-green-200 pt-3">
                  <p className="text-xs font-semibold text-[#64748B] mb-2">NOTES</p>
                  <p className="text-sm text-[#1A2B3C]">{formData.message}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-green-700 mt-4 text-center">
              📧 Confirmation details have been sent to <strong>{formData.email}</strong>
            </p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm">
            {error}
          </div>
        )}

        {/* Step Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map(stepNum => (
            <div key={stepNum} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === stepNum
                    ? 'bg-[#D4AF37] text-[#1A2B3C]'
                    : step > stepNum
                      ? 'bg-green-500 text-white'
                      : 'bg-[#D1D5DB] text-[#6B7280]'
                }`}
              >
                {step > stepNum ? '✓' : stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-1 transition-all ${
                    step > stepNum ? 'bg-green-500' : 'bg-[#D1D5DB]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); }} className="space-y-6">
          {/* STEP 1: Contact Information */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-3 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  inputMode="email"
                  autoComplete="email"
                  pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                  title="Use a valid email format like name@example.com"
                  required
                  className={`px-6 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    !showEmailState
                      ? 'border-[#D1D5DB] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'
                      : emailIsValid
                        ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                        : 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  }`}
                />
                {showEmailState && (
                  <p className={`text-xs ${emailIsValid ? 'text-green-700' : 'text-red-700'}`}>
                    {emailIsValid ? '✓ Valid email format' : '✗ Invalid email format'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-3 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

              <div className="rounded-lg border border-[#D1D5DB] p-4 space-y-3 bg-[#F8FAFC]">
                <p className="text-sm font-semibold text-[#1A2B3C]">📧 Email Verification</p>
                {emailVerified ? (
                  <p className="text-xs text-green-700 font-medium">✓ Email verified. Ready to continue.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {codeSent ? (
                      <>
                        <p className="text-sm text-blue-700 font-medium">
                          A verification link has been sent to <strong>{formData.email}</strong>.
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Click the link in your email and return here — this form will update automatically.
                        </p>
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode}
                          className="self-start px-4 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-[#1A2B3C] hover:bg-zinc-100 transition-colors disabled:opacity-60"
                        >
                          {sendingCode ? 'Sending…' : 'Resend Link'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode}
                          className="self-start px-4 py-2 rounded-lg bg-[#1A2B3C] text-white text-sm font-semibold hover:bg-[#243548] transition-colors disabled:opacity-60"
                        >
                          {sendingCode ? 'Sending…' : 'Send Verification Link'}
                        </button>
                        <p className="text-xs text-[#64748B]">
                          We'll send a link to confirm your email.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Appointment Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Preferred Date *</label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={localTomorrow}
                  className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#1A2B3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-3">Preferred Time *</label>
                {!formData.preferredDate ? (
                  <div className="text-center py-8 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm">
                    Select a date above to view available times
                  </div>
                ) : loadingAvailability ? (
                  <div className="text-center py-8 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm">
                    Loading available slots...
                  </div>
                ) : effectiveSlots.length === 0 ? (
                  <div className="text-center py-8 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm">
                    ❌ No available slots on this date. Please choose another.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Availability Counter */}
                    <div className="flex items-center justify-between bg-[#FEF9F0] px-3 py-2 rounded-lg border border-[#D4AF37]">
                      <span className="text-sm font-semibold text-[#1A2B3C]">
                        {effectiveSlots.length} of 7 slots available
                      </span>
                      <span className="text-xs text-[#6B7280]">
                        {bookedSlots.length > 0 && `${bookedSlots.length} booked`}
                      </span>
                    </div>

                    {/* Morning Times */}
                    <div>
                      <h4 className="text-xs font-bold text-[#6B7280] uppercase mb-2">🌅 Morning</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['9:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, preferredTime: slot });
                            }}
                            disabled={!effectiveSlots.includes(slot)}
                            className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                              formData.preferredTime === slot
                                ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                                : effectiveSlots.includes(slot)
                                  ? 'bg-white border border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                                  : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                            }`}
                          >
                            {slot}
                            {effectiveSlots.includes(slot) && formData.preferredTime === slot && <span className="ml-1">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Afternoon Times */}
                    <div>
                      <h4 className="text-xs font-bold text-[#6B7280] uppercase mb-2">☀️ Afternoon</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, preferredTime: slot });
                            }}
                            disabled={!effectiveSlots.includes(slot)}
                            className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                              formData.preferredTime === slot
                                ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                                : effectiveSlots.includes(slot)
                                  ? 'bg-white border border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                                  : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                            }`}
                          >
                            {slot}
                            {effectiveSlots.includes(slot) && formData.preferredTime === slot && <span className="ml-1">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Service Type *</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#6B7280]"
                >
                  <option value="">Select a service</option>
                  <option value="civil">Civil Matters</option>
                  <option value="criminal">Criminal Defense</option>
                  <option value="family">Family Law</option>
                  <option value="realestate">Real Estate</option>
                  <option value="estate">Estate Planning</option>
                  <option value="corporate">Corporate & Business</option>
                  <option value="documentation">Documentation Services</option>
                  <option value="notarial">Notarial Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-2">Case Details (Optional)</label>
                <textarea
                  name="message"
                  placeholder="Tell us about your case or what you need help with..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-6 py-3 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="bg-[#F8FAFC] rounded-lg p-6 border border-[#D1D5DB] space-y-4">
                <h3 className="text-lg font-bold text-[#1A2B3C]">Appointment Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Name:</span>
                    <span className="text-[#1A2B3C] font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Email:</span>
                    <span className="text-[#1A2B3C] font-semibold text-sm">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Phone:</span>
                    <span className="text-[#1A2B3C] font-semibold">{formData.phone}</span>
                  </div>
                </div>

                <div className="border-t border-[#D1D5DB] pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Appointment Date:</span>
                    <span className="text-[#1A2B3C] font-semibold">
                      {formData.preferredDate
                        ? new Date(formData.preferredDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Appointment Time:</span>
                    <span className="text-[#1A2B3C] font-semibold">{formData.preferredTime || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] text-sm">Service:</span>
                    <span className="text-[#1A2B3C] font-semibold">
                      {
                        {
                          civil: 'Civil Matters',
                          criminal: 'Criminal Defense',
                          family: 'Family Law',
                          realestate: 'Real Estate',
                          estate: 'Estate Planning',
                          corporate: 'Corporate & Business',
                          documentation: 'Documentation Services',
                          notarial: 'Notarial Services',
                        }[formData.service] || 'Not selected'
                      }
                    </span>
                  </div>
                </div>

                {formData.message && (
                  <div className="border-t border-[#D1D5DB] pt-4">
                    <p className="text-[#6B7280] text-sm mb-2">Case Details:</p>
                    <p className="text-[#1A2B3C] text-sm bg-white p-3 rounded border border-[#D1D5DB]">
                      {formData.message}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#6B7280] text-center">
                By submitting, you agree that we will contact you within 24 hours to confirm your appointment.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 bg-[#E5E7EB] text-[#1A2B3C] font-bold py-3 rounded-lg hover:bg-[#D1D5DB] transition-colors"
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                key="next"
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-[#D4AF37] text-[#1A2B3C] font-bold py-3 rounded-lg hover:bg-[#C49D2E] transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                key="submit"
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#D4AF37] text-[#1A2B3C] font-bold py-3 rounded-lg hover:bg-[#C49D2E] transition-colors disabled:opacity-60"
              >
                {saving ? 'Submitting...' : 'Confirm & Book'}
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#E5E7EB] text-[#1A2B3C] font-bold py-3 rounded-lg hover:bg-[#D1D5DB] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
