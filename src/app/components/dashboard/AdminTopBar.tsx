'use client';

import { Search, Plus, Bell, Calendar, X, User } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '../../../lib/supabase';

interface AdminTopBarProps {
  activeSection: string;
  onNewAppointment?: () => void;
  onNavigate?: (section: string) => void;
  globalSearch?: string;
  setGlobalSearch?: (q: string) => void;
}

interface NotifItem {
  id: string;
  type: 'appointment';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
}

interface SearchResult {
  id: string;
  client_name: string;
  title: string;
  status: string;
  date: string;
}

export default function AdminTopBar({ activeSection, onNewAppointment, onNavigate, globalSearch, setGlobalSearch }: AdminTopBarProps) {
  const [initials, setInitials] = useState('AM');
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState(globalSearch || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    const { data: appts } = await supabase
      .from('appointments')
      .select('id, client_name, title, created_at')
      .eq('status', 'Requested')
      .order('created_at', { ascending: false })
      .limit(8);

    const readIds: string[] = JSON.parse(localStorage.getItem('readNotifIds') || '[]');

    const items: NotifItem[] = (appts || []).map(a => ({
      id: `appt-${a.id}`,
      type: 'appointment' as const,
      title: 'New Appointment Request',
      subtitle: `${a.client_name || 'A client'} — ${a.title || 'Consultation'}`,
      time: a.created_at,
      read: readIds.includes(`appt-${a.id}`),
    }));

    setNotifs(items);
  };

  // Debounced search
  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setSearchLoading(true);
    setShowSearch(true);
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from('appointments')
      .select('id, client_name, title, status, date')
      .or(`client_name.ilike.${term},title.ilike.${term}`)
      .order('date', { ascending: false })
      .limit(8);
    setSearchResults((data as SearchResult[]) || []);
    setSearchLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => runSearch(val), 300);
  };

  const handleSearchSelect = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    onNavigate?.('appointments');
  };

  const handleViewAllResults = () => {
    if (setGlobalSearch) setGlobalSearch(searchQuery);
    setShowSearch(false);
    onNavigate?.('archive');
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata?.full_name;
      const full = (meta && !meta.includes('@')) ? meta : 'Abigail Miller, Esq.';
      const parts = full.replace(/[,.]/g, '').split(' ').filter(Boolean);
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : full.slice(0, 2).toUpperCase()
      );
    });

    fetchNotifications();

    const channel = supabase
      .channel('topbar-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, fetchNotifications)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id: string) => {
    const stored: string[] = JSON.parse(localStorage.getItem('readNotifIds') || '[]');
    if (!stored.includes(id)) localStorage.setItem('readNotifIds', JSON.stringify([...stored, id]));
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const ids = notifs.map(n => n.id);
    localStorage.setItem('readNotifIds', JSON.stringify(ids));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: NotifItem) => {
    markRead(notif.id);
    setShowDropdown(false);
    onNavigate?.('appointments-requests');
  };

  const formatTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const statusColor: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    Requested: 'bg-amber-100 text-amber-700',
    'Pending Staff Confirmation': 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard';
      case 'appointments': return 'Appointments Overview';
      case 'appointments-requests': return 'Pending Requests';
      case 'appointments-confirmed': return 'Upcoming Appointments';
      case 'new-appointment': return 'New Appointment';
      case 'archive': return 'Archive';
      case 'availability': return 'My Availability';
      case 'settings': return 'Settings';
      default: return '';
    }
  };

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 gap-4">
      {/* Section Title (Desktop) */}
      <div className="hidden md:block w-48 shrink-0">
        <h2 className="font-semibold text-slate-800 text-lg truncate">
          {getSectionTitle()}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-lg" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSearch(true)}
            placeholder="Search clients or appointments…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}

          {showSearch && (
            <div className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              {searchLoading ? (
                <div className="px-5 py-4 text-sm text-slate-400 text-center">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-400 text-center">No results found</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      onClick={handleSearchSelect}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                    >
                      <div className="w-8 h-8 bg-[#D4AF37]/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-[#D4AF37]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.client_name || 'Unknown Client'}</p>
                        <p className="text-xs text-slate-500 truncate">{r.title}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[r.status] || 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </button>
                  ))}
                  {searchResults.length === 8 && (
                    <button
                      onClick={handleViewAllResults}
                      className="w-full text-center py-3 text-sm font-semibold text-[#D4AF37] hover:bg-[#F8FAFC] border-t border-[#1A2B3C]/5 transition-colors"
                    >
                      View all results for &quot;{searchQuery}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewAppointment}
          className="hidden sm:flex items-center gap-2 bg-[#D4AF37] text-[#1A2B3C] px-5 py-2 rounded-xl font-semibold text-sm hover:bg-[#C49D2E] transition-colors shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          New Appointment
        </button>

        <button
          onClick={onNewAppointment}
          className="sm:hidden w-9 h-9 bg-[#D4AF37] text-[#1A2B3C] rounded-xl flex items-center justify-center hover:bg-[#C49D2E] transition-colors"
          aria-label="New Appointment"
        >
          <Plus size={18} />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="relative w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-200"
          >
            <Bell size={17} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-11 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#D4AF37] hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Bell size={26} className="mb-2 opacity-30" />
                    <p className="text-sm">No new appointment requests</p>
                  </div>
                ) : (
                  notifs.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left ${!notif.read ? 'bg-[#D4AF37]/5' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-50 text-blue-500">
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{notif.title}</p>
                          {!notif.read && <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.subtitle}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatTime(notif.time)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
