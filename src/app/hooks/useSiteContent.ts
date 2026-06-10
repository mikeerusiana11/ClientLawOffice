'use client';

import { useEffect, useState } from 'react';

export interface SiteService {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface SiteContactContent {
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hoursWeekday: string;
  hoursSat: string;
  hoursSun: string;
}

export interface SiteHeroContent {
  heroHeadline: string;
  heroSubheadline: string;
  firmDescription: string;
}

export interface SiteSocialContent {
  facebook: string;
  instagram: string;
  linkedin: string;
}

export const DEFAULT_CONTACT: SiteContactContent = {
  phone: '+63 917 631 7120',
  email: 'attyabigailtmiller@gmail.com',
  address: '878R+W4, Dumaguete City, Negros Oriental, Philippines',
  mapUrl: '',
  hoursWeekday: '9:00 AM - 5:00 PM',
  hoursSat: 'By Appointment',
  hoursSun: 'Closed',
};

export const DEFAULT_HERO: SiteHeroContent = {
  heroHeadline: 'Reliable Legal Services for Every Life Matter',
  heroSubheadline: 'Miller Law Office provides ethical, practical legal solutions for civil, criminal, family law, real estate, estate planning, and corporate matters.',
  firmDescription: 'Boutique solo practice providing reliable, ethical, and practical legal services to individuals, families, and businesses.',
};

export const DEFAULT_SOCIAL: SiteSocialContent = {
  facebook: '',
  instagram: '',
  linkedin: '',
};

export const DEFAULT_SERVICES: SiteService[] = [
  { id: '1', title: 'Family & Personal Law', description: 'Custody, annulment, legal separation, child support, and other family and personal legal matters.', icon: 'Users' },
  { id: '2', title: 'Property & Real Estate', description: 'Property disputes, real estate transactions, contracts, documentation, and legal compliance.', icon: 'Home' },
  { id: '3', title: 'Business & Corporate Law', description: 'Business registration, corporate matters, contracts, compliance, and legal documentation.', icon: 'Briefcase' },
  { id: '4', title: 'Civil & Criminal Defense', description: 'Civil litigation, breach of contract, debt recovery, criminal defense, and dispute resolution.', icon: 'Scale' },
  { id: '5', title: 'Estate Planning', description: 'Estate settlement, inheritance matters, and succession planning.', icon: 'ScrollText' },
  { id: '6', title: 'Notarial Services', description: 'Document authentication, certification, and notarization services.', icon: 'PenLine' },
];

interface SiteContentResult {
  contact: SiteContactContent;
  hero: SiteHeroContent;
  social: SiteSocialContent;
  services: SiteService[];
  loading: boolean;
}

let cache: Record<string, unknown> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useSiteContent(): SiteContentResult {
  const [sections, setSections] = useState<Record<string, unknown>>(cache ?? {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) {
      setSections(cache);
      setLoading(false);
      return;
    }

    fetch('/api/site-content')
      .then(r => r.json())
      .then(({ sections: s }) => {
        cache = s ?? {};
        cacheTime = Date.now();
        setSections(cache!);
      })
      .catch((err) => { console.error('Failed to load site content, using defaults:', err); })
      .finally(() => setLoading(false));
  }, []);

  return {
    contact: sections.contact ? (sections.contact as SiteContactContent) : DEFAULT_CONTACT,
    hero: sections.hero ? (sections.hero as SiteHeroContent) : DEFAULT_HERO,
    social: sections.social ? (sections.social as SiteSocialContent) : DEFAULT_SOCIAL,
    services: sections.services ? (sections.services as SiteService[]) : DEFAULT_SERVICES,
    loading,
  };
}

/** Call this from AdminSettings after saving to bust the in-memory cache */
export function invalidateSiteContentCache() {
  cache = null;
  cacheTime = 0;
}

/** Save a single section to the API */
export async function saveSiteSection(section: string, content: unknown): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, content }),
    });
    if (res.ok) {
      invalidateSiteContentCache();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}