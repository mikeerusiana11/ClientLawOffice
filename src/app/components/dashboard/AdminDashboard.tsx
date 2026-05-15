'use client';

import React from 'react';
import { Calendar, Clock, Video, Phone, MapPin, Loader2, AlertCircle, CheckCircle, RefreshCw, User, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDateShort } from '../../../lib/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase';

interface Appointment {
  id: string;
  date: string;
  time: string;
  title: string;
  type: string;
  method: string;
  client_name: string;
  client_email: string;
  status: string;
}

interface UnavailableSlot {
  date: string;
  time: string;
}

const SLOT_ORDER = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayISO() {
  return toISODate(new Date());
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

function getMethodIcon(method: string, size = 15) {
  if (method === 'Video') return <Video size={size} />;
  if (method === 'Phone') return <Phone size={size} />;
  return <MapPin size={size} />;
}

export default function AdminDashboard({ onNavigate }: { onNavigate?: (s: string) => void; onStatusChange?: () => void }) {
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [pendingApts, setPendingApts] = useState<Appointment[]>([]);
  const [weekApts, setWeekApts] = useState<Appointment[]>([]);
  const [weekGridApts, setWeekGridApts] = useState<Appointment[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [monthStats, setMonthStats] = useState({ total: 0, confirmed: 0, cancelled: 0 });
  const [adminFirstName, setAdminFirstName] = useState('');

  const supabase = useMemo(() => createClient(), []);

  const weekDays = useMemo(() => {
    const days: { iso: string; label: string; short: string }[] = [];
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        iso: toISODate(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        short: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      });
    }
    return days;
  }, []);

  const weekRangeLabel = weekDays.length === 6
    ? `${weekDays[0].label} - ${weekDays[5].label}`
    : '';

  const fetchAll = useCallback(async () => {
    const today = getTodayISO();
    setTodayDate(new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }));

    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const weekGridStart = weekDays[0]?.iso;
    const weekGridEnd = weekDays[weekDays.length - 1]?.iso;

    const [{ data: allApts }, { data: monthData }, availabilityRes] = await Promise.all([
      supabase.from('appointments').select('*').order('date', { ascending: true }),
      supabase.from('appointments').select('status').gte('created_at', monthStart.toISOString()),
      fetch('/api/admin/attorney-availability'),
    ]);

    try {
      if (availabilityRes?.ok) {
        const availabilityData = await availabilityRes.json() as { slots?: UnavailableSlot[] };
        setUnavailableSlots(availabilityData.slots || []);
      } else {
        setUnavailableSlots([]);
      }
    } catch (err) {
      console.error('Failed to fetch unavailable slots:', err);
      setUnavailableSlots([]);
    }

    if (allApts) {
      const rows = allApts as Appointment[];

      setTodayApts(
        rows
          .filter(a => a.date === today && (a.status === 'Confirmed' || a.status === 'Rescheduled'))
          .sort((a, b) => SLOT_ORDER.indexOf(a.time) - SLOT_ORDER.indexOf(b.time))
      );

      setPendingApts(
        rows
          .filter(a => a.status === 'Requested' || a.status === 'Pending Staff Confirmation' || a.status === 'Needs Reschedule')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );

      setWeekApts(
        rows.filter(a => {
          if (a.status !== 'Confirmed' && a.status !== 'Rescheduled') return false;
          const d = new Date(a.date + 'T00:00:00');
          return d >= new Date(today + 'T00:00:00') && d <= weekEnd;
        }).sort((a, b) => {
          const dc = a.date.localeCompare(b.date);
          return dc !== 0 ? dc : SLOT_ORDER.indexOf(a.time) - SLOT_ORDER.indexOf(b.time);
        })
      );

      if (weekGridStart && weekGridEnd) {
        setWeekGridApts(
          rows
            .filter(a => (a.status === 'Confirmed' || a.status === 'Rescheduled')
              && a.date >= weekGridStart && a.date <= weekGridEnd)
            .sort((a, b) => {
              const dc = a.date.localeCompare(b.date);
              return dc !== 0 ? dc : SLOT_ORDER.indexOf(a.time) - SLOT_ORDER.indexOf(b.time);
            })
        );
      } else {
        setWeekGridApts([]);
      }
    }

    if (monthData) {
      setMonthStats({
        total: monthData.length,
        confirmed: monthData.filter(a => a.status === 'Confirmed' || a.status === 'Rescheduled').length,
        cancelled: monthData.filter(a => a.status === 'Cancelled').length,
      });
    }

    setLoading(false);
  }, [supabase, weekDays]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const full = data.user?.user_metadata?.full_name;
      if (full && !full.includes('@')) {
        setAdminFirstName(full.replace(/[,.]/g, '').split(' ')[0]);
      }
    });

    fetchAll();
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll, supabase]);

  const grouped = weekApts.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const today = getTodayISO();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const label =
      apt.date === today ? 'Today' :
      apt.date === tomorrowISO ? 'Tomorrow' :
      new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    (acc[label] ??= []).push(apt);
    return acc;
  }, {});

  const weekGridMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    weekGridApts.forEach(apt => {
      map.set(`${apt.date}|${apt.time}`, apt);
    });
    return map;
  }, [weekGridApts]);

  const isSlotBlocked = (iso: string, time: string) =>
    unavailableSlots.some(slot => slot.date === iso && slot.time === time);

  const monthSubText = (() => {
    const pending = monthStats.total - monthStats.confirmed - monthStats.cancelled;
    const parts: string[] = [];
    if (monthStats.confirmed > 0) parts.push(`${monthStats.confirmed} confirmed`);
    if (pending > 0) parts.push(`${pending} pending`);
    if (monthStats.cancelled > 0) parts.push(`${monthStats.cancelled} cancelled`);
    return parts.length > 0 ? parts.join(' · ') : 'No activity yet';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
            {getGreeting()}{adminFirstName ? `, ${adminFirstName}` : ''}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">{todayDate}</p>
        </div>
        <button
          onClick={fetchAll}
          className="p-2 text-[#64748B] hover:text-[#1A2B3C] transition-colors rounded-lg hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          {
            icon: <Calendar size={20} />,
            label: "Today's Appointments",
            value: todayApts.length,
            sub: todayApts.length === 0 ? 'Nothing scheduled' : `${todayApts.length} confirmed`,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            target: 'appointments-confirmed',
          },
          {
            icon: <AlertCircle size={20} />,
            label: 'Pending Requests',
            value: pendingApts.length,
            sub: pendingApts.length === 0 ? 'All clear' : 'Awaiting your review',
            color: pendingApts.length > 0 ? 'text-amber-600' : 'text-green-600',
            bg: pendingApts.length > 0 ? 'bg-amber-50' : 'bg-green-50',
            target: 'appointments-requests',
          },
          {
            icon: <CheckCircle size={20} />,
            label: 'This Week',
            value: weekApts.length,
            sub: weekApts.length === 0 ? 'Nothing confirmed' : `${weekApts.length} confirmed`,
            color: 'text-green-600',
            bg: 'bg-green-50',
            target: 'appointments-confirmed',
          },
          {
            icon: <TrendingUp size={20} />,
            label: 'This Month',
            value: monthStats.total,
            sub: monthSubText,
            color: 'text-[#D4AF37]',
            bg: 'bg-[#D4AF37]/10',
            target: 'archive',
          },
        ] as const).map((stat, i) => (
          <button
            key={i}
            onClick={() => onNavigate?.(stat.target)}
            className="bg-white border border-[#1A2B3C]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left w-full"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              {stat.value}
            </p>
            <p className={`text-xs mt-1 font-medium ${stat.color}`}>{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Action Required — only visible when there are pending requests */}
      {pendingApts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                  Action Required
                </h2>
                <p className="text-xs text-amber-700">
                  {pendingApts.length} appointment {pendingApts.length === 1 ? 'request' : 'requests'} awaiting your review
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('appointments-requests')}
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              Review all <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingApts.slice(0, 5).map(apt => (
              <div key={apt.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-amber-200 rounded-full flex items-center justify-center shrink-0">
                  <User size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B3C] truncate">{apt.client_name || '—'}</p>
                  <p className="text-xs text-[#64748B] truncate">
                    {apt.title} · {formatDateShort(apt.date)} at {apt.time}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-white border border-amber-200 text-amber-700 whitespace-nowrap shrink-0">
                  {apt.status === 'Requested' ? 'New' : apt.status === 'Needs Reschedule' ? 'Needs Reschedule' : 'Reschedule'}
                </span>
              </div>
            ))}
            {pendingApts.length > 5 && (
              <button
                onClick={() => onNavigate?.('appointments-requests')}
                className="w-full py-3 text-xs text-amber-700 hover:text-amber-900 transition-colors font-medium"
              >
                +{pendingApts.length - 5} more requests →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar Focus Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calendar Grid */}
        <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
        <div className="p-5 border-b border-[#1A2B3C]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-[#D4AF37] rounded-full" />
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                Weekly Calendar
              </h2>
              <p className="text-xs text-[#64748B]">{weekRangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-3 py-2 text-left text-[#64748B] font-semibold w-20 border-b border-r border-[#E5E7EB]">Time</th>
                {weekDays.map(day => {
                  const todayISO = getTodayISO();
                  const isToday = day.iso === todayISO;
                  const allBlocked = SLOT_ORDER.every(t => isSlotBlocked(day.iso, t));
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
              {SLOT_ORDER.map((slot, si) => (
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
                      const appointment = weekGridMap.get(`${day.iso}|${slot}`);
                      const isBooked = Boolean(appointment);
                      const blocked = isSlotBlocked(day.iso, slot);
                      const todayISO = getTodayISO();
                      const isPast = day.iso < todayISO;
                      const cellBg = isPast ? 'bg-[#F9FAFB]' : isBooked ? 'bg-amber-50' : blocked ? 'bg-red-50' : 'bg-green-50/60';
                      return (
                        <td key={day.iso} className={`border-r border-[#E5E7EB] last:border-r-0 py-2 px-1 ${cellBg}`}>
                          {isPast ? (
                            <span className="block text-center text-[#D1D5DB] text-[10px]">—</span>
                          ) : isBooked ? (
                            <span
                              className="block text-center text-[10px] font-semibold text-amber-700 truncate px-1 cursor-default"
                              title={`${appointment?.client_name || 'Client'} · ${appointment?.type || ''}`}
                            >
                              {appointment?.client_name?.split(' ')[0] || 'Booked'}
                            </span>
                          ) : blocked ? (
                            <span className="block text-center text-[10px] text-red-400 font-medium">✕</span>
                          ) : (
                            <span className="block text-center text-[10px] text-green-400">•</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] flex items-center gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-300 inline-block" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300 inline-block" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 inline-block" /> Blocked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] inline-block" /> Past</span>
        </div>
      </div>

        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#1A2B3C]/10 flex items-center gap-3">
              <div className="w-1 h-7 bg-[#D4AF37] rounded-full" />
              <div>
                <h2 className="text-lg font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                  Today's Schedule
                </h2>
                <p className="text-xs text-[#64748B]">
                  {todayApts.length === 0
                    ? 'No appointments scheduled'
                    : `${todayApts.length} appointment${todayApts.length > 1 ? 's' : ''} confirmed`}
                </p>
              </div>
            </div>

            {todayApts.length === 0 ? (
              <div className="px-5 py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2B3C]">No appointments today</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Your schedule is clear.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('new-appointment')}
                  className="shrink-0 text-xs font-semibold bg-[#D4AF37] text-[#1A2B3C] px-3 py-1.5 rounded-lg hover:bg-[#C49D2E] transition-colors flex items-center gap-1"
                >
                  + Schedule
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1A2B3C]/5">
                {SLOT_ORDER.map(slot => {
                  const apt = todayApts.find(a => a.time === slot);
                  if (!apt) return null;
                  return (
                    <div key={apt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="w-20 shrink-0 flex items-center gap-1.5">
                        <Clock size={12} className="text-[#D4AF37]" />
                        <span className="text-sm font-bold text-[#1A2B3C]">{apt.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A2B3C] truncate">{apt.title}</p>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                          <User size={11} />
                          <span>{apt.client_name || '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#1A2B3C]/10 px-2.5 py-1 rounded-full shrink-0">
                        {getMethodIcon(apt.method, 12)}
                        <span>{apt.method}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* This Week */}
          <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#1A2B3C]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-green-400 rounded-full" />
                <div>
                  <h2 className="text-lg font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
                    This Week
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    {weekApts.length === 0 ? 'No confirmed appointments' : `${weekApts.length} confirmed`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('appointments-confirmed')}
                className="text-xs font-semibold bg-[#F8FAFC] border border-[#1A2B3C]/10 text-[#1A2B3C] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight size={12} />
              </button>
            </div>

            {weekApts.length === 0 ? (
              <div className="px-5 py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2B3C]">No upcoming appointments</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Nothing confirmed for the next 7 days.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('new-appointment')}
                  className="shrink-0 text-xs font-semibold bg-[#D4AF37] text-[#1A2B3C] px-3 py-1.5 rounded-lg hover:bg-[#C49D2E] transition-colors flex items-center gap-1"
                >
                  + Schedule
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1A2B3C]/5 max-h-[320px] overflow-y-auto">
                {Object.entries(grouped).map(([label, apts]) => (
                  <div key={label}>
                    <div className="px-5 py-2 bg-[#F8FAFC]">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{label}</span>
                    </div>
                    {apts.map(apt => (
                      <div key={apt.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors">
                        <div className="w-20 shrink-0 flex items-center gap-1.5">
                          <Clock size={12} className="text-[#64748B]" />
                          <span className="text-sm font-semibold text-[#1A2B3C]">{apt.time}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A2B3C] truncate">{apt.title}</p>
                          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                            <User size={11} />
                            <span>{apt.client_name || '—'}</span>
                            <span className="text-[#1A2B3C]/20">·</span>
                            <span>{apt.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#1A2B3C]/10 px-2.5 py-1 rounded-full shrink-0">
                          {getMethodIcon(apt.method, 12)}
                          <span>{apt.method}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
