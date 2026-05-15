'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Bell, Save, Eye, EyeOff, CheckCircle, Palette, Phone, Mail, MapPin, Globe, Clock, Briefcase, Image } from 'lucide-react';
import { createClient } from '../../../lib/supabase';
import { saveSiteSection, invalidateSiteContentCache, DEFAULT_CONTACT, DEFAULT_HERO, DEFAULT_SOCIAL, DEFAULT_SERVICES } from '../../hooks/useSiteContent';
import type { SiteContactContent, SiteHeroContent, SiteSocialContent, SiteService } from '../../hooks/useSiteContent';

type Tab = 'profile' | 'office' | 'notifications' | 'customize';
type CustomizeTab = 'contact' | 'services' | 'hero' | 'social';

interface NotifPrefs {
  newAppointment: boolean;
  appointmentCancelled: boolean;
  dailySummary: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface SiteContent {
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hoursWeekday: string;
  hoursSat: string;
  hoursSun: string;
  heroHeadline: string;
  heroSubheadline: string;
  firmDescription: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  services: Service[];
}

const DEFAULT_CONTENT: SiteContent = {
  phone: '+63 9176317120',
  email: 'attyabigailtmiller@gmail.com',
  address: '878R+W4, Dumaguete City, Negros Oriental, Philippines',
  mapUrl: '',
  hoursWeekday: '9:00 AM - 5:00 PM',
  hoursSat: 'By Appointment',
  hoursSun: 'Closed',
  heroHeadline: 'Trusted Legal Counsel for Every Challenge',
  heroSubheadline: 'Providing reliable, ethical, and practical legal services to individuals, families, and businesses.',
  firmDescription: 'Boutique solo practice providing reliable, ethical, and practical legal services.',
  facebook: '',
  instagram: '',
  linkedin: '',
  services: [
    { id: '1', title: 'Civil & Criminal', description: 'Property disputes, breach of contract, debt recovery, and criminal defense.', icon: '⚖️' },
    { id: '2', title: 'Family Law', description: 'Family law issues, special proceedings, and matters affecting your family.', icon: '👨‍👩‍👧‍👦' },
    { id: '3', title: 'Real Estate', description: 'Property and real estate transactions, documentation, and dispute resolution.', icon: '🏠' },
    { id: '4', title: 'Estate Planning', description: 'Estate settlement, inheritance matters, and succession planning.', icon: '📋' },
    { id: '5', title: 'Corporate & Business', description: 'Business registration, corporate matters, contracts, and legal documentation.', icon: '💼' },
    { id: '6', title: 'Notarial Services', description: 'Document authentication, certification, and notarization services.', icon: '✍️' },
  ],
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [customizeTab, setCustomizeTab] = useState<CustomizeTab>('contact');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Profile
  const [fullName, setFullName] = useState('Abigail Miller, Esq.');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    newAppointment: true,
    appointmentCancelled: true,
    dailySummary: false,
  });

  // Site Content (CMS)
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [initialContent, setInitialContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [cmsSaving, setCmsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail(user.email || '');
      const meta = user.user_metadata;
      if (meta?.full_name && !meta.full_name.includes('@')) setFullName(meta.full_name);
    });
    const stored = localStorage.getItem('adminNotifPrefs');
    if (stored) setNotifPrefs(JSON.parse(stored));
    // Load CMS from API (public read endpoint)
    fetch('/api/site-content')
      .then(r => r.json())
      .then(({ sections }) => {
        if (!sections) return;
        const c = sections.contact as SiteContactContent | undefined;
        const h = sections.hero as SiteHeroContent | undefined;
        const s = sections.social as SiteSocialContent | undefined;
        const sv = sections.services as SiteService[] | undefined;
        const loadedContent = {
          ...prev,
          ...(c ?? {}),
          ...(h ?? {}),
          ...(s ?? {}),
          services: sv ?? prev.services,
        };
        setContent(loadedContent);
        setInitialContent(loadedContent);
      })
      .catch(() => {});
  }, []);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const saveProfile = async () => {
    setProfileSaving(true); setProfileError('');
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) { setProfileError(error.message); return; }
      if (newPassword) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwErr) { setProfileError(pwErr.message); return; }
        setNewPassword('');
      }
      showSaved();
    } finally { setProfileSaving(false); }
  };

  const saveNotifs = () => {
    localStorage.setItem('adminNotifPrefs', JSON.stringify(notifPrefs));
    showSaved();
  };

  const saveCms = async (sectionKey: CustomizeTab) => {
    setCmsSaving(true);
    let payload: unknown;
    if (sectionKey === 'contact') {
      payload = {
        phone: content.phone, email: content.email, address: content.address,
        mapUrl: content.mapUrl, hoursWeekday: content.hoursWeekday,
        hoursSat: content.hoursSat, hoursSun: content.hoursSun,
      };
    } else if (sectionKey === 'hero') {
      payload = {
        heroHeadline: content.heroHeadline,
        heroSubheadline: content.heroSubheadline,
        firmDescription: content.firmDescription,
      };
    } else if (sectionKey === 'social') {
      payload = { facebook: content.facebook, instagram: content.instagram, linkedin: content.linkedin };
    } else {
      payload = content.services;
    }
    const ok = await saveSiteSection(sectionKey, payload);
    setCmsSaving(false);
    if (ok) {
      setInitialContent(content);
      showSaved();
    }
  };

  const updateService = (id: string, field: keyof Service, value: string) => {
    setContent(c => ({ ...c, services: c.services.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  };

  const addService = () => {
    setContent(c => ({
      ...c,
      services: [...c.services, { id: Date.now().toString(), title: '', description: '', icon: '⚖️' }],
    }));
  };

  const removeService = (id: string) => {
    setContent(c => ({ ...c, services: c.services.filter(s => s.id !== id) }));
  };

  const inputClass = 'w-full border border-[#1A2B3C]/20 rounded-xl px-4 py-3 text-sm text-[#1A2B3C] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 bg-[#F8FAFC]';
  const labelClass = 'block text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1.5';
  const saveBtn = 'flex items-center gap-2 bg-[#1A2B3C] text-white px-6 py-3 rounded-xl hover:bg-[#2a3f54] transition-colors text-sm font-medium disabled:opacity-50';

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#D4AF37]' : 'bg-[#CBD5E1]'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'customize', label: 'Customize Site', icon: <Palette size={16} /> },
  ];

  const customizeTabs: { id: CustomizeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'contact', label: 'Contact & Hours', icon: <Phone size={14} /> },
    { id: 'services', label: 'Services', icon: <Briefcase size={14} /> },
    { id: 'hero', label: 'Hero & About', icon: <Image size={14} /> },
    { id: 'social', label: 'Social Links', icon: <Globe size={14} /> },
  ];

  const hasUnsavedCms = JSON.stringify(content) !== JSON.stringify(initialContent);
  const [unsavedWarning, setUnsavedWarning] = useState<{ onDiscard: () => void } | null>(null);

  const guardUnsaved = (onContinue: () => void) => {
    if (hasUnsavedCms) {
      setUnsavedWarning({ onDiscard: () => { setContent(initialContent); onContinue(); setUnsavedWarning(null); } });
    } else {
      onContinue();
    }
  };

  const handleMainTabClick = (tabId: Tab) => {
    if (tabId === activeTab) return;
    if (activeTab === 'customize') {
      guardUnsaved(() => setActiveTab(tabId));
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCustomizeTabClick = (ctId: CustomizeTab) => {
    if (ctId === customizeTab) return;
    guardUnsaved(() => setCustomizeTab(ctId));
  };

  return (
    <div className="max-w-3xl">

      {/* Unsaved changes modal */}
      {unsavedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border-2 border-amber-200">
            <h3 className="text-lg font-bold text-[#1A2B3C] mb-2">Unsaved Changes</h3>
            <p className="text-sm text-[#64748B] mb-6">You have unsaved changes on this section. What would you like to do?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { saveCms(customizeTab).then(() => { unsavedWarning.onDiscard(); }); setUnsavedWarning(null); }}
                className="flex-1 bg-[#D4AF37] text-[#1A2B3C] font-bold py-2.5 rounded-xl hover:bg-[#C49D2E] transition-colors text-sm"
              >
                Save & Continue
              </button>
              <button
                onClick={unsavedWarning.onDiscard}
                className="flex-1 bg-red-50 text-red-700 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
              >
                Discard
              </button>
              <button
                onClick={() => setUnsavedWarning(null)}
                className="flex-1 bg-[#F8FAFC] border border-[#1A2B3C]/20 text-[#1A2B3C] font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="flex gap-1 bg-white border border-[#1A2B3C]/10 rounded-2xl p-1.5 mb-8 w-fit shadow-sm flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleMainTabClick(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-[#1A2B3C] text-white shadow' : 'text-[#64748B] hover:text-[#1A2B3C]'
            }`}
          >
            {tab.icon}{tab.label}
            {tab.id === 'customize' && hasUnsavedCms && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
            )}
          </button>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
          <CheckCircle size={16} /> Changes saved successfully
        </div>
      )}

      {/* ── Profile ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>Profile Settings</h2>
            <p className="text-sm text-[#64748B] mt-1">Update your display name and account password.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#1A2B3C] font-bold text-xl">
              {fullName.replace(/[,.]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'AM'}
            </div>
            <div>
              <p className="font-semibold text-[#1A2B3C]">{fullName}</p>
              <p className="text-sm text-[#64748B]">Administrator · Attorney</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Display Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Abigail Miller, Esq." />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input value={email} readOnly className={inputClass + ' opacity-60 cursor-not-allowed'} />
            <p className="text-xs text-[#94A3B8] mt-1">Email cannot be changed here.</p>
          </div>
          <div className="border-t border-[#1A2B3C]/10 pt-6">
            <h3 className="text-sm font-semibold text-[#1A2B3C] mb-4">Change Password</h3>
            <label className={labelClass}>New Password</label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className={inputClass + ' pr-10'} />
              <button onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
          <button onClick={saveProfile} disabled={profileSaving} className={saveBtn}>
            <Save size={16} />{profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1A2B3C]" style={{ fontFamily: 'Playfair Display' }}>Notification Preferences</h2>
            <p className="text-sm text-[#64748B] mt-1">Choose what triggers a notification in the portal.</p>
          </div>
          <div className="space-y-5">
            {([
              { key: 'newAppointment', label: 'New Appointment Request', desc: 'When a client books or requests a new appointment' },
              { key: 'appointmentCancelled', label: 'Appointment Cancelled', desc: 'When a client cancels their appointment' },
              { key: 'dailySummary', label: 'Daily Summary', desc: "Today's schedule shown on dashboard load" },
            ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map(item => (
              <div key={item.key} className="flex items-center justify-between py-4 border-b border-[#1A2B3C]/5 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#1A2B3C]">{item.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                </div>
                <Toggle checked={notifPrefs[item.key]} onChange={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key] }))} />
              </div>
            ))}
          </div>
          <button onClick={saveNotifs} className={saveBtn}><Save size={16} />Save Preferences</button>
        </div>
      )}

      {/* ── Customize Site (CMS) ── */}
      {activeTab === 'customize' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#1A2B3C] mb-1" style={{ fontFamily: 'Playfair Display' }}>Customize Landing Page</h2>
            <p className="text-sm text-[#64748B]">Changes here will update the public website automatically.</p>
          </div>

          {/* Customize Sub-tabs */}
          <div className="flex gap-1 bg-white border border-[#1A2B3C]/10 rounded-xl p-1 w-fit shadow-sm flex-wrap">
            {customizeTabs.map(ct => (
              <button
                key={ct.id}
                onClick={() => handleCustomizeTabClick(ct.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  customizeTab === ct.id ? 'bg-[#D4AF37] text-[#1A2B3C] shadow' : 'text-[#64748B] hover:text-[#1A2B3C]'
                }`}
              >
                {ct.icon}{ct.label}
              </button>
            ))}
          </div>

          {/* Contact & Hours */}
          {customizeTab === 'contact' && (
            <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
              <h3 className="font-semibold text-[#1A2B3C] flex items-center gap-2"><Phone size={16} className="text-[#D4AF37]" />Contact Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input value={content.phone} onChange={e => setContent(c => ({ ...c, phone: e.target.value }))} className={inputClass} placeholder="+63 9176317120" />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input value={content.email} onChange={e => setContent(c => ({ ...c, email: e.target.value }))} className={inputClass} placeholder="attorney@email.com" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}><MapPin size={12} className="inline mr-1" />Office Address</label>
                  <textarea value={content.address} onChange={e => setContent(c => ({ ...c, address: e.target.value }))} rows={2} className={inputClass} placeholder="Full address..." />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}><Globe size={12} className="inline mr-1" />Google Maps Embed URL</label>
                  <input value={content.mapUrl} onChange={e => setContent(c => ({ ...c, mapUrl: e.target.value }))} className={inputClass} placeholder="https://maps.google.com/..." />
                </div>
              </div>

              <div className="border-t border-[#1A2B3C]/10 pt-6">
                <h3 className="font-semibold text-[#1A2B3C] flex items-center gap-2 mb-4"><Clock size={16} className="text-[#D4AF37]" />Office Hours</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Mon – Fri</label>
                    <input value={content.hoursWeekday} onChange={e => setContent(c => ({ ...c, hoursWeekday: e.target.value }))} className={inputClass} placeholder="9:00 AM - 5:00 PM" />
                  </div>
                  <div>
                    <label className={labelClass}>Saturday</label>
                    <input value={content.hoursSat} onChange={e => setContent(c => ({ ...c, hoursSat: e.target.value }))} className={inputClass} placeholder="By Appointment" />
                  </div>
                  <div>
                    <label className={labelClass}>Sunday</label>
                    <input value={content.hoursSun} onChange={e => setContent(c => ({ ...c, hoursSun: e.target.value }))} className={inputClass} placeholder="Closed" />
                  </div>
                </div>
              </div>
              <button onClick={() => saveCms('contact')} disabled={cmsSaving} className={saveBtn}><Save size={16} />{cmsSaving ? 'Saving...' : 'Save Contact & Hours'}</button>
            </div>
          )}

          {/* Services */}
          {customizeTab === 'services' && (
            <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1A2B3C] flex items-center gap-2"><Briefcase size={16} className="text-[#D4AF37]" />Practice Area Services</h3>
                <button onClick={addService} className="text-sm text-[#D4AF37] font-semibold hover:underline">+ Add Service</button>
              </div>
              <div className="space-y-4">
                {content.services.map((svc, i) => (
                  <div key={svc.id} className="bg-[#F8FAFC] border border-[#1A2B3C]/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Service {i + 1}</span>
                      <button onClick={() => removeService(svc.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className={labelClass}>Icon (emoji)</label>
                        <input value={svc.icon} onChange={e => updateService(svc.id, 'icon', e.target.value)} className={inputClass} placeholder="⚖️" />
                      </div>
                      <div className="col-span-3">
                        <label className={labelClass}>Title</label>
                        <input value={svc.title} onChange={e => updateService(svc.id, 'title', e.target.value)} className={inputClass} placeholder="Civil & Criminal" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea value={svc.description} onChange={e => updateService(svc.id, 'description', e.target.value)} rows={2} className={inputClass} placeholder="Brief description of this service..." />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => saveCms('services')} disabled={cmsSaving} className={saveBtn}><Save size={16} />{cmsSaving ? 'Saving...' : 'Save Services'}</button>
            </div>
          )}

          {/* Hero & About */}
          {customizeTab === 'hero' && (
            <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
              <h3 className="font-semibold text-[#1A2B3C] flex items-center gap-2"><Image size={16} className="text-[#D4AF37]" />Hero Section & About</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Hero Headline</label>
                  <input value={content.heroHeadline} onChange={e => setContent(c => ({ ...c, heroHeadline: e.target.value }))} className={inputClass} placeholder="Trusted Legal Counsel..." />
                </div>
                <div>
                  <label className={labelClass}>Hero Subheadline</label>
                  <textarea value={content.heroSubheadline} onChange={e => setContent(c => ({ ...c, heroSubheadline: e.target.value }))} rows={2} className={inputClass} placeholder="Supporting tagline..." />
                </div>
                <div>
                  <label className={labelClass}>Firm Description (Footer & About)</label>
                  <textarea value={content.firmDescription} onChange={e => setContent(c => ({ ...c, firmDescription: e.target.value }))} rows={3} className={inputClass} placeholder="Boutique solo practice providing..." />
                </div>
              </div>
              <button onClick={() => saveCms('hero')} disabled={cmsSaving} className={saveBtn}><Save size={16} />{cmsSaving ? 'Saving...' : 'Save Hero & About'}</button>
            </div>
          )}

          {/* Social Links */}
          {customizeTab === 'social' && (
            <div className="bg-white rounded-2xl border border-[#1A2B3C]/10 shadow-sm p-8 space-y-6">
              <h3 className="font-semibold text-[#1A2B3C] flex items-center gap-2"><Globe size={16} className="text-[#D4AF37]" />Social Media Links</h3>
              <div className="space-y-4">
                {[
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
                ].map(item => (
                  <div key={item.key}>
                    <label className={labelClass}>{item.label}</label>
                    <input
                      value={content[item.key as keyof SiteContent] as string}
                      onChange={e => setContent(c => ({ ...c, [item.key]: e.target.value }))}
                      className={inputClass}
                      placeholder={item.placeholder}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => saveCms('social')} disabled={cmsSaving} className={saveBtn}><Save size={16} />{cmsSaving ? 'Saving...' : 'Save Social Links'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}