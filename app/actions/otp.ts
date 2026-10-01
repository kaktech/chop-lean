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
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import LoginCode from "@/emails/LoginCode";

export type Purpose = "login" | "signup" | "reset";
export type OtpState = { step: "email" | "code"; purpose?: Purpose; email?: string; message?: string; error?: string; sentAt?: number };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);
const safePath = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");
const clientIp = async () => (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";

const SUBJECT: Record<Purpose, (c: string) => string> = {
  login: (c) => `${c} is your Chop Lean sign-in code`,
  signup: (c) => `${c} is your Chop Lean verification code`,
  reset: (c) => `${c} is your Chop Lean password reset code`,
};

/** Creates a normal Auth.js database session (same as Google sign-in) and sets the cookie. */
async function startSession(userId: string) {
  const token = newSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 3600_000);
  await db.insert(s.sessions).values({ sessionToken: token, userId, expires });
  const secure = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  (await cookies()).set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", token, { httpOnly: true, sameSite: "lax", secure, path: "/", expires });
}

/** Stores a fresh code (invalidating older ones for the same purpose) and emails it. Returns an error message or null. */
async function issueCode(email: string, purpose: Purpose, payload?: string): Promise<string | null> {
  const recent = await db.select({ n: sql<number>`count(*)::int` }).from(s.loginCodes).where(and(eq(s.loginCodes.email, email), gt(s.loginCodes.createdAt, new Date(Date.now() - 10 * 60_000))));
  if ((recent[0]?.n ?? 0) >= 4) return "We've already sent several codes. Use the latest one, or try again in a few minutes.";
  const code = generateCode();
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(and(eq(s.loginCodes.email, email), eq(s.loginCodes.purpose, purpose), isNull(s.loginCodes.usedAt)));
  await db.insert(s.loginCodes).values({ email, purpose, payload: payload ?? null, codeHash: hashCode(code, email), expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  const sent = await sendEmail({ to: email, subject: SUBJECT[purpose](code), react: createElement(LoginCode, { code, purpose }) });
  if (!sent) {
    if (process.env.NODE_ENV === "production") return "We couldn't send the email just now. Please try again in a minute.";
    console.info(`\n[${purpose} code] ${email}: ${code}   (Mailgun isn't configured or failed, so the code is shown here in development only)\n`);
  }
  return null;
}

/** Email-only sign-in: send a 6-digit code. Identical response whether or not an account exists. */
export async function requestLoginCode(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { step: "email", purpose: "login", error: parsed.error.issues[0].message };
  const email = parsed.data;
  if (!rateLimit(`otp-ip:${await clientIp()}`, 10, 10 * 60_000)) return { step: "email", purpose: "login", email, error: "Too many requests. Please wait a few minutes and try again." };
  const err = await issueCode(email, "login");
  if (err) return { step: "email", purpose: "login", email, error: err };
  return { step: "code", purpose: "login", email, message: `We sent a 6-digit code to ${email}.`, sentAt: Date.now() };
}

const signupSchema = z.object({ name: z.string().trim().min(2, "Enter your name").max(60), email: emailSchema, password: z.string() });

/** Create an account with a password. The email is verified with a code before the account is created. */
export async function requestSignup(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const p = signupSchema.safeParse({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { step: "email", purpose: "signup", error: p.error.issues[0].message };
  const problem = passwordProblem(p.data.password);
  if (problem) return { step: "email", purpose: "signup", email: p.data.email, error: problem };
  if (!rateLimit(`otp-ip:${await clientIp()}`, 10, 10 * 60_000)) return { step: "email", purpose: "signup", email: p.data.email, error: "Too many requests. Please wait a few minutes and try again." };

  const [existing] = await db.select({ pw: s.users.passwordHash }).from(s.users).where(eq(s.users.email, p.data.email)).limit(1);
  if (existing?.pw) return { step: "email", purpose: "signup", email: p.data.email, error: "An account with that email already exists. Sign in, or choose “Forgot password”." };

  const payload = JSON.stringify({ name: p.data.name, passwordHash: await hashPassword(p.data.password) });
  const err = await issueCode(p.data.email, "signup", payload);
  if (err) return { step: "email", purpose: "signup", email: p.data.email, error: err };
  return { step: "code", purpose: "signup", email: p.data.email, message: `We sent a 6-digit code to ${p.data.email} to verify it's you.`, sentAt: Date.now() };
}

/** Forgot password: email a code. Same response either way so it can't be used to probe for accounts. */
export async function requestReset(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { step: "email", purpose: "reset", error: parsed.error.issues[0].message };
  const email = parsed.data;
  if (!rateLimit(`otp-ip:${await clientIp()}`, 10, 10 * 60_000)) return { step: "email", purpose: "reset", email, error: "Too many requests. Please wait a few minutes and try again." };
  const [user] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).limit(1);
  if (user) { const err = await issueCode(email, "reset"); if (err) return { step: "email", purpose: "reset", email, error: err }; }
  return { step: "code", purpose: "reset", email, message: `If ${email} has an account, we sent a 6-digit code to it.`, sentAt: Date.now() };
}

/** Checks a code for any purpose, then signs the person in. */
export async function verifyAuthCode(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const purpose = z.enum(["login", "signup", "reset"]).catch("login").parse(fd.get("purpose"));
  const email = emailSchema.safeParse(fd.get("email"));
  const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code").safeParse(String(fd.get("code") ?? "").replace(/\s/g, ""));
  if (!email.success) return { step: "email", purpose, error: "Enter your email again." };
  if (!code.success) return { step: "code", purpose, email: email.data, error: code.error.issues[0].message };

  let newPasswordHash: string | null = null;
  if (purpose === "reset") {
    const pw = String(fd.get("newPassword") ?? "");
    const problem = passwordProblem(pw);
    if (problem) return { step: "code", purpose, email: email.data, error: problem };
    newPasswordHash = await hashPassword(pw);
  }
  if (!rateLimit(`otp-verify:${await clientIp()}`, 20, 10 * 60_000)) return { step: "code", purpose, email: email.data, error: "Too many attempts. Please wait a few minutes." };

  const [row] = await db.select().from(s.loginCodes)
    .where(and(eq(s.loginCodes.email, email.data), eq(s.loginCodes.purpose, purpose), isNull(s.loginCodes.usedAt), gt(s.loginCodes.expiresAt, new Date())))
    .orderBy(desc(s.loginCodes.createdAt)).limit(1);
  if (!row) return { step: "code", purpose, email: email.data, error: "That code has expired. Request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) {
    await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));
    return { step: "code", purpose, email: email.data, error: "Too many wrong attempts. Request a new code." };
  }
  if (!codesMatch(code.data, email.data, row.codeHash)) {
    await db.update(s.loginCodes).set({ attempts: row.attempts + 1 }).where(eq(s.loginCodes.id, row.id));
    return { step: "code", purpose, email: email.data, error: `That code isn't right. ${MAX_ATTEMPTS - row.attempts - 1} attempt(s) left.` };
  }
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));

  let [user] = await db.select().from(s.users).where(eq(s.users.email, email.data)).limit(1);
  if (purpose === "reset" && !user) return { step: "code", purpose, email: email.data, error: "We couldn't find an account for that email." };

  if (purpose === "signup") {
    const payload = JSON.parse(row.payload ?? "{}") as { name?: string; passwordHash?: string };
    if (!payload.passwordHash) return { step: "email", purpose, error: "Something went wrong. Please start again." };
    if (!user) [user] = await db.insert(s.users).values({ email: email.data, name: payload.name ?? null, passwordHash: payload.passwordHash, emailVerified: new Date() }).returning();
    else await db.update(s.users).set({ passwordHash: payload.passwordHash, name: user.name ?? payload.name ?? null, emailVerified: user.emailVerified ?? new Date() }).where(eq(s.users.id, user.id));
  } else if (purpose === "reset") {
    await db.update(s.users).set({ passwordHash: newPasswordHash, emailVerified: user.emailVerified ?? new Date() }).where(eq(s.users.id, user.id));
    await db.delete(s.sessions).where(eq(s.sessions.userId, user.id)); // sign out other devices after a reset
  } else {
    if (!user) [user] = await db.insert(s.users).values({ email: email.data, emailVerified: new Date() }).returning();
    else if (!user.emailVerified) await db.update(s.users).set({ emailVerified: new Date() }).where(eq(s.users.id, user.id));
  }

  await startSession(user.id);
  redirect(safePath(String(fd.get("callbackUrl") ?? "")));
}

