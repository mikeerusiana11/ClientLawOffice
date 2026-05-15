'use client';

import { Calendar, Clock, MapPin, FileText, Check } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { createClient } from '../../../lib/supabase';


interface AppointmentForm {
  preferredDate: string;
  preferredTime: string;
  type: 'consultation' | 'follow-up' | 'review' | 'meeting';
  method: 'in-person';
  title: string;
  description: string;
}

interface ClientNewAppointmentProps {
  onSubmit?: (data: AppointmentForm) => void;
  onCancel?: () => void;
}

export default function ClientNewAppointment({ onSubmit, onCancel }: ClientNewAppointmentProps) {
  const [formData, setFormData] = useState<AppointmentForm>({
    preferredDate: '',
    preferredTime: '',
    type: 'follow-up',
    method: 'in-person',
    title: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const localTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const checkAvailability = async (date: string) => {
    setLoadingAvailability(true);
    try {
      const res = await fetch('/api/appointment/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json() as { available_slots?: string[]; booked_slots?: string[]; attorney_unavailable_slots?: string[] };
      const slots = data.available_slots || [];
      setAvailableSlots(slots);
      setBookedSlots(data.booked_slots || []);
      if (formData.preferredTime && !slots.includes(formData.preferredTime)) {
        setFormData(prev => ({ ...prev, preferredTime: '' }));
      }
    } catch {
      setAvailableSlots([]);
      setBookedSlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'preferredDate' && value) {
      checkAvailability(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to schedule an appointment.');
      return;
    }

    const typeMap: Record<string, string> = {
      consultation: 'Consultation',
      'follow-up': 'Follow-up',
      review: 'Review',
      meeting: 'Meeting',
    };

    const clientName = user.user_metadata?.full_name || user.email || 'Client';

    const { error: insertError } = await supabase.from('appointments').insert({
      user_id: user.id,
      client_name: clientName,
      title: formData.title,
      date: formData.preferredDate,
      time: formData.preferredTime,
      type: typeMap[formData.type],
      method: 'In-person',
      notes: formData.description,
      attorney: 'Abigail Miller',
      status: 'Requested',
    });

    if (insertError) {
      setError('Failed to submit appointment. Please try again.');
      return;
    }

    setSubmitted(true);
    if (onSubmit) onSubmit(formData);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        preferredDate: '',
        preferredTime: '',
        type: 'follow-up',
        method: 'in-person',
        title: '',
        description: '',
      });
      setAvailableSlots([]);
      setBookedSlots([]);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center text-[#D4AF37]">
            <Calendar size={20} />
          </div>
          <h2 className="text-2xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
            Request Appointment
          </h2>
        </div>
        <p className="text-sm text-[#64748B] ml-13">
          Request a new appointment with Abigail Miller
        </p>
      </div>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3 animate-pulse">
          <Check size={20} className="text-green-600" />
          <div>
            <p className="font-semibold text-green-700">Request Submitted!</p>
            <p className="text-sm text-green-600">
              Our staff will review and confirm your request within 24 hours.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appointment Title */}
        <div>
          <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
            Appointment Title *
          </label>
          <input
            type="text"
            name="title"
            placeholder="e.g., Contract Review, Discovery Discussion"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
            <Calendar size={16} className="inline mr-2" />
            Preferred Date *
          </label>
          <input
            type="date"
            name="preferredDate"
            value={formData.preferredDate}
            onChange={handleChange}
            required
            min={localTomorrow}
            className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>

        {/* Time Slots */}
        <div>
          <label className="block text-sm font-semibold text-[#1A2B3C] mb-3">
            <Clock size={16} className="inline mr-2" />
            Preferred Time *
          </label>

          {!formData.preferredDate ? (
            <div className="text-center py-6 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
              Select a date above to view available times
            </div>
          ) : loadingAvailability ? (
            <div className="text-center py-6 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
              Loading available slots...
            </div>
          ) : (
            <div className="space-y-3">
              {availableSlots.length === 0 && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">All slots on this date are unavailable.</p>
              )}
              {/* Morning */}
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">🌅 Morning</p>
                <div className="grid grid-cols-3 gap-2">
                  {['9:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredTime: slot }))}
                      disabled={!availableSlots.includes(slot)}
                      className={`py-2 px-2 rounded-lg font-medium text-sm transition-all leading-tight ${
                        formData.preferredTime === slot
                          ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                          : availableSlots.includes(slot)
                            ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                            : bookedSlots.includes(slot)
                              ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                              : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                      }`}
                    >
                      <span className="block">{slot}</span>
                      {!availableSlots.includes(slot) && (
                        <span className="block text-[10px] font-normal">
                          {bookedSlots.includes(slot) ? 'Booked' : 'Unavailable'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon */}
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">☀️ Afternoon</p>
                <div className="grid grid-cols-4 gap-2">
                  {['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredTime: slot }))}
                      disabled={!availableSlots.includes(slot)}
                      className={`py-2 px-2 rounded-lg font-medium text-sm transition-all leading-tight ${
                        formData.preferredTime === slot
                          ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                          : availableSlots.includes(slot)
                            ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                            : bookedSlots.includes(slot)
                              ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                              : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                      }`}
                    >
                      <span className="block">{slot}</span>
                      {!availableSlots.includes(slot) && (
                        <span className="block text-[10px] font-normal">
                          {bookedSlots.includes(slot) ? 'Booked' : 'Unavailable'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hidden required input to enforce time selection */}
          <input
            type="text"
            name="preferredTime"
            value={formData.preferredTime}
            required
            readOnly
            className="sr-only"
            aria-hidden="true"
          />
        </div>

        {/* Type and Method Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
              Appointment Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#1A2B3C]"
            >
              <option value="follow-up">Follow-up</option>
              <option value="consultation">Consultation</option>
              <option value="review">Document Review</option>
              <option value="meeting">Strategy Meeting</option>
            </select>
          </div>

          {/* Meeting Method */}
          <div>
            <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
              Meeting Method
            </label>
            <div className="flex items-center gap-2 px-4 py-3 border-2 border-[#D1D5DB] rounded-lg bg-[#F8FAFC] text-[#1A2B3C]">
              <MapPin size={16} className="text-[#64748B]" />
              <span className="font-medium">In-Person</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-[#1A2B3C] mb-2 flex items-center gap-2">
            <FileText size={16} />
            Description
          </label>
          <textarea
            name="description"
            placeholder="Please provide any relevant details about the appointment..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Submit Request
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#1A2B3C] font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 pt-8 border-t-2 border-[#D4AF37]/20">
        <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] rounded-lg p-4">
          <p className="text-sm text-[#1A2B3C] font-semibold mb-2">📋 What to bring/prepare:</p>
          <ul className="text-sm text-[#64748B] space-y-1">
            <li>• Any relevant documents related to your case</li>
            <li>• Notes or questions you'd like to discuss</li>
            <li>• Updated timeline of events (if applicable)</li>
            <li>• Please arrive 5 minutes early at the office</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
