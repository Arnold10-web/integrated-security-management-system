// Shared messaging adapters (email + SMS) for ISCMS notifications, reminders
// and scheduled-job alerts. Pure functions — no Prisma dependency so they can be
// reused from route handlers, the cron scheduler and on-demand triggers equally.
//
// Providers (Africa's Talking SMS + SendGrid email) are configured via .env:
//   AT_SMS_USERNAME / AT_SMS_API_KEY / AT_SMS_SENDER_ID
//   SENDGRID_API_KEY / REMINDER_FROM_EMAIL
// If credentials are missing the channel is reported as undelivered (false) so
// callers can log the outcome as "Skipped" instead of crashing.

export const EMAIL_FROM = process.env.REMINDER_FROM_EMAIL || "notifications@iscms.ug";

export type DeliveryResult = {
  email: boolean;
  sms: boolean;
  delivered: boolean;
  channel: "sms+email" | "email" | "sms" | "none";
  reason?: string;
};

export function sendAtSms(to: string, message: string): Promise<boolean> {
  const key = process.env.AT_SMS_API_KEY;
  if (!key) return Promise.resolve(false);
  return fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "apiKey": key },
    body: new URLSearchParams({
      username: process.env.AT_SMS_USERNAME || "",
      to,
      message,
      from: process.env.AT_SMS_SENDER_ID || "",
    }).toString(),
  }).then((r) => r.ok).catch(() => false);
}

export function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return Promise.resolve(false);
  return fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: EMAIL_FROM },
      subject,
      content: [{ type: "text/plain", value: html }],
    }),
  }).then((r) => r.ok).catch(() => false);
}

export interface DispatchOptions {
  to?: string; // phone or email recipient (optional)
  email?: string;
  phone?: string;
  subject?: string;
  body: string;
}

/**
 * Attempt to deliver a message via email and/or SMS. Returns the per-channel +
 * aggregate delivery result so the caller can record "Sent"/"Skipped" accurately.
 */
export async function dispatchMessage(opts: DispatchOptions): Promise<DeliveryResult> {
  const emailTarget = opts.email ?? (opts.to ?? "").includes("@") ? opts.to : undefined;
  const phoneTarget = opts.phone ?? (opts.to && !opts.to.includes("@") ? opts.to : undefined);
  const emailOk = emailTarget ? await sendEmail(emailTarget, opts.subject || "ISCMS Notification", opts.body) : false;
  const smsOk = phoneTarget ? await sendAtSms(phoneTarget, opts.body) : false;
  const delivered = emailOk || smsOk;
  const channel: DeliveryResult["channel"] =
    emailOk && smsOk ? "sms+email" : emailOk ? "email" : smsOk ? "sms" : "none";
  const reason = !emailTarget && !phoneTarget
    ? "No recipient contact on file"
    : !emailOk && !smsOk
      ? "Messaging credentials not configured in .env"
      : undefined;
  return { email: emailOk, sms: smsOk, delivered, channel, reason };
}

/** Human-friendly prefixed message for job/system notifications. */
export function systemMessage(topic: string, body: string): string {
  return `[ISCMS] ${topic}\n${body}`;
}
