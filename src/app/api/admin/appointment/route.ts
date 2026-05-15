import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const ALLOWED_STATUSES = ['Requested', 'Confirmed', 'Cancelled', 'Completed', 'Needs Reschedule'] as const;
type AppointmentStatus = typeof ALLOWED_STATUSES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, clientPhone, title, date, time, type, method, status, notes } = body;

    if (!clientName || !clientEmail || !title || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const finalStatus: AppointmentStatus = ALLOWED_STATUSES.includes(status)
      ? status
      : 'Confirmed';

    const supabase = createAdminClient();

    const { error: dbError } = await supabase.from('appointments').insert({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || null,
      title,
      date,
      time,
      type,
      method,
      status: finalStatus,
      notes: notes || null,
      attorney: 'Abigail Miller',
    });

    if (dbError) {
      console.error('Admin appointment insert error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Appointment created successfully' }, { status: 200 });
  } catch (err) {
    console.error('Admin appointment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
