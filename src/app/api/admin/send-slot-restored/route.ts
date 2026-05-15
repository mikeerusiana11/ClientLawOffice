import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, EMAIL_FROM } from '@/lib/html';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientEmail, clientName, date, time, title, type, attorney = 'Abigail Miller' } = body;

    if (!clientEmail || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeName = escapeHtml(clientName || 'Client');
    const safeDate = escapeHtml(date);
    const safeTime = escapeHtml(time);
    const safeTitle = escapeHtml(title || 'Your Appointment');
    const safeType = escapeHtml(type || 'Appointment');
    const safeAttorney = escapeHtml(attorney);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #1A2B3C; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22C55E; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 26px; }
          .content { background-color: #F8FAFC; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #D1D5DB; }
          .detail-box { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
          .section-title { font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .detail-label { font-weight: 600; color: #1A2B3C; }
          .detail-value { color: #64748B; }
          .restored-box { background-color: #F0FDF4; padding: 15px; border-left: 4px solid #22C55E; border-radius: 4px; margin: 20px 0; color: #15803D; font-weight: 600; font-size: 15px; }
          .info-box { background-color: #FEF9F0; padding: 15px; border-left: 4px solid #D4AF37; border-radius: 4px; margin: 20px 0; }
          .contact-button { background-color: #D4AF37; color: #1A2B3C; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #64748B; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Appointment Reinstated</h1>
          </div>
          <div class="content">
            <p>Hello ${safeName},</p>
            <p>Good news! The scheduling conflict that previously affected your appointment has been resolved. <strong>Your appointment is back on as originally scheduled</strong> — there is no need to reschedule.</p>

            <div class="restored-box">
              ✓ Reinstated: ${safeDate} at ${safeTime}
            </div>

            <div class="detail-box">
              <div class="section-title">📋 Appointment Details</div>
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
            </div>

            <div class="info-box">
              If you would still prefer to move your appointment to a different date or time, please contact our office and we will be happy to assist you.
            </div>

            <div style="text-align: center;">
              <a href="mailto:attyabigailtmiller@gmail.com" class="contact-button">Questions? Contact Us</a>
            </div>

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
      subject: `Your Appointment is Back On — ${date} at ${time}`,
      html: emailHtml,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Slot restored notification sent', emailId: response.data?.id }, { status: 200 });
  } catch (err) {
    console.error('Send slot restored error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
