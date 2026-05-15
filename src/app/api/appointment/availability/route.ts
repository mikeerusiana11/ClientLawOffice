import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Available time slots (1 hour per appointment)
const AVAILABLE_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json() as { date?: string };
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Check booked appointment slots
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', date)
      .in('status', ['Confirmed', 'Requested', 'Needs Reschedule', 'Pending Staff Confirmation']);

    // Check attorney unavailable slots
    const { data: unavailableSlots, error: unavailError } = await supabase
      .from('attorney_unavailable_slots')
      .select('time')
      .eq('date', date);

    if (apptError) {
      console.error('Appointment check error:', apptError);
    }
    if (unavailError) {
      console.error('Unavailability check error:', unavailError);
    }

    const bookedTimes = (appointments || [])
      .map((apt: { time: string | null }) => apt.time)
      .filter((time): time is string => time !== null && time !== undefined);

    const attorneyUnavailableTimes = (unavailableSlots || [])
      .map((slot: { time: string | null }) => slot.time)
      .filter((time): time is string => time !== null && time !== undefined);

    const unavailableTimes = [...new Set([...bookedTimes, ...attorneyUnavailableTimes])];
    const availableSlots = AVAILABLE_SLOTS.filter(slot => !unavailableTimes.includes(slot));

    return NextResponse.json({
      date,
      available_slots: availableSlots,
      booked_slots: bookedTimes,
      attorney_unavailable_slots: attorneyUnavailableTimes,
      total_available: availableSlots.length,
    });
  } catch (err) {
    console.error('Availability API error:', err);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
