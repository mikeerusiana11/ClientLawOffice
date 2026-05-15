'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, User, Mail, Scale } from 'lucide-react';

interface AppointmentInfo {
  id: string;
  clientName: string | null;
  clientEmail: string | null;
  date: string;
  time: string;
  title: string | null;
  type: string | null;
  status: string;
  attorney: string | null;
}

const MORNING = ['9:00 AM', '10:00 AM', '11:00 AM'];
const AFTERNOON = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function ReschedulePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  const [appt, setAppt] = useState<AppointmentInfo | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const localTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (!appointmentId) return;
    fetch(`/api/appointment/info?id=${appointmentId}`)
      .then(r => r.json())
      .then((data: AppointmentInfo & { error?: string }) => {
        if (data.error) { setNotFound(true); return; }
        const canReschedule = ['Needs Reschedule', 'Confirmed', 'Rescheduled'].includes(data.status);
        if (!canReschedule) { setAlreadyDone(true); setAppt(data); return; }
        setAppt(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingAppt(false));
  }, [appointmentId]);

  const checkAvailability = async (date: string) => {
    setLoadingSlots(true);
    setNewTime('');
    try {
      const res = await fetch('/api/appointment/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json() as { available_slots?: string[]; booked_slots?: string[] };
      setAvailableSlots(data.available_slots || []);
      setBookedSlots(data.booked_slots || []);
    } catch {
      setAvailableSlots([]);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!newDate || !newTime) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/appointment/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, newDate, newTime }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        setError(json.error || 'Failed to submit. Please try again.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const slotButton = (slot: string) => (
    <button
      key={slot}
      type="button"
      onClick={() => setNewTime(slot)}
      disabled={!availableSlots.includes(slot)}
      className={`py-2 px-2 rounded-lg font-medium text-sm transition-all leading-tight ${
        newTime === slot
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
  );

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-[#1A2B3C] py-4 px-6 flex items-center gap-3">
        <Scale size={24} className="text-[#D4AF37]" />
        <span className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display' }}>
          Miller Law Office
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="bg-white rounded-2xl border-2 border-[#D4AF37]/30 shadow-lg w-full max-w-lg p-8">

          {/* Loading */}
          {loadingAppt && (
            <div className="text-center py-12 text-[#64748B]">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm">Loading appointment details...</p>
            </div>
          )}

          {/* Not found */}
          {!loadingAppt && notFound && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-[#1A2B3C] mb-2">Appointment Not Found</h2>
              <p className="text-sm text-[#64748B]">This reschedule link is invalid or has expired. Please contact our office directly.</p>
              <a href="mailto:attyabigailtmiller@gmail.com" className="mt-6 inline-block bg-[#D4AF37] text-[#1A2B3C] font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#C49D2E] transition-colors">
                Contact Us
              </a>
            </div>
          )}

          {/* Already processed */}
          {!loadingAppt && alreadyDone && appt && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-[#1A2B3C] mb-2">No Action Needed</h2>
              <p className="text-sm text-[#64748B]">
                This appointment is currently <strong>{appt.status}</strong> and does not require rescheduling.
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-3xl font-bold">✓</span>
              </div>
              <h2 className="text-xl font-bold text-[#1A2B3C] mb-2">Request Submitted!</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Your reschedule request for <strong>{newDate && formatDate(newDate)}</strong> at <strong>{newTime}</strong> has been sent to our staff. We will confirm your new appointment shortly.
              </p>
              <p className="text-xs text-[#64748B] mt-4">
                Questions? Email us at{' '}
                <a href="mailto:attyabigailtmiller@gmail.com" className="text-[#D4AF37] hover:underline">attyabigailtmiller@gmail.com</a>
              </p>
            </div>
          )}

          {/* Reschedule form */}
          {!loadingAppt && !notFound && !alreadyDone && !success && appt && (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center text-[#D4AF37]">
                    <Calendar size={20} />
                  </div>
                  <h1 className="text-2xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                    {appt.status === 'Needs Reschedule' ? 'Reschedule Appointment' : 'Request a Different Time'}
                  </h1>
                </div>
                <p className="text-sm text-[#64748B] ml-13">
                  {appt.status === 'Needs Reschedule'
                    ? 'Your original slot is no longer available. Please select a new date and time.'
                    : 'If your scheduled time no longer works, select a new date and time below.'}
                </p>
              </div>

              {/* Current appointment info */}
              <div className={`rounded-xl p-4 mb-6 space-y-2 ${appt.status === 'Needs Reschedule' ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${appt.status === 'Needs Reschedule' ? 'text-orange-600' : 'text-blue-600'}`}>Current Appointment</p>
                {appt.title && <p className="text-sm font-semibold text-[#1A2B3C]">{appt.title}</p>}
                <p className={`text-sm ${appt.status === 'Needs Reschedule' ? 'text-orange-700' : 'text-blue-700'}`}>
                  <span className="font-medium">{formatDate(appt.date)}</span> at <span className="font-medium">{appt.time}</span>
                </p>
              </div>

              {/* Client info — pre-filled, read-only */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
                    <User size={12} className="inline mr-1" />Name
                  </label>
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg text-sm text-[#1A2B3C] font-medium">
                    {appt.clientName || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
                    <Mail size={12} className="inline mr-1" />Email
                  </label>
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg text-sm text-[#1A2B3C] font-medium truncate">
                    {appt.clientEmail || '—'}
                  </div>
                </div>
              </div>

              {/* New Date */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">
                  <Calendar size={15} className="inline mr-1" />New Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={localTomorrow}
                  onChange={e => { setNewDate(e.target.value); if (e.target.value) checkAvailability(e.target.value); }}
                  className="w-full px-4 py-3 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-sm"
                />
              </div>

              {/* Time slots */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#1A2B3C] mb-3">
                  <Clock size={15} className="inline mr-1" />New Time *
                </label>

                {!newDate ? (
                  <div className="text-center py-5 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
                    Select a date above to view available times
                  </div>
                ) : loadingSlots ? (
                  <div className="text-center py-5 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-sm border-2 border-[#D1D5DB]">
                    Loading available slots...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableSlots.length === 0 && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        No available slots on this date. Please choose another date.
                      </p>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">🌅 Morning</p>
                      <div className="grid grid-cols-3 gap-2">
                        {MORNING.map(slotButton)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#6B7280] uppercase mb-2">☀️ Afternoon</p>
                      <div className="grid grid-cols-4 gap-2">
                        {AFTERNOON.map(slotButton)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!newDate || !newTime || submitting}
                className="w-full bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Reschedule Request'}
              </button>

              <p className="text-xs text-center text-[#64748B] mt-4">
                Your request will be reviewed and confirmed by our staff. Questions?{' '}
                <a href="mailto:attyabigailtmiller@gmail.com" className="text-[#D4AF37] hover:underline">Contact us</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
