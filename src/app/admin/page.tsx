'use client';

import { useState, useCallback } from 'react';
import {
  AdminSidebar,
  AdminTopBar,
  AdminNewAppointment,
  AdminSettings,
  AdminAvailability,
  AdminDashboard,
  AdminAppointmentsView,
} from '@/app/components/admin';

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const refreshStats = useCallback(() => {}, []);



  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <AdminDashboard
            onNavigate={setActiveSection}
            onStatusChange={refreshStats}
          />
        );

      case 'appointments-requests':
      case 'appointments-confirmed':
      case 'archive':
        return (
          <AdminAppointmentsView
            onStatusChange={refreshStats}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            searchQuery={globalSearch}
          />
        );

      case 'new-appointment':
        return (
          <AdminNewAppointment
            onCancel={() => setActiveSection('dashboard')}
            onSubmit={() => {
              refreshStats();
              setTimeout(() => setActiveSection('dashboard'), 2200);
            }}
          />
        );

      case 'availability':
        return (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B3C] mb-1" style={{ fontFamily: 'Playfair Display' }}>
              My Availability
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Block time slots to prevent booking on the landing page and in-office appointments.
            </p>
            <AdminAvailability />
          </div>
        );

      case 'settings':
        return (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A2B3C] mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Settings
            </h1>
            <AdminSettings />
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen">
      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <AdminTopBar
          activeSection={activeSection}
          onNewAppointment={() => setActiveSection('new-appointment')}
          onNavigate={setActiveSection}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
