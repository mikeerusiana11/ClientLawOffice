'use client';

import { Calendar, Settings, LogOut, ChevronDown, AlertCircle, CheckCircle, History, Clock, Menu, X, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const [adminName, setAdminName] = useState('');
  const [initials, setInitials] = useState('AM');
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const supabase = createClient();

  const isApptActive = activeSection === 'appointments-requests' || activeSection === 'appointments-confirmed' || activeSection === 'archive';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata?.full_name;
      const full = (meta && !meta.includes('@')) ? meta : 'Abigail Miller, Esq.';
      setAdminName(full);
      const parts = full.replace(/[,.]/g, '').split(' ').filter(Boolean);
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : full.slice(0, 2).toUpperCase()
      );
    });

    const fetchPending = async () => {
      const [pendingRes, confirmedRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Requested', 'Pending Staff Confirmation']),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Confirmed'),
      ]);
      setPendingCount(pendingRes.count ?? 0);
      setConfirmedCount(confirmedRes.count ?? 0);
    };
    fetchPending();

    const channel = supabase
      .channel('sidebar-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchPending)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    setIsMobileOpen(false);
  };

  const NavItem = ({ id, icon, label, badge }: { id: string; icon: React.ReactNode; label: string; badge?: number }) => (
    <button
      onClick={() => handleNavigate(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeSection === id
          ? 'bg-white/10 text-[#D4AF37] border-l-4 border-[#D4AF37]'
          : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
      }`}
    >
      <span className={activeSection === id ? 'text-[#D4AF37]' : 'text-white/70'}>{icon}</span>
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="w-6 h-6 bg-amber-400 text-[#1A2B3C] rounded-full flex items-center justify-center text-xs font-bold">
          {badge}
        </span>
      )}
    </button>
  );

  const SidebarContent = () => (
    <div className="w-[280px] bg-[#1A2B3C] h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1A2B3C] font-bold text-sm">
            ⚖
          </div>
          <h1 className="text-white font-semibold text-base" style={{ fontFamily: 'Playfair Display' }}>
            Miller Law Office
          </h1>
        </div>
        <button
          className="md:hidden text-white/60 hover:text-white"
          onClick={() => setIsMobileOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {/* Dashboard */}
        <NavItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />

        {/* Appointments */}
        <button
          onClick={() => handleNavigate('appointments-requests')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isApptActive
              ? 'bg-white/10 text-[#D4AF37] border-l-4 border-[#D4AF37]'
              : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
          }`}
        >
          <Calendar size={20} className={isApptActive ? 'text-[#D4AF37]' : 'text-white/70'} />
          <span className="text-sm font-medium flex-1 text-left">Appointments</span>
          {pendingCount > 0 && (
            <span className="w-6 h-6 bg-amber-400 text-[#1A2B3C] rounded-full flex items-center justify-center text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </button>



        {/* Availability */}
        <NavItem id="availability" icon={<Clock size={20} />} label="My Availability" />

        {/* Settings */}
        <NavItem id="settings" icon={<Settings size={20} />} label="Settings" />


      </nav>

      {/* User Profile */}
      <div className="p-5 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1A2B3C] font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{adminName || 'Administrator'}</p>
            <p className="text-white/50 text-xs">Attorney</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#1A2B3C] rounded-lg flex items-center justify-center text-white shadow-lg"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 border-r border-slate-200/20">
        <SidebarContent />
      </div>
    </>
  );
}
