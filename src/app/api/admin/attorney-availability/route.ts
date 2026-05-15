import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('attorney_unavailable_slots')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Unavailability fetch error:', error);
      return NextResponse.json({ slots: [] });
    }

    return NextResponse.json({ slots: data || [] });
  } catch (err) {
    console.error('Unavailability API error:', err);
    return NextResponse.json({ slots: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, date, time, notifyClients } = await request.json() as {
      action: 'add' | 'remove';
      date?: string;
      time?: string;
      notifyClients?: boolean;
    };

    if (!action || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === 'add') {
      const { error: dbError } = await supabase
        .from('attorney_unavailable_slots')
        .upsert(
          { date, time, reason: 'Attorney unavailable' },
          { onConflict: 'date,time' }
        );

      if (dbError) {
        console.error('Add unavailable slot error:', dbError);
        return NextResponse.json(
          { error: 'Failed to mark as unavailable' },
          { status: 500 }
        );
      }

      // Re-query conflicts inside the handler — do not trust the client-supplied list
      const { data: conflicts, error: conflictErr } = await supabase
        .from('appointments')
        .select('id, client_name, client_email, type')
        .eq('date', date)
        .eq('time', time)
        .in('status', ['Confirmed', 'Requested']);

      if (conflictErr) {
        console.error('Conflict re-query error:', conflictErr);
      }

      const conflictList = conflicts || [];

      // Mark conflicting appointments as Needs Reschedule
      if (conflictList.length > 0) {
        const ids = conflictList.map(c => c.id);
        const { error: updateErr } = await supabase
          .from('appointments')
          .update({ status: 'Needs Reschedule' })
          .in('id', ids);

        if (updateErr) {
          console.error('Failed to mark conflicts as Needs Reschedule:', updateErr);
        }
      }

      // Send notifications if requested
      if (notifyClients && conflictList.length > 0) {
        const notifications = conflictList
          .filter(c => c.client_email)
          .map(c => ({
            appointmentId: c.id as string,
            clientEmail: c.client_email as string,
            clientName: c.client_name || 'Client',
            originalDate: date,
            originalTime: time,
          }));

        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

          const cookie = request.headers.get('cookie') || '';

          const notificationRes = await fetch(`${baseUrl}/api/admin/attorney-availability/send-notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie },
            body: JSON.stringify({ notifications }),
          });

          if (!notificationRes.ok) {
            console.error('Failed to send notifications', await notificationRes.text());
          }
        } catch (err) {
          console.error('Error sending notifications:', err);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Slot marked as unavailable',
        conflictsUpdated: conflictList.length,
      });
    } else if (action === 'remove') {
      const { error: dbError } = await supabase
        .from('attorney_unavailable_slots')
        .delete()
        .eq('date', date)
        .eq('time', time);

      if (dbError) {
        console.error('Remove unavailable slot error:', dbError);
        return NextResponse.json(
          { error: 'Failed to mark as available' },
          { status: 500 }
        );
      }

      // Restore any appointments that were set to Needs Reschedule due to this slot
      const { data: toRestore } = await supabase
        .from('appointments')
        .select('id, client_name, client_email, user_id, title, type, method, date, time')
        .eq('date', date)
        .eq('time', time)
        .eq('status', 'Needs Reschedule');

      const restoredList = toRestore || [];

      if (restoredList.length > 0) {
        const ids = restoredList.map((a: { id: string }) => a.id);
        await supabase
          .from('appointments')
          .update({ status: 'Confirmed' })
          .in('id', ids);

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const cookie = request.headers.get('cookie') || '';
        const formatDate = (d: string) =>
          new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          });

        for (const appt of restoredList as Array<{
          id: string; client_name: string | null; client_email: string | null;
          user_id: string | null; title: string | null; type: string | null;
          method: string | null; date: string; time: string;
        }>) {
          let emailAddr = appt.client_email;
          let name = appt.client_name || 'Client';

          // For client-booked appointments, look up email from auth
          if (!emailAddr && appt.user_id) {
            try {
              const { data: userData } = await supabase.auth.admin.getUserById(appt.user_id);
              emailAddr = userData?.user?.email ?? null;
              if (!appt.client_name && userData?.user?.user_metadata?.full_name) {
                name = userData.user.user_metadata.full_name as string;
              }
            } catch {
              // ignore auth lookup failure
            }
          }

          if (emailAddr) {
            try {
              await fetch(`${baseUrl}/api/admin/send-slot-restored`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', cookie },
                body: JSON.stringify({
                  clientEmail: emailAddr,
                  clientName: name,
                  date: formatDate(appt.date),
                  time: appt.time,
                  title: appt.title,
                  type: appt.type,
                  attorney: 'Abigail Miller',
                }),
              });
            } catch (err) {
              console.error('Failed to send slot restored notification:', err);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Slot marked as available',
        appointmentsRestored: restoredList.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Unavailability API error:', err);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}