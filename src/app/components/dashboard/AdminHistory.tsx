'use client';

import { Loader2, Eye, X, RefreshCw, Calendar, Clock, User, Mail, Phone, FileText, Video, MapPin, Download, Inbox, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase';

interface Appointment {
  id: string;
  user_id?: string;
  date: string;
  time: string;
  title: string;
  type: string;
  method: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  attorney?: string;
  status: 'Requested' | 'Pending Staff Confirmation' | 'Confirmed' | 'Cancelled' | 'Rescheduled';
  notes: string;
  created_at: string;
}

const STATUS_TABS = ['All', 'Confirmed', 'Rescheduled', 'Cancelled', 'Requested', 'Pending Staff Confirmation'] as const;

const STATUS_COLOR: Record<string, string> = {
  Requested: 'bg-blue-100 text-blue-700',
  'Pending Staff Confirmation': 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Rescheduled: 'bg-purple-100 text-purple-700',
};

function DetailModal({
  apt,
  onClose,
  onRestore,
  updating,
}: {
  apt: Appointment;
  onClose: () => void;
  onRestore: () => void;
  updating: boolean;
}) {
  const methodIcon =
    apt.method === 'Video' ? <Video size={15} /> :
    apt.method === 'Phone' ? <Phone size={15} /> :
    <MapPin size={15} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border-2 border-[#D4AF37]/30">
        <div className="flex items-center justify-between p-6 border-b border-[#1A2B3C]/10">
          <div>
            <h3 className="text-xl font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
              Appointment Details
            </h3>
            <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[apt.status] ?? ''}`}>
              {apt.status}
            </span>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1A2B3C] p-1">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide">Client</p>
            <div className="flex items-center gap-2 text-[#1A2B3C]">
              <User size={15} className="text-[#64748B]" />
              <span className="font-semibold">{apt.client_name || '—'}</span>
            </div>
            {apt.client_email && (
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <Mail size={14} /><span>{apt.client_email}</span>
              </div>
            )}
            {apt.client_phone && (
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <Phone size={14} /><span>{apt.client_phone}</span>
              </div>
            )}
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide">Appointment</p>
            <p className="font-semibold text-[#1A2B3C]">{apt.title}</p>
            <p className="text-sm text-[#64748B]">{apt.type}{apt.attorney ? ` · ${apt.attorney}` : ''}</p>
            <div className="flex items-center gap-4 text-sm text-[#1A2B3C] mt-1">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#64748B]" />{apt.date || '—'}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#64748B]" />{apt.time || '—'}</span>
              <span className="flex items-center gap-1.5 text-[#64748B]">{methodIcon}{apt.method}</span>
            </div>
          </div>

          {apt.notes && (
            <div className="bg-[#F8FAFC] rounded-xl p-4">
              <p className="text-xs font-semibold uppercase text-[#64748B] tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-[#1A2B3C] leading-relaxed flex items-start gap-2">
                <FileText size={14} className="text-[#64748B] mt-0.5 shrink-0" />
                {apt.notes}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          {updating ? (
            <div className="flex items-center gap-2 text-[#64748B] text-sm py-2">
              <Loader2 size={16} className="animate-spin" /> Processing…
            </div>
          ) : apt.status === 'Cancelled' ? (
            <>
              <button
                onClick={onRestore}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                <RefreshCw size={15} /> Restore to Requested
              </button>
              <button onClick={onClose} className="flex-1 bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                Close
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminHistory({ onStatusChange, initialSearchQuery }: { onStatusChange?: () => void; initialSearchQuery?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>('All');
  const [detailApt, setDetailApt] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  const supabase = useMemo(() => createClient(), []);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('appointments').select('*', { count: 'exact' });

    if (activeTab !== 'All') query = query.eq('status', activeTab);
    if (searchQuery) query = query.or(`client_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (error || !data) { setLoading(false); return; }
    setTotalCount(count || 0);

    const rows = data as Appointment[];

    // Enrich any rows missing client_name but having a user_id
    const unnamed = rows.filter(a => !a.client_name && a.user_id);
    if (unnamed.length > 0) {
      try {
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
          const { names } = await res.json() as { names: Record<string, string> };
          for (const row of rows) {
            if (!row.client_name && row.user_id && names[row.user_id]) {
              row.client_name = names[row.user_id];
            }
          }
        }
      } catch { /* fall through */ }
    }

    setAppointments(rows);
    setLoading(false);
  }, [supabase, activeTab, searchQuery, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Handle Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('history-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchPage();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPage, supabase]);

  const restore = async (id: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'Requested' })
      .eq('id', id);
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Requested' } : a));
      setDetailApt(prev => prev?.id === id ? { ...prev, status: 'Requested' } : prev);
      onStatusChange?.();
    }
    setUpdating(null);
  };

  const handleExportCSV = async () => {
    setLoading(true);
    let query = supabase.from('appointments').select('*');
    if (activeTab !== 'All') query = query.eq('status', activeTab);
    if (searchQuery) query = query.or(`client_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data } = await query.order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const rows = data as Appointment[];
    const headers = ['Date', 'Time', 'Client Name', 'Email', 'Phone', 'Type', 'Method', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...rows.map((row: Appointment) => [
        `"${row.date || ''}"`,
        `"${row.time || ''}"`,
        `"${(row.client_name || '').replace(/"/g, '""')}"`,
        `"${(row.client_email || '').replace(/"/g, '""')}"`,
        `"${(row.client_phone || '').replace(/"/g, '""')}"`,
        `"${(row.type || '').replace(/"/g, '""')}"`,
        `"${(row.method || '').replace(/"/g, '""')}"`,
        `"${row.status}"`,
        `"${(row.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    link.setAttribute('download', `appointments_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  return (
    <div className="bg-white border border-[#1A2B3C]/10 rounded-2xl shadow-sm overflow-hidden">
      {detailApt && (
        <DetailModal
          apt={detailApt}
          updating={updating === detailApt.id}
          onRestore={() => restore(detailApt.id)}
          onClose={() => setDetailApt(null)}
        />
      )}

      {/* Header */}
      <div className="p-6 border-b border-[#1A2B3C]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>
            Archive
          </h3>
          <p className="text-sm text-[#64748B]">
            {loading ? 'Loading…' : `${totalCount} total record${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 w-full md:w-52"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#64748B] shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#1A2B3C]"
              title="Submitted from"
            />
            <span className="text-[#64748B] text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-[#1A2B3C]"
              title="Submitted to"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                className="text-[#9CA3AF] hover:text-[#1A2B3C] transition-colors"
                title="Clear date filter"
              >
                <X size={15} />
              </button>
            )}
          </div>
          
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 bg-[#F8FAFC] border border-[#1A2B3C]/10 text-[#1A2B3C] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <Download size={16} /> Export CSV
          </button>
          
          <button
            onClick={fetchPage}
            className="p-2 text-[#64748B] hover:text-[#1A2B3C] transition-colors rounded-lg hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-[#1A2B3C]/10 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-[#D4AF37] text-[#1A2B3C]'
                : 'border-transparent text-[#64748B] hover:text-[#1A2B3C]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading && appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p>Loading records...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#64748B]">
            <div className="bg-[#F8FAFC] p-4 rounded-full mb-4 border border-[#1A2B3C]/5">
              <Inbox size={32} className="text-[#64748B]" />
            </div>
            <p className="font-semibold text-[#1A2B3C] text-lg">No records found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#1A2B3C]/10 text-[#64748B] font-medium">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2B3C]/5">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1A2B3C]">{apt.client_name || '—'}</td>
                  <td className="px-6 py-4 text-[#64748B]">{apt.date} at {apt.time}</td>
                  <td className="px-6 py-4 text-[#64748B]">{apt.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[apt.status] ?? ''}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDetailApt(apt)}
                      className="flex items-center gap-1.5 bg-[#1A2B3C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#243548] transition-colors"
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalCount > 0 && (
        <div className="p-4 border-t border-[#1A2B3C]/10 flex items-center justify-between text-sm text-[#64748B] bg-[#F8FAFC]">
          <div>
            Showing <span className="font-semibold text-[#1A2B3C]">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold text-[#1A2B3C]">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-semibold text-[#1A2B3C]">{totalCount}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * PAGE_SIZE >= totalCount}
              className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
