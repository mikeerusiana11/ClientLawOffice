import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, EMAIL_FROM } from '@/lib/html';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, clientEmail, clientName, date, time, title, type, method, notes, attorney = 'Abigail Miller' } = body;

    if (!clientEmail || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeName = escapeHtml(clientName);
    const safeType = escapeHtml(type || 'Appointment');
    const safeTitle = escapeHtml(title || 'N/A');
    const safeAttorney = escapeHtml(attorney);
    const safeDate = escapeHtml(date);
    const safeTime = escapeHtml(time);
    const safeMethod = escapeHtml(method || 'In-Person');
    const safeNotes = escapeHtml(notes);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1A2B3C; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #D4AF37; color: #1A2B3C; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; font-family: 'Playfair Display', serif; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background-color: #F8FAFC; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #D1D5DB; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .detail-box { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .detail-label { font-weight: 600; color: #1A2B3C; }
          .detail-value { color: #64748B; }
          .highlight { background-color: #E8F5E9; padding: 15px; border-left: 4px solid #4CAF50; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748B; font-size: 12px; }
          .confirm-button { background-color: #D4AF37; color: #1A2B3C; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Appointment Confirmed</h1>
          </div>

          <div class="content">
            <p>Hello ${safeName},</p>

            <p>Your appointment with Miller Law Office has been confirmed! Here are the details:</p>

            <div class="detail-box">
              <div class="section-title">📋 Appointment Details</div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${safeType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span class="detail-value">${safeTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Attorney:</span>
                <span class="detail-value">${safeAttorney}</span>
              </div>
            </div>

            <div class="detail-box">
              <div class="section-title">📅 Date & Time</div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${safeDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${safeTime}</span>
              </div>
            </div>

            <div class="detail-box">
              <div class="section-title">🔄 Meeting Method</div>
              <div class="detail-row">
                <span class="detail-label">Method:</span>
                <span class="detail-value">${safeMethod}</span>
              </div>
              ${method === 'In-Person' ? `
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">Miller Law Office</span>
                </div>
              ` : ''}
            </div>

            ${notes ? `
            <div class="detail-box">
              <div class="section-title">📝 Additional Notes</div>
              <p style="margin: 0; color: #1A2B3C;">${safeNotes}</p>
            </div>
            ` : ''}

            <div class="highlight">
              <strong>What to expect:</strong><br>
              Please arrive 10 minutes early if meeting in person. For phone or video appointments, we'll send you a link or call at the scheduled time. If you need to reschedule, please contact our office as soon as possible.
            </div>

            <div style="text-align: center;">
              <a href="mailto:attyabigailtmiller@gmail.com" class="confirm-button">Questions? Contact Us</a>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #64748B;">
              Best regards,<br>
              <strong>Miller Law Office</strong><br>
              Professional Legal Services
            </p>
          </div>

          <div class="footer">
            <p>This is an automated confirmation email. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: clientEmail,
        subject: `Appointment Confirmed - ${date} at ${time}`,
        html: emailHtml,
      });

      if (response.error) {
        console.error('Resend error:', response.error);
        return NextResponse.json({
          error: 'Failed to send confirmation email',
          details: response.error
        }, { status: 500 });
      }

      console.log('✅ Confirmation email sent:', response.data?.id);
      return NextResponse.json({
        message: 'Confirmation email sent successfully',
        emailSent: true,
        emailId: response.data?.id
      }, { status: 200 });
    } catch (emailErr) {
      console.error('Error sending email via Resend:', emailErr);
      return NextResponse.json({
        error: 'Failed to send confirmation email',
        details: String(emailErr)
      }, { status: 500 });
    }

  } catch (err) {
    console.error('Send confirmation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
