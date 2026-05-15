import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Json } from '@/types/database';

type SiteContentRow = {
  id: string;
  section: string | null;
  content: Json | null;
  updated_at: string | null;
};

export async function GET() {
  try {
    const supabase = createAdminClient();

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

    return NextResponse.json({ sections });
  } catch (err) {
    console.error('site-content GET error:', err);
    return NextResponse.json({ sections: {} });
  }
}
