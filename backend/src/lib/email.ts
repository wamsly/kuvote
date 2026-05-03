import nodemailer from "nodemailer";
import { logger } from "./logger";

const SMTP_HOST = process.env["SMTP_HOST"];
const SMTP_PORT = Number(process.env["SMTP_PORT"] ?? "587");
const SMTP_USER = process.env["SMTP_USER"];
const SMTP_PASS = process.env["SMTP_PASS"];
const SMTP_FROM = process.env["SMTP_FROM"] ?? SMTP_USER ?? "noreply@kuvote.ku.ac.ke";
const SMTP_FROM_NAME = process.env["SMTP_FROM_NAME"] ?? "KUVOTE – KU Elections";

const SENDGRID_API_KEY = process.env["SENDGRID_API_KEY"];
const SENDGRID_FROM = process.env["SENDGRID_FROM"] ?? "noreply@kuvote.ku.ac.ke";

export function isEmailConfigured(): boolean {
  return Boolean((SMTP_HOST && SMTP_USER && SMTP_PASS) || SENDGRID_API_KEY);
}

function buildOtpHtml(otp: string, purpose: "registration" | "password_reset"): string {
  const heading =
    purpose === "registration"
      ? "Verify your KUVOTE account"
      : "Reset your KUVOTE password";
  const body =
    purpose === "registration"
      ? "Thank you for registering on <strong>KUVOTE</strong>, the Kenyatta University Students' digital voting platform. Use the code below to verify your email address and activate your account."
      : "We received a request to reset the password for your <strong>KUVOTE</strong> account. Enter the code below to proceed. If you did not request this, please ignore this email.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#15803d;padding:28px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">KUVOTE</span>
              <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px;">Kenyatta University Students' Voting Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${body}</p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <div style="display:inline-block;background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;padding:20px 40px;">
                      <p style="margin:0;font-size:13px;color:#15803d;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Your one-time code</p>
                      <p style="margin:8px 0 0;font-size:40px;font-weight:700;letter-spacing:10px;color:#111827;">${otp}</p>
                      <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Expires in <strong>10 minutes</strong></p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                If you did not request this code, you can safely ignore this email. Your account will not be affected.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} KUVOTE &nbsp;|&nbsp; Kenyatta University Students Association<br />
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaSMTP(payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

async function sendViaSendGrid(payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: SENDGRID_FROM, name: "KUVOTE" },
      subject: payload.subject,
      content: [
        { type: "text/plain", value: payload.text },
        ...(payload.html ? [{ type: "text/html", value: payload.html }] : []),
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body, to: payload.to }, "SendGrid email failed");
    throw new Error(`SendGrid error: ${res.status}`);
  }
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    await sendViaSMTP(payload);
    logger.info({ to: payload.to, subject: payload.subject }, "Email sent via SMTP");
    return;
  }

  if (SENDGRID_API_KEY) {
    await sendViaSendGrid(payload);
    logger.info({ to: payload.to, subject: payload.subject }, "Email sent via SendGrid");
    return;
  }

  logger.warn({ to: payload.to, subject: payload.subject }, "No email provider configured — logging OTP to console (dev mode)");
  logger.info({ to: payload.to, subject: payload.subject, body: payload.text }, "OUTGOING EMAIL (DEV)");
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: "registration" | "password_reset",
): Promise<void> {
  const subject =
    purpose === "registration"
      ? "Your KUVOTE verification code"
      : "Your KUVOTE password reset code";
  const text = `Your KUVOTE one-time code is: ${otp}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.\n\n— KUVOTE | Kenyatta University Students Association`;
  const html = buildOtpHtml(otp, purpose);
  await sendEmail({ to, subject, text, html });
}
