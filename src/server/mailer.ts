import "server-only";
import { appendFile } from "node:fs/promises";

export type Email = { to: string; subject: string; text: string; html: string };

/**
 * Sends an email through Resend (https://resend.com) when RESEND_API_KEY is set.
 * Without a key, as in local development, the email is printed to the server
 * console instead, and also appended to the file in MAIL_OUTBOX if that's set
 * (the end-to-end tests read reset links from there).
 */
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "RoomFinder <onboarding@resend.dev>",
        ...email,
      }),
    });
    if (!response.ok) {
      throw new Error(`Sending email failed: ${response.status} ${await response.text()}`);
    }
    return;
  }

  if (process.env.MAIL_OUTBOX) {
    await appendFile(process.env.MAIL_OUTBOX, `${JSON.stringify(email)}\n`);
  }
  console.log(`\n[email] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
