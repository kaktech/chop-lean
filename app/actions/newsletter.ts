"use server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { sendMenuTo } from "@/lib/menu-email";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });

export type NewsletterResult = { ok: boolean; message: string };

export async function subscribeNewsletter(_prev: NewsletterResult | null, formData: FormData): Promise<NewsletterResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) return { ok: false, message: "Too many attempts. Try again in a minute." };

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const email = parsed.data.email;

  // New subscriber, or someone who unsubscribed and is coming back.
  const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1);
  let token: string;
  if (existing) {
    if (existing.unsubscribedAt) await db.update(newsletterSubscribers).set({ unsubscribedAt: null }).where(eq(newsletterSubscribers.id, existing.id));
    token = existing.token;
  } else {
    const [row] = await db.insert(newsletterSubscribers).values({ email }).returning({ token: newsletterSubscribers.token });
    token = row.token;
  }

  // The promise on the sign-up box: send the menu now. Never fails the sign-up if email is down.
  const sent = await sendMenuTo(email, token, true).catch(() => false);
  return { ok: true, message: sent ? "You're in! We've emailed you this week's menu." : "You're in. You'll get the menu every Sunday." };
}
