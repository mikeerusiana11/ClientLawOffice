import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { section, content } = await request.json() as {
      section: string;
      content: unknown;
    };

    if (!section || content === undefined) {
      return NextResponse.json({ error: 'Missing section or content' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('site_content')
      .upsert(
        { section, content, updated_at: new Date().toISOString() },
        { onConflict: 'section' }
      );

    if (error) {
      console.error('site_content upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('site-content API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
