'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, X, Plus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '../../../lib/supabase';

const AVAILABLE_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

interface UnavailableSlot {
  date: string;
  time: string;
}

interface ConflictingAppointment {
  id: string;
  client_name: string;
  client_email: string;
  time: string;
  type: string;
}

interface WeekAppointment {
  id: string;
  date: string;
  time: string;
  client_name: string;
  type: string;
  status: string;
}

export default function AdminAvailability() {
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<WeekAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [blockType, setBlockType] = useState<'single' | 'morning' | 'afternoon' | 'allday' | 'custom'>('single');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState<ConflictingAppointment[]>([]);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [timesToMark, setTimesToMark] = useState<string[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  // Build Mon–Sat for the displayed week
  const weekDays = useMemo(() => {
    const days: { iso: string; label: string; short: string }[] = [];
    const now = new Date();
    // Start from this Monday
    const dow = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        short: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      });
    }
    return days;
  }, [weekOffset]);

  const isBlocked = (iso: string, time: string) =>
    unavailableSlots.some(s => s.date === iso && s.time === time);

  const weekRangeLabel = weekDays.length === 6
    ? `${weekDays[0].label} – ${weekDays[5].label}`
    : '';

  const weekAppointmentMap = useMemo(() => {
    const map = new Map<string, WeekAppointment>();
    weekAppointments.forEach(apt => {
      map.set(`${apt.date}|${apt.time}`, apt);
    });
    return map;
  }, [weekAppointments]);

  // Fetch unavailable slots
  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/attorney-availability');
        const data = await res.json() as { slots?: UnavailableSlot[] };
        setUnavailableSlots(data.slots || []);
      } catch (err) {
        console.error('Failed to fetch unavailable slots:', err);
        setMessage('Failed to load unavailable slots');
      } finally {
        setLoading(false);
      }
    };

    fetchUnavailableSlots();
  }, []);

  useEffect(() => {
    if (weekDays.length === 0) return;
    const start = weekDays[0].iso;
    const end = weekDays[weekDays.length - 1].iso;

    const fetchWeekAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, date, time, client_name, type, status')
          .gte('date', start)
          .lte('date', end)
          .in('status', ['Confirmed', 'Rescheduled'])
          .order('date', { ascending: true });

        if (error) {
          console.error('Failed to fetch week appointments:', error);
          setWeekAppointments([]);
          return;
        }

        setWeekAppointments((data || []) as WeekAppointment[]);
      } catch (err) {
        console.error('Failed to fetch week appointments:', err);
        setWeekAppointments([]);
      }
    };

    fetchWeekAppointments();
  }, [supabase, weekDays]);

  const checkForConflicts = async (date: string, time: string) => {
    try {
      const res = await fetch('/api/admin/attorney-availability/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time }),
      });
      const data = await res.json() as { conflicts?: ConflictingAppointment[] };
      return data.conflicts || [];
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return [];
    }
  };

  const handleMarkUnavailable = async () => {
    if (!selectedDate) {
      setMessage('Please select a date');
      return;
    }

    let times: string[] = [];

    if (blockType === 'single') {
      if (!selectedTime) {
        setMessage('Please select a time slot');
        return;
      }
      times = [selectedTime];
    } else if (blockType === 'morning') {
      times = ['9:00 AM', '10:00 AM', '11:00 AM'];
    } else if (blockType === 'afternoon') {
      times = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    } else if (blockType === 'allday') {
      times = [...AVAILABLE_SLOTS];
    } else if (blockType === 'custom') {
      if (!customStartTime || !customEndTime) {
        setMessage('Please select start and end times for custom range');
        return;
      }
      const startIdx = AVAILABLE_SLOTS.indexOf(customStartTime);
      const endIdx = AVAILABLE_SLOTS.indexOf(customEndTime);
      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        setMessage('Invalid custom time range');
        return;
      }
      times = AVAILABLE_SLOTS.slice(startIdx, endIdx + 1);
    }

    // Check if already marked as unavailable
    const alreadyMarked = times.filter(time =>
      unavailableSlots.some(slot => slot.date === selectedDate && slot.time === time)
    );
    if (alreadyMarked.length > 0) {
      setMessage(`${alreadyMarked.length} time slot(s) already marked as unavailable`);
      return;
    }

    setTimesToMark(times);

    // Check for conflicts
    const allConflicts: ConflictingAppointment[] = [];
    for (const time of times) {
      const conflicts = await checkForConflicts(selectedDate, time);
      allConflicts.push(...conflicts);
    }

    if (allConflicts.length > 0) {
      setConflictingAppointments(allConflicts);
      setShowConflictDialog(true);
      return;
    }

    // No conflicts, proceed
    await proceedMarkingUnavailable(false, times);
  };

  const proceedMarkingUnavailable = async (notifyClients: boolean, times: string[] = []) => {
    if (times.length === 0) times = timesToMark;
    
    setSaving(true);
    try {
      const promises = times.map(time =>
        fetch('/api/admin/attorney-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            date: selectedDate,
            time,
            notifyClients,
            conflicts: notifyClients ? conflictingAppointments.filter(c => c.time === time) : [],
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allSuccess = responses.every(res => res.ok);

      if (allSuccess) {
        const newSlots = times.map(time => ({ date: selectedDate, time }));
        setUnavailableSlots([...unavailableSlots, ...newSlots]);
        setSelectedDate('');
        setSelectedTime('');
        setCustomStartTime('');
        setCustomEndTime('');
        setBlockType('single');
        setConflictingAppointments([]);
        setShowConflictDialog(false);
        setMessage(`${times.length} time slot(s) marked as unavailable ✓`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to mark some slots as unavailable');
      }
    } catch (err) {
      console.error('Error marking as unavailable:', err);
      setMessage('Failed to mark as unavailable');
    } finally {
      setSaving(false);
      setResolvingConflict(false);
    }
  };

  const handleRemoveUnavailable = async (date: string, time: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/attorney-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          date,
          time,
        }),
      });

      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setUnavailableSlots(
          unavailableSlots.filter(slot => !(slot.date === date && slot.time === time))
        );
        setMessage('Slot marked as available ✓');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to mark as available');
      }
    } catch (err) {
      console.error('Error marking as available:', err);
      setMessage('Failed to remove unavailable slot');
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedSlots = [...unavailableSlots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return AVAILABLE_SLOTS.indexOf(a.time) - AVAILABLE_SLOTS.indexOf(b.time);
  });

  return (
    <div className="space-y-8">

      {/* ── Week Calendar View ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              Weekly Overview
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">{weekRangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(v => v - 1)}
              className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1A2B3C] transition-colors"
              title="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#64748B] disabled:opacity-40 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(v => v + 1)}
              className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1A2B3C] transition-colors"
              title="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-3 py-2 text-left text-[#64748B] font-semibold w-20 border-b border-r border-[#E5E7EB]">Time</th>
                {weekDays.map(day => {
                  const todayISO = new Date().toISOString().split('T')[0];
                  const isToday = day.iso === todayISO;
                  const allBlocked = AVAILABLE_SLOTS.every(t => isBlocked(day.iso, t));
                  return (
                    <th key={day.iso} className={`px-2 py-2 text-center font-semibold border-b border-r border-[#E5E7EB] last:border-r-0 ${isToday ? 'bg-[#D4AF37]/10 text-[#1A2B3C]' : 'text-[#64748B]'}`}>
                      <span className={`block ${isToday ? 'text-[#D4AF37] font-bold' : ''}`}>{day.short}</span>
                      {allBlocked && <span className="block text-[10px] text-red-400 font-normal mt-0.5">Full day</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {AVAILABLE_SLOTS.map((slot, si) => {
                const todayISO = new Date().toISOString().split('T')[0];
                return (
                  <React.Fragment key={slot}>
                    {slot === '1:00 PM' && (
                      <tr>
                        <td className="px-3 py-1 text-[9px] text-[#9CA3AF] italic border-r border-[#E5E7EB] whitespace-nowrap">12:00 PM</td>
                        {weekDays.map(day => (
                          <td key={day.iso} className="border-r border-[#E5E7EB] last:border-r-0 py-1 bg-[#F3F4F6]">
                            <span className="block text-center text-[9px] text-[#9CA3AF] italic">Lunch</span>
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr className={si % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]/30'}>
                      <td className="px-3 py-2 text-[#64748B] font-medium border-r border-[#E5E7EB] whitespace-nowrap">{slot}</td>
                      {weekDays.map(day => {
                        const blocked = isBlocked(day.iso, slot);
                        const appointment = weekAppointmentMap.get(`${day.iso}|${slot}`);
                        const isBooked = Boolean(appointment);
                        const isPast = day.iso < todayISO;
                        const cellBg = isPast
                          ? 'bg-[#F9FAFB]'
                          : isBooked
                          ? 'bg-amber-50 hover:bg-amber-100 cursor-default'
                          : blocked
                          ? 'bg-red-50 hover:bg-red-100 cursor-pointer'
                          : 'bg-green-50/60 hover:bg-green-100/60 cursor-pointer';
                        return (
                          <td
                            key={day.iso}
                            className={`border-r border-[#E5E7EB] last:border-r-0 text-center py-2 px-1 transition-colors ${cellBg}`}
                            onClick={() => {
                              if (isPast || isBooked) return;
                              if (blocked) {
                                handleRemoveUnavailable(day.iso, slot);
                              } else {
                                setSelectedDate(day.iso);
                                setSelectedTime(slot);
                                setBlockType('single');
                              }
                            }}
                            title={
                              isPast ? 'Past'
                              : isBooked ? `${appointment?.client_name || 'Client'} — ${appointment?.type || 'Consultation'}`
                              : blocked ? 'Click to unblock'
                              : 'Click to block this slot'
                            }
                          >
                            {isPast ? (
                              <span className="text-[#D1D5DB] text-[11px]">—</span>
                            ) : isBooked ? (
                              <span className="text-amber-700 text-[10px] font-semibold">
                                {appointment?.client_name?.split(' ')[0] || 'Booked'}
                              </span>
                            ) : blocked ? (
                              <span className="text-red-400 text-[11px] font-bold">✕</span>
                            ) : (
                              <span className="text-green-500 text-[11px]">•</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] flex items-center gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" /> Available (click to block)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Blocked (click to unblock)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#F3F4F6] border border-[#E5E7EB] inline-block" /> Past</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#F3F4F6] border border-[#E5E7EB] inline-block" /> Lunch</span>
        </div>
      </div>

      {/* Add Unavailable Slot */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-bold text-[#1A2B3C] mb-6" style={{ fontFamily: 'Playfair Display' }}>
          Mark Time as Unavailable
        </h3>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">Date *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
              className="w-full px-4 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {/* Block Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-3">Block Type *</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'single', label: 'Single Slot', icon: '⏰' },
                { value: 'morning', label: 'All Morning', icon: '🌅' },
                { value: 'afternoon', label: 'All Afternoon', icon: '☀️' },
                { value: 'allday', label: 'All Day', icon: '🚫' },
                { value: 'custom', label: 'Custom Range', icon: '📍' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setBlockType(option.value as typeof blockType)}
                  className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                    blockType === option.value
                      ? 'border-[#D4AF37] bg-[#FEF9F0] text-[#1A2B3C]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D4AF37]'
                  }`}
                >
                  <div className="text-xl mb-1">{option.icon}</div>
                  <div className="text-xs">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Single Slot Selection */}
          {blockType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Time *</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="">Select a time</option>
                {AVAILABLE_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Range Selection */}
          {blockType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">Start Time *</label>
                <select
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  <option value="">Start time</option>
                  {AVAILABLE_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">End Time *</label>
                <select
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  <option value="">End time</option>
                  {AVAILABLE_SLOTS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Time Preview */}
          {selectedDate && (
            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280] mb-2">Times to Mark Unavailable:</p>
              <div className="flex flex-wrap gap-2">
                {blockType === 'single' && selectedTime && (
                  <span className="inline-block px-3 py-1 bg-[#D4AF37]/20 text-[#1A2B3C] rounded-full text-sm font-medium">
                    {selectedTime}
                  </span>
                )}
                {blockType === 'morning' && (
                  ['9:00 AM', '10:00 AM', '11:00 AM'].map(t => (
                    <span key={t} className="inline-block px-3 py-1 bg-[#D4AF37]/20 text-[#1A2B3C] rounded-full text-sm font-medium">
                      {t}
                    </span>
                  ))
                )}
                {blockType === 'afternoon' && (
                  ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(t => (
                    <span key={t} className="inline-block px-3 py-1 bg-[#D4AF37]/20 text-[#1A2B3C] rounded-full text-sm font-medium">
                      {t}
                    </span>
                  ))
                )}
                {blockType === 'allday' && (
                  AVAILABLE_SLOTS.map(t => (
                    <span key={t} className="inline-block px-3 py-1 bg-[#D4AF37]/20 text-[#1A2B3C] rounded-full text-sm font-medium">
                      {t}
                    </span>
                  ))
                )}
                {blockType === 'custom' && customStartTime && customEndTime && (
                  AVAILABLE_SLOTS.slice(
                    AVAILABLE_SLOTS.indexOf(customStartTime),
                    AVAILABLE_SLOTS.indexOf(customEndTime) + 1
                  ).map(t => (
                    <span key={t} className="inline-block px-3 py-1 bg-[#D4AF37]/20 text-[#1A2B3C] rounded-full text-sm font-medium">
                      {t}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleMarkUnavailable}
            disabled={saving || !selectedDate || (blockType === 'single' && !selectedTime) || (blockType === 'custom' && (!customStartTime || !customEndTime))}
            className="w-full flex items-center justify-center gap-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-[#BDC3C7] disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Mark Time(s) as Unavailable
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium mt-4 ${
            message.includes('✓') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Conflict Dialog */}
      {showConflictDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border-2 border-[#D4AF37] p-8 max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={28} className="text-[#E74C3C]" />
              <h3 className="text-2xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                Scheduling Conflict
              </h3>
            </div>

            <p className="text-[#6B7280] mb-6">
              You have {conflictingAppointments.length} appointment(s) that conflict with the times you're marking as unavailable on <strong>{formatDateDisplay(selectedDate)}</strong>:
            </p>

            <div className="space-y-3 mb-8 max-h-72 overflow-y-auto bg-[#F8FAFC] p-4 rounded-lg">
              {conflictingAppointments.map((apt, idx) => (
                <div key={idx} className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
                  <p className="font-semibold text-[#1A2B3C]">{apt.client_name}</p>
                  <p className="text-sm text-[#6B7280]">{apt.type} Consultation</p>
                  <p className="text-xs text-[#64748B] mt-1">{apt.client_email}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#6B7280] mb-6 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              📧 <strong>These clients will receive an email notification</strong> asking them to reschedule to an available time slot.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConflictDialog(false)}
                className="flex-1 px-4 py-3 border border-[#D1D5DB] rounded-lg text-[#1A2B3C] font-semibold hover:bg-[#F9F5F0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setResolvingConflict(true);
                  proceedMarkingUnavailable(true);
                }}
                disabled={resolvingConflict}
                className="flex-1 px-4 py-3 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {resolvingConflict ? 'Notifying...' : 'Proceed & Notify Clients'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Slots List */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-bold text-[#1A2B3C] mb-6" style={{ fontFamily: 'Playfair Display' }}>
          Unavailable Slots ({unavailableSlots.length})
        </h3>

        {loading ? (
          <p className="text-[#6B7280]">Loading unavailable slots...</p>
        ) : unavailableSlots.length === 0 ? (
          <div className="text-center py-10">
            <Calendar size={32} className="mx-auto text-[#D1D5DB] mb-3" />
            <p className="text-sm font-medium text-[#1A2B3C]">All times are available</p>
            <p className="text-xs text-[#6B7280] mt-1">No slots have been blocked yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Group by date
              const grouped: Record<string, typeof sortedSlots> = {};
              sortedSlots.forEach(slot => {
                (grouped[slot.date] ??= []).push(slot);
              });
              return Object.entries(grouped).map(([date, slots]) => (
                <div key={date} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  {/* Date header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#D4AF37]" />
                      <span className="text-sm font-semibold text-[#1A2B3C]">{formatDateDisplay(date)}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">{slots.length} slot{slots.length > 1 ? 's' : ''} blocked</span>
                  </div>
                  {/* Slots for this date */}
                  <div className="divide-y divide-[#E5E7EB]">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-red-50/30 transition-colors">
                        <div className="flex items-center gap-2 text-[#6B7280]">
                          <Clock size={14} className="text-[#D4AF37]" />
                          <span className="text-sm font-medium">{slot.time}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUnavailable(slot.date, slot.time)}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove block"
                        >
                          <X size={13} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
