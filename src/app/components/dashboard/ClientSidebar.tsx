'use client';

import { Calendar, HelpCircle, FileText, Phone, Plus } from 'lucide-react';

interface ClientSidebarProps {
  activeSection: 'schedule' | 'new-appointment';
  setActiveSection: (section: 'schedule' | 'new-appointment') => void;
}

export default function ClientSidebar({ activeSection, setActiveSection }: ClientSidebarProps) {

  const navItems = [
    { icon: <Calendar size={18} />, label: 'Schedule', id: 'schedule' as const },
    { icon: <Plus size={18} />, label: 'Request Appointment', id: 'new-appointment' as const },
  ];

  return (
    <div className="w-[240px] bg-[#F8FAFC] h-[calc(100vh-70px)] border-r border-[#1A2B3C]/10 p-6 flex flex-col">
      {/* Navigation Items */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeSection === item.id
                ? 'bg-[#1A2B3C]/10 text-[#1A2B3C] border-l-4 border-[#D4AF37]'
                : 'text-[#64748B] hover:bg-white/50 text-[#1A2B3C]/60'
            }`}
          >
            <div className={activeSection === item.id ? 'text-[#D4AF37]' : ''}>
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Links */}
      <div className="pt-6 border-t border-[#1A2B3C]/10 space-y-3">
        <button className="w-full flex items-center gap-2 px-4 py-3 text-[#1A2B3C] text-sm font-medium hover:bg-white rounded-lg transition-colors">
          <HelpCircle size={16} />
          Help & Support
        </button>
        <button className="w-full flex items-center gap-2 px-4 py-3 text-[#1A2B3C] text-sm font-medium hover:bg-white rounded-lg transition-colors">
          <FileText size={16} />
          Privacy Policy
        </button>
        <button className="w-full flex items-center gap-2 px-4 py-3 border-2 border-[#D4AF37] text-[#1A2B3C] text-sm font-medium rounded-lg hover:bg-[#D4AF37] hover:text-white transition-colors">
          <Phone size={16} />
          Contact Attorney
        </button>
      </div>
    </div>
  );
}
