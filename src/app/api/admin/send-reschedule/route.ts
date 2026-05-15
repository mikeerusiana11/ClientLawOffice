import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, EMAIL_FROM } from '@/lib/html';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointmentId,
      clientEmail,
      clientName,
      originalDate,
      originalTime,
      newDate,
      newTime,
      title,
      type,
      method,
      attorney = 'Abigail Miller',
      note,
    } = body;

    if (!clientEmail || !originalDate || !originalTime || !newDate || !newTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const rescheduleUrl = appointmentId ? `${siteUrl}/reschedule/${appointmentId}` : null;

    const safeName = escapeHtml(clientName);
    const safeTitle = escapeHtml(title || 'Appointment');
    const safeType = escapeHtml(type || 'Consultation');
    const safeAttorney = escapeHtml(attorney);
    const safeMethod = escapeHtml(method || 'In-Person');
    const safeOriginalDate = escapeHtml(originalDate);
    const safeOriginalTime = escapeHtml(originalTime);
    const safeNewDate = escapeHtml(newDate);
    const safeNewTime = escapeHtml(newTime);
    const safeNote = escapeHtml(note);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #1A2B3C; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9333ea; color: #ffffff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 26px; }
          .content { background-color: #F8FAFC; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #D1D5DB; }
          .detail-box { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
          .section-title { font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .detail-label { font-weight: 600; color: #1A2B3C; }
          .detail-value { color: #64748B; }
          .old-slot { background-color: #FEF2F2; padding: 12px 15px; border-left: 4px solid #EF4444; border-radius: 4px; margin-bottom: 10px; color: #B91C1C; }
          .new-slot { background-color: #F0FDF4; padding: 12px 15px; border-left: 4px solid #22C55E; border-radius: 4px; margin-bottom: 15px; color: #15803D; }
          .note-box { background-color: #FEF9F0; padding: 15px; border-left: 4px solid #D4AF37; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748B; font-size: 12px; }
          .contact-button { background-color: #D4AF37; color: #1A2B3C; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>↻ Appointment Rescheduled</h1>
          </div>

          <div class="content">
            <p>Hello ${safeName},</p>

            <p>We're writing to let you know that your appointment with Miller Law Office has been rescheduled. We apologize for any inconvenience this may cause.</p>

            <div class="detail-box">
              <div class="section-title">📋 Appointment</div>
              <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span class="detail-value">${safeTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${safeType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Attorney:</span>
                <span class="detail-value">${safeAttorney}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Method:</span>
                <span class="detail-value">${safeMethod}</span>
              </div>
            </div>

            <div class="section-title">📅 Schedule Change</div>
            <div class="old-slot">
              <strong>Previous:</strong> ${safeOriginalDate} at ${safeOriginalTime}
            </div>
            <div class="new-slot">
              <strong>New Schedule:</strong> ${safeNewDate} at ${safeNewTime}
            </div>

            ${note ? `
            <div class="note-box">
              <strong>Message from our office:</strong><br>
              ${safeNote}
            </div>
            ` : ''}

            <p>If this new schedule does not work for you, you can request a different time directly:</p>

            ${rescheduleUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${rescheduleUrl}" style="background-color: #1A2B3C; color: #D4AF37; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
                Request a Different Time
              </a>
            </div>
            ` : ''}

            <p style="text-align: center; font-size: 13px; color: #64748B; margin-top: 10px;">
              Or reach us directly:<br>
              <strong>Phone:</strong> +63 9176317120 &nbsp;|&nbsp;
              <a href="mailto:attyabigailtmiller@gmail.com" style="color: #D4AF37;">attyabigailtmiller@gmail.com</a>
            </p>

            <p style="margin-top: 30px; font-size: 12px; color: #64748B;">
              Best regards,<br>
              <strong>Miller Law Office</strong><br>
              Professional Legal Services
            </p>
          </div>

          <div class="footer">
            <p>This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: clientEmail,
      subject: `Appointment Rescheduled — New Schedule: ${newDate} at ${newTime}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return NextResponse.json({ error: 'Failed to send reschedule email', details: response.error }, { status: 500 });
    }

    console.log('✅ Reschedule email sent:', response.data?.id);
    return NextResponse.json({ message: 'Reschedule email sent successfully', emailId: response.data?.id }, { status: 200 });

  } catch (err) {
    console.error('Send reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
