'use client';

import { Calendar, Video, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase';

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  method: string;
  attorney: string;
  status: string;
  notes: string;
}

export default function ClientNextAppointment() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandChecklist, setExpandChecklist] = useState(true);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Prepare list of questions', completed: false },
    { id: 2, text: 'Gather relevant documents', completed: false },
    { id: 3, text: 'Complete intake questionnaire', completed: false },
  ]);

  useEffect(() => {
    const supabase = createClient();
    const fetchNext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'eq', 'Cancelled')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1);

      if (data && data.length > 0) setAppointment(data[0]);
      setLoading(false);
    };
    fetchNext();
  }, []);

  const toggleCheckItem = (id: number) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  if (loading) {
    return (
      <div className="col-span-2 bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-10 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="col-span-2 bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37]">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs uppercase text-[#64748B] font-bold tracking-wide">Upcoming Appointment</p>
            <p className="text-sm text-[#64748B] mt-1">No upcoming appointments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 bg-white rounded-2xl border-2 border-[#D4AF37]/30 p-6 shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37]">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs uppercase text-[#64748B] font-bold tracking-wide">Upcoming Appointment</p>
            <span className="bg-[#D4AF37] text-[#1A2B3C] text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-block">
              {appointment.status}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-[#1A2B3C]/10">
        <p className="text-3xl font-bold text-[#1A2B3C] mb-1" style={{ fontFamily: 'Playfair Display' }}>
          {appointment.date}
        </p>
        {appointment.time && <p className="text-xl text-[#1A2B3C] font-semibold">{appointment.time}</p>}
        <p className="text-sm font-semibold text-[#1A2B3C] mt-3 mb-2">{appointment.title}</p>
        <div className="flex items-center gap-2 text-[#64748B] text-sm">
          <Video size={16} />
          {appointment.method || 'In-Person'}
        </div>
        <div className="text-sm mt-3">
          <p className="text-[#64748B] mb-1">with</p>
          <p className="font-semibold text-[#1A2B3C]">{appointment.attorney || 'Abigail Miller, Esq.'}</p>
          <p className="text-xs text-[#64748B]">Attorney</p>
        </div>
      </div>

      {/* Preparation Checklist */}
      <div>
        <button
          className="flex items-center gap-2 text-sm font-semibold text-[#1A2B3C] mb-3"
          onClick={() => setExpandChecklist(v => !v)}
        >
          <ChevronDown size={16} className={`transition-transform ${expandChecklist ? '' : '-rotate-90'}`} />
          Preparation Checklist
        </button>
        {expandChecklist && (
          <div className="space-y-2">
            {checklist.map(item => (
              <button
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className="w-full flex items-center gap-3 text-sm text-left"
              >
                {item.completed
                  ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  : <AlertCircle size={18} className="text-[#94A3B8] flex-shrink-0" />}
                <span className={item.completed ? 'line-through text-[#94A3B8]' : 'text-[#1A2B3C]'}>{item.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
