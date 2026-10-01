import "server-only";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

/** Sends one email through Mailgun. Never throws: failures are logged so checkout is never blocked. */
export async function sendEmail(opts: { to: string | string[]; subject: string; react: ReactElement }): Promise<boolean> {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_REGION } = process.env;
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