const MAX_FAILS = 5;

export async function signInWithPassword(_prev: OtpState | null, fd: FormData): Promise<OtpState> {
  const email = emailSchema.safeParse(fd.get("email"));
  const password = String(fd.get("password") ?? "");
  if (!email.success) return { step: "email", purpose: "login", error: email.error.issues[0].message };
  if (!password) return { step: "email", purpose: "login", email: email.data, error: "Enter your password." };

  const key = `pw:${email.data}`;
  const [fails] = await db.select({ n: sql<number>`count(*)::int` }).from(s.loginAttempts).where(and(eq(s.loginAttempts.key, key), gt(s.loginAttempts.createdAt, new Date(Date.now() - 15 * 60_000))));
  if ((fails?.n ?? 0) >= MAX_FAILS) return { step: "email", purpose: "login", email: email.data, error: "Too many failed attempts. Try again in 15 minutes, or reset your password." };
  if (!rateLimit(`pw-ip:${await clientIp()}`, 30, 10 * 60_000)) return { step: "email", purpose: "login", email: email.data, error: "Too many attempts. Please wait a few minutes." };

  const [user] = await db.select().from(s.users).where(eq(s.users.email, email.data)).limit(1);
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    await db.insert(s.loginAttempts).values({ key });
    const noPw = user && !user.passwordHash;
    return { step: "email", purpose: "login", email: email.data, error: noPw ? "This account has no password yet. Use “Email me a code” or Google, then add one in your account." : "Email or password is incorrect." };
  }
  await db.delete(s.loginAttempts).where(eq(s.loginAttempts.key, key));
  await startSession(user.id);
  redirect(safePath(String(fd.get("callbackUrl") ?? "")));
}
