import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, EMAIL_FROM } from '@/lib/html';

interface RescheduleNotification {
  appointmentId: string;
  clientEmail: string;
  clientName: string;
  originalDate: string;
  originalTime: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const CONTACT_EMAIL = 'attyabigailtmiller@gmail.com';
const CONTACT_PHONE = '+63 9176317120';

export async function POST(request: NextRequest) {
  try {
    const { notifications } = await request.json() as {
      notifications?: RescheduleNotification[];
    };

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const results = await Promise.allSettled(
      notifications.map((notif) => {
        const rescheduleUrl = `${siteUrl}/reschedule/${notif.appointmentId}`;
        const formattedDate = new Date(notif.originalDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        const safeName = escapeHtml(notif.clientName);
        const safeFormattedDate = escapeHtml(formattedDate);
        const safeTime = escapeHtml(notif.originalTime);

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1A2B3C; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #D4AF37; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px; color: #1A2B3C; font-family: 'Playfair Display', serif;">
                  Appointment Reschedule Notice
                </h1>
              </div>

              <div style="background-color: #F8FAFC; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #D1D5DB;">
                <p>Dear <strong>${safeName}</strong>,</p>

                <p>Due to an unforeseen scheduling change, we regret to inform you that your appointment needs to be rescheduled. The original appointment was:</p>

                <div style="background-color: white; padding: 20px; border-left: 4px solid #D4AF37; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Original Date &amp; Time</p>
                  <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold; color: #1A2B3C;">
                    ${safeFormattedDate} at ${safeTime}
                  </p>
                </div>

                <p>We sincerely apologize for any inconvenience this may cause. Please use the button below to select a new date and time that works for you:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${rescheduleUrl}"
                    style="background-color: #1A2B3C; color: #D4AF37; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
                    Reschedule My Appointment
                  </a>
                </div>

                <p>If you prefer to reschedule by phone, please contact us directly:</p>
                <ul style="color: #6B7280; padding-left: 20px;">
                  <li><strong>Phone:</strong> ${CONTACT_PHONE}</li>
                  <li><strong>Email:</strong> <a href="mailto:${CONTACT_EMAIL}" style="color: #D4AF37;">${CONTACT_EMAIL}</a></li>
                </ul>

                <p>Thank you for your patience and understanding.</p>

                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Abigail T. Miller, Esq.</strong><br>
                  <span style="color: #64748B;">Miller Law Office</span>
                </p>
              </div>

              <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
                <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        return resend.emails.send({
          from: EMAIL_FROM,
          to: notif.clientEmail,
          subject: 'Appointment Reschedule Notice — Miller Law Office',
          html,
        });
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      console.error(
        'Some reschedule notifications failed:',
        results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason)
      );
    }

    console.log(`✅ Reschedule notifications: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: `${sent} reschedule notification(s) sent`,
    });
  } catch (err) {
    console.error('Notification API error:', err);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
