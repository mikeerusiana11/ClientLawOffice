'use client';

import { Scale, Lock, ChevronDown, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase';

export default function ClientTopNav() {
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState('');
  const [initials, setInitials] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const full = user.user_metadata?.full_name || user.email || 'Client';
      setUserName(full);
      const parts = full.split(' ');
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : full.slice(0, 2).toUpperCase()
      );
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="h-[70px] bg-white border-b border-[#1A2B3C]/10 shadow-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left Section - Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1A2B3C] text-sm font-bold">
          ⚖
        </div>
        <div>
          <h1 className="text-[#1A2B3C] font-semibold text-base" style={{ fontFamily: 'Playfair Display' }}>
            Miller Law Office
          </h1>
        </div>
        <span className="ml-4 bg-[#E2E8F0] text-[#64748B] text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Lock size={12} />
          Client Portal
        </span>
      </div>

      {/* Right Section - User Menu */}
      <div className="flex items-center gap-4 relative">
        <span className="text-sm text-[#64748B]">Welcome, {userName || 'Loading...'}</span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-[#D4AF37] text-[#1A2B3C] rounded-full flex items-center justify-center text-xs font-semibold">
            {initials || <User size={16} />}
          </div>
          <ChevronDown size={16} className="text-[#64748B]" />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-12 bg-white border border-[#1A2B3C]/10 rounded-lg shadow-lg py-2 min-w-[150px]">
            <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-[#1A2B3C] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
