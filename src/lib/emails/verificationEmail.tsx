/**
 * Verification email template for Miller Law Office appointment booking.
 * Returns a plain HTML string — no @react-email/render dependency needed.
 *
 * To swap the sending domain later:
 *   1. Verify your domain at https://resend.com/domains
 *   2. Change the FROM_ADDRESS constant in send-verification-token/route.ts
 */

interface VerificationEmailProps {
  verificationUrl: string;
  email: string;
  expiryHours?: number;
}

export function renderVerificationEmail({
  verificationUrl,
  email,
  expiryHours = 24,
}: VerificationEmailProps): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email — Miller Law Office</title>
</head>
<body style="margin:0;padding:32px 16px;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;">
    <tbody>
      <tr>
        <td>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);background-color:#ffffff;border:1px solid #e4e4e7;">
            <tbody>

              <!-- Header -->
              <tr>
                <td style="background-color:#1A2B3C;padding:24px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr>
                        <td style="vertical-align:middle;padding-right:14px;">
                          <div style="background-color:#D4AF37;border-radius:10px;width:52px;height:52px;text-align:center;line-height:52px;font-size:26px;">⚖️</div>
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 2px;letter-spacing:0.3px;">Miller Law Office</p>
                          <p style="color:#D4AF37;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;">Attorney at Law</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="text-align:center;font-size:48px;margin:0 0 20px;">✉️</p>
                  <h1 style="color:#1A2B3C;font-size:24px;font-weight:700;margin:0 0 20px;text-align:center;">Verify Your Email Address</h1>

                  <p style="color:#3f3f46;font-size:15px;line-height:1.7;margin:0 0 14px;">
                    Hello, <strong>${escapeHtml(email)}</strong>
                  </p>
                  <p style="color:#3f3f46;font-size:15px;line-height:1.7;margin:0 0 28px;">
                    You requested to book an appointment with <strong>Miller Law Office</strong>.
                    To confirm your email and continue, please click the button below.
                  </p>

                  <!-- CTA Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
                    <tbody>
                      <tr>
                        <td align="center" style="border-radius:10px;background-color:#D4AF37;">
                          <a href="${verificationUrl}"
                             target="_blank"
                             rel="noopener noreferrer"
                             style="display:inline-block;background-color:#D4AF37;color:#1A2B3C;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                            ✓ &nbsp;Verify My Email &amp; Continue Booking
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p style="color:#71717a;font-size:13px;text-align:center;margin:0 0 24px;">
                    ⏱ This link expires in <strong>${expiryHours} hours</strong>.
                  </p>

                  <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

                  <p style="color:#71717a;font-size:12px;margin:0 0 6px;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color:#2563eb;font-size:11px;word-break:break-all;margin:0 0 20px;">
                    ${verificationUrl}
                  </p>

                  <p style="color:#a1a1aa;font-size:12px;line-height:1.6;margin:0;">
                    If you did not request this, you can safely ignore this email.
                    No account or appointment will be created.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f4f4f5;padding:20px 40px;border-top:1px solid #e4e4e7;">
                  <p style="color:#a1a1aa;font-size:11px;text-align:center;margin:0 0 4px;">
                    &copy; ${year} Miller Law Office &middot; All rights reserved
                  </p>
                  <p style="color:#a1a1aa;font-size:11px;text-align:center;margin:0;">
                    This is an automated message. Please do not reply directly to this email.
                  </p>
                </td>
              </tr>

            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

/** Prevent XSS in email content */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
