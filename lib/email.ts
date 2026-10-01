import "server-only";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

/** Brevo fallback (free, no card, sends to anyone once one sender address is verified). */
async function sendViaBrevo(opts: { to: string | string[]; subject: string; react: ReactElement }): Promise<boolean> {
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME } = process.env;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME || "Chop Lean" },
        to: [opts.to].flat().map((email) => ({ email })),
        subject: opts.subject,
        htmlContent: await render(opts.react),
        textContent: await render(opts.react, { plainText: true }),
      }),
    });
    if (!res.ok) { console.error(`[email] Brevo rejected "${opts.subject}":`, res.status, await res.text()); return false; }
    return true;
  } catch (err) {
    console.error(`[email] Brevo failed for "${opts.subject}":`, err);
    return false;
  }
}

/** Sends one email through Mailgun (or Brevo if only that is configured). Never throws: failures are logged so checkout is never blocked. */
export async function sendEmail(opts: { to: string | string[]; subject: string; react: ReactElement }): Promise<boolean> {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_REGION } = process.env;
  if ((!MAILGUN_API_KEY || !MAILGUN_DOMAIN) && process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) return sendViaBrevo(opts);
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn(`[email] Mailgun not configured; skipped "${opts.subject}" to ${[opts.to].flat().join(", ")}`);
    return false;
  }
  try {
    const mg = new Mailgun(FormData).client({
      username: "api",
      key: MAILGUN_API_KEY,
      url: MAILGUN_REGION === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net",
    });
    const html = await render(opts.react);
    const text = await render(opts.react, { plainText: true });
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: MAILGUN_FROM || `Chop Lean <orders@${MAILGUN_DOMAIN}>`,
      to: [opts.to].flat(),
      subject: opts.subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${opts.subject}":`, err);
    return false;
  }
}
