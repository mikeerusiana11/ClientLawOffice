import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

const AVAILABLE_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, newDate, newTime } = await request.json() as {
      appointmentId: string;
      newDate: string;
      newTime: string;
    };

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!AVAILABLE_SLOTS.includes(newTime)) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (newDate <= todayStr) {
      return NextResponse.json({ error: 'Cannot reschedule to today or a past date.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch appointment and verify ownership
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, user_id, date, time, title, type, method, client_name, client_email')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify the new slot is available (exclude current appointment from conflict check)
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', newDate)
      .eq('time', newTime)
      .neq('id', appointmentId)
      .in('status', ['Confirmed', 'Requested', 'Needs Reschedule', 'Pending Staff Confirmation']);

    const { data: unavailable } = await supabase
      .from('attorney_unavailable_slots')
      .select('id')
      .eq('date', newDate)
      .eq('time', newTime);

    if ((conflicts && conflicts.length > 0) || (unavailable && unavailable.length > 0)) {
      return NextResponse.json({ error: 'This time slot is no longer available. Please choose another.' }, { status: 409 });
    }

    // Save new date/time and set to Pending Staff Confirmation — admin must approve
    const { error: updateErr } = await supabase
      .from('appointments')
      .update({ date: newDate, time: newTime, status: 'Pending Staff Confirmation' })
      .eq('id', appointmentId);

    if (updateErr) {
      console.error('Reschedule update error:', updateErr);
      return NextResponse.json({ error: 'Failed to submit reschedule request' }, { status: 500 });
    }

    // Email is sent by admin when they confirm — nothing to send here

    return NextResponse.json({ message: 'Reschedule request submitted. Awaiting staff confirmation.' }, { status: 200 });
  } catch (err) {
    console.error('Reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
