import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase-admin';
import { rateLimit, getIp } from '@/lib/rate-limit';
import type { Json } from '@/types/database';

type SiteContentRow = {
  id: string;
  section: string | null;
  content: Json | null;
  updated_at: string | null;
};

export async function GET(request: NextRequest) {
  if (!rateLimit(`site-content:${getIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { sections: {} },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('site_content')
      .select('id, section, content, updated_at') as {
        data: SiteContentRow[] | null;
        error: unknown;
      };

    if (error) {
      console.error('site_content fetch error:', error);
      return NextResponse.json({ sections: {} });
    }

    const sections: Record<string, unknown> = {};
    for (const row of data ?? []) {
      if (row.section) sections[row.section] = row.content;
    }

    return NextResponse.json({ sections }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('site-content GET error:', err);
    return NextResponse.json({ sections: {} });
  }
}
