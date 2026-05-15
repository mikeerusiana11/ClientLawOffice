import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { date, time } = await request.json() as { date?: string; time?: string };

    if (!date || !time) {
      return NextResponse.json({ error: 'Missing date or time' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, client_name, client_email, type')
      .eq('date', date)
      .eq('time', time)
      .in('status', ['Confirmed', 'Requested']);

    if (error) {
      console.error('Conflict check error:', error);
      return NextResponse.json({ conflicts: [] });
    }

    const conflicts = (appointments || []).map(apt => ({
      id: apt.id,
      client_name: apt.client_name || 'Unknown Client',
      client_email: apt.client_email || '',
      time,
      type: apt.type || 'General',
    }));

    return NextResponse.json({ conflicts });
  } catch (err) {
    console.error('Conflict check API error:', err);
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    );
  }
}