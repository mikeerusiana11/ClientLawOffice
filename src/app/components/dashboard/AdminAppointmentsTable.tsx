'use client';

import { Loader2, RefreshCw, Eye, Check, X, Calendar, Clock, User, Mail, FileText, Video, Phone, MapPin, ChevronDown, Inbox, CalendarCheck, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';

interface Appointment {
  id: string;
  date: string;
  time: string;
  title: string;
  type: string;
  method: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  attorney?: string;
  status: 'Requested' | 'Pending Staff Confirmation' | 'Confirmed' | 'Cancelled' | 'Rescheduled' | 'Needs Reschedule' | 'Completed';
  notes: string;
  created_at: string;
  user_id?: string;
}

const MORNING_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM'];
const AFTERNOON_SLOTS = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const normalizeDateForComparison = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return dateStr.toLowerCase();
};

function ReviewModal({
  apt,
  conflictWith,
  updating,
  onConfirm,
  onCancel,
  onComplete,
  onRestore,
  onRestoreConfirmed,
  onReschedule,
  onClose,
}: {
  apt: Appointment;
  conflictWith: Appointment | null;
  updating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onRestore: () => void;
  onRestoreConfirmed: () => void;
  onReschedule: (newDate: string, newTime: string, note: string) => void;
  onClose: () => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

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

  const methodIcon = apt.method === 'Video'
    ? <Video size={15} />
    : apt.method === 'Phone'
    ? <Phone size={15} />
    : <MapPin size={15} />;

  const statusColor: Record<string, string> = {
    Requested: 'bg-blue-100 text-blue-700',
    'Pending Staff Confirmation': 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Rescheduled: 'bg-purple-100 text-purple-700',
    'Needs Reschedule': 'bg-orange-100 text-orange-700',
    Completed: 'bg-emerald-100 text-emerald-700',
  };

  const isRequested = apt.status === 'Requested' || apt.status === 'Pending Staff Confirmation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border-2 border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A2B3C]/10 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              Appointment Review
            </h3>
            <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-medium ${statusColor[apt.status] ?? ''}`}>
              {apt.status}
            </span>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1A2B3C] transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Conflict Warning */}
        {conflictWith && isRequested && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-700 text-sm">Scheduling Conflict Detected</p>
                <p className="text-sm text-red-600 mt-1">
                  <span className="font-semibold">{conflictWith.client_name}</span> already has a{' '}
                  <span className="font-semibold">{conflictWith.status.toLowerCase()}</span> appointment on{' '}
                  <span className="font-semibold">{formatDate(conflictWith.date)}</span> at{' '}
                  <span className="font-semibold">{conflictWith.time}</span>.
                </p>
                <p className="text-xs text-red-500 mt-1">
                  You can confirm anyway, reschedule this client to a different slot, or cancel the request.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmed Badge */}
        {apt.status === 'Confirmed' && (
          <div className="px-6 pt-6 pb-2">
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                <h4 className="font-bold text-green-700">Appointment Confirmed</h4>
              </div>
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">DATE</p>
                    <p className="font-bold text-[#1A2B3C]">{formatDate(apt.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">TIME</p>
                    <p className="font-bold text-[#1A2B3C]">{apt.time}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">TYPE</p>
                  <p className="font-bold text-[#1A2B3C]">{apt.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B]">METHOD</p>
                  <p className="font-bold text-[#1A2B3C]">{apt.method}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rescheduled Badge */}
        {apt.status === 'Rescheduled' && (
          <div className="px-6 pt-6 pb-2">
            <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">↻</div>
                <h4 className="font-bold text-purple-700">Appointment Rescheduled</h4>
              </div>
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">NEW DATE</p>
                    <p className="font-bold text-[#1A2B3C]">{formatDate(apt.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">NEW TIME</p>
                    <p className="font-bold text-[#1A2B3C]">{apt.time}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">Client has been notified of the new schedule.</p>
            </div>
          </div>
        )}

        {/* Needs Reschedule Badge */}
        {apt.status === 'Needs Reschedule' && (
          <div className="px-6 pt-6 pb-2">
            <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">!</div>
                <h4 className="font-bold text-orange-700">Awaiting Client Reschedule</h4>
              </div>
              <p className="text-sm text-orange-700">A reschedule notice was sent to the client. They will select a new date and time using the link in the email. You may also reschedule them manually below.</p>
            </div>
          </div>
        )}

        {/* Completed Badge */}
        {apt.status === 'Completed' && (
          <div className="px-6 pt-6 pb-2">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                <h4 className="font-bold text-emerald-700">Appointment Completed</h4>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className={`space-y-4 ${apt.status === 'Confirmed' || apt.status === 'Rescheduled' ? 'px-6 py-4' : 'p-6'}`}>
          {/* Client */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide">Client</p>
            <div className="flex items-center gap-2 text-[#1A2B3C]">
              <User size={15} className="text-[#64748B]" />
              <span className="font-semibold">{apt.client_name || '—'}</span>
            </div>
            {apt.client_email && (
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <Mail size={14} />
                <span>{apt.client_email}</span>
              </div>
            )}
            {apt.client_phone && (
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <Phone size={14} />
                <span>{apt.client_phone}</span>
              </div>
            )}
          </div>

          {/* Appointment Info */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide">Appointment</p>
            <p className="font-semibold text-[#1A2B3C]">{apt.title}</p>
            <p className="text-sm text-[#64748B]">{apt.type}{apt.attorney ? ` · ${apt.attorney}` : ''}</p>
            <div className="flex items-center gap-4 text-sm text-[#1A2B3C] mt-1">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#64748B]" />{apt.date ? formatDate(apt.date) : '—'}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#64748B]" />{apt.time || '—'}</span>
              <span className="flex items-center gap-1.5 text-[#64748B]">{methodIcon}{apt.method}</span>
            </div>
          </div>

          {/* Notes */}
          {apt.notes && (
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-[#1A2B3C] leading-relaxed flex items-start gap-2">
                <FileText size={14} className="text-[#64748B] mt-0.5 shrink-0" />
                {apt.notes}
              </p>
            </div>
          )}

          {/* Reschedule Panel */}
          {showReschedule && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-4">
              <p className="text-sm font-bold text-amber-800">Reschedule Appointment</p>

              {/* Date picker */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                  <Calendar size={11} className="inline mr-1" />New Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => { setNewDate(e.target.value); if (e.target.value) checkAvailability(e.target.value); }}
                  min={getLocalDateStr()}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] bg-white"
                />
              </div>

              {/* Time slot picker */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-2">
                  <Clock size={11} className="inline mr-1" />New Time *
                </label>

                {!newDate ? (
                  <div className="text-center py-4 text-[#6B7280] bg-white rounded-lg text-xs border border-[#D1D5DB]">
                    Select a date above to see available slots
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[#6B7280] bg-white rounded-lg text-xs border border-[#D1D5DB]">
                    <Loader2 size={13} className="animate-spin" /> Checking availability…
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableSlots.length === 0 && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        No available slots on this date. Please choose another date.
                      </p>
                    )}
                    {/* Morning */}
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">Morning</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MORNING_SLOTS.map(slot => {
                          const isAvailable = availableSlots.includes(slot);
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = newTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => isAvailable && setNewTime(slot)}
                              disabled={!isAvailable}
                              className={`py-2 px-1 rounded-lg font-medium text-xs transition-all leading-tight ${
                                isSelected
                                  ? 'bg-amber-500 text-white ring-2 ring-amber-400'
                                  : isAvailable
                                    ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-amber-400 hover:bg-amber-50'
                                    : isBooked
                                      ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                                      : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                              }`}
                            >
                              <span className="block">{slot}</span>
                              {!isAvailable && (
                                <span className="block text-[9px] font-normal">
                                  {isBooked ? 'Booked' : 'Unavailable'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Afternoon */}
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide mb-1.5">Afternoon</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {AFTERNOON_SLOTS.map(slot => {
                          const isAvailable = availableSlots.includes(slot);
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = newTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => isAvailable && setNewTime(slot)}
                              disabled={!isAvailable}
                              className={`py-2 px-1 rounded-lg font-medium text-xs transition-all leading-tight ${
                                isSelected
                                  ? 'bg-amber-500 text-white ring-2 ring-amber-400'
                                  : isAvailable
                                    ? 'bg-white border-2 border-[#D1D5DB] text-[#1A2B3C] hover:border-amber-400 hover:bg-amber-50'
                                    : isBooked
                                      ? 'bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-100'
                                      : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-2 border-[#E5E7EB]'
                              }`}
                            >
                              <span className="block">{slot}</span>
                              {!isAvailable && (
                                <span className="block text-[9px] font-normal">
                                  {isBooked ? 'Booked' : 'Unavailable'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message to client */}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Message to Client (Optional)</label>
                <textarea
                  rows={2}
                  value={rescheduleNote}
                  onChange={e => setRescheduleNote(e.target.value)}
                  placeholder="e.g., Your appointment has been moved due to a scheduling conflict."
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm resize-none focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { if (newDate && newTime) onReschedule(newDate, newTime, rescheduleNote); }}
                  disabled={!newDate || !newTime || updating}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                  Save & Notify Client
                </button>
                <button
                  onClick={() => { setShowReschedule(false); setNewDate(''); setNewTime(''); setAvailableSlots([]); setBookedSlots([]); }}
                  className="px-4 bg-white border border-[#D1D5DB] text-[#64748B] font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!showReschedule && (
          <div className="px-6 pb-6 flex gap-3 flex-wrap">
            {/* Cancel confirmation prompt */}
            {confirmCancel && (
              <div className="w-full bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-red-700">Cancel this appointment?</p>
                <p className="text-xs text-red-600">This will notify the client and move the appointment to Archive. This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setConfirmCancel(false); onCancel(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <X size={15} /> Yes, Cancel Appointment
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 bg-white border border-[#D1D5DB] text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    No, Keep It
                  </button>
                </div>
              </div>
            )}
            {!confirmCancel && (updating ? (
              <div className="flex items-center gap-2 text-[#64748B] text-sm py-2">
                <Loader2 size={16} className="animate-spin" /> Processing...
              </div>
            ) : apt.status === 'Cancelled' || apt.status === 'Completed' ? (
              <>
                {apt.status === 'Cancelled' && (
                  <div className="w-full space-y-2">
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Restore as:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={onRestoreConfirmed}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-100 transition-colors text-sm border border-green-200"
                      >
                        <Check size={15} /> Confirmed
                      </button>
                      <button
                        onClick={onRestore}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      >
                        <RefreshCw size={15} /> Pending Review
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={onClose} className="w-full bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                  Close
                </button>
              </>
            ) : apt.status === 'Needs Reschedule' ? (
              <div className="flex gap-2 w-full flex-wrap">
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 font-semibold py-2.5 rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200"
                >
                  <Calendar size={15} /> Reschedule Manually
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <X size={15} /> Cancel
                </button>
                <button onClick={onClose} className="w-full bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                  Close
                </button>
              </div>
            ) : apt.status === 'Confirmed' || apt.status === 'Rescheduled' ? (
              <div className="flex gap-2 w-full flex-wrap">
                <button
                  onClick={onComplete}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-2.5 rounded-xl hover:bg-emerald-100 transition-colors text-sm border border-emerald-200"
                >
                  <Check size={15} /> Mark as Completed
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <X size={15} /> Cancel
                </button>
                <button onClick={onClose} className="w-full bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                  Close
                </button>
              </div>
            ) : conflictWith ? (
              <>
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm"
                >
                  <Calendar size={15} /> Reschedule
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <X size={15} /> Cancel Request
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onConfirm}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-[#1A2B3C] font-bold py-2.5 rounded-xl hover:bg-[#C49D2E] transition-colors text-sm"
                >
                  <Check size={15} /> Confirm &amp; Send Email
                </button>
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 font-semibold py-2.5 rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200"
                >
                  <Calendar size={15} /> Reschedule
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <X size={15} /> Cancel
                </button>
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAppointmentsTable({ onStatusChange, focusSection = 'all' }: { onStatusChange?: () => void; focusSection?: 'all' | 'requests' | 'confirmed' | 'cancelled' } = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [reviewApt, setReviewApt] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const supabase = useMemo(() => createClient(), []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const rows = data as Appointment[];
      const unnamed = rows.filter(a => !a.client_name && a.user_id);
      if (unnamed.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/user-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ userIds: unnamed.map(a => a.user_id) }),
        });
        if (res.ok) {
          const { names: nameMap } = await res.json() as { names: Record<string, string> };
          unnamed.forEach(a => { if (a.user_id && nameMap[a.user_id]) a.client_name = nameMap[a.user_id]; });
        }
      }
      setAppointments(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    const channel = supabase
      .channel('appointments-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // IDs of Requested appointments that conflict with a Confirmed/Rescheduled slot
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    const locked = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Rescheduled');
    for (const apt of appointments) {
      if (apt.status !== 'Requested' && apt.status !== 'Pending Staff Confirmation') continue;
      const aptDate = normalizeDateForComparison(apt.date);
      if (locked.some(o => o.id !== apt.id && normalizeDateForComparison(o.date) === aptDate && o.time === apt.time)) {
        ids.add(apt.id);
      }
    }
    return ids;
  }, [appointments]);

  const findConflict = (apt: Appointment): Appointment | null => {
    if (apt.status !== 'Requested' && apt.status !== 'Pending Staff Confirmation') return null;
    const aptDate = normalizeDateForComparison(apt.date);
    return appointments.find(o =>
      o.id !== apt.id &&
      (o.status === 'Confirmed' || o.status === 'Rescheduled') &&
      normalizeDateForComparison(o.date) === aptDate &&
      o.time === apt.time
    ) ?? null;
  };

  const updateStatus = async (id: string, newStatus: Appointment['status'], aptSnapshot?: Appointment) => {
    setUpdating(id);
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      setReviewApt(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);

      if (newStatus === 'Confirmed' && aptSnapshot) {
        showToast('Appointment confirmed.');
        try {
          const res = await fetch('/api/admin/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointmentId: aptSnapshot.id,
              clientEmail: aptSnapshot.client_email,
              clientName: aptSnapshot.client_name,
              date: aptSnapshot.date,
              time: aptSnapshot.time,
              title: aptSnapshot.title,
              type: aptSnapshot.type,
              method: aptSnapshot.method,
              notes: aptSnapshot.notes,
              attorney: aptSnapshot.attorney || 'Abigail Miller',
            }),
          });
          if (res.ok) {
            showToast('Confirmation email sent to client.');
          } else {
            const body = await res.json().catch(() => ({}));
            showToast(`Email failed: ${body?.details?.message ?? body?.error ?? 'Unknown error'}`, 'error');
          }
        } catch (err) {
          showToast('Email could not be sent. Check server logs.', 'error');
        }
      } else if (newStatus === 'Completed') {
        showToast('Appointment marked as completed.');
      } else if (newStatus === 'Cancelled') {
        showToast('Appointment cancelled.');
      } else if (newStatus === 'Requested') {
        showToast('Appointment restored to pending review.');
      } else if (newStatus === 'Confirmed' && !aptSnapshot) {
        showToast('Appointment restored to confirmed.');
      }

      onStatusChange?.();
    }
    setUpdating(null);
  };

  const rescheduleAppointment = async (id: string, newDate: string, newTime: string, note: string, aptSnapshot: Appointment) => {
    setUpdating(id);

    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id, client_name')
      .eq('date', newDate)
      .eq('time', newTime)
      .in('status', ['Confirmed', 'Rescheduled'])
      .neq('id', id);

    if (conflicts && conflicts.length > 0) {
      const takenBy = (conflicts[0] as { client_name?: string }).client_name || 'another client';
      showToast(`That slot is already booked by ${takenBy}. Choose a different date or time.`, 'error');
      setUpdating(null);
      return;
    }

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'Rescheduled', date: newDate, time: newTime })
      .eq('id', id);

    if (!error) {
      setAppointments(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'Rescheduled', date: newDate, time: newTime } : a
      ));
      setReviewApt(null);
      showToast('Appointment rescheduled.');

      try {
        const res = await fetch('/api/admin/send-reschedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: id,
            clientEmail: aptSnapshot.client_email,
            clientName: aptSnapshot.client_name,
            originalDate: aptSnapshot.date,
            originalTime: aptSnapshot.time,
            newDate,
            newTime,
            title: aptSnapshot.title,
            type: aptSnapshot.type,
            method: aptSnapshot.method,
            attorney: aptSnapshot.attorney || 'Abigail Miller',
            note,
          }),
        });
        if (res.ok) {
          showToast('Reschedule email sent to client.');
        } else {
          const body = await res.json().catch(() => ({}));
          showToast(`Email failed: ${body?.details?.message ?? body?.error ?? 'Unknown error'}`, 'error');
        }
      } catch (err) {
        showToast('Email could not be sent. Check server logs.', 'error');
      }

      onStatusChange?.();
    }
    setUpdating(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Requested': return 'bg-blue-100 text-blue-700';
      case 'Pending Staff Confirmation': return 'bg-amber-100 text-amber-700';
      case 'Confirmed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      case 'Rescheduled': return 'bg-purple-100 text-purple-700';
      case 'Needs Reschedule': return 'bg-orange-100 text-orange-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      default: return '';
    }
  };

  const matchesSearch = (a: Appointment) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.client_name || '').toLowerCase().includes(q) ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.client_email || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q)
    );
  };

  const newRequests = appointments
    .filter(a => a.status === 'Requested' && matchesSearch(a))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const rescheduleRequests = appointments
    .filter(a => a.status === 'Pending Staff Confirmation' && matchesSearch(a))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const needsRescheduleList = appointments
    .filter(a => a.status === 'Needs Reschedule' && matchesSearch(a))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const totalPending = newRequests.length + rescheduleRequests.length + needsRescheduleList.length;

  const todayISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const confirmed = appointments
    .filter(a => (a.status === 'Confirmed' || a.status === 'Rescheduled') && a.date >= todayISO && matchesSearch(a))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cancelled = appointments
    .filter(a => (a.status === 'Cancelled' || a.status === 'Completed') && matchesSearch(a))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const TableHead = () => (
    <thead>
      <tr className="bg-[#F8FAFC] border-b border-[#1A2B3C]/10">
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">#</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Date</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Time</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Client</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Appointment</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Method</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Status</th>
        <th className="px-6 py-3 text-xs uppercase text-[#64748B] font-medium tracking-wide text-left">Action</th>
      </tr>
    </thead>
  );

  const renderRows = (list: Appointment[]) => list.map((apt, idx) => (
    <tr key={apt.id} className={`border-b border-[#1A2B3C]/5 hover:bg-[#F8FAFC] transition-colors ${conflictIds.has(apt.id) ? 'bg-red-50/40' : ''}`}>
      <td className="px-6 py-4 text-[#64748B] font-mono text-xs">{String(idx + 1).padStart(3, '0')}</td>
      <td className="px-6 py-4 text-[#1A2B3C] font-medium whitespace-nowrap">{formatDate(apt.date)}</td>
      <td className="px-6 py-4 text-[#1A2B3C] font-medium whitespace-nowrap">{apt.time}</td>
      <td className="px-6 py-4">
        <span className="text-[#1A2B3C] font-medium">{apt.client_name || 'Client'}</span>
      </td>
      <td className="px-6 py-4">
        <p className="text-[#1A2B3C] font-medium">{apt.title}</p>
        <p className="text-xs text-[#64748B] mt-0.5">{apt.type}</p>
      </td>
      <td className="px-6 py-4 text-[#64748B]">{apt.method}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(apt.status)}`}>
            {apt.status}
          </span>
          {conflictIds.has(apt.id) && (
            <span title="Scheduling conflict detected"><AlertTriangle size={14} className="text-red-500 shrink-0" /></span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => setReviewApt(apt)}
          className="flex items-center gap-1.5 bg-[#1A2B3C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#243548] transition-colors"
        >
          <Eye size={13} /> Review
        </button>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-6">
      {reviewApt && (
        <ReviewModal
          apt={reviewApt}
          conflictWith={findConflict(reviewApt)}
          updating={updating === reviewApt.id}
          onConfirm={() => updateStatus(reviewApt.id, 'Confirmed', reviewApt)}
          onCancel={() => updateStatus(reviewApt.id, 'Cancelled', reviewApt)}
          onComplete={() => updateStatus(reviewApt.id, 'Completed', reviewApt)}
          onRestore={() => updateStatus(reviewApt.id, 'Requested', reviewApt)}
          onRestoreConfirmed={() => updateStatus(reviewApt.id, 'Confirmed', reviewApt)}
          onReschedule={(newDate, newTime, note) => rescheduleAppointment(reviewApt.id, newDate, newTime, note, reviewApt)}
          onClose={() => setReviewApt(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-[#1A2B3C] text-white' : 'bg-red-600 text-white'
        }`}>
          <CheckCircle size={16} className="shrink-0" />
          {toast.message}
        </div>
      )}

      {/* ── Search bar (filters all sections) ── */}
      <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm px-6 py-4 flex items-center gap-3">
        <Search size={16} className="text-[#64748B] shrink-0" />
        <input
          type="text"
          placeholder="Search by client, title, email or type…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-sm text-[#1A2B3C] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-[#9CA3AF] hover:text-[#1A2B3C] transition-colors">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Pending Requests ── */}
      {(focusSection === 'all' || focusSection === 'requests') && (
        <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="p-6 border-b border-[#1A2B3C]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-amber-400 rounded-full" />
              <div>
                <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                  Pending Requests
                </h3>
                <p className="text-sm text-[#64748B]">
                  {loading ? 'Loading...' : totalPending === 0 ? 'No pending requests' : `${totalPending} awaiting review`}
                </p>
              </div>
              {totalPending > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {totalPending}
                </span>
              )}
            </div>
            <button
              onClick={fetchAppointments}
              className="p-2 text-[#64748B] hover:text-[#1A2B3C] transition-colors rounded-lg hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[#64748B]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
              <div className="bg-[#F8FAFC] p-4 rounded-full mb-4 border border-[#1A2B3C]/5">
                <Inbox size={32} className="text-[#64748B]" />
              </div>
              <p className="font-semibold text-[#1A2B3C] text-lg">All clear!</p>
              <p className="text-sm mt-1">There are no pending appointment requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2B3C]/5">

              {/* Sub-table: New Appointment Requests */}
              <div>
                <div className="px-6 py-3 flex items-center gap-2 bg-blue-50/60">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">New Appointment Requests</span>
                  {newRequests.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                      {newRequests.length}
                    </span>
                  )}
                </div>
                {newRequests.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-[#64748B] italic">No new appointment requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <TableHead />
                      <tbody>{renderRows(newRequests)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sub-table: Client Reschedule Requests */}
              <div>
                <div className="px-6 py-3 flex items-center gap-2 bg-amber-50/60">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Client Reschedule Requests</span>
                  {rescheduleRequests.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                      {rescheduleRequests.length}
                    </span>
                  )}
                </div>
                {rescheduleRequests.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-[#64748B] italic">No pending reschedule confirmations.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <TableHead />
                      <tbody>{renderRows(rescheduleRequests)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sub-table: Awaiting Client Reschedule */}
              <div>
                <div className="px-6 py-3 flex items-center gap-2 bg-orange-50/60">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Awaiting Client Reschedule</span>
                  {needsRescheduleList.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                      {needsRescheduleList.length}
                    </span>
                  )}
                </div>
                {needsRescheduleList.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-[#64748B] italic">No appointments awaiting client action.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <TableHead />
                      <tbody>{renderRows(needsRescheduleList)}</tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── Upcoming Confirmed / Rescheduled ── */}
      {(focusSection === 'all' || focusSection === 'confirmed') && (
        <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#1A2B3C]/10 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-400 rounded-full" />
            <div>
              <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                Upcoming Appointments
              </h3>
              <p className="text-sm text-[#64748B]">
                {loading ? 'Loading...' : confirmed.length === 0 ? 'No confirmed appointments' : `${confirmed.length} confirmed`}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-[#64748B]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : confirmed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
                <div className="bg-[#F8FAFC] p-4 rounded-full mb-4 border border-[#1A2B3C]/5">
                  <CalendarCheck size={32} className="text-[#64748B]" />
                </div>
                <p className="font-semibold text-[#1A2B3C] text-lg">Schedule is open</p>
                <p className="text-sm mt-1">There are no upcoming confirmed appointments.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <TableHead />
                <tbody>{renderRows(confirmed)}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Cancelled ── */}
      {(focusSection === 'cancelled' || focusSection === 'all') && !loading && cancelled.length > 0 && (
        <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
          {focusSection === 'cancelled' ? (
            <>
              <div className="p-6 border-b border-[#1A2B3C]/10 flex items-center gap-3">
                <div className="w-1 h-8 bg-red-300 rounded-full" />
                <div>
                  <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>Archive</h3>
                  <p className="text-sm text-[#64748B]">{cancelled.length} total</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TableHead />
                  <tbody>{renderRows(cancelled)}</tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-[#64748B] hover:text-[#1A2B3C] transition-colors"
                onClick={() => setShowCancelled(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-red-300 rounded-full" />
                  <span className="text-sm font-medium">Archive ({cancelled.length})</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showCancelled ? 'rotate-180' : ''}`} />
              </button>
              {showCancelled && (
                <div className="overflow-x-auto border-t border-[#1A2B3C]/10">
                  <table className="w-full text-sm">
                    <TableHead />
                    <tbody>{renderRows(cancelled)}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {focusSection === 'cancelled' && !loading && cancelled.length === 0 && (
        <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm flex items-center justify-center py-16 text-[#64748B]">
          <p className="text-sm font-medium">No archived appointments on record.</p>
        </div>
      )}
    </div>
  );
}
