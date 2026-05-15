'use client';

import { AdminAppointmentsTable, AdminHistory } from '@/app/components/admin';

type ApptSection = 'appointments-requests' | 'appointments-confirmed' | 'archive';

export default function AdminAppointmentsView({
  onStatusChange,
  activeSection,
  setActiveSection,
  searchQuery,
}: {
  onStatusChange: () => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  searchQuery?: string;
}) {
  const tabs: { id: ApptSection; label: string }[] = [
    { id: 'appointments-requests', label: 'Pending Requests' },
    { id: 'appointments-confirmed', label: 'Upcoming' },
    { id: 'archive', label: 'Archive' },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B3C] mb-6" style={{ fontFamily: 'Playfair Display' }}>
        Appointments
      </h1>

      {/* Horizontal Tabs */}
      <div className="flex gap-1 bg-white border border-[#1A2B3C]/10 rounded-2xl p-1.5 mb-6 w-fit shadow-sm flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === tab.id ? 'bg-[#1A2B3C] text-white shadow' : 'text-[#64748B] hover:text-[#1A2B3C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'appointments-requests' && (
        <AdminAppointmentsTable
          onStatusChange={onStatusChange}
          focusSection="requests"
        />
      )}

      {activeSection === 'appointments-confirmed' && (
        <AdminAppointmentsTable
          onStatusChange={onStatusChange}
          focusSection="confirmed"
        />
      )}

      {activeSection === 'archive' && (
        <AdminHistory onStatusChange={onStatusChange} initialSearchQuery={searchQuery} />
      )}
    </div>
  );
}
