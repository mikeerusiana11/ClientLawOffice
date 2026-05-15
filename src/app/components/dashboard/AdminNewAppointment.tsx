                                                                                                  'use client';

import { Calendar, Clock, MapPin, FileText, Check, User } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface AppointmentForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'consultation' | 'follow-up' | 'review' | 'meeting';
  method: 'in-person';
  title: string;
  status: 'confirmed' | 'pending';
  description: string;
}

interface AdminNewAppointmentProps {
  onSubmit?: (data: AppointmentForm) => void;
  onCancel?: () => void;
}


export default function AdminNewAppointment({ onSubmit, onCancel }: AdminNewAppointmentProps) {
  const [formData, setFormData] = useState<AppointmentForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    type: 'follow-up',
    method: 'in-person',
    title: '',
    status: 'confirmed',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);


  const formatDisplayDate = (d: string) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      if (formData.appointmentTime && !slots.includes(formData.appointmentTime)) {
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
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
    if (name === 'appointmentDate' && value) {
      checkAvailability(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const typeMap: Record<string, string> = {
      consultation: 'Consultation', 'follow-up': 'Follow-up',
      review: 'Review', meeting: 'Meeting',
    };
    const methodMap: Record<string, string> = {
      video: 'Video', phone: 'Phone', 'in-person': 'In-person',
    };
    const statusMap: Record<string, string> = {
      confirmed: 'Confirmed', pending: 'Pending Staff Confirmation',
    };

    const res = await fetch('/api/admin/appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        title: formData.title,
        // Store date as ISO YYYY-MM-DD — display formatting happens at render time
        date: formData.appointmentDate,
        // Time is already in display format (9:00 AM) from TIME_SLOTS
        time: formData.appointmentTime,
        type: typeMap[formData.type],
        method: methodMap[formData.method],
        status: statusMap[formData.status],
        notes: formData.description,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Failed to create appointment. Please try again.');
      return;
    }

    // Send confirmation email — use a placeholder ID since admin/appointment API doesn't return the ID
    try {
      await fetch('/api/admin/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: `admin-${Date.now()}`,
          clientEmail: formData.clientEmail,
          clientName: formData.clientName,
          date: formatDisplayDate(formData.appointmentDate),
          time: formData.appointmentTime,
          title: formData.title,
          type: typeMap[formData.type],
          method: methodMap[formData.method],
          notes: formData.description,
          attorney: 'Abigail Miller',
        }),
      });
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
    }

    setSubmitted(true);
    if (onSubmit) onSubmit(formData);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        clientName: '', clientEmail: '', clientPhone: '',
        appointmentDate: '', appointmentTime: '',
        type: 'follow-up', method: 'in-person',
        title: '', status: 'confirmed', description: '',
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
            Create New Appointment
          </h2>
        </div>
        <p className="text-sm text-[#64748B] ml-13">
          Schedule a new appointment with a client
        </p>
      </div>

      {submitted && (
        <div className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">✓</div>
            <h3 className="text-lg font-bold text-green-700">Appointment Created!</h3>
          </div>
          
          <p className="text-sm text-green-700 mb-4">
            The appointment has been scheduled and an invitation has been sent to the client.
          </p>

          <div className="bg-white rounded-lg p-4 space-y-3 border border-green-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-[#64748B]">SERVICE TYPE</p>
                <p className="text-sm font-bold text-[#1A2B3C]">
                  {(() => {
                    const types: Record<string, string> = {
                      consultation: 'Consultation',
                      'follow-up': 'Follow-up',
                      review: 'Document Review',
                      meeting: 'Strategy Meeting',
                    };
                    return types[formData.type] || formData.type;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B]">METHOD</p>
                <p className="text-sm font-bold text-[#1A2B3C]">In-Person</p>
              </div>
            </div>

            <div className="border-t border-green-200 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">DATE</p>
                  <p className="text-sm font-bold text-[#1A2B3C]">
                    {formData.appointmentDate
                      ? new Date(formData.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">TIME</p>
                  <p className="text-sm font-bold text-[#1A2B3C]">{formData.appointmentTime || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-3">
              <p className="text-xs font-semibold text-[#64748B] mb-2">CLIENT INFORMATION</p>
              <div className="space-y-1">
                <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Name:</span> {formData.clientName}</p>
                <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Email:</span> {formData.clientEmail}</p>
                <p className="text-sm text-[#1A2B3C]"><span className="font-semibold">Phone:</span> {formData.clientPhone}</p>
              </div>
            </div>

            {formData.title && (
              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-semibold text-[#64748B] mb-2">TITLE</p>
                <p className="text-sm text-[#1A2B3C]">{formData.title}</p>
              </div>
            )}

            {formData.description && (
              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-semibold text-[#64748B] mb-2">NOTES</p>
                <p className="text-sm text-[#1A2B3C]">{formData.description}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-green-700 mt-4 text-center">
            📧 Confirmation email sent to <strong>{formData.clientEmail}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Information Section */}
        <div className="bg-[#F8FAFC] rounded-xl p-6 border-2 border-[#D4AF37]/20">
          <h3 className="text-lg font-bold text-[#1A2B3C] mb-4 flex items-center gap-2">
            <User size={20} />
            Client Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                placeholder="Enter client name"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  placeholder="client@email.com"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  placeholder="(555) 000-0000"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Details Section */}
        <div className="bg-[#F8FAFC] rounded-xl p-6 border-2 border-[#D4AF37]/20">
          <h3 className="text-lg font-bold text-[#1A2B3C] mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Appointment Details
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                Appointment Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Contract Review, Initial Consultation"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Date *
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                  min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
                  className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>

            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-3">
                <Clock size={16} className="inline mr-2" />
                Time *
              </label>
              {!formData.appointmentDate ? (
                <div className="text-center py-4 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
                  Select a date above to view available times
                </div>
              ) : loadingAvailability ? (
                <div className="text-center py-4 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
                  Loading available slots...
                </div>
                      ) : (
                <div className="space-y-3">
                  {availableSlots.length === 0 && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">All slots on this date are unavailable.</p>
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">🌅 Morning</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['9:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, appointmentTime: slot }))}
                          disabled={!availableSlots.includes(slot)}
                          className={`py-2 px-2 rounded-lg font-medium text-sm transition-all leading-tight ${
                            formData.appointmentTime === slot
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
                  <div>
                    <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">☀️ Afternoon</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, appointmentTime: slot }))}
                          disabled={!availableSlots.includes(slot)}
                          className={`py-2 px-2 rounded-lg font-medium text-sm transition-all leading-tight ${
                            formData.appointmentTime === slot
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
              {/* Hidden input enforces required validation */}
              <input type="text" name="appointmentTime" value={formData.appointmentTime} required readOnly className="sr-only" aria-hidden="true" />
            </div>

            {/* Type and Method Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-[#1A2B3C]"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="review">Document Review</option>
                  <option value="meeting">Strategy Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  Method
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-[#D1D5DB] rounded-lg bg-[#F8FAFC] text-[#1A2B3C]">
                  <MapPin size={16} className="text-[#64748B]" />
                  <span className="font-medium">In-Person</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                Status *
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'pending', label: 'Pending' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={formData.status === value}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-[#1A2B3C]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className="block text-sm font-semibold text-[#1A2B3C] mb-2 flex items-center gap-2">
            <FileText size={16} />
            Notes/Description
          </label>
          <textarea
            name="description"
            placeholder="Add any notes or special details about this appointment..."
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
            disabled={saving}
            className="flex-1 bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            {saving ? 'Creating...' : 'Create Appointment'}
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
    </div>
  );
}
