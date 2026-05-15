'use client';

import { Calendar, Users, FileText, ArrowUp, AlertCircle, XCircle, BarChart2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase';

export default function AdminStatsCards({ refreshKey }: { refreshKey?: number }) {
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [cancelledCount, setCancelledCount] = useState<number | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchStats = useCallback(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRes, leadsRes, pendingRes, monthRes, cancelledRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .not('status', 'eq', 'Cancelled'),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Requested', 'Pending Staff Confirmation']),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Cancelled')
        .gte('created_at', monthStart.toISOString()),
    ]);

    setTodayCount(todayRes.count ?? 0);
    setNewLeadsCount(leadsRes.count ?? 0);
    setPendingCount(pendingRes.count ?? 0);
    setMonthCount(monthRes.count ?? 0);
    setCancelledCount(cancelledRes.count ?? 0);
  }, [supabase]);

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('stats-cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats, supabase]);

  // Explicit refresh triggered by parent (e.g. after a status update)
  useEffect(() => {
    if (refreshKey !== undefined) fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const loading = todayCount === null;

  const monthName = new Date().toLocaleString('default', { month: 'long' });
  const cancelRate = monthCount ? Math.round(((cancelledCount ?? 0) / monthCount) * 100) : 0;

  const stats = [
    {
      icon: <Calendar size={24} />,
      label: 'Appointments Today',
      value: loading ? '—' : String(todayCount),
      trend: 'Scheduled for today',
      trendColor: 'text-green-600',
      urgent: false,
    },
    {
      icon: <Users size={24} />,
      label: 'New Leads',
      value: loading ? '—' : String(newLeadsCount),
      trend: 'Added this week',
      trendColor: 'text-green-600',
      urgent: false,
    },
    {
      icon: <FileText size={24} />,
      label: 'Pending Reviews',
      value: loading ? '—' : String(pendingCount),
      trend: (pendingCount ?? 0) > 0 ? `${pendingCount} awaiting action` : 'All clear',
      trendColor: (pendingCount ?? 0) > 0 ? 'text-amber-600' : 'text-green-600',
      urgent: (pendingCount ?? 0) > 0,
    },
    {
      icon: <BarChart2 size={24} />,
      label: `Total — ${monthName}`,
      value: loading ? '—' : String(monthCount),
      trend: 'Appointments this month',
      trendColor: 'text-green-600',
      urgent: false,
    },
    {
      icon: <XCircle size={24} />,
      label: `Cancellations — ${monthName}`,
      value: loading ? '—' : String(cancelledCount),
      trend: monthCount ? `${cancelRate}% cancellation rate` : 'No data yet',
      trendColor: (cancelledCount ?? 0) > 0 ? 'text-red-500' : 'text-green-600',
      urgent: (cancelledCount ?? 0) > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-[#1A2B3C]/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        >
          {/* Icon Circle */}
          <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37] mb-4">
            {stat.icon}
          </div>

          {/* Label */}
          <p className="text-xs uppercase tracking-wide text-[#64748B] font-medium mb-2">
            {stat.label}
          </p>

          {/* Value */}
          <p className="text-4xl font-bold text-[#1A2B3C] mb-3" style={{ fontFamily: 'Playfair Display' }}>
            {stat.value}
          </p>

          {/* Trend */}
          <div className="flex items-center gap-1">
            {stat.urgent ? (
              <AlertCircle size={16} className={stat.trendColor} />
            ) : (
              <ArrowUp size={16} className={stat.trendColor} />
            )}
            <span className={`${stat.trendColor} text-xs font-medium`}>{stat.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
