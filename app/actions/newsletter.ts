"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });

export type NewsletterResult = { ok: boolean; message: string };

export async function subscribeNewsletter(_prev: NewsletterResult | null, formData: FormData): Promise<NewsletterResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) return { ok: false, message: "Too many attempts. Try again in a minute." };

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  await db.insert(newsletterSubscribers).values({ email: parsed.data.email }).onConflictDoNothing();
  return { ok: true, message: "You're in. Look out for the menu on Sunday." };
}
