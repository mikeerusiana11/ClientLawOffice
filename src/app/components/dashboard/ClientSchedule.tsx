'use client';

import { ChevronDown, MoreVertical, Video, Phone, MapPin, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../lib/supabase';

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: 'Consultation' | 'Follow-up' | 'Review' | 'Meeting';
  title: string;
  attorney: string;
  method: 'Video' | 'Phone' | 'In-person';
  status: 'Requested' | 'Pending Staff Confirmation' | 'Confirmed' | 'Needs Reschedule' | 'Cancelled' | 'Completed';
  notes?: string;
  client_email?: string | null;
  client_name?: string | null;
}

interface ClientScheduleProps {
  onNewAppointment?: () => void;
}

const TYPE_OPTIONS = ['All', 'Consultation', 'Follow-up', 'Review', 'Meeting'];

export default function ClientSchedule({ onNewAppointment }: ClientScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [joinInfo, setJoinInfo] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleAvailableSlots, setRescheduleAvailableSlots] = useState<string[]>([]);
  const [rescheduleBookedSlots, setRescheduleBookedSlots] = useState<string[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!error && data) {
        setAppointments(data as Appointment[]);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    const supabase = createClient();
    // Soft-delete: update status to Cancelled so admin can still see it in History
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', id);
    if (!error) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
    setCancellingId(null);
    setOpenMenuId(null);
  };

  const localTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const checkRescheduleAvailability = async (date: string) => {
    setLoadingRescheduleSlots(true);
    setRescheduleTime('');
    try {
      const res = await fetch('/api/appointment/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      const data = await res.json() as { available_slots?: string[]; booked_slots?: string[] };
      setRescheduleAvailableSlots(data.available_slots || []);
      setRescheduleBookedSlots(data.booked_slots || []);
    } catch {
      setRescheduleAvailableSlots([]);
      setRescheduleBookedSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  const handleReschedule = async () => {
    if (!reschedulingAppt || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    setRescheduleError('');

    const res = await fetch('/api/appointment/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: reschedulingAppt.id,
        newDate: rescheduleDate,
        newTime: rescheduleTime,
      }),
    });

    setRescheduling(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      setRescheduleError(json.error || 'Failed to submit request. Please try again.');
      return;
    }

    // Update local state — new date/time saved, awaiting staff confirmation
    const apptId = reschedulingAppt.id;
    setAppointments(prev =>
      prev.map(a =>
        a.id === apptId
          ? { ...a, date: rescheduleDate, time: rescheduleTime, status: 'Pending Staff Confirmation' }
          : a
      )
    );
    setRescheduleSuccess(true);
    setTimeout(() => {
      setRescheduleSuccess(false);
      setReschedulingAppt(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleAvailableSlots([]);
      setRescheduleBookedSlots([]);
    }, 2500);
  };

  const getJoinMessage = (appt: Appointment) => {
    switch (appt.method) {
      case 'Video':
        return 'Your secure video meeting link was sent to your registered email address. Please check your inbox (and spam folder) and click the link at the scheduled time.';
      case 'Phone':
        return 'Your attorney will call you at your registered phone number at the scheduled time. Please ensure you are available and have a good signal.';
      case 'In-person':
        return 'Please visit our office at the scheduled time. Bring any relevant documents, IDs, or case files. If you need directions, please contact us in advance.';
      default:
        return 'Please contact our office for connection details.';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-700';
      case 'Pending Staff Confirmation': return 'bg-amber-100 text-amber-700';
      case 'Requested': return 'bg-blue-100 text-blue-700';
      case 'Needs Reschedule': return 'bg-orange-100 text-orange-700';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      case 'Completed': return 'bg-gray-100 text-gray-600';
      default: return '';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Video':
        return <Video size={16} />;
      case 'Phone':
        return <Phone size={16} />;
      case 'In-person':
        return <MapPin size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  const filtered = filterType === 'All'
    ? appointments
    : appointments.filter(a => a.type === filterType);

  return (
    <>
      {/* Join Meeting Info Modal — outside overflow-hidden container */}
      {joinInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                  {getMethodIcon(joinInfo.method)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A2B3C]">{joinInfo.title}</h4>
                  <p className="text-xs text-[#64748B]">{joinInfo.date} at {joinInfo.time}</p>
                </div>
              </div>
              <button onClick={() => setJoinInfo(null)} className="text-[#64748B] hover:text-[#1A2B3C]">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed">{getJoinMessage(joinInfo)}</p>
            {joinInfo.notes && (
              <div className="mt-4 p-3 bg-[#F8FAFC] rounded-lg">
                <p className="text-xs font-medium text-[#1A2B3C] mb-1">Attorney Notes</p>
                <p className="text-xs text-[#64748B]">{joinInfo.notes}</p>
              </div>
            )}
            <button
              onClick={() => setJoinInfo(null)}
              className="mt-5 w-full bg-[#D4AF37] text-[#1A2B3C] text-sm font-semibold py-2 rounded-lg hover:bg-[#C49D2E] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal — outside overflow-hidden container so it renders over the full screen */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {rescheduleSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl font-bold">✓</span>
                </div>
                <h4 className="font-semibold text-[#1A2B3C] text-lg mb-2">Request Submitted!</h4>
                <p className="text-sm text-[#64748B]">
                  Your reschedule request has been sent to our staff. We will confirm your new appointment shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-[#1A2B3C] text-lg">Request Reschedule</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">{reschedulingAppt.title}</p>
                  </div>
                  <button onClick={() => { setReschedulingAppt(null); setRescheduleDate(''); setRescheduleTime(''); setRescheduleError(''); }} className="text-[#64748B] hover:text-[#1A2B3C]">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4 text-sm text-orange-700">
                  Current: <strong>{reschedulingAppt.date}</strong> at <strong>{reschedulingAppt.time}</strong>
                </div>

                <p className="text-xs text-[#64748B] mb-4">Pick your preferred new date and time. Your request will be sent to our staff for confirmation.</p>

                <div className="space-y-4">
                  {/* Date picker */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A2B3C] mb-1">New Date</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      min={localTomorrow}
                      onChange={e => { setRescheduleDate(e.target.value); if (e.target.value) checkRescheduleAvailability(e.target.value); }}
                      className="w-full px-4 py-2.5 border-2 border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-sm"
                    />
                  </div>

                  {/* Time slots */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A2B3C] mb-2">New Time</label>
                    {!rescheduleDate ? (
                      <p className="text-center py-4 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-xs border-2 border-[#D1D5DB]">Select a date to view available times</p>
                    ) : loadingRescheduleSlots ? (
                      <p className="text-center py-4 text-[#6B7280] bg-[#F8FAFC] rounded-lg text-xs border-2 border-[#D1D5DB]">Loading slots...</p>
                    ) : (
                      <div className="space-y-2">
                        {rescheduleAvailableSlots.length === 0 && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">No available slots on this date. Please choose another date.</p>
                        )}
                        <div>
                          <p className="text-xs font-bold text-[#6B7280] uppercase mb-1.5">Morning</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['9:00 AM', '10:00 AM', '11:00 AM'].map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setRescheduleTime(slot)}
                                disabled={!rescheduleAvailableSlots.includes(slot)}
                                className={`py-2 px-1 rounded-lg font-medium text-xs transition-all leading-tight ${
                                  rescheduleTime === slot
                                    ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                                    : rescheduleAvailableSlots.includes(slot)
                                      ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                                      : rescheduleBookedSlots.includes(slot)
                                        ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                                        : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                                }`}
                              >
                                <span className="block">{slot}</span>
                                {!rescheduleAvailableSlots.includes(slot) && (
                                  <span className="block text-[9px] font-normal">{rescheduleBookedSlots.includes(slot) ? 'Booked' : 'Unavailable'}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#6B7280] uppercase mb-1.5">Afternoon</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setRescheduleTime(slot)}
                                disabled={!rescheduleAvailableSlots.includes(slot)}
                                className={`py-2 px-1 rounded-lg font-medium text-xs transition-all leading-tight ${
                                  rescheduleTime === slot
                                    ? 'bg-[#D4AF37] text-[#1A2B3C] ring-2 ring-[#D4AF37]'
                                    : rescheduleAvailableSlots.includes(slot)
                                      ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-[#D4AF37] hover:bg-[#FEF9F0]'
                                      : rescheduleBookedSlots.includes(slot)
                                        ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                                        : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                                }`}
                              >
                                <span className="block">{slot}</span>
                                {!rescheduleAvailableSlots.includes(slot) && (
                                  <span className="block text-[9px] font-normal">{rescheduleBookedSlots.includes(slot) ? 'Booked' : 'Unavailable'}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {rescheduleError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{rescheduleError}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReschedule}
                      disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                      className="flex-1 bg-[#D4AF37] hover:bg-[#C49D2E] text-[#1A2B3C] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rescheduling ? 'Submitting...' : 'Submit Reschedule Request'}
                    </button>
                    <button
                      onClick={() => { setReschedulingAppt(null); setRescheduleDate(''); setRescheduleTime(''); setRescheduleError(''); }}
                      className="flex-1 bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#1A2B3C] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    <div className="col-span-2 bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#1A2B3C]/10 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
            Your Appointments
          </h3>
          <p className="text-sm text-[#64748B]">
            {loading ? 'Loading...' : `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}${filterType !== 'All' ? ` · ${filterType}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Type filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className="flex items-center gap-2 text-[#1A2B3C] hover:text-[#D4AF37] transition-colors text-sm font-medium border border-[#1A2B3C]/20 rounded-lg px-3 py-1.5"
            >
              {filterType === 'All' ? 'All Types' : filterType}
              <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#1A2B3C]/10 rounded-xl shadow-lg z-10 overflow-hidden">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setFilterType(opt); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#F8FAFC] ${filterType === opt ? 'text-[#D4AF37] font-semibold' : 'text-[#1A2B3C]'}`}
                  >
                    {opt === 'All' ? 'All Types' : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onNewAppointment}
            className="bg-[#D4AF37] text-[#1A2B3C] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#C49D2E] transition-colors"
          >
            Schedule New Appointment
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#64748B]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading appointments...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
            <p className="text-sm font-medium">
              {appointments.length === 0 ? 'No appointments yet.' : `No ${filterType} appointments found.`}
            </p>
            {appointments.length === 0 && (
              <button
                onClick={onNewAppointment}
                className="mt-3 bg-[#D4AF37] text-[#1A2B3C] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#C49D2E] transition-colors"
              >
                Schedule your first appointment
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#1A2B3C]/10">
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[60px]">#</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[130px]">Date</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[100px]">Time</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[280px]">Appointment</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[170px]">Method</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[120px]">Status</th>
                <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appointment, idx) => (
                <tr key={appointment.id} className="border-b border-[#1A2B3C]/5 hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 text-[#64748B] font-mono text-sm">{String(idx + 1).padStart(3, '0')}</td>
                  <td className="px-6 py-4 text-[#1A2B3C] font-medium">{appointment.date}</td>
                  <td className="px-6 py-4 text-[#1A2B3C] font-medium">{appointment.time}</td>
                  <td className="px-6 py-4">
                    <p className="text-[#1A2B3C] font-medium">{appointment.title}</p>
                    <p className="text-xs text-[#64748B] mt-1">{appointment.type} · {appointment.attorney}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#64748B]">
                      {getMethodIcon(appointment.method)}
                      {appointment.method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {appointment.status === 'Confirmed' ? (
                        <button
                          onClick={() => setJoinInfo(appointment)}
                          className="bg-[#D4AF37] text-[#1A2B3C] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#C49D2E] transition-colors"
                        >
                          Join Meeting
                        </button>
                      ) : appointment.status === 'Needs Reschedule' ? (
                        <button
                          onClick={() => { setReschedulingAppt(appointment); setRescheduleError(''); }}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          Reschedule
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-white border border-[#1A2B3C]/30 text-[#64748B] text-xs font-semibold px-4 py-2 rounded-lg cursor-default"
                        >
                          Awaiting Staff
                        </button>
                      )}
                      {/* ⋮ menu */}
                      <div ref={menuRef} className="relative">
                        <button
                          onClick={() => setOpenMenuId(prev => prev === appointment.id ? null : appointment.id)}
                          className="text-[#64748B] hover:text-[#1A2B3C] transition-colors p-2 rounded-lg hover:bg-[#F8FAFC]"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === appointment.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-[#1A2B3C]/10 rounded-xl shadow-lg z-10 overflow-hidden">
                            <button
                              onClick={() => { setJoinInfo(appointment); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-[#1A2B3C] hover:bg-[#F8FAFC] transition-colors"
                            >
                              View Details
                            </button>
                            {appointment.status === 'Needs Reschedule' && (
                              <button
                                onClick={() => { setReschedulingAppt(appointment); setRescheduleError(''); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                Reschedule
                              </button>
                            )}
                            {(appointment.status === 'Requested' || appointment.status === 'Needs Reschedule' || appointment.status === 'Pending Staff Confirmation') && (
                              <button
                                onClick={() => handleCancel(appointment.id)}
                                disabled={cancellingId === appointment.id}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel Appointment'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </>
  );
}
