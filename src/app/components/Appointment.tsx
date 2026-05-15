'use client';

import { useState, useEffect, FormEvent } from 'react';

export default function AppointmentForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const checkEmailAvailability = async (email: string): Promise<'available' | 'pending_verification' | 'enrolled' | 'unknown'> => {
    try {
      const res = await fetch('/api/appointment/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return 'unknown';
      const data = await res.json() as { status?: 'available' | 'pending_verification' | 'enrolled' };
      return data.status || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const handleSendCode = async () => {
    const email = formData.email.trim();
    if (!email) { setSubmitStatus({ type: 'error', message: 'Please enter your email first.' }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) { setSubmitStatus({ type: 'error', message: 'Please enter a valid email address.' }); return; }
    const status = await checkEmailAvailability(email);
    if (status === 'enrolled') {
      setSubmitStatus({ type: 'error', message: 'This email is already in our system. Please contact our office.' });
      return;
    }
    setSendingCode(true);
    setSubmitStatus({ type: null, message: '' });
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
        body: JSON.stringify({ email, returnTo: '/#appointment' }),
      });
      const data = await res.json() as { error?: string; verificationUrl?: string };
      if (!res.ok) { setSubmitStatus({ type: 'error', message: data.error || 'Unable to send verification link. Please try again.' }); return; }
      console.log('✅ Verification token sent');
      setCodeSent(true);
      // In development, log the verification URL for testing
      if (process.env.NODE_ENV === 'development' && data.verificationUrl) {
        console.log('🔗 Dev verification URL:', data.verificationUrl);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to send verification link.';
      setSubmitStatus({ type: 'error', message: errorMsg });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you! Your appointment request has been submitted. We will contact you shortly.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          preferredDate: '',
          preferredTime: '',
          message: ''
        });
        setCodeSent(false);
        setEmailVerified(false);
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit appointment request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'email') {
      setEmailVerified(false);
      setCodeSent(false);
      setSubmitStatus({ type: null, message: '' });
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
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
        setSubmitStatus({ type: 'error', message: 'Previously selected time is now booked. Please choose another.' });
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
    setSubmitStatus({ type: null, message: '' });
    if (currentStep === 1) {
      // Contact Info validation
      if (!formData.name.trim()) {
        setSubmitStatus({ type: 'error', message: 'Please enter your full name.' });
        return false;
      }
      if (!formData.email.trim()) {
        setSubmitStatus({ type: 'error', message: 'Please enter your email address.' });
        return false;
      }
      if (!emailIsValid) {
        setSubmitStatus({ type: 'error', message: 'Please enter a valid email address.' });
        return false;
      }
      if (!formData.phone.trim()) {
        setSubmitStatus({ type: 'error', message: 'Please enter your phone number.' });
        return false;
      }
      if (!emailVerified) {
        setSubmitStatus({
          type: 'error',
          message: 'Please verify your email before continuing. Check your inbox for the verification link.',
        });
        return false;
      }
      return true;
    } else if (currentStep === 2) {
      // Appointment Details validation
      if (!formData.preferredDate) {
        setSubmitStatus({ type: 'error', message: 'Please select a date' });
        return false;
      }
      if (!formData.preferredTime) {
        setSubmitStatus({ type: 'error', message: 'Please select a time' });
        return false;
      }
      if (!formData.service) {
        setSubmitStatus({ type: 'error', message: 'Please select a service' });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setSubmitStatus({ type: null, message: '' });
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setSubmitStatus({ type: null, message: '' });
  };

  return (
    <section id="appointment" className="py-20 bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Schedule a Consultation
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Let us discuss your legal needs. Fill out the form below and we'll get back to you promptly.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); }} className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
          {/* Step Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {[1, 2, 3].map(stepNum => (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === stepNum
                      ? 'bg-blue-600 dark:bg-blue-700 text-white'
                      : step > stepNum
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {step > stepNum ? '✓' : stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-8 h-1 transition-all ${
                      step > stepNum ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: Contact Information */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    inputMode="email"
                    autoComplete="email"
                    pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                    title="Use a valid email format like name@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50 ${
                      !showEmailState
                        ? 'border-zinc-300 dark:border-zinc-600 focus:ring-blue-500'
                        : emailIsValid
                          ? 'border-green-500 dark:border-green-500 focus:ring-green-500'
                          : 'border-red-500 dark:border-red-500 focus:ring-red-500'
                    }`}
                  />
                  {showEmailState && (
                    <p className={`mt-1 text-xs ${emailIsValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {emailIsValid ? '✓ Valid email format' : '✗ Invalid email format'}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/60">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-3">📧 Email Verification</p>
                {emailVerified ? (
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">✓ Email verified. Ready to continue.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {codeSent ? (
                      <>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          A verification link has been sent to <strong>{formData.email}</strong>.
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Click the link in your email and return here — this form will update automatically.
                        </p>
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode}
                          className="self-start px-4 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
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
                          className="self-start px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg transition-colors disabled:opacity-60"
                        >
                          {sendingCode ? 'Sending…' : 'Send Verification Link'}
                        </button>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={localTomorrow}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Service Type *
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Preferred Time *
                </label>
                {!formData.preferredDate ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm">
                    Select a date above to view available times
                  </div>
                ) : loadingAvailability ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm">
                    Loading available slots...
                  </div>
                ) : effectiveSlots.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm">
                    ❌ No available slots on this date. Please choose another.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Availability Counter */}
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {effectiveSlots.length} of 7 slots available
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {bookedSlots.length > 0 && `${bookedSlots.length} booked`}
                      </span>
                    </div>

                    {/* Morning Times */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">🌅 Morning</h4>
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
                                ? 'bg-blue-600 dark:bg-blue-700 text-white ring-2 ring-blue-400'
                                : effectiveSlots.includes(slot)
                                  ? 'bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
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
                      <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">☀️ Afternoon</h4>
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
                                ? 'bg-blue-600 dark:bg-blue-700 text-white ring-2 ring-blue-400'
                                : effectiveSlots.includes(slot)
                                  ? 'bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
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
                <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Case Details (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your case or what you need help with..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-50"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6 border border-zinc-300 dark:border-zinc-600 space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Appointment Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Name:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Email:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold text-sm">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Phone:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{formData.phone}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Appointment Date:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
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
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Appointment Time:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{formData.preferredTime || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">Service:</span>
                    <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
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
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Case Details:</p>
                    <p className="text-zinc-900 dark:text-zinc-50 text-sm bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-700">
                      {formData.message}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                By submitting, you agree that we will contact you within 24 hours to confirm your appointment.
              </p>
            </div>
          )}

          {submitStatus.type === 'success' ? (
            <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">✓</div>
                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Appointment Request Confirmed!</h3>
              </div>
              
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Thank you for booking with Miller Law Office. We'll contact you within 24 hours to confirm.
              </p>

              <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 space-y-3 border border-green-200 dark:border-green-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SERVICE</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">LOCATION</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Miller Law Office</p>
                  </div>
                </div>

                <div className="border-t border-green-200 dark:border-green-700 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">DATE</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">TIME</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formData.preferredTime || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-green-200 dark:border-green-700 pt-3">
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">CONTACT INFORMATION</p>
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100"><span className="font-semibold">Name:</span> {formData.name}</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100"><span className="font-semibold">Email:</span> {formData.email}</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100"><span className="font-semibold">Phone:</span> {formData.phone}</p>
                  </div>
                </div>

                {formData.message && (
                  <div className="border-t border-green-200 dark:border-green-700 pt-3">
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">NOTES</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{formData.message}</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-green-700 dark:text-green-300 mt-4 text-center">
                📧 Confirmation details have been sent to <strong>{formData.email}</strong>
              </p>
            </div>
          ) : submitStatus.type ? (
            <div
              className={`mb-6 p-4 rounded-lg ${
                submitStatus.type === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  : ''
              }`}
            >
              {submitStatus.message}
            </div>
          ) : null}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-semibold py-3 rounded-lg transition-colors"
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                key="next"
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                key="submit"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Book'}
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', email: '', phone: '', service: '', preferredDate: '', preferredTime: '', message: '' });
                  setStep(1);
                  setEmailVerified(false);
                  setCodeSent(false);
                }}
                className="flex-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 font-semibold py-3 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
