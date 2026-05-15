'use client';

import { Calendar, Clock, User, Video, Phone, MapPin, Loader2 } from 'lucide-react';
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
  status: string;
}

export default function AdminWeeklyList({ refreshKey }: { refreshKey?: number }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchWeek = useCallback(async () => {
    const now = new Date();
    // Start of today
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    // End of 7 days from now
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, date, time, title, type, method, client_name, status')
      .eq('status', 'Confirmed')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (!error && data) {
      // Filter client-side since date is stored as a formatted string
      const filtered = (data as Appointment[]).filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd;
      });
      setAppointments(filtered);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWeek();
    const channel = supabase
      .channel('weekly-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchWeek)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchWeek, supabase]);

  useEffect(() => {
    if (refreshKey !== undefined) fetchWeek();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const methodIcon = (method: string) =>
    method === 'Video' ? <Video size={13} /> :
    method === 'Phone' ? <Phone size={13} /> :
    <MapPin size={13} />;

  // Group by date label
  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const d = new Date(apt.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) label = 'Tomorrow';
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(apt);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#1A2B3C]/10 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#D4AF37] rounded-full" />
        <div>
          <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
            Upcoming This Week
          </h3>
          <p className="text-sm text-[#64748B]">
            {loading ? 'Loading...' : appointments.length === 0 ? 'No confirmed appointments in the next 7 days' : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} scheduled`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-[#64748B]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-[#64748B]">
          <p className="text-sm font-medium">Nothing scheduled for the next 7 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1A2B3C]/5">
          {Object.entries(grouped).map(([label, apts]) => (
            <div key={label}>
              {/* Day header */}
              <div className="px-6 py-2 bg-[#F8FAFC]">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
              </div>
              {/* Appointments for that day */}
              {apts.map(apt => (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors">
                  {/* Time */}
                  <div className="w-20 shrink-0 flex items-center gap-1.5 text-[#1A2B3C] font-medium text-sm">
                    <Clock size={13} className="text-[#64748B]" />
                    {apt.time}
                  </div>
                  {/* Client + title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B3C] truncate">{apt.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                      <User size={11} />
                      <span>{apt.client_name || '—'}</span>
                      <span className="text-[#1A2B3C]/20">·</span>
                      <span>{apt.type}</span>
                    </div>
                  </div>
                  {/* Method badge */}
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#1A2B3C]/10 px-2.5 py-1 rounded-full shrink-0">
                    {methodIcon(apt.method)}
                    {apt.method}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
