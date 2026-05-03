import { logger } from "./logger";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const SENDGRID_API_KEY = process.env["SENDGRID_API_KEY"];
const SENDGRID_FROM = process.env["SENDGRID_FROM"] ?? "noreply@kuvote.ku.ac.ke";

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!SENDGRID_API_KEY) {
    logger.warn(
      { to: payload.to, subject: payload.subject },
      "SENDGRID_API_KEY not configured — printing email body to logs (development fallback)",
    );
    logger.info(
      { to: payload.to, subject: payload.subject, body: payload.text },
      "OUTGOING EMAIL (DEV)",
    );
    return;
  }

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
    logger.error(
      { status: res.status, body, to: payload.to },
      "SendGrid email failed",
    );
    throw new Error(`SendGrid error: ${res.status}`);
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(SENDGRID_API_KEY);
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
  await sendEmail({ to, subject, text });
}
