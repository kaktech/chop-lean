"use server";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createElement } from "react";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { CODE_TTL_MS, MAX_ATTEMPTS, codesMatch, generateCode, hashCode, newSessionToken } from "@/lib/otp";
import LoginCode from "@/emails/LoginCode";

export type OtpState = { step: "email" | "code"; email?: string; message?: string; error?: string; sentAt?: number };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);
const safePath = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

/** Step 1: email a 6-digit code. The response is identical whether or not the address has an account. */
export async function requestLoginCode(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { step: "email", error: parsed.error.issues[0].message };
  const email = parsed.data;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`otp-ip:${ip}`, 10, 10 * 60_000)) return { step: "email", email, error: "Too many requests. Please wait a few minutes and try again." };

  const recent = await db.select({ n: sql<number>`count(*)::int` }).from(s.loginCodes).where(and(eq(s.loginCodes.email, email), gt(s.loginCodes.createdAt, new Date(Date.now() - 10 * 60_000))));
  if ((recent[0]?.n ?? 0) >= 4) return { step: "code", email, error: "We've already sent several codes. Use the latest one, or try again in a few minutes." };

  const code = generateCode();
  // Only the newest code works.
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(and(eq(s.loginCodes.email, email), isNull(s.loginCodes.usedAt)));
  await db.insert(s.loginCodes).values({ email, codeHash: hashCode(code, email), expiresAt: new Date(Date.now() + CODE_TTL_MS) });

  const sent = await sendEmail({ to: email, subject: `${code} is your Chop Lean sign-in code`, react: createElement(LoginCode, { code }) });
  if (!sent) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[sign-in code] ${email}: ${code}   (Mailgun isn't configured or failed, so the code is shown here in development only)\n`);
    } else {
      return { step: "email", email, error: "We couldn't send the email just now. Please try again in a minute." };
    }
  }
  return { step: "code", email, message: `We sent a 6-digit code to ${email}.`, sentAt: Date.now() };
}

/** Step 2: check the code, then sign the person in (creating their account silently if new). */
export async function verifyLoginCode(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const email = emailSchema.safeParse(fd.get("email"));
  const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code").safeParse(String(fd.get("code") ?? "").replace(/\s/g, ""));
  if (!email.success) return { step: "email", error: "Enter your email again." };
  if (!code.success) return { step: "code", email: email.data, error: code.error.issues[0].message };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`otp-verify:${ip}`, 20, 10 * 60_000)) return { step: "code", email: email.data, error: "Too many attempts. Please wait a few minutes." };

  const [row] = await db.select().from(s.loginCodes)
    .where(and(eq(s.loginCodes.email, email.data), isNull(s.loginCodes.usedAt), gt(s.loginCodes.expiresAt, new Date())))
    .orderBy(desc(s.loginCodes.createdAt)).limit(1);
  if (!row) return { step: "code", email: email.data, error: "That code has expired. Request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) {
    await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));
    return { step: "code", email: email.data, error: "Too many wrong attempts. Request a new code." };
  }
  if (!codesMatch(code.data, email.data, row.codeHash)) {
    await db.update(s.loginCodes).set({ attempts: row.attempts + 1 }).where(eq(s.loginCodes.id, row.id));
    return { step: "code", email: email.data, error: `That code isn't right. ${MAX_ATTEMPTS - row.attempts - 1} attempt(s) left.` };
  }
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));

  // Find or create the user. Proving access to the inbox is the verification.
  let [user] = await db.select().from(s.users).where(eq(s.users.email, email.data)).limit(1);
  if (!user) [user] = await db.insert(s.users).values({ email: email.data, emailVerified: new Date() }).returning();
  else if (!user.emailVerified) await db.update(s.users).set({ emailVerified: new Date() }).where(eq(s.users.id, user.id));

  // Create a normal Auth.js database session, the same kind Google sign-in creates.
  const token = newSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 3600_000);
  await db.insert(s.sessions).values({ sessionToken: token, userId: user.id, expires });
  const secure = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  (await cookies()).set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", token, { httpOnly: true, sameSite: "lax", secure, path: "/", expires });

  redirect(safePath(String(fd.get("callbackUrl") ?? "")));
}
