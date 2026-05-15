import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('appointments')
      .select('id, client_name, client_email, user_id, date, time, title, type, status, attorney')
      .eq('id', appointmentId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    let email = data.client_email as string | null;
    let name = data.client_name as string | null;

    // For client-dashboard appointments, look up email from auth
    if (!email && data.user_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(data.user_id as string);
        email = userData?.user?.email ?? null;
        if (!name && userData?.user?.user_metadata?.full_name) {
          name = userData.user.user_metadata.full_name as string;
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      id: data.id,
      clientName: name,
      clientEmail: email,
      date: data.date,
      time: data.time,
      title: data.title,
      type: data.type,
      status: data.status,
      attorney: data.attorney,
    });
  } catch (err) {
    console.error('Appointment info error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
